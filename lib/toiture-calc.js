// ============================================================================
// Calculateur toiture PÜR Construction
// ============================================================================
// Reproduit la logique du fichier Excel "Toitures calcul copie.xlsx"
// Source de vérité pour tous les devis toiture automatisés.
//
// Modèle vérifié contre scénario Excel :
//   - 65 paquets × 32 pi²/paquet = 2 080 pi²
//   - Pente 4/12–6/12, tier 1 (3,75 $/pi²)
//   - 2 travailleurs × 1 jour
//   ⇒ Revenu HT 7 800 $ / Coûtant 4 946,20 $ / Profit brut 2 853,80 $
//   ⇒ Total client TTC 8 968,05 $
// ============================================================================

// ---------- Constantes ----------

export const TAX_GST = 0.05;          // TPS fédérale
export const TAX_QST = 0.09975;       // TVQ provinciale
export const TAX_COMBINED = 0.14975;  // TPS + TVQ combinées
export const SQFT_PER_PAQUET = 32.8;  // IKO Cambridge / Dynasty manufacturer spec
                                       // (3 paquets / 98,4 pi² · 21 bardeaux × 5⅝" exposition)

// ---------- Catalogue matériaux ----------
// Prix fournisseur (coûtant). Source : Excel K:N de "Soumission".
// Modifiable via DB Supabase plus tard — pour l'instant, source unique ici.

export const MATERIALS = {
  bardeau_standard: {
    id: 'bardeau_standard',
    label: 'Bardeau IKO Cambridge',
    price: 41.89,
    unit: 'paquet',
    sqft_per: 32.8,
    category: 'shingle'
  },
  bardeau_dynasty: {
    id: 'bardeau_dynasty',
    label: 'Bardeau IKO Dynasty',
    price: 44.59,
    unit: 'paquet',
    sqft_per: 32.8,
    category: 'shingle'
  },
  cap_bardeau: {
    id: 'cap_bardeau',
    label: 'Cap bardeau (faîte)',
    price: 61.53,
    unit: 'paquet',
    category: 'ridge'
  },
  pitch: {
    // Nom ambigu dans l'Excel — à clarifier avec Jeremy.
    // Probablement produit d'étanchéité ou ventilation pitch.
    id: 'pitch',
    label: 'Pitch / étanchéité',
    price: 59.06,
    unit: 'unité',
    category: 'sealing'
  },
  syntec: {
    id: 'syntec',
    label: 'Syntec — sous-couche synthétique',
    price: 64.71,
    unit: 'rouleau',
    sqft_per: 1000, // couvre ~1000 pi² par rouleau (standard industrie)
    category: 'underlayment'
  },
  glace_eau: {
    id: 'glace_eau',
    label: 'Membrane glace et eau',
    price: 62.25,
    unit: 'rouleau',
    linear_ft_per: 65, // couvre ~65 pi linéaires × 36" par rouleau
    category: 'underlayment'
  },
  maximum: {
    id: 'maximum',
    label: 'Ventilateur Maximum (ridge vent)',
    price: 129.99,
    unit: 'unité',
    category: 'ventilation'
  },
  event: {
    id: 'event',
    label: 'Évent de toit',
    price: 34.99,
    unit: 'unité',
    category: 'ventilation'
  },
  clou: {
    id: 'clou',
    label: 'Clous à toiture (boîte)',
    price: 32.99,
    unit: 'boîte',
    paquets_per: 48, // ~1 boîte pour 48 paquets de bardeau
    category: 'fastener'
  }
};

// ---------- Frais de chantier ----------

export const JOB_FEES = {
  conteneur: { label: 'Conteneur à rebuts', price: 500 },
  essence: { label: 'Essence / déplacements', price: 100 },
  transport: { label: 'Transport matériaux', price: 75 }
};

// ---------- Main d'œuvre ----------
// Modèle par travailleur : chaque worker a son propre taux horaire.
// Le coût employeur = hourly × hours × days × (1 + MARKUP).
// Le markup 20 % couvre les charges patronales fixes (RRQ, RQAP, AE, FSS,
// CNESST) de façon simplifiée pour les devis rapides.

export const LABOR = {
  default_workers: 2,
  default_hourly_rate: 50.00,
  hours_per_day: 10,                  // cap par défaut · 10 h = journée standard
  max_hours_per_day: 10,
  employer_markup: 0.20,              // +20 % fixe sur le taux horaire brut
  sqft_per_worker_hour: 100,          // productivité industrie : ~1 carré/h-homme
  labor_overhead_factor: 1.10         // 10 % marge opérationnelle (setup, pauses, détails)
};

