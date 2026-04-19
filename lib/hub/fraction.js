/**
 * Parse fractional inch strings.
 * Handles: "48", "48.5", "48 1/2", "1/2", "48-1/2", "35 13/16"
 * Exact port of the existing parseFraction from commande-royalty.html.
 */
export function parseFraction(str) {
  if (str == null) return NaN;
  str = String(str).trim();
  if (!str) return NaN;
  // Pure decimal
  if (/^\d+(\.\d+)?$/.test(str)) return parseFloat(str);
  // Pure fraction: "1/2", "13/16"
  const pureFrac = str.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (pureFrac) return parseInt(pureFrac[1]) / parseInt(pureFrac[2]);
  // Whole + fraction: "48 1/2", "48-1/2", "48 13/16"
  const mixed = str.match(/^(\d+)\s*[-\s]\s*(\d+)\s*\/\s*(\d+)$/);
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
  return NaN;
}

/**
 * Format a decimal dimension back to a readable string with fractions.
 */
export function formatDim(val) {
  if (val == null || isNaN(val)) return '';
  const whole = Math.floor(val);
  const frac = val - whole;
  if (frac === 0) return String(whole);

  // Common fractions
  const fractions = [
    [1/16, '1/16'], [1/8, '1/8'], [3/16, '3/16'], [1/4, '1/4'],
    [5/16, '5/16'], [3/8, '3/8'], [7/16, '7/16'], [1/2, '1/2'],
    [9/16, '9/16'], [5/8, '5/8'], [11/16, '11/16'], [3/4, '3/4'],
    [13/16, '13/16'], [7/8, '7/8'], [15/16, '15/16'],
  ];

  let best = null;
  let bestDiff = Infinity;
  for (const [f, label] of fractions) {
    const diff = Math.abs(frac - f);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = label;
    }
  }

  if (bestDiff < 0.001) {
    return whole > 0 ? `${whole} ${best}` : best;
  }
  // Fallback to decimal
  return val.toFixed(2);
}
