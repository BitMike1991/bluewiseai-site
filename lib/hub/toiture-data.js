/**
 * PÜR Hub v2 — Toiture Data Accessor
 *
 * Re-exports from /lib/toiture-calc.js.
 * NEVER duplicates data.
 */

export {
  TAX_GST,
  TAX_QST,
  TAX_COMBINED,
  SQFT_PER_PAQUET,
  MATERIALS,
  JOB_FEES,
  LABOR,
  SURFACE_RATE_BUCKETS,
  getSurfaceMultiplier,
  suggestLaborFromSurface,
  PITCH_RATES,
  formatCAD,
  autoCalculateQuantities,
  calculateRoofingQuote,
} from '@/lib/toiture-calc';