// Surface buckets : multiplicateurs sur le rate $/pi² en mode auto
// Les petits jobs coûtent proportionnellement plus cher (overhead fixe),
// donc on facture plus par pi² pour couvrir.
export const SURFACE_RATE_BUCKETS = [
  { max: 1000,  mult: 1.53, label: '<1000 pi² · petit job' },
  { max: 2000,  mult: 1.20, label: '1000-2000 pi² · moyen' },
  { max: Infinity, mult: 1.00, label: '>2000 pi² · standard' }
];

export function getSurfaceMultiplier(surface_sqft) {
  for (const b of SURFACE_RATE_BUCKETS) {
    if (surface_sqft <= b.max) return { mult: b.mult, label: b.label };
  }
  return { mult: 1.00, label: 'standard' };
}

/**
 * Calcule automatiquement les heures main-d'œuvre nécessaires pour une surface donnée.
 * Retourne { total_hours, days, hours_per_day_per_worker } réparti sur le nb de gars.
 *
 * Logique :
 *   1. total_hours = surface / 100 × 1.10 (productivité industrie)
 *   2. hours_per_day = total_hours / workers / days
 *   3. Si > max_hours_per_day, auto-bump days jusqu'à ce que ça fit
 */
export function suggestLaborFromSurface({ surface_sqft, workers = 2, preferred_days = 1 }) {
  const total_hours = Math.max(0, (surface_sqft / LABOR.sqft_per_worker_hour) * LABOR.labor_overhead_factor);
  let days = Math.max(0.5, preferred_days);
  let hours_per_day = workers > 0 ? (total_hours / workers / days) : 0;

  // Si dépasse 10h/jour, ajouter des jours
  while (hours_per_day > LABOR.max_hours_per_day && days < 30) {
    days += 1;
    hours_per_day = total_hours / workers / days;
  }

  // Arrondir à la demi-heure la plus proche pour lisibilité
  hours_per_day = Math.max(0.5, Math.round(hours_per_day * 2) / 2);

  return {
    total_hours: round2(total_hours),
    days,
    hours_per_day,
    total_worker_hours: round2(hours_per_day * workers * days)
  };
}

// ---------- Tarifs $/pi² selon pente ----------
// Source : Sheet "Soumission" rangée 5, 3 catégories × 2 tiers.

export const PITCH_RATES = {
  easy: {
    id: 'easy',
    label: 'Pente 4/12 — 6/12',
    description: 'Pente facile, installation rapide',
    tier1: 3.75,
    tier2: 4.00,
    paquet_price_hint: { tier1: 120, tier2: 128 }
  },
  medium: {
    id: 'medium',
    label: 'Pente 7/12 — 10/12 simple',
    description: 'Pente moyenne, toit simple',
    tier1: 4.25,
    tier2: 4.50,
    paquet_price_hint: { tier1: 136, tier2: 144 }
  },
  complex: {
    id: 'complex',
    label: 'Pente 10/12 complexe — 12/12',
    description: 'Pente raide ou toit complexe (lucarnes, noues)',
    tier1: 4.75,
    tier2: 5.25,
    paquet_price_hint: { tier1: 152, tier2: 168 }
  }
};

// ---------- Helpers ----------

/** Arrondit vers le haut à l'entier supérieur (quantité discrète) */
const ceil = (x) => Math.ceil(x);

/** Arrondit à 2 décimales (pour les $ canadiens) */
const round2 = (x) => Math.round(x * 100) / 100;

