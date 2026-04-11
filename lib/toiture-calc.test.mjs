// Test de validation du calculateur toiture
// Usage : node lib/toiture-calc.test.mjs
//
// Scénario : mêmes quantités qu'Excel original (65 paquets Cambridge)
// mais prix et modèle de main d'œuvre mis à jour au 2026-04-11 :
//   - Cambridge 41,89 $/paquet (était 37,25)
//   - Boîte de clous = 1 par 48 paquets (était 33)
//   - Main d'œuvre = taux horaire par travailleur × 10 h × jours × 1,20

import { calculateRoofingQuote, formatCAD, MATERIALS, LABOR, PITCH_RATES } from './toiture-calc.js';

// Scénario : 2 080 pi² Cambridge, 2 travailleurs à 50 $/h, pente 4-6 tier 1
const scenario = calculateRoofingQuote({
  shingle_type: 'bardeau_standard',
  quantities: {
    bardeau_standard: 65,
    cap_bardeau: 4,
    pitch: 1,
    syntec: 1,
    glace_eau: 2,
    maximum: 1,
    event: 1,
    clou: 2
  },
  fees: { conteneur: 1, essence: 1, transport: 1 },
  worker_rates: [50, 50],  // 2 travailleurs à 50 $/h chacun
  days: 1,
  hours_per_day: 10,
  pitch_category: 'easy',
  pitch_tier: 1,
  surface_sqft: 2080
});

// ============================================================================
// ASSERTIONS
// ============================================================================
// Matériaux (nouveaux prix) :
//   65 × 41,89 = 2 722,85  (Cambridge)
//   4  × 61,53 =   246,12  (cap bardeau)
//   1  × 59,06 =    59,06  (pitch)
//   1  × 64,71 =    64,71  (syntec)
//   2  × 62,25 =   124,50  (glace/eau)
//   1  × 129,99 =  129,99  (maximum)
//   1  × 34,99 =    34,99  (event)
//   2  × 32,99 =    65,98  (clous)
//                 3 448,20 TOTAL matériaux
//
// Frais : conteneur 500 + essence 100 + transport 75 = 675
//
// Main d'œuvre : 2 workers × 50 $/h × 10 h × 1 j × 1,20 = 1 200,00
//
// Coût total : 3 448,20 + 675 + 1 200 = 5 323,20
// Revenu HT : 3,75 × 2 080 = 7 800
// Profit brut : 7 800 - 5 323,20 = 2 476,80

// Intrants taxables (matériaux + frais, pas labor) = 3448.20 + 675 = 4123.20
//   CTI TPS récupérée = 4123.20 × 5 %     =   206.16
//   RTI TVQ récupérée = 4123.20 × 9.975 % =   411.29
//   Total récupéré                        =   617.45
//
// Taxes nettes à remettre :
//   TPS facturée 390.00 − CTI 206.16 = 183.84 à Revenu Canada
//   TVQ facturée 778.05 − RTI 411.29 = 366.76 à Revenu Québec
//   Total nettes = 550.60
//
// Profit net = 2476.80 − 550.60 = 1926.20

const expected = {
  material_cost_ht: 3448.20,
  fee_cost_ht: 675.00,
  labor_cost: 1200.00,
  total_cost_ht: 5323.20,
  rate_per_sqft: 3.75,
  revenue_ht: 7800.00,
  tax_gst_sale: 390.00,
  tax_qst_sale: 778.05,
  tax_combined_sale: 1168.05,
  total_client_ttc: 8968.05,
  taxable_inputs: 4123.20,
  input_tax_credit_gst: 206.16,
  input_tax_credit_qst: 411.29,
  input_tax_credit: 617.45,
  tax_net_gst_payable: 183.84,
  tax_net_qst_payable: 366.76,
  tax_net_payable: 550.60,
  gross_profit_ht: 2476.80,
  net_profit: 1926.20
};

function check(name, actual, expected, tolerance = 0.02) {
  const diff = Math.abs(actual - expected);
  const pass = diff <= tolerance;
  const icon = pass ? '✅' : '❌';
  console.log(`${icon} ${name.padEnd(28)} = ${formatCAD(actual).padStart(14)}  (attendu ${formatCAD(expected)}, diff ${diff.toFixed(4)})`);
  return pass;
}

console.log('\n╔══════════════════════════════════════════════════════════════════════════╗');
console.log('║  TEST CALCULATEUR TOITURE — prix 2026-04-11                             ║');
console.log('║  65 paquets Cambridge · 2 080 pi² · pente 4-6 t1 · 2 gars × 50 $/h      ║');
console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

console.log('── LIGNES MATÉRIAUX ──────────────────────────────────────────────────────');
scenario.material_lines.forEach(l => {
  console.log(`  ${l.label.padEnd(40)} ${String(l.qty).padStart(3)} × ${formatCAD(l.unit_price).padStart(10)} = ${formatCAD(l.total).padStart(12)}`);
});
console.log(`  ${'Sous-total matériaux'.padEnd(57)}${formatCAD(scenario.material_cost_ht).padStart(14)}\n`);

