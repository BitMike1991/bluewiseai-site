/**
 * PUR "porte simple gratuite" promo — offered when the quote has 9+ openings
 * (counting qty). Jérémy gives away ONE simple entry door up to $800 supplier cost
 * + its standard installation. Extras (more expensive doors, sides, side install)
 * are still charged to the client at full price.
 *
 * Implementation: the door item stays on the quote at its normal computed price;
 * we subtract a flat "rebate" line equal to the price we would charge for a base
 * $800-cost simple door at standard dimensions (no sides). Because the base door's
 * value is removed from the total, the client effectively only pays for whatever
 * exceeds it (extra supplier cost + sides + any side-related material).
 *
 * Mikaël's rules (2026-04-19):
 *   - Threshold: >=9 items total (qty summed). Door counts.
 *   - Cheapest door wins the promo when there are multiple — but rebate is fixed
 *     regardless of which door, since "it's always just $800 of door + install".
 *   - Auto-enabled when eligible; Jérémy can toggle OFF per quote.
 *   - Client-facing: show full price + a separate "Rabais promo" line in green.
 */

export const PROMO_DOOR_BASE_COST = 800;
export const PROMO_QTY_THRESHOLD = 9;
// Standard entry-door dims (matches PS-34 used in the 6 rescue quotes)
export const PROMO_DOOR_STD_DIMS = { width: 36, height: 82.75 };

/**
 * Compute the rebate amount = what we'd charge a client for a base simple entry
 * door at $800 supplier cost, zero sides, standard dimensions, full install.
 *
 * @param {Object} [pricing] - optional override { markupPct, perLinearInch, ... }
 * @returns {number} rebate amount, rounded to 2 decimals
 */
export function computePromoDoorRebate(pricing = {}) {
  const markupPct      = Number(pricing.markupPct      ?? 20);
  const perLinearInch  = Number(pricing.perLinearInch  ?? 3);
  const urethanePer150 = Number(pricing.urethanePer150 ?? 6.75);
  const moulurePerInch = Number(pricing.moulurePerInch ?? 0.04);
  const calkingPer120  = Number(pricing.calkingPer120  ?? 6.75);

  const cost = PROMO_DOOR_BASE_COST;
  const afterMarkup = cost * (1 + markupPct / 100);

  const w = PROMO_DOOR_STD_DIMS.width;
  const h = PROMO_DOOR_STD_DIMS.height;
  const perimeter = 2 * (w + h);
  const linear    = perimeter * perLinearInch;
  const urethane  = Math.ceil(perimeter / 150) * urethanePer150;
  const moulure   = perimeter * moulurePerInch;
  const calking   = Math.ceil(perimeter / 120) * calkingPer120;

  const rebate = afterMarkup + linear + urethane + moulure + calking;
  return Math.round(rebate * 100) / 100;
}

/**
 * Returns true if a line item is a simple entry door (not patio, not double).
 * Accepts hardcoded_type tag, type, model, description.
 */
export function isPorteSimpleItem(item) {
  if (!item) return false;
  if (item._hardcoded_type === 'porte_simple') return true;
  const blob = [
    item.type || '',
    item.model || '',
    item.description || '',
  ].join(' ').toLowerCase();
  if (blob.includes('patio')) return false;      // exclude patio doors
  if (blob.includes('double')) return false;     // exclude double doors
  return blob.includes('porte') && blob.includes('simple');
}

/**
 * Count total openings (qty-weighted) across line items, excluding "Installation"
 * pseudo-items.
 */
export function countOpenings(items) {
  if (!Array.isArray(items)) return 0;
  return items
    .filter(it => (it.type || '').toLowerCase() !== 'installation'
      && !(it.description || '').toLowerCase().startsWith('installation'))
    .reduce((s, it) => s + (Number(it.qty) || 1), 0);
}

/**
 * Does this quote qualify for the free simple door promo?
 *   - total openings (qty) >= 9
 *   - at least one simple entry door item present
 */
export function qualifiesForPromo(items) {
  if (!Array.isArray(items)) return false;
  return countOpenings(items) >= PROMO_QTY_THRESHOLD
    && items.some(isPorteSimpleItem);
}
