/**
 * PÜR Hub v2 — Unified Catalog Accessor
 *
 * Re-exports from the three canonical catalog source files.
 * NEVER duplicates data — all imports from /lib/*.js.
 */

// ── Royalty ──
import {
  COLLECTIONS,
  WINDOW_COLORS,
  THERMOS_TYPES,
  WINDOW_TYPES,
  ENTRY_DOOR_SPECS,
  ENTRY_DOOR_STYLES,
  ENTRY_DOOR_MODELS,
  ENTRY_DOOR_SPECS_DEFAULT,
  DOOR_STANDARD_MEASUREMENTS,
  CONVENIENCE_DOOR_OPTIONS,
  HANDLES,
  PATIO_DOOR_COLLECTIONS,
  PATIO_CONFIGS,
  PATIO_DOOR_OPTIONS,
  ROYALTY_WARRANTIES_REFERENCE,
  ROYALTY_CONTACT,
} from '@/lib/royalty-catalog';

// ── Touchette ──
import {
  TOUCHETTE_INFO,
  TOUCHETTE_SERIE,
  TOUCHETTE_WINDOW_FAMILIES,
  TOUCHETTE_PERFORMANCE,
  TOUCHETTE_NOTATION,
  WINDOW_TYPES_TOUCHETTE,
} from '@/lib/touchette-catalog';

// ── Portes Standard ──
import {
  PORTES_STANDARD_INFO,
  ODYSSEE,
  BELLE_VUE,
  PORTES_STANDARD_PATIO,
} from '@/lib/portes-standard-catalog';

// ── Re-exports ──
export {
  // Royalty
  COLLECTIONS,
  WINDOW_COLORS,
  THERMOS_TYPES,
  WINDOW_TYPES,
  ENTRY_DOOR_SPECS,
  ENTRY_DOOR_STYLES,
  ENTRY_DOOR_MODELS,
  ENTRY_DOOR_SPECS_DEFAULT,
  DOOR_STANDARD_MEASUREMENTS,
  CONVENIENCE_DOOR_OPTIONS,
  HANDLES,
  PATIO_DOOR_COLLECTIONS,
  PATIO_CONFIGS,
  PATIO_DOOR_OPTIONS,
  ROYALTY_WARRANTIES_REFERENCE,
  ROYALTY_CONTACT,
  // Touchette
  TOUCHETTE_INFO,
  TOUCHETTE_SERIE,
  TOUCHETTE_WINDOW_FAMILIES,
  TOUCHETTE_PERFORMANCE,
  TOUCHETTE_NOTATION,
  WINDOW_TYPES_TOUCHETTE,
  // Portes Standard
  PORTES_STANDARD_INFO,
  ODYSSEE,
  BELLE_VUE,
  PORTES_STANDARD_PATIO,
};

// ── Helper Functions ──

/**
 * Get window types for a given supplier.
 * Royalty: WINDOW_TYPES (object keyed by type id, each with configurations[])
 * Touchette: WINDOW_TYPES_TOUCHETTE (same structure — 7 types with configurations[])
 */
export function getWindowTypes(supplier) {
  if (supplier === 'touchette') return WINDOW_TYPES_TOUCHETTE;
  return WINDOW_TYPES;
}

/**
 * Get entry door styles (panel configs + slab sizes).
 * Both suppliers use the same door styles from Royalty.
 */
export function getEntryDoorStyles() {
  return ENTRY_DOOR_STYLES;
}

/**
 * Patio configs — always Portes Standard (the only patio supplier PÜR uses).
 */
export const PATIO_CONFIGS_PSTD = [
  { code: 'XO',    panels: ['X','O'],         min: { w: 58,  h: 71 }, max: { w: 94,  h: 96 } },
  { code: 'OX',    panels: ['O','X'],         min: { w: 58,  h: 71 }, max: { w: 94,  h: 96 } },
  { code: 'XOO',   panels: ['X','O','O'],     min: { w: 87,  h: 79 }, max: { w: 140, h: 96 } },
  { code: 'OOX',   panels: ['O','O','X'],     min: { w: 87,  h: 79 }, max: { w: 140, h: 96 } },
  { code: 'XOX',   panels: ['X','O','X'],     min: { w: 86,  h: 79 }, max: { w: 138, h: 96 } },
  { code: 'OXO-G', panels: ['O','X','O'],     min: { w: 88,  h: 79 }, max: { w: 142, h: 96 } },
  { code: 'OXO-D', panels: ['O','X','O'],     min: { w: 88,  h: 79 }, max: { w: 142, h: 96 } },
  { code: 'OXXO',  panels: ['O','X','X','O'], min: { w: 116, h: 79 }, max: { w: 138, h: 96 } },
];

export function getPatioConfigs() {
  return PATIO_CONFIGS_PSTD;
}

/**
 * Get patio collections by supplier.
 * Royalty: PATIO_DOOR_COLLECTIONS
 * Touchette: PORTES_STANDARD_PATIO (distributed by Touchette)
 */
export function getPatioCollections(supplier) {
  if (supplier === 'touchette') {
    return PORTES_STANDARD_PATIO;
  }
  return PATIO_DOOR_COLLECTIONS;
}

/**
 * Get available colors for a collection.
 */
export function getColors(collection) {
  if (!collection) return WINDOW_COLORS.standard_upvc;
  const col = COLLECTIONS[collection];
  if (!col) return WINDOW_COLORS.standard_upvc;
  if (col.colors_available === 'all_6_plus_custom') {
    return WINDOW_COLORS.standard_hybride;
  }
  return WINDOW_COLORS.standard_upvc;
}

/**
 * Get supplier info by key.
 */
export function supplierInfo(key) {
  if (key === 'royalty') {
    return {
      name: 'Groupe Royalty',
      short: 'R',
      ...ROYALTY_CONTACT,
    };
  }
  if (key === 'touchette') {
    return {
      name: TOUCHETTE_INFO.name,
      short: 'T',
      ...TOUCHETTE_INFO,
    };
  }
  return null;
}
