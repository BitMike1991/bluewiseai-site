/**
 * PUR client pricing formula — ported from DevisPage.js (pur-construction-site).
 * Mikael's confirmed constants: $3/linear inch, 20% markup, $400 floor.
 */

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
 * Compute client price from list price + dealer escompte.
 *
 * Formula:
 *   cost        = listPrice * (1 - escomptePct/100)
 *   afterMarkup = cost * (1 + markupPct/100)       [default 20%]
 *   perimeter   = 2 × (width_in + height_in)
 *   rawPrice    = afterMarkup + perimeter * perLinearInch  [default $3/in]
 *   clientUnit  = max(rawPrice, minPerWindow)              [default $400]
 *
 * @param {Object} item - matched soumission item with unitPrice + dimensions
 * @param {Object} pricing - { escomptePct, markupPct?, perLinearInch?, minPerWindow? }
 * @returns {{ cost, clientUnit, clientTotal }}
 */
export function computeClientPrice(item, pricing) {
  if (!item.unitPrice) return { clientUnit: 0, clientTotal: 0, cost: 0 };
  const listPrice = Number(item.unitPrice);
  const escomptePct = Number(pricing.escomptePct) || 0;
  const markupPct = Number(pricing.markupPct ?? 20);
  const perLinearInch = Number(pricing.perLinearInch ?? 3);
  const minPerWindow = Number(pricing.minPerWindow ?? 400);

  // Step 1: dealer discount
  const cost = listPrice * (1 - escomptePct / 100);
  // Step 2: markup on cost
  const afterMarkup = cost * (1 + markupPct / 100);
  // Step 3: perimeter surcharge
  const w = parseFrac(item.dimensions?.width);
  const h = parseFrac(item.dimensions?.height);
  const perimeter = 2 * (w + h);
  const rawPrice = afterMarkup + perimeter * perLinearInch;
  // Step 4: floor
  const clientUnit = Math.max(rawPrice, minPerWindow);
  const qty = Number(item.qty) || 1;

  return {
    cost: Math.round(cost * 100) / 100,
    clientUnit: Math.round(clientUnit * 100) / 100,
    clientTotal: Math.round(clientUnit * qty * 100) / 100,
  };
}