/** Formate en dollars canadiens */
export function formatCAD(amount) {
  return Number(amount).toLocaleString('fr-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' $';
}

// ---------- Auto-calculs qté matériaux à partir de la surface ----------

/**
 * Calcule automatiquement les quantités de matériaux à partir des mesures.
 * L'utilisateur peut surcharger n'importe quelle valeur dans le wizard.
 *
 * @param {Object} measures
 * @param {number} measures.surface_sqft        Surface totale du toit en pi²
 * @param {number} measures.eaves_length_ft     Longueur bas de pente en pi linéaires
 * @param {number} measures.ridge_ft            Longueur totale des faîtes en pi linéaires
 * @param {string} [measures.shingle_type]      Clé du bardeau (pour retourner la bonne qté)
 * @returns {Object} Quantités suggérées par matériau
 */
export function autoCalculateQuantities({ surface_sqft, eaves_length_ft = 0, ridge_ft = 0, shingle_type = 'bardeau_standard', perimeter_ft }) {
  // Accept legacy `perimeter_ft` name as alias for eaves_length_ft
  const eaves = eaves_length_ft || perimeter_ft || 0;

  // Bardeau : surface / 32 pi²/paquet, +10 % de rebut
  const paquets = ceil((surface_sqft / SQFT_PER_PAQUET) * 1.10);

  // Cap bardeau : 1 paquet couvre ~25 pi linéaires de faîte
  const cap_bardeau = ridge_ft > 0 ? ceil(ridge_ft / 25) : 4;

  // Syntec : 1 rouleau couvre 1000 pi²
  const syntec = ceil(surface_sqft / 1000);

  // Glace/eau : 2 rouleaux minimum (requis par code bas de pente + noues)
  // 1 rouleau couvre ~65 pi linéaires sur 36 po de largeur
  const glace_eau = Math.max(2, ceil(eaves / 65));

  // Clous : ~1 boîte par 48 paquets
  const clou = Math.max(1, ceil(paquets / 48));

  // Ventilation : défaut 1 max + 1 évent, user peut ajuster
  const maximum = 1;
  const event = 1;

  // Pitch : 1 unité standard
  const pitch = 1;

  const out = {
    cap_bardeau,
    syntec,
    glace_eau,
    clou,
    maximum,
    event,
    pitch
  };
  // Set the shingle quantity under the selected shingle key
  out[shingle_type] = paquets;
  return out;
}

// ---------- Calcul principal ----------

/**
 * Calcule un devis toiture complet (interne + client).
 *
 * @param {Object} input
 * @param {string} input.shingle_type           Clé MATERIALS pour bardeau (default 'bardeau_standard')
 * @param {Object} input.quantities             Quantités par id matériau { bardeau_standard: 65, ... }
 * @param {Object} input.fees                   Frais chantier { conteneur: 1, essence: 1, transport: 1 } (0 = exclure)
 * @param {Array}  [input.worker_rates]         Array of per-worker hourly rates [50, 45, 55] (preferred).
 * @param {number} [input.workers]              Legacy: number of workers (if worker_rates not provided).
 * @param {number} [input.hourly_rate]          Legacy: single hourly rate applied to all workers.
 * @param {number} input.days                   Nombre de jours chantier
 * @param {number} [input.hours_per_day]        Hours per day (default LABOR.hours_per_day = 10).
 * @param {string} input.pitch_category         'easy' | 'medium' | 'complex'
 * @param {number} input.pitch_tier             1 | 2
 * @param {number} input.surface_sqft           Surface totale pour calcul du revenu
 * @param {number} [input.override_rate]        Override $/pi² manuel (optionnel)
 * @param {number} [input.override_subtotal_ht] Override prix forfaitaire HT complet (optionnel)
 * @param {number} [input.cash_discount]        Escompte cash en $ (default 0)
 * @returns {Object} Breakdown complet
 */
export function calculateRoofingQuote(input) {
  const {
    shingle_type = 'bardeau_standard',
    quantities = {},
    fees = { conteneur: 1, essence: 1, transport: 1 },
    worker_rates,
    workers = LABOR.default_workers,
    hourly_rate = LABOR.default_hourly_rate,
    days: raw_days = 1,
    hours_per_day: raw_hours_per_day = null,
    auto_labor = false,       // auto-calc hours+days from surface
    pitch_category = 'easy',
    pitch_tier = 1,
    surface_sqft = 0,
    surface_bucket_mode = 'flat', // 'flat' (current rate) | 'graduated' (bucket multiplier)
    override_rate = null,
    override_subtotal_ht = null,
    cash_discount = 0,
    min_quote_price = 0,
    target_margin_pct = null  // if set, revenue computed from cost / (1 - margin)
  } = input;

  // Normalize worker rates into an array regardless of which API was used.
  const rates = Array.isArray(worker_rates) && worker_rates.length > 0
    ? worker_rates.map(r => Number(r) || 0)
    : Array.from({ length: Math.max(1, workers) }, () => Number(hourly_rate) || 0);
  const worker_count = rates.length;

  // Auto-suggest labor from surface if enabled AND hours_per_day not explicitly set.
  let days = raw_days;
  let hours_per_day = raw_hours_per_day;
  let labor_auto_applied = false;
  if (auto_labor && surface_sqft > 0 && (hours_per_day == null || hours_per_day <= 0)) {
    const suggestion = suggestLaborFromSurface({ surface_sqft, workers: worker_count, preferred_days: raw_days });
    hours_per_day = suggestion.hours_per_day;
    days = suggestion.days;
    labor_auto_applied = true;
  }
  if (hours_per_day == null || hours_per_day <= 0) hours_per_day = LABOR.hours_per_day;
  if (days == null || days <= 0) days = 1;

  // --------- 1. Ligne par ligne matériaux ---------
  const material_lines = [];
  let material_cost_ht = 0;

  // Bardeau principal
  const shingle = MATERIALS[shingle_type] || MATERIALS.bardeau_standard;
  const shingle_qty = quantities[shingle_type] || 0;
  if (shingle_qty > 0) {
    const line_total = round2(shingle_qty * shingle.price);
    material_lines.push({
      id: shingle.id,
      label: shingle.label,
      qty: shingle_qty,
      unit: shingle.unit,
      unit_price: shingle.price,
      total: line_total
    });
    material_cost_ht += line_total;
  }

  // Autres matériaux (non-shingle)
  const other_ids = ['cap_bardeau', 'pitch', 'syntec', 'glace_eau', 'maximum', 'event', 'clou'];
  for (const id of other_ids) {
    const mat = MATERIALS[id];
    const qty = quantities[id] || 0;
    if (qty > 0) {
      const line_total = round2(qty * mat.price);
      material_lines.push({
        id: mat.id,
        label: mat.label,
        qty,
        unit: mat.unit,
        unit_price: mat.price,
        total: line_total
      });
      material_cost_ht += line_total;
    }
  }

  // --------- 2. Frais chantier ---------
  const fee_lines = [];
  let fee_cost_ht = 0;
  for (const [key, info] of Object.entries(JOB_FEES)) {
    const qty = fees[key] || 0;
    if (qty > 0) {
      const total = round2(qty * info.price);
      fee_lines.push({
        id: key,
        label: info.label,
        qty,
        unit_price: info.price,
        total
      });
      fee_cost_ht += total;
    }
  }

  // --------- 3. Main d'œuvre ---------
  // Par travailleur : hourly × hours_per_day × days × (1 + markup fixe 20%)
  // Chaque worker peut avoir un taux horaire différent.
  const markup_factor = 1 + (LABOR.employer_markup || 0);
  const worker_breakdown = rates.map((rate, i) => {
    const hours_total = hours_per_day * days;
    const gross = rate * hours_total;
    const with_markup = round2(gross * markup_factor);
    return {
      index: i + 1,
      hourly_rate: rate,
      hours: hours_total,
      gross_wage: round2(gross),
      employer_cost: with_markup // = gross × 1.20
    };
  });
  const labor_cost = round2(worker_breakdown.reduce((s, w) => s + w.employer_cost, 0));
  const worker_count_label = `${worker_count} travailleur${worker_count > 1 ? 's' : ''}`;
  const day_label = `${days} jour${days > 1 ? 's' : ''}`;
  const labor_line = {
    id: 'labor',
    label: `Main d'œuvre (${worker_count_label} × ${day_label}, +20 % charges)`,
    qty: worker_count * days,
    unit: 'jour-homme',
    unit_price: round2(labor_cost / Math.max(1, worker_count * days)),
    total: labor_cost,
    workers: worker_breakdown,
    markup_pct: Math.round(LABOR.employer_markup * 100),
    hours_per_day
  };

  // --------- 4. Coût variable total (ce que Jeremy paie) ---------
  // Note : le transport est dans fee_lines, pas dans le coût taxable pour le calcul
  // d'entrée de caisse. Dans l'Excel N20 = somme matériaux + labor, transport est séparé en M4.
  // Pour simplifier on regroupe tout dans "coûtant" qui représente la sortie totale.
  const total_cost_ht = round2(material_cost_ht + fee_cost_ht + labor_cost);

  // Crédits sur taxes des intrants : TPS via CTI + TVQ via RTI.
  // Les deux sont récupérables pour un inscrit aux deux comptes (TPS+TVQ).
  // La main d'œuvre est exclue (salaire = pas de TPS/TVQ).
  // Tous les autres coûts (matériaux + frais chantier) sont taxables.
  const taxable_inputs = material_cost_ht + fee_cost_ht;
  const input_tax_credit_gst = round2(taxable_inputs * TAX_GST);     // CTI TPS récupérée
  const input_tax_credit_qst = round2(taxable_inputs * TAX_QST);     // RTI TVQ récupérée
  const input_tax_credit = round2(input_tax_credit_gst + input_tax_credit_qst);

  // --------- 5. Revenu client ---------
  let revenue_ht;
  let rate_per_sqft = null;
  let min_quote_applied = false;
  let target_margin_applied = false;
  let surface_multiplier = 1.0;
  let surface_bucket_label = null;

  if (target_margin_pct !== null && target_margin_pct > 0 && target_margin_pct < 100) {
    // Mode marge cible : prix = coût / (1 - marge_cible)
    const target = target_margin_pct / 100;
    revenue_ht = round2((total_cost_ht / (1 - target)) - cash_discount);
    target_margin_applied = true;
    if (surface_sqft > 0) rate_per_sqft = round2(revenue_ht / surface_sqft);
  } else if (override_subtotal_ht !== null && override_subtotal_ht > 0) {
    revenue_ht = round2(override_subtotal_ht - cash_discount);
  } else if (override_rate !== null && override_rate > 0) {
    rate_per_sqft = override_rate;
    revenue_ht = round2((rate_per_sqft * surface_sqft) - cash_discount);
  } else {
    const rate_cfg = PITCH_RATES[pitch_category] || PITCH_RATES.easy;
    const base_rate = pitch_tier === 2 ? rate_cfg.tier2 : rate_cfg.tier1;
    // Multiplicateur selon bucket de surface (graduated mode)
    if (surface_bucket_mode === 'graduated' && surface_sqft > 0) {
      const bucket = getSurfaceMultiplier(surface_sqft);
      surface_multiplier = bucket.mult;
      surface_bucket_label = bucket.label;
    }
    rate_per_sqft = round2(base_rate * surface_multiplier);
    revenue_ht = round2((rate_per_sqft * surface_sqft) - cash_discount);
  }

  // Plancher minimum forfait (applicable dans tous les modes sauf target_margin)
  if (!target_margin_applied && min_quote_price > 0 && revenue_ht > 0 && revenue_ht < min_quote_price) {
    revenue_ht = round2(min_quote_price - cash_discount);
    min_quote_applied = true;
    if (surface_sqft > 0) rate_per_sqft = round2(revenue_ht / surface_sqft);
  }

  // --------- 6. Taxes sur la vente ---------
  const tax_gst_sale = round2(revenue_ht * TAX_GST);
  const tax_qst_sale = round2(revenue_ht * TAX_QST);
  const tax_combined_sale = round2(revenue_ht * TAX_COMBINED);
  const total_client_ttc = round2(revenue_ht + tax_combined_sale);

  // --------- 7. Taxes nettes à remettre (TPS et TVQ séparées) ---------
  // Ce que Jeremy doit remettre à chaque palier de gouvernement.
  const tax_net_gst_payable = round2(tax_gst_sale - input_tax_credit_gst);  // à Revenu Canada
  const tax_net_qst_payable = round2(tax_qst_sale - input_tax_credit_qst);  // à Revenu Québec
  const tax_net_payable = round2(tax_net_gst_payable + tax_net_qst_payable);

  // --------- 8. Profit ---------
  const gross_profit_ht = round2(revenue_ht - total_cost_ht);
  const gross_margin_pct = revenue_ht > 0 ? round2((gross_profit_ht / revenue_ht) * 100) : 0;

  // Profit net = profit brut - taxes nettes à remettre (ce que Jeremy garde vraiment)
  const net_profit = round2(gross_profit_ht - tax_net_payable);
  const net_margin_pct = revenue_ht > 0 ? round2((net_profit / revenue_ht) * 100) : 0;

  return {
    // === Lignes détail ===
    material_lines,
    fee_lines,
    labor_line,

    // === Totaux côté coût (interne) ===
    material_cost_ht: round2(material_cost_ht),
    fee_cost_ht: round2(fee_cost_ht),
    labor_cost,
    total_cost_ht,
    input_tax_credit,
    input_tax_credit_gst,
    input_tax_credit_qst,

    // === Totaux côté revenu (client) ===
    rate_per_sqft,
    surface_sqft,
    revenue_ht,
    tax_gst_sale,
    tax_qst_sale,
    tax_combined_sale,
    total_client_ttc,

    // === Taxes nettes ===
    tax_net_payable,
    tax_net_gst_payable,
    tax_net_qst_payable,
    taxable_inputs: round2(taxable_inputs),

    // === Profit ===
    gross_profit_ht,
    gross_margin_pct,
    net_profit,
    net_margin_pct,

    // === Meta ===
    min_quote_price,
    min_quote_applied,
    target_margin_pct,
    target_margin_applied,
    surface_multiplier,
    surface_bucket_label,
    surface_bucket_mode,
    labor_auto_applied,
    workers: worker_count,
    worker_rates: rates,
    hours_per_day,
    days,
    cash_discount,
    pitch_category,
    pitch_tier
  };
}
