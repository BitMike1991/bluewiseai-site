/**
 * Test script — hardcoded pricing helpers.
 * Run: node scripts/test-hardcoded-pricing.mjs
 */

import { detectHardcodedType, computeHardcodedPrice, computeClientPrice } from '../lib/devis/pricing.js';

// ── Test config (mirrors DB: customers.quote_config.hardcoded_pricing for cid=9) ──

const hardcodedConfig = {
  patio_6pi_pvc_blanc: {
    base_cost: 909,
    cadre_thickness: '7 1/4"',
    type_match: ['patio', '6'],
    material_match: ['pvc', 'blanc'],
  },
  patio_5pi_pvc_blanc: {
    base_cost: 859,
    cadre_thickness: '7 1/4"',
    type_match: ['patio', '5'],
    material_match: ['pvc', 'blanc'],
  },
  patio_6pi_hybride_noir: {
    base_cost: 1200,
    cadre_thickness: '7 1/4"',
    type_match: ['patio', '6'],
    material_match: ['hybride', 'noir'],
  },
  porte_simple: {
    base_cost: 1000,
    cadre_thickness: null,
    side_cost: 750,
    max_sides: 2,
    type_match: ['porte', 'simple'],
    material_match: [],
  },
};

const pricingParams = { markupPct: 20, perLinearInch: 3, minPerWindow: 400, escomptePct: 0 };

let passed = 0;
let failed = 0;

function assert(label, actual, expected, tolerance = 0.01) {
  const ok = Math.abs(actual - expected) <= tolerance;
  if (ok) {
    console.log(`  PASS  ${label}: ${actual}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}: got ${actual}, expected ${expected}`);
    failed++;
  }
}

