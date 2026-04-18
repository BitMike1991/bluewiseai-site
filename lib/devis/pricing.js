/**
 * PUR client pricing formula — ported from DevisPage.js (pur-construction-site).
 * Mikael's confirmed constants: $3/linear inch, 20% markup, $400 floor.
 * Updated S156: urethane + moulure + calking supply fees added to formula.
 */

export const DEFAULT_PRICING = {
  markupPct: 20,
  perLinearInch: 3,
  minPerWindow: 400,
  escomptePct: 0,
  // Supply fees (per item)
  urethanePer150: 6.75,   // 1 can per 150 linear inches
  moulurePerInch: 0.04,   // moulure per linear inch
  calkingPer120: 6.75,    // 1 tube per 120 linear inches
  // Per-project fixed costs
  overheadPerJob: 200,
  gazPerJob: 100,
};

function parseFrac(str) {
  if (!str) return 0;
  const s = String(str).trim().replace(/[""]/g, '');
  if (/^\d+(\.\d+)?$/.test(s)) return parseFloat(s);
  const m = s.match(/^(\d+)\s*(\d+)\s*\/\s*(\d+)$/);
  if (m) return parseInt(m[1]) + parseInt(m[2]) / parseInt(m[3]);
  const f = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (f) return parseInt(f[1]) / parseInt(f[2]);
  return parseFloat(s) || 0;
}

/**
 * Detect if an item matches a hardcoded pricing config entry.
 *
 * Matching is intentionally conservative — err on false-negative rather than
 * false-positive (we never want to apply the wrong fixed cost).
 *
 * @param {Object} item - { type, model, description, specs, dimensions, ... }
 * @param {Object} hardcodedConfig - quote_config.hardcoded_pricing object
 * @returns {{ config_key, base_cost, cadre_thickness, side_cost, max_sides } | null}
 */
