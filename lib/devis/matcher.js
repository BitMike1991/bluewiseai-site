/**
 * Devis Matcher — matches bon de commande items to soumission items by model + dimensions.
 */

/**
 * Parse fractional inch string to decimal.
 * "46 3/4" → 46.75, "37 3/4" → 37.75, "82 1/2" → 82.5, "68" → 68
 */
export function parseFractionalInch(str) {
  if (str == null) return NaN;
  str = String(str).trim().replace(/[""]/g, '').replace(/po\.?$/i, '').trim();
  if (!str) return NaN;
  // Pure decimal / integer
  if (/^\d+(\.\d+)?$/.test(str)) return parseFloat(str);
  // Pure fraction: "1/2"
  const pureFrac = str.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (pureFrac) return parseInt(pureFrac[1]) / parseInt(pureFrac[2]);
  // Mixed: "46 3/4" or "46-3/4"
  const mixed = str.match(/^(\d+)\s*[-\s]\s*(\d+)\s*\/\s*(\d+)$/);
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
  return NaN;
}

/**
 * Normalize model code to canonical base type.
 * C2G, C2D, C2X → C2
 * C3G, C3D → C3
 * BS1 → BS1
 * G1 → G1
 * All others → original (uppercased)
 */
function normalizeModel(model) {
  if (!model) return '';
  const m = String(model).toUpperCase().trim();
  if (/^C2/.test(m)) return 'C2';
  if (/^C3/.test(m)) return 'C3';
  if (/^BS1/.test(m)) return 'BS1';
  if (/^G1/.test(m)) return 'G1';
  return m;
}

/**
 * Map a normalized model code to a product family for wide-tolerance fallback matching.
 * ARC-* or BOW* → 'bow_arc'
 * C1/C2/C3/C4   → 'coulissante'
 * BS1/BS2/BS3   → 'battante'
 * G1/G2         → 'guillotine'
 * PS-*          → 'porte_simple'
 * default       → 'other'
 */
export function modelFamily(normModel) {
  if (!normModel) return 'other';
  const m = String(normModel).toUpperCase().trim();
  if (/^(ARC|BOW)/.test(m)) return 'bow_arc';
  if (/^C[1234]/.test(m)) return 'coulissante';
  if (/^BS[123]/.test(m)) return 'battante';
  if (/^G[12]/.test(m)) return 'guillotine';
  if (/^PS/.test(m)) return 'porte_simple';
  return 'other';
}

/**
 * Parse a dimension object {width, height} from either string or object.
 * Returns {width: number, height: number} in decimal inches.
 */
function parseDimensions(dim) {
  if (!dim) return { width: NaN, height: NaN };
  if (typeof dim === 'string') {
    // "68 X 37 3/4" or "68 × 37 3/4" or "68x37 3/4"
    const parts = dim.split(/[xX×]/);
    if (parts.length >= 2) {
      return {
        width: parseFractionalInch(parts[0].trim()),
        height: parseFractionalInch(parts[1].trim()),
      };
    }
    return { width: NaN, height: NaN };
  }
  return {
    width: parseFractionalInch(dim.width),
    height: parseFractionalInch(dim.height),
  };
}

/**
 * Check if two dimensions match within tolerance (in inches).
 */
function dimsMatch(a, b, tolerance = 1) {
  const da = parseDimensions(a);
  const db = parseDimensions(b);
  if (isNaN(da.width) || isNaN(da.height) || isNaN(db.width) || isNaN(db.height)) return false;
  return (
    Math.abs(da.width - db.width) <= tolerance &&
    Math.abs(da.height - db.height) <= tolerance
  );
}

/**
 * matchPrices(orders, soumission)
 *
 * Enriches each order's items with price data from soumission.
 * Matching strategy:
 *   1. Model type match (normalized)
 *   2. Dimension match within 1" tolerance
 *   3. Qty as tiebreaker when multiple candidates
 *
 * Prevents double-assignment of soumission items.
 *
 * @param {Array} orders — array of bon_commande parsed objects
 * @param {Object} soumission — parsed soumission object
 * @returns {Array} enriched orders
 */
export function matchPrices(orders, soumission) {
  if (!orders || !soumission) return orders || [];

  const souItems = (soumission.items || []).map((item, idx) => ({
    ...item,
    _idx: idx,
    _used: false,
    _normModel: normalizeModel(item.model),
  }));

  return orders.map((order) => {
    const enrichedItems = (order.items || []).map((item) => {
      const normModel = normalizeModel(item.model);

      // Find candidates: try model + dims first, then dims-only fallback
      let candidates = souItems.filter(
        (s) =>
          !s._used &&
          s._normModel === normModel &&
          dimsMatch(item.dimensions, s.dimensions)
      );

      // Fallback: match by dimensions + qty only (models may differ between bon/soumission)
      if (candidates.length === 0) {
        candidates = souItems.filter(
          (s) =>
            !s._used &&
            dimsMatch(item.dimensions, s.dimensions) &&
            Number(s.qty) === Number(item.qty)
        );
      }

      // Branch 3: last resort — match by dimensions only (ignore model + qty), 1.5" tolerance
      if (candidates.length === 0) {
        candidates = souItems.filter(
          (s) => !s._used && dimsMatch(item.dimensions, s.dimensions, 1.5)
        );
      }

      // Branch 4: wide-tolerance fallback — model family match + dims within 5"
      // Flags as partial_wide for Jérémy to manually verify.
      let isWideMatch = false;
      if (candidates.length === 0) {
        const itemFamily = modelFamily(normModel);
        candidates = souItems.filter(
          (s) =>
            !s._used &&
            modelFamily(s._normModel) === itemFamily &&
            dimsMatch(item.dimensions, s.dimensions, 5)
        );
        if (candidates.length > 0) isWideMatch = true;
      }

      if (candidates.length === 0) {
        return { ...item, matched: false, unitPrice: null, totalPrice: null };
      }

      // Tiebreaker: prefer qty match
      let best = candidates[0];
      if (candidates.length > 1) {
        const qtyMatch = candidates.find((c) => Number(c.qty) === Number(item.qty));
        if (qtyMatch) best = qtyMatch;
      }

      // Mark used
      souItems[best._idx]._used = true;

      return {
        ...item,
        matched: true,
        unitPrice: best.unitPrice ?? null,
        totalPrice: best.totalPrice ?? null,
        soumissionItemNumber: best.itemNumber ?? null,
        match_confidence: isWideMatch ? 'partial_wide' : undefined,
      };
    });

    return { ...order, items: enrichedItems };
  });
}