console.log('── FRAIS CHANTIER ────────────────────────────────────────────────────────');
scenario.fee_lines.forEach(l => {
  console.log(`  ${l.label.padEnd(40)} ${String(l.qty).padStart(3)} × ${formatCAD(l.unit_price).padStart(10)} = ${formatCAD(l.total).padStart(12)}`);
});
console.log(`  ${'Sous-total frais'.padEnd(57)}${formatCAD(scenario.fee_cost_ht).padStart(14)}\n`);

console.log('── MAIN D\'ŒUVRE (par travailleur, +20 % charges) ─────────────────────────');
scenario.labor_line.workers.forEach(w => {
  const gross = formatCAD(w.gross_wage);
  const emp = formatCAD(w.employer_cost);
  console.log(`  Travailleur ${w.index} · ${formatCAD(w.hourly_rate)}/h × ${w.hours} h  brut ${gross.padStart(12)}  employeur ${emp.padStart(12)}`);
});
console.log(`  ${'Sous-total main d\'œuvre'.padEnd(57)}${formatCAD(scenario.labor_cost).padStart(14)}\n`);

console.log('── ASSERTIONS ────────────────────────────────────────────────────────────');
let allPass = true;
allPass &= check('material_cost_ht',        scenario.material_cost_ht,        expected.material_cost_ht);
allPass &= check('fee_cost_ht',             scenario.fee_cost_ht,             expected.fee_cost_ht);
allPass &= check('labor_cost',              scenario.labor_cost,              expected.labor_cost);
allPass &= check('total_cost_ht',           scenario.total_cost_ht,           expected.total_cost_ht);
allPass &= check('rate_per_sqft',           scenario.rate_per_sqft,           expected.rate_per_sqft);
allPass &= check('revenue_ht',              scenario.revenue_ht,              expected.revenue_ht);
allPass &= check('tax_gst_sale',            scenario.tax_gst_sale,            expected.tax_gst_sale);
allPass &= check('tax_qst_sale',            scenario.tax_qst_sale,            expected.tax_qst_sale);
allPass &= check('tax_combined_sale',       scenario.tax_combined_sale,       expected.tax_combined_sale);
allPass &= check('total_client_ttc',        scenario.total_client_ttc,        expected.total_client_ttc);
allPass &= check('taxable_inputs',          scenario.taxable_inputs,          expected.taxable_inputs);
allPass &= check('input_tax_credit_gst',    scenario.input_tax_credit_gst,    expected.input_tax_credit_gst);
allPass &= check('input_tax_credit_qst',    scenario.input_tax_credit_qst,    expected.input_tax_credit_qst);
allPass &= check('input_tax_credit',        scenario.input_tax_credit,        expected.input_tax_credit);
allPass &= check('tax_net_gst_payable',     scenario.tax_net_gst_payable,     expected.tax_net_gst_payable);
allPass &= check('tax_net_qst_payable',     scenario.tax_net_qst_payable,     expected.tax_net_qst_payable);
allPass &= check('tax_net_payable',         scenario.tax_net_payable,         expected.tax_net_payable);
allPass &= check('gross_profit_ht',         scenario.gross_profit_ht,         expected.gross_profit_ht);
allPass &= check('net_profit',              scenario.net_profit,              expected.net_profit);

// Test 2 : travailleurs à taux différents (50 / 45 / 55 $/h)
console.log('\n── TEST 2 : 3 travailleurs à taux différents ─────────────────────────────');
const s2 = calculateRoofingQuote({
  shingle_type: 'bardeau_standard',
  quantities: { bardeau_standard: 65, cap_bardeau: 4, syntec: 1, glace_eau: 2, clou: 2, maximum: 1, event: 1, pitch: 1 },
  fees: { conteneur: 1, essence: 1, transport: 1 },
  worker_rates: [50, 45, 55],
  days: 1,
  hours_per_day: 10,
  pitch_category: 'easy',
  pitch_tier: 1,
  surface_sqft: 2080
});
// Labor expected: (50+45+55) × 10 × 1 × 1.20 = 150 × 10 × 1.20 = 1800
allPass &= check('3 workers mixed rates labor', s2.labor_cost, 1800.00);
console.log(`  Détail : ${s2.labor_line.workers.map(w => `${w.hourly_rate}$/h→${formatCAD(w.employer_cost)}`).join(' · ')}`);

// Test 3 : bardeau Dynasty
console.log('\n── TEST 3 : Dynasty 44,59 $/paquet ───────────────────────────────────────');
const s3 = calculateRoofingQuote({
  shingle_type: 'bardeau_dynasty',
  quantities: { bardeau_dynasty: 65, cap_bardeau: 4, syntec: 1, glace_eau: 2, clou: 2, maximum: 1, event: 1, pitch: 1 },
  fees: { conteneur: 1, essence: 1, transport: 1 },
  worker_rates: [50, 50],
  days: 1,
  pitch_category: 'easy',
  pitch_tier: 1,
  surface_sqft: 2080
});
// 65 × 44.59 = 2898.35 ; rest (246.12 + 59.06 + 64.71 + 124.50 + 129.99 + 34.99 + 65.98) = 725.35
// Total materials = 2898.35 + 725.35 = 3623.70
allPass &= check('Dynasty material_cost_ht', s3.material_cost_ht, 3623.70);

console.log('\n' + (allPass ? '✅ TOUS LES TESTS PASSENT' : '❌ CERTAINS TESTS ÉCHOUENT'));
console.log();
process.exit(allPass ? 0 : 1);