export function detectHardcodedType(item, hardcodedConfig) {
  if (!hardcodedConfig || typeof hardcodedConfig !== 'object') return null;

  // Combine text fields into one lowercase search string.
  // NOTE: dimensions.width is intentionally excluded — a 60" width contains "6"
  // and would falsely match the "patio 6pi" token. Size matching relies on
  // explicit mentions in type/model/description (e.g. "6pi", "6'", "6 pi").
  const text = [
    item.type || '',
    item.model || '',
    item.description || '',
    item.specs || '',
  ]
    .join(' ')
    .toLowerCase()
    .replace(/['"]/g, '') // strip inch/quote chars that might confuse digit matching
    .replace(/'/g, '');   // smart quotes

  // Order matters: check hybride noir BEFORE pvc blanc on 6pi
  // to avoid pvc 6pi matching hybride 6pi
  const ORDERED_KEYS = [
    'patio_6pi_hybride_noir',
    'patio_6pi_pvc_blanc',
    'patio_5pi_pvc_blanc',
    'porte_simple',
  ];

  for (const key of ORDERED_KEYS) {
    const cfg = hardcodedConfig[key];
    if (!cfg) continue;

    const { type_match = [], material_match = [] } = cfg;

    // All type_match tokens must appear in text
    let typeOk = type_match.every(token => text.includes(token.toLowerCase()));

    // Porte simple: also match "porte" + side lite synonyms (latéraux, sides, lite)
    // even if the literal word "simple" is absent (e.g. "Porte + 2 latéraux")
    if (!typeOk && key === 'porte_simple') {
      const hasPorte = text.includes('porte');
      const hasSideWord = /lat[eé]rau?x?|lat[eé]ral|\bsides?\b|\blite\b/i.test(text);
      const notPatio = !text.includes('patio');
      if (hasPorte && hasSideWord && notPatio) typeOk = true;
    }
    if (!typeOk) continue;

    // Porte simple: must NOT contain "patio" (guard)
    if (key === 'porte_simple' && text.includes('patio')) continue;

    // All material_match tokens must appear in text (if any)
    const matOk =
      material_match.length === 0 ||
      material_match.every(token => text.includes(token.toLowerCase()));
    if (!matOk) continue;

    // blanc / blanche variant for PVC blanc types
    if (key === 'patio_6pi_pvc_blanc' || key === 'patio_5pi_pvc_blanc') {
      const hasBlanc = text.includes('blanc') || text.includes('blanche');
      if (!hasBlanc) continue;
    }

    // noir / noire variant for hybride noir
    if (key === 'patio_6pi_hybride_noir') {
      const hasNoir = text.includes('noir') || text.includes('noire');
      if (!hasNoir) continue;
    }

    return {
      config_key: key,
      base_cost: cfg.base_cost,
      cadre_thickness: cfg.cadre_thickness ?? null,
      side_cost: cfg.side_cost ?? null,
      max_sides: cfg.max_sides ?? null,
    };
  }

  return null;
}

/**
 * Compute client price for a hardcoded item (patio doors + porte simple).
 *
 * Patio formula:
 *   clientUnit = base_cost × 1.20 + perimeter_inches × 3  (min 400)
 *
 * Porte simple formula:
 *   rawCost    = base_cost + (sides × side_cost)
 *   clientUnit = rawCost × 1.20 + perimeter_inches × 3    (min 400)
 *
 * @param {Object} item          - { dimensions, qty, sides?, ... }
 * @param {Object} hardcodedMatch - result of detectHardcodedType (non-null)
 * @param {Object} pricing        - { markupPct?, perLinearInch?, minPerWindow? }
 * @returns {{ cost, clientUnit, clientTotal }}
 */
export function computeHardcodedPrice(item, hardcodedMatch, pricing) {
  const markupPct      = Number(pricing.markupPct      ?? 20);
  const perLinearInch  = Number(pricing.perLinearInch  ?? 3);
  const minPerWindow   = Number(pricing.minPerWindow   ?? 400);
  const urethanePer150 = Number(pricing.urethanePer150 ?? 6.75);
  const moulurePerInch = Number(pricing.moulurePerInch ?? 0.04);
  const calkingPer120  = Number(pricing.calkingPer120  ?? 6.75);

  const { base_cost, side_cost, max_sides } = hardcodedMatch;

  // Compute raw cost (before markup)
  let rawCost = base_cost;
  if (side_cost != null) {
    // porte simple: add sides
    const sides = Math.min(Number(item.sides) || 0, max_sides || 2);
    rawCost = base_cost + sides * side_cost;
  }

  // Markup
  const afterMarkup = rawCost * (1 + markupPct / 100);

  // Perimeter surcharges
  const w = parseFrac(item.dimensions?.width);
  const h = parseFrac(item.dimensions?.height);
  const perimeter = 2 * (w + h);
  const linear    = perimeter * perLinearInch;
  const urethane  = Math.ceil(perimeter / 150) * urethanePer150;
  const moulure   = perimeter * moulurePerInch;
  const calking   = Math.ceil(perimeter / 120) * calkingPer120;

  const rawPrice  = afterMarkup + linear + urethane + moulure + calking;

  // Floor
  const clientUnit = Math.max(rawPrice, minPerWindow);
  const qty        = Number(item.qty) || 1;

  return {
    cost:        Math.round(rawCost * 100) / 100,
    clientUnit:  Math.round(clientUnit * 100) / 100,
    clientTotal: Math.round(clientUnit * qty * 100) / 100,
    _perimeter:  Math.round(perimeter * 100) / 100,
    _urethane:   Math.round(urethane * 100) / 100,
    _moulure:    Math.round(moulure * 100) / 100,
    _calking:    Math.round(calking * 100) / 100,
  };
}

/**
 * Compute client price from list price + dealer escompte.
 *
 * If hardcodedConfig is provided and the item matches a hardcoded type,
 * the hardcoded formula is used instead of the standard list-price formula.
 *
 * Standard formula:
 *   cost        = listPrice * (1 - escomptePct/100)
 *   afterMarkup = cost * (1 + markupPct/100)       [default 20%]
 *   perimeter   = 2 × (width_in + height_in)
 *   rawPrice    = afterMarkup + perimeter * perLinearInch  [default $3/in]
 *   clientUnit  = max(rawPrice, minPerWindow)              [default $400]
 *
 * @param {Object} item           - matched soumission item with unitPrice + dimensions
 * @param {Object} pricing        - { escomptePct, markupPct?, perLinearInch?, minPerWindow?,
 *                                    urethanePer150?, moulurePerInch?, calkingPer120? }
 * @param {Object} [hardcodedConfig] - quote_config.hardcoded_pricing (optional)
 * @returns {{ cost, clientUnit, clientTotal, _perimeter, _urethane, _moulure, _calking }}
 */
export function computeClientPrice(item, pricing, hardcodedConfig) {
  // Try hardcoded route first (only if config provided and customer opted in)
  if (hardcodedConfig) {
    const match = detectHardcodedType(item, hardcodedConfig);
    if (match) {
      return computeHardcodedPrice(item, match, pricing);
    }
  }

  // Standard formula (list price based)
  if (!item.unitPrice) return { clientUnit: 0, clientTotal: 0, cost: 0, _perimeter: 0, _urethane: 0, _moulure: 0, _calking: 0 };
  const listPrice      = Number(item.unitPrice);
  const escomptePct    = Number(pricing.escomptePct    || 0);
  const markupPct      = Number(pricing.markupPct      ?? 20);
  const perLinearInch  = Number(pricing.perLinearInch  ?? 3);
  const minPerWindow   = Number(pricing.minPerWindow   ?? 400);
  const urethanePer150 = Number(pricing.urethanePer150 ?? 6.75);
  const moulurePerInch = Number(pricing.moulurePerInch ?? 0.04);
  const calkingPer120  = Number(pricing.calkingPer120  ?? 6.75);

  // Step 1: dealer discount
  const cost = listPrice * (1 - escomptePct / 100);
  // Step 2: markup on cost
  const afterMarkup = cost * (1 + markupPct / 100);
  // Step 3: perimeter surcharges
  const w = parseFrac(item.dimensions?.width);
  const h = parseFrac(item.dimensions?.height);
  const perimeter = 2 * (w + h);
  const linear    = perimeter * perLinearInch;
  const urethane  = Math.ceil(perimeter / 150) * urethanePer150;
  const moulure   = perimeter * moulurePerInch;
  const calking   = Math.ceil(perimeter / 120) * calkingPer120;
  const rawPrice  = afterMarkup + linear + urethane + moulure + calking;
  // Step 4: floor
  const clientUnit = Math.max(rawPrice, minPerWindow);
  const qty = Number(item.qty) || 1;

  return {
    cost:        Math.round(cost * 100) / 100,
    clientUnit:  Math.round(clientUnit * 100) / 100,
    clientTotal: Math.round(clientUnit * qty * 100) / 100,
    _perimeter:  Math.round(perimeter * 100) / 100,
    _urethane:   Math.round(urethane * 100) / 100,
    _moulure:    Math.round(moulure * 100) / 100,
    _calking:    Math.round(calking * 100) / 100,
  };
}

/**
 * Compute project-level totals from an array of already-priced line items.
 *
 * @param {Array}  items    - line items, each with { total: number }
 * @param {Object} pricing  - { overheadPerJob?, gazPerJob? }
 * @param {Object} [opts]   - { container?: boolean }
 * @returns {{ itemsTotal, overhead, gaz, container, subtotal, tax_gst, tax_qst, total_ttc }}
 */
export function computeProjectTotals(items, pricing = {}, opts = {}) {
  const itemsTotal = (items || []).reduce((s, it) => s + (Number(it.total) || 0), 0);
  const overhead   = Number(pricing.overheadPerJob ?? 200);
  const gaz        = Number(pricing.gazPerJob      ?? 100);
  const container  = opts.container ? 175 : 0;
  const subtotal   = itemsTotal + overhead + gaz + container;
  const tax_gst    = +(subtotal * 0.05).toFixed(2);
  const tax_qst    = +(subtotal * 0.09975).toFixed(2);
  const total_ttc  = +(subtotal + tax_gst + tax_qst).toFixed(2);
  return {
    itemsTotal: Math.round(itemsTotal * 100) / 100,
    overhead,
    gaz,
    container,
    subtotal:  Math.round(subtotal * 100) / 100,
    tax_gst,
    tax_qst,
    total_ttc,
  };
}
