/**
 * Shared helpers for rendering item specs + dimensions in PÜR quote + contract
 * templates. Goal: clean, client-facing output with no duplicate spec lines or
 * awkward line-breaks in dimensions.
 */

// Category prefixes we consider duplicates when repeated within an item's specs.
// Example: two lines starting with "Thermos" are collapsed to one — the more
// informative one wins (numeric dimension > generic word).
const CATEGORY = /^(thermos|configuration|collection|couleur|moustiquaire|[eéÉE]paisseur|rencontre|sens\s+ouvrant|seuil|serrure|style|slab|mod[eèÈE]le|cadre\s+de\s+porte|profil[eéÉE]?)/i;

function isCleanPunctuation(line) {
  // Proper spacing around : · — means this version was hand-written, not a
  // concatenation leftover from an import.
  return /\s[:·—]\s/.test(line);
}

function hasNumericSpec(line) {
  // A line like `Thermos 7/8" Low-E Argon` carries the actual spec value.
  return /\d/.test(line);
}

function pickBetter(existing, candidate) {
  // Prefer the entry that carries a numeric spec (7/8", 9 1/2, etc.).
  const existingNum = hasNumericSpec(existing);
  const candidateNum = hasNumericSpec(candidate);
  if (candidateNum && !existingNum) return candidate;
  if (existingNum && !candidateNum) return existing;
  // Both numeric (or both not) — prefer the one with proper punctuation spacing.
  const existingClean = isCleanPunctuation(existing);
  const candidateClean = isCleanPunctuation(candidate);
  if (candidateClean && !existingClean) return candidate;
  if (existingClean && !candidateClean) return existing;
  // Tie-breaker: longer string (more info).
  return candidate.length > existing.length ? candidate : existing;
}

/**
 * Dedupe a spec list by category prefix. Accepts array or comma-separated
 * string. Returns an array of clean spec strings in original order.
 */
export function dedupeSpecs(specs) {
  if (specs == null) return [];
  const list = (Array.isArray(specs)
    ? specs
    : String(specs).split(',')
  ).map(s => String(s || '').trim()).filter(Boolean);

  const out = [];
  const indexByKey = new Map();

  for (const line of list) {
    const m = line.match(CATEGORY);
    const key = m ? m[1].toLowerCase().replace(/\s+/g, '') : null;
    if (key && indexByKey.has(key)) {
      const idx = indexByKey.get(key);
      out[idx] = pickBetter(out[idx], line);
      continue;
    }
    if (key) indexByKey.set(key, out.length);
    out.push(line);
  }
  return out;
}

/**
 * Clean a project_description for display. The S155 rescue script
 * (scripts/rescue-jeremy-6-quotes.mjs) appended " — ${projectId}" where
 * projectId was derived from the source filename, leaving tails like
 * "— PU_R___Bon_de_commande_fournis" on client-facing devis. Strip those.
 */
export function sanitizeProjectDescription(desc) {
  if (!desc) return '';
  // Strip trailing " — <filename-like>" where the tail contains ≥2 underscores
  // (to avoid eating legitimate dashes-separated clauses).
  return String(desc)
    .replace(/\s+[—–-]\s*\S*_\S*_\S*\s*$/g, '')
    .trim();
}

function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Render a dimensions line that never line-breaks inside a value like "30 1/4".
 * Each value is wrapped in a nowrap span so "24 1/4 × 54" stays on one line
 * when possible, and long pairs break only at the `×`.
 */
export function renderDimsHtml(w, h, className = 'dims') {
  if (w == null || h == null || w === '' || h === '') return '';
  return `<div class="${className}">`
    + `<span class="dim-val">${escAttr(w)}</span>`
    + `<span class="x"> × </span>`
    + `<span class="dim-val">${escAttr(h)}</span>`
    + `</div>`;
}