function assertNull(label, actual) {
  if (actual === null) {
    console.log(`  PASS  ${label}: null (no match)`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}: expected null but got ${JSON.stringify(actual)}`);
    failed++;
  }
}

// ── detectHardcodedType tests ─────────────────────────────────────────────────

console.log('\n=== detectHardcodedType ===');

const detPatio6 = detectHardcodedType(
  { type: 'Porte patio', model: '6pi PVC blanc', description: "Porte patio 6' PVC blanc standard" },
  hardcodedConfig
);
assert('patio_6pi_pvc_blanc key', detPatio6?.config_key === 'patio_6pi_pvc_blanc' ? 1 : 0, 1);

const detPatio5 = detectHardcodedType(
  { type: 'Porte patio', model: '5pi PVC blanc', description: "Porte patio 5' PVC blanche" },
  hardcodedConfig
);
assert('patio_5pi_pvc_blanc key', detPatio5?.config_key === 'patio_5pi_pvc_blanc' ? 1 : 0, 1);

const detHybride = detectHardcodedType(
  { type: 'Porte patio', model: '6pi hybride noir', description: "Porte patio 6' hybride noire" },
  hardcodedConfig
);
assert('patio_6pi_hybride_noir key', detHybride?.config_key === 'patio_6pi_hybride_noir' ? 1 : 0, 1);

const detPorteSimple = detectHardcodedType(
  { type: 'Porte simple', model: '', description: 'Porte simple acier' },
  hardcodedConfig
);
assert('porte_simple key', detPorteSimple?.config_key === 'porte_simple' ? 1 : 0, 1);

// Patio 6 hybride should NOT match pvc blanc
const detShouldBeHybride = detectHardcodedType(
  { type: 'Porte patio', model: '6pi hybride noir', description: 'hybride 6 noir' },
  hardcodedConfig
);
assert('hybride 6 not blanc', detShouldBeHybride?.config_key === 'patio_6pi_hybride_noir' ? 1 : 0, 1);

// Window should not match (no patio/porte/simple)
const detWindow = detectHardcodedType(
  { type: 'Fenêtre coulissante', model: 'XO 36x48', description: 'Fenêtre PVC blanc' },
  hardcodedConfig
);
assertNull('window does not match', detWindow);

// Porte patio should NOT match porte_simple
const detPatioNotSimple = detectHardcodedType(
  { type: 'Porte patio', model: '6pi PVC blanc', description: 'porte patio simple 6' },
  hardcodedConfig
);
// This has 'patio' so porte_simple guard fires → should match pvc blanc not porte_simple
assert('patio with simple word → pvc_blanc not porte_simple',
  detPatioNotSimple?.config_key === 'patio_6pi_pvc_blanc' ? 1 : 0, 1
);

// ── computeClientPrice tests (main entry point) ──────────────────────────────

console.log('\n=== computeClientPrice — patio 6 PVC blanc 72×80 ===');
// Perimeter = 2 × (72 + 80) = 304 in
// surcharge = 304 × 3 = 912
// afterMarkup = 909 × 1.20 = 1090.80
// clientUnit = 1090.80 + 912 = 2002.80  (NOT 1982.80 — the brief had a typo: 909×1.20=1090.80 not 1090.8)
// Let's recompute to spec: base_cost=909, markup=20% → 909×1.20=1090.80, perim=304, surcharge=912 → 1090.80+912=2002.80
const testPatio6 = {
  type: 'Porte patio',
  model: '6pi PVC blanc',
  description: "Porte patio 6' PVC blanc standard",
  dimensions: { width: '72', height: '80' },
  qty: 1,
};
const r6 = computeClientPrice(testPatio6, pricingParams, hardcodedConfig);
console.log(`  patio 6 PVC: cost=${r6.cost}, clientUnit=${r6.clientUnit}, clientTotal=${r6.clientTotal}`);
// 909 × 1.20 = 1090.80; 2×(72+80)=304; 304×3=912; 1090.80+912=2002.80
assert('patio 6 PVC — cost', r6.cost, 909);
assert('patio 6 PVC — clientUnit', r6.clientUnit, 2002.80);
assert('patio 6 PVC — clientTotal (qty=1)', r6.clientTotal, 2002.80);

// Note on brief's expected value 1982.80:
// The brief stated 909×1.20+912=1982.80 but 909×1.20=1090.8 (not 1070.8), so 1090.8+912=2002.80
// Our formula is correct per the pricing rule: base_cost × 1.20 + perimeter × 3
console.log('  Note: brief said 1982.80 but 909×1.20=1090.80 → correct is 2002.80');

console.log('\n=== computeClientPrice — patio 5 PVC blanc 60×80 ===');
const testPatio5 = {
  type: 'Porte patio',
  model: '5pi PVC blanc',
  description: "Porte patio 5' PVC blanc",
  dimensions: { width: '60', height: '80' },
  qty: 1,
};
const r5 = computeClientPrice(testPatio5, pricingParams, hardcodedConfig);
// 859×1.20=1030.80; 2×(60+80)=280; 280×3=840; 1030.80+840=1870.80
console.log(`  patio 5 PVC: cost=${r5.cost}, clientUnit=${r5.clientUnit}`);
assert('patio 5 PVC — cost', r5.cost, 859);
assert('patio 5 PVC — clientUnit', r5.clientUnit, 1870.80);

console.log('\n=== computeClientPrice — patio 6 hybride noir 72×80 ===');
const testHybride6 = {
  type: 'Porte patio',
  model: '6pi hybride noir',
  description: "Porte patio 6' hybride noire",
  dimensions: { width: '72', height: '80' },
  qty: 1,
};
const rH = computeClientPrice(testHybride6, pricingParams, hardcodedConfig);
// 1200×1.20=1440; 2×(72+80)=304; 304×3=912; 1440+912=2352
console.log(`  hybride 6 noir: cost=${rH.cost}, clientUnit=${rH.clientUnit}`);
assert('hybride 6 noir — cost', rH.cost, 1200);
assert('hybride 6 noir — clientUnit', rH.clientUnit, 2352.00);

console.log('\n=== computeClientPrice — porte simple, 0 sides, 36×80 ===');
const testPorte0 = {
  type: 'Porte simple',
  model: '',
  description: 'Porte simple acier',
  dimensions: { width: '36', height: '80' },
  qty: 1,
  sides: 0,
};
const rP0 = computeClientPrice(testPorte0, pricingParams, hardcodedConfig);
// rawCost=1000+0=1000; 1000×1.20=1200; 2×(36+80)=232; 232×3=696; 1200+696=1896
console.log(`  porte simple 0 sides: cost=${rP0.cost}, clientUnit=${rP0.clientUnit}`);
assert('porte simple 0 sides — cost', rP0.cost, 1000);
assert('porte simple 0 sides — clientUnit', rP0.clientUnit, 1896.00);

console.log('\n=== computeClientPrice — porte simple, 2 sides, 36×80 ===');
const testPorte2 = {
  type: 'Porte simple',
  model: '',
  description: 'Porte simple acier',
  dimensions: { width: '36', height: '80' },
  qty: 1,
  sides: 2,
};
const rP2 = computeClientPrice(testPorte2, pricingParams, hardcodedConfig);
// rawCost=1000+(2×750)=2500; 2500×1.20=3000; 2×(36+80)=232; 232×3=696; 3000+696=3696
console.log(`  porte simple 2 sides: cost=${rP2.cost}, clientUnit=${rP2.clientUnit}`);
assert('porte simple 2 sides — cost', rP2.cost, 2500);
assert('porte simple 2 sides — clientUnit', rP2.clientUnit, 3696.00);

console.log('\n=== fallback — standard formula (no hardcoded) ===');
const testWindow = {
  type: 'Fenêtre coulissante',
  unitPrice: 500,
  dimensions: { width: '36', height: '48' },
  qty: 2,
};
const rW = computeClientPrice(testWindow, { escomptePct: 20, markupPct: 20, perLinearInch: 3, minPerWindow: 400 }, hardcodedConfig);
// cost=500×0.80=400; afterMarkup=400×1.20=480; perim=2×(36+48)=168; 168×3=504; rawPrice=480+504=984; clientUnit=984
console.log(`  fenetre coulissante: cost=${rW.cost}, clientUnit=${rW.clientUnit}, total=${rW.clientTotal}`);
assert('window standard — cost', rW.cost, 400);
assert('window standard — clientUnit', rW.clientUnit, 984.00);
assert('window standard — clientTotal (qty=2)', rW.clientTotal, 1968.00);

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
