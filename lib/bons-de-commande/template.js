// lib/bons-de-commande/template.js
// Manufacturer-grade BDC HTML template + spec sanitizers + categorisation.
// Extracted 2026-04-21 from pages/api/bons-de-commande/generate.js so the
// viewer route (/api/bons-de-commande/[id]) can re-render older BDCs with
// the latest template — no backfill needed (Mikael 2026-04-21:
// "ca ne backlog pas sur les ancien BC").
//
// Public exports:
//   - buildBcHtml({ ... }) → HTML string (full BDC document)
//   - assembleProjectsFromItemRefs(supabase, customerId, itemRefs)
//       → Promise<{ projects, totalItems, totalQty }>

import { itemSketchSvg } from '../quote-templates/pur.js';
import { dedupeSpecs } from '../devis/specs.js';
import { parseFraction, formatDim } from '../hub/fraction.js';

const NAVY    = '#2A2C35';
const SAGE    = '#5A7A5A';
const RED     = '#B73D3A';
const PAPER   = '#FAFAF7';
const RULE    = '#E5E2DA';
const MUTED   = '#7B7565';
const TEXT    = '#2A2C35';

// ── Helpers ──────────────────────────────────────────────────────────────────

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(d) {
  const dt = d ? new Date(d) : new Date();
  return dt.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

// supplierLabel() removed 2026-04-21 — Mikael: zero "fournisseur" wording on
// the BDC anywhere. Internal supplier tag still flows through bc.supplier
// for sourcing/analytics but never appears in the rendered HTML.

// ── Fractions helper ─────────────────────────────────────────────────────────
// Mikael 2026-04-22: BDC in fractions, never decimals. Anywhere a decimal
// inch value leaks through (45.125, 1.25, etc.) convert it to 45 1/8 / 1 1/4.

function decimalToFraction(numStr) {
  const v = parseFraction(numStr);
  if (!isFinite(v)) return numStr;
  // Whole numbers stay whole.
  if (Number.isInteger(v)) return String(v);
  return formatDim(v);
}

function decimalsToFractions(str) {
  if (str == null) return str;
  // Match decimals: 45.125, 0.5, 1.25 — NOT plain integers, NOT existing mixed
  // fractions like "45 1/8" (those have a space before slash, not a dot).
  return String(str).replace(/\b\d+\.\d+\b/g, (m) => decimalToFraction(m));
}

function formatInches(val) {
  if (val == null || val === '') return '';
  const parsed = parseFraction(val);
  if (isFinite(parsed)) {
    const formatted = formatDim(parsed);
    return formatted || String(val);
  }
  return String(val);
}

// ── BDC spec line builder ────────────────────────────────────────────────────
// Mikael 2026-04-22: Jeremy wants the BDC to carry ONLY the factory-relevant
// identity of each product, not 20 lines of boilerplate. Target format
// (fenêtre example):
//   HYBRIDE TRADITION PERFORMANCE
//   CADRE HYBRIDE GUILLOTINE SIMPLE 5 3/4" NOIR
//   ÉPAISSEUR TOTALE DU CADRE: 10 1/4"
//   CETTE FENÊTRE NE RENCONTRE PAS LA NORME EGRESS
//   VOLET : TH DOUBLE, LOW-E
//   CONFIGURATION : <code>
//   AVEC MOUSTIQUAIRE
//
// Data pulled directly from the stored item fields (no defaults, no
// enrichment) — so if a field is empty, the line is dropped instead of
// substituted with a generic catalogue string.

const COLLECTION_LABELS = {
  hybride: 'Hybride',
  pvc: 'PVC',
  upvc: 'uPVC',
  performance: 'Performance',
  tradition: 'Tradition',
  prima: 'Prima',
  prestige: 'Prestige',
};

const WINDOW_TYPE_LABELS = {
  battant: 'Battant',
  auvent: 'Auvent',
  guillotine: 'Guillotine',
  coulissante: 'Coulissante',
  fixe: 'Fixe',
  baie: 'Baie',
  arc: 'Arc',
};

const THERMOS_LABELS = {
  double: 'Thermos 7/8" double Low-E Argon',
  triple: 'Thermos 1 1/4" triple Low-E Argon',
  lamine: 'Thermos laminé (insonorisation + sécurité)',
  givre: 'Thermos givré (intimité)',
  gluechip: 'Thermos gluechip (texturé)',
};

// Legacy BDCs: line_items saved before 2026-04-22 don't carry thermos,
// color_ext/int, moustiquaire, egress, frame_thickness at the top level.
// Extract what we can from the `specs` comma-separated string so old BDCs
// still render the reduced 7-line format instead of falling back to empty
// bullets. Any field that can't be parsed is simply dropped from output.
function hydrateFromSpecs(item) {
  const spec = String(item?.specs || '');
  if (!spec) return item;

  const lines = spec.split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean);
  const text = lines.join(' | ');
  const out = { ...item };

  // Thermos: "Thermos 7/8\" Low-E Argon" / "Thermos 1 1/4\" triple Low-E Argon"
  if (out.thermos == null) {
    const lower = text.toLowerCase();
    if (/thermos[^|]*triple/.test(lower)) out.thermos = 'triple';
    else if (/thermos[^|]*(?:double|7\/8)/.test(lower)) out.thermos = 'double';
    else if (/thermos\s+lamin/.test(lower)) out.thermos = 'lamine';
    else if (/thermos\s+givr/.test(lower)) out.thermos = 'givre';
    else if (/thermos\s+gluechip/.test(lower)) out.thermos = 'gluechip';
  }

  // Glass type (patio): "Verre Triple Low-E" / "Verre Double Low-E Argon"
  if (out.glass_type == null) {
    const g = text.match(/Verre\s+(Triple|Double)/i);
    if (g) out.glass_type = g[1].toLowerCase();
  }

  // Colors: "Couleurs ext. X / int. Y" (both) or "Couleur : X" / "Couleur X" (single)
  if (!out.color_ext || !out.color_int) {
    const both = text.match(/Couleurs?\s*:?\s*ext(?:érieur|\.)?\s+([^/|]+?)\s*\/\s*int(?:érieur|\.)?\s+([^|,]+)/i);
    if (both) {
      out.color_ext = out.color_ext || both[1].trim();
      out.color_int = out.color_int || both[2].trim();
    } else {
      // Single-color legacy form ("Couleur Noir"): window builder historically
      // only exposed exterior color; interior was always implicitly Blanc and
      // never persisted. Hydrate ext only, leave int for the default.
      const single = text.match(/Couleur\s*:?\s*([^|,]+)/i);
      if (single) {
        const v = single[1].replace(/^[\s:·—-]+/, '').trim();
        if (v) {
          out.color_name = out.color_name || v;
          out.color_ext = out.color_ext || v;
        }
      }
    }
  }

  // Collection: "Collection Prestige" etc.
  if (!out.collection && !out.collection_info) {
    const c = text.match(/Collection\s+([^|,]+)/i);
    if (c) out.collection = c[1].trim();
  }

  // Moustiquaire: explicit phrase
  if (out.moustiquaire == null && /moustiquaire\s+incluse/i.test(text)) {
    out.moustiquaire = true;
  }

  // Egress: "Rencontre la norme egress" / "Ne rencontre pas la norme egress"
  if (out.egress == null) {
    if (/ne\s+rencontre\s+pas.*egress/i.test(text)) out.egress = 'non';
    else if (/rencontre.*egress/i.test(text)) out.egress = 'rencontre';
  }

  // Frame thickness: "Épaisseur du cadre : 10 1/4" (old buildItemSpecs output)
  if (!out.frame_thickness) {
    const m = text.match(/Épaisseur\s+(?:totale\s+)?du\s+cadre\s*:\s*([^|,]+)/i);
    if (m) out.frame_thickness = m[1].trim().replace(/["']$/, '');
  }

  // Frame (patio): "Cadre 4 9/16" (when no colon — distinguish from "Cadre Hybride ...")
  if (!out.frame) {
    const m = text.match(/Cadre\s+(\d[\d\s\/]*)/);
    if (m) out.frame = m[1].trim();
  }

  // Door model: "Modèle Odyssée 308"
  if (!out.door_model) {
    const m = text.match(/Mod[eèéêëÈ]le\s+([^|,]+)/i);
    if (m) out.door_model = m[1].trim();
  }

  return out;
}

function pickForm(item, key) {
  if (item == null) return null;
  if (item[key] != null && item[key] !== '') return item[key];
  const form = item._form || {};
  if (form[key] != null && form[key] !== '') return form[key];
  return null;
}

function categoryOf(item) {
  const raw = String(item._category || item.category || '').toLowerCase();
  if (raw === 'patio' || raw === 'patio_door') return 'patio';
  if (raw === 'door' || raw === 'entry_door' || raw === 'porte') return 'porte';
  if (raw === 'window' || raw === 'fenetre' || raw === 'fenêtre') return 'fenetre';
  const type = String(item.type || item.description || '').toLowerCase();
  if (type.includes('patio') || type.includes('porte-fenêtre') || type.includes('porte fenêtre')) return 'patio';
  if (type.includes('porte')) return 'porte';
  return 'fenetre';
}

function titleCase(s) {
  return String(s || '')
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function collectionLabel(item) {
  const raw = item?.collection_info?.name || item?.collection || '';
  const key = String(raw).toLowerCase().trim();
  return COLLECTION_LABELS[key] || titleCase(raw);
}

function windowTypeLabel(item) {
  const key = String(item?._window_type || item?.window_type || item?.type || '').toLowerCase();
  return WINDOW_TYPE_LABELS[key] || titleCase(key);
}

function windowModeLabel(item) {
  // "GUILLOTINE SIMPLE" / "GUILLOTINE DOUBLE" — mode hint lives on the config.
  const mode = item?._config?.mode || item?.config?.mode || '';
  if (mode === 'simple') return 'Simple';
  if (mode === 'double') return 'Double';
  return '';
}

function colorTriad(item) {
  // Mikael 2026-04-22: fenêtre color_int always surfaced on BDC; default
  // "Blanc" when the form never exposed an interior color (window builder
  // only exposes a single color that becomes color_ext).
  const ext = item?.color_ext || item?.color_name || '';
  const int = item?.color_int || 'Blanc';
  if (ext && int && ext.toLowerCase() !== int.toLowerCase()) {
    return { ext, int, combined: `ext. ${ext} / int. ${int}` };
  }
  const single = ext || item?.color_name || item?.color || int;
  return { ext: single, int, combined: single };
}

// ENERGY STAR policy on BDC: default ON for fenêtre, patio AND porte
// (Mikael 2026-04-22 — "les porte sont energie star"). Only explicit
// opt-out (energy_star === false) suppresses the line.
function shouldShowEnergyStar(item /*, cat */) {
  if (item?.energy_star === false || item?.energy === false) return false;
  return true;
}

// Exported so the devis template (lib/quote-templates/pur.js) can render
// items with the SAME condensed format — Mikael 2026-04-22: "mets le meme
// format de specs par item !!". One source of truth per item identity.
export function buildCondensedSpecsLines(rawItem) {
  return buildBdcSpecsLines(rawItem);
}

function buildBdcSpecsLines(rawItem) {
  const item = hydrateFromSpecs(rawItem);
  const cat = categoryOf(item);
  const lines = [];

  if (cat === 'fenetre') {
    // Line 1 — Collection identity (e.g., "HYBRIDE TRADITION PERFORMANCE")
    const coll = collectionLabel(item);
    if (coll) lines.push(coll);

    // Line 2 — Cadre / profilé with width + color
    const typeLabel = windowTypeLabel(item);
    const modeLabel = windowModeLabel(item);
    const color = colorTriad(item).ext;
    const cadreParts = ['Cadre', coll, typeLabel, modeLabel].filter(Boolean).join(' ');
    const colorTail = color ? ` — ${color}` : '';
    if (typeLabel) lines.push(`${cadreParts}${colorTail}`);

    // Line 3 — Couleur intérieure (Mikael 2026-04-22: always on fenêtre BDC,
    // defaults to Blanc unless explicitly changed). Ext is already on the
    // cadre line above, so this line only carries int.
    const { int } = colorTriad(item);
    lines.push(`Couleur intérieure : ${int}`);

    // Line 4 — Épaisseur totale du cadre
    const frameThickness = pickForm(item, 'frame_thickness');
    if (frameThickness) {
      lines.push(`Épaisseur totale du cadre : ${formatInches(frameThickness)}"`);
    }

    // Line 5 — Egress
    const egress = pickForm(item, 'egress');
    if (egress === 'rencontre') lines.push('Rencontre la norme egress');
    else if (egress === 'non') lines.push('Cette fenêtre ne rencontre pas la norme egress');

    // Line 6 — Thermos
    const thermos = pickForm(item, 'thermos');
    if (thermos) lines.push(THERMOS_LABELS[thermos] || `Thermos ${thermos}`);

    // Line 7 — Configuration code
    const configCode = item?.config_code || item?.model;
    if (configCode) lines.push(`Configuration : ${configCode}`);

    // Line 8 — Moustiquaire
    if (pickForm(item, 'moustiquaire')) lines.push('Avec moustiquaire');
  } else if (cat === 'patio') {
    const coll = collectionLabel(item);
    if (coll) lines.push(`Collection ${coll}`);

    const frame = pickForm(item, 'frame');
    if (frame) lines.push(`Cadre : ${formatInches(frame)}`);

    const { ext, int } = colorTriad(item);
    if (ext || int) {
      lines.push(`Couleurs : extérieur ${ext || '—'} / intérieur ${int || '—'}`);
    }

    const frameThickness = pickForm(item, 'frame_thickness');
    if (frameThickness) lines.push(`Épaisseur totale du cadre : ${formatInches(frameThickness)}"`);

    const glassType = pickForm(item, 'glass_type');
    if (glassType) {
      lines.push(glassType === 'triple' ? 'Verre Triple Low-E' : 'Verre Double Low-E Argon');
    }

    const configCode = item?.config_code || item?.model;
    if (configCode) lines.push(`Configuration : ${configCode}`);

    if (pickForm(item, 'moustiquaire')) lines.push('Avec moustiquaire');
  } else {
    // Porte d'entrée
    const styleName = item?.style_info?.name || pickForm(item, 'entry_door_style');
    if (styleName) lines.push(String(styleName));

    const doorModel = pickForm(item, 'door_model');
    if (doorModel) lines.push(`Modèle : ${doorModel}`);

    const slab = item?.slab_w || pickForm(item, 'slab_w');
    const frameDepth = pickForm(item, 'frame_depth');
    const depthLabel = frameDepth === '1_1_4'
      ? '1 1/4" — hauteur 82 1/2"'
      : frameDepth === '1_1_2'
        ? '1 1/2" — hauteur 82 3/4"'
        : '';
    const slabLine = [slab ? `Slab : ${formatInches(slab)}"` : '', depthLabel ? `Cadre ${depthLabel}` : ''].filter(Boolean).join('  ·  ');
    if (slabLine) lines.push(slabLine);

    const { ext, int } = colorTriad(item);
    if (ext || int) {
      lines.push(`Couleurs : extérieur ${ext || '—'} / intérieur ${int || '—'}`);
    }

    const frameThickness = pickForm(item, 'frame_thickness');
    if (frameThickness) lines.push(`Épaisseur totale du cadre : ${formatInches(frameThickness)}"`);

    const swing = pickForm(item, 'swing');
    if (swing) lines.push(`Sens ouvrant : ${swing} (vue extérieur)`);

    const glass = pickForm(item, 'glass');
    if (glass) lines.push(`Verre : ${glass}`);
  }

  if (shouldShowEnergyStar(item, cat)) lines.push('Certifié ENERGY STAR');

  const sanitized = lines
    .map((l) => decimalsToFractions(String(l || '').trim()))
    .filter(Boolean);
  return dedupeSpecs(sanitized);
}

// ── Item categorisation (Fenêtres / Portes patio / Portes d'entrée) ──────────

function categorizeItem(item) {
  const t = String(item.type || item.description || '').toLowerCase();
  if (t.includes('patio') || t.includes('porte-fenêtre') || t.includes('porte fenêtre')) {
    return 'patio';
  }
  if (t.includes('porte')) return 'porte';
  if (t.includes('fen') || t.includes('window')) return 'fenetre';
  return 'autre';
}

const CATEGORY_LABELS = {
  fenetre: 'Fenêtres',
  porte:   'Portes d’entrée',
  patio:   'Portes patio',
  autre:   'Autres articles',
};

function groupByCategory(items) {
  const groups = { fenetre: [], porte: [], patio: [], autre: [] };
  for (const it of items) {
    groups[categorizeItem(it)].push(it);
  }
  return groups;
}

function renderItemCardBc(item, idx) {
  const num = String(idx + 1).padStart(2, '0');
  const sketchSvg = itemSketchSvg(item);
  const type = escHtml(item.type || '—');
  const model = item.model ? `<span class="bc-item-model">${escHtml(item.model)}</span>` : '';
  const ouvrant = item.ouvrant ? `<span class="bc-item-ouvrant">${escHtml(item.ouvrant)}</span>` : '';
  const dimsW = item.dimensions?.width  != null ? formatInches(item.dimensions.width)  : '';
  const dimsH = item.dimensions?.height != null ? formatInches(item.dimensions.height) : '';
  const dims = (dimsW && dimsH)
    ? `${escHtml(dimsW)}" × ${escHtml(dimsH)}"`
    : '';
  // Mikael 2026-04-22: Jeremy wants ONLY the factory-relevant identity on the
  // BDC — collection, profilé cadre, épaisseur totale, egress, thermos,
  // configuration, moustiquaire. No 20-line boilerplate. Fields pulled from
  // stored item data only; missing fields = line dropped.
  const specsParts = buildBdcSpecsLines(item);
  const specsHtml = specsParts.length > 0
    ? `<ul class="bc-item-specs">${specsParts.map(s => `<li>${escHtml(s)}</li>`).join('')}</ul>`
    : '';
  // Optional location pin (📍 Évier / Cuisine / etc) from item room/note.
  const room = item.room || item._room || item.location || item.note || null;
  const roomHtml = room
    ? `<div class="bc-item-room"><span class="bc-pin">📍</span>${escHtml(room)}</div>`
    : '';
  const qty = Number(item.qty) || 1;

  return `
    <div class="bc-item-card">
      <div class="bc-item-num">${num}</div>
      ${qty > 1 ? `<div class="bc-item-qty">× ${qty}</div>` : ''}
      <div class="bc-item-sketch">
        ${sketchSvg}
        ${dims ? `<div class="bc-item-dims">${dims}</div>` : ''}
      </div>
      <div class="bc-item-info">
        <div class="bc-item-type">${type}${model}${ouvrant}</div>
        ${specsHtml}
        ${roomHtml}
      </div>
    </div>`;
}

export function buildBcHtml({ bc_number, supplier, date, projects, totalItems, totalQty, businessName, authorizedRep, hideSupplierName }) {
  // supplier + hideSupplierName kept in signature for backward compat with
  // /generate, but the BDC no longer renders any "fournisseur" label —
  // Mikael 2026-04-21: "le BDC parle encore du fournisseur ... enleve ca
  // partout pour vrai !".
  void supplier; void hideSupplierName;

  const projectsHtml = projects.map((proj, projIdx) => {
    // Mikael 2026-04-21: NEVER expose client_name / client_address on the
    // BDC — it goes to the supplier, not the client.
    // Mikael 2026-04-22: use the same sequential project_ref (e.g. PUR-0042)
    // that's on the devis + contrat so Jérémy can track BDC ↔ devis ↔ contrat
    // on one id. Fall back to a local #N tag when project_ref is missing
    // (legacy quotes or unref'd drafts).
    const projRef = proj.project_ref || `#${projIdx + 1}`;
    const itemsHtml = proj.items.map((entry, idx) => renderItemCardBc(entry.item, idx)).join('');
    const projHeader = `
      <div class="bc-proj-header">
        <div class="bc-proj-meta">
          <span class="bc-proj-number">Projet ${escHtml(projRef)}</span>
        </div>
        <div class="bc-proj-count">${proj.items.length} article${proj.items.length > 1 ? 's' : ''}</div>
      </div>`;

    return `
      <div class="bc-project-block">
        ${projHeader}
        <div class="bc-item-grid">${itemsHtml}</div>
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>BON DE COMMANDE ${escHtml(bc_number)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', system-ui, sans-serif;
    background: #f8f9fa;
    color: ${NAVY};
    font-size: 13px;
    line-height: 1.5;
  }

  .page {
    max-width: 900px;
    margin: 0 auto;
    background: #fff;
    min-height: 100vh;
  }

  /* Header */
  .bc-header {
    background: ${NAVY};
    color: #fff;
    padding: 32px 40px 24px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;
  }

  .bc-brand { display: flex; flex-direction: column; gap: 6px; }
  .bc-brand-name {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    font-size: 22px;
    letter-spacing: -0.5px;
    color: #fff;
  }
  .bc-brand-sub {
    font-size: 11px;
    color: rgba(255,255,255,0.55);
    letter-spacing: 0.5px;
  }

  .bc-title-block { text-align: right; }
  .bc-doc-type {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: ${SAGE};
    margin-bottom: 4px;
  }
  .bc-number {
    font-family: 'JetBrains Mono', monospace;
    font-size: 20px;
    font-weight: 700;
    color: #fff;
  }
  .bc-date {
    font-size: 11px;
    color: rgba(255,255,255,0.6);
    margin-top: 4px;
  }

  /* Meta bar */
  .bc-meta {
    background: #f0f3ef;
    border-bottom: 2px solid ${NAVY};
    padding: 16px 40px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 20px;
  }
  .meta-block { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .meta-label {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: ${SAGE};
  }
  .meta-value {
    font-size: 13px;
    font-weight: 600;
    color: ${NAVY};
    word-break: break-word;
  }
  .meta-value-sm {
    font-size: 11px;
    color: ${NAVY};
  }

  /* Summary strip */
  .bc-summary {
    display: flex;
    gap: 24px;
    padding: 12px 40px;
    background: #fff;
    border-bottom: 1px solid #e0e4df;
    flex-wrap: wrap;
  }
  .summary-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #666;
  }
  .summary-chip strong {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    font-size: 14px;
    color: ${NAVY};
  }

  /* Body */
  .bc-body { padding: 24px 40px 40px; }

  .bc-project-block {
    margin-bottom: 32px;
    border: 1px solid #dde2db;
    border-radius: 10px;
    overflow: hidden;
    background: #fff;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .bc-proj-header {
    background: #f0f3ef;
    border-bottom: 1px solid #dde2db;
    padding: 14px 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .bc-proj-meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .bc-proj-number {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 700;
    color: ${NAVY};
  }
  .bc-proj-client { font-size: 13px; font-weight: 600; color: ${NAVY}; }
  .bc-proj-addr   { font-size: 11px; color: #666; }
  .bc-proj-count  {
    font-size: 11px;
    font-weight: 600;
    color: ${NAVY};
    background: #e4ece4;
    padding: 4px 12px;
    border-radius: 20px;
    white-space: nowrap;
  }

  /* Item list — single column always (Mikael 2026-04-21: items toujours
     un en haut de l'autre, jamais en grille, même sur desktop). */
  .bc-item-grid {
    display: block;
    padding: 16px;
  }
  .bc-item-grid > .bc-item-card { margin-bottom: 14px; }
  .bc-item-grid > .bc-item-card:last-child { margin-bottom: 0; }

  .bc-item-card {
    position: relative;
    background: #fff;
    border: 1px solid #dde2db;
    border-radius: 8px;
    padding: 18px 16px 14px;
    display: flex;
    gap: 14px;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .bc-item-num {
    position: absolute;
    top: -10px;
    left: 14px;
    background: ${NAVY};
    color: #fff;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    padding: 3px 9px;
    border-radius: 3px;
    letter-spacing: 0.5px;
  }
  .bc-item-qty {
    position: absolute;
    top: 14px;
    right: 14px;
    background: #e4ece4;
    color: ${NAVY};
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 9px;
    border-radius: 3px;
  }
  .bc-item-sketch {
    flex-shrink: 0;
    width: 96px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .bc-item-sketch svg {
    display: block;
    background: #f7f9f7;
    border: 1px solid #e0e4df;
    border-radius: 3px;
    max-width: 96px;
    height: auto;
  }
  .bc-item-dims {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: ${NAVY};
    text-align: center;
    font-weight: 600;
    white-space: nowrap;
  }
  .bc-item-info {
    flex: 1;
    min-width: 0;
  }
  .bc-item-type {
    font-size: 13px;
    font-weight: 700;
    color: ${NAVY};
    margin-bottom: 8px;
    line-height: 1.3;
    word-wrap: break-word;
  }
  .bc-item-model {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    background: #e4ece4;
    color: ${NAVY};
    padding: 1px 6px;
    border-radius: 3px;
    margin-left: 6px;
    font-weight: 700;
  }
  .bc-item-ouvrant {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    background: #f0f3ef;
    color: ${NAVY};
    padding: 1px 6px;
    border-radius: 3px;
    margin-left: 4px;
    opacity: 0.8;
  }
  .bc-item-specs {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .bc-item-specs li {
    font-size: 11px;
    color: #555;
    line-height: 1.5;
    padding-left: 10px;
    position: relative;
  }
  .bc-item-specs li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 8px;
    width: 4px;
    height: 1px;
    background: ${NAVY};
    opacity: 0.4;
  }
  .bc-item-room {
    margin-top: 8px;
    padding-top: 6px;
    border-top: 1px dashed #e0e4df;
    font-size: 11px;
    font-style: italic;
    color: #B73D3A;
  }
  .bc-pin {
    margin-right: 4px;
    font-style: normal;
  }

  /* Footer */
  .bc-footer {
    margin: 0 40px;
    padding: 16px 0;
    border-top: 2px solid ${NAVY};
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .footer-totals { display: flex; gap: 24px; flex-wrap: wrap; }
  .footer-total-item { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .footer-total-label {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #666;
  }
  .footer-total-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 18px;
    font-weight: 700;
    color: ${NAVY};
  }
  .footer-note { font-size: 10px; color: #888; text-align: right; max-width: 220px; }

  /* Print FAB */
  .bc-print-fab {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 10;
    background: ${NAVY};
    color: #fff;
    border: none;
    padding: 10px 18px;
    border-radius: 10px;
    cursor: pointer;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .bc-print-fab:hover { opacity: 0.9; }

  /* Mobile — single-column cards, no horizontal scroll on Safari */
  @media (max-width: 768px) {
    .bc-header { padding: 24px 20px 20px; }
    .bc-title-block { text-align: left; }
    .bc-meta { padding: 14px 20px; grid-template-columns: 1fr; gap: 12px; }
    .bc-summary { padding: 10px 20px; }
    .bc-body { padding: 18px 14px 28px; }
    .bc-proj-header { padding: 12px 14px; }
    .bc-item-grid { padding: 12px; }
    .bc-item-card { padding: 16px 14px 12px; gap: 12px; }
    .bc-item-sketch { width: 84px; }
    .bc-item-sketch svg { max-width: 84px; }
    .bc-footer { padding: 14px 20px; margin: 0; flex-direction: column; align-items: flex-start; }
    .footer-note { text-align: left; }
  }

  /* Print — Letter, ½ inch margins, every card stays whole.
     Hardened 2026-04-21 (PUR-bug-9 — Mikael): items + sections still split
     on Chrome/Safari despite break-inside:avoid because (a) project-block
     was avoid-page so it tried to fit the whole project on one page and
     ended up splitting cards instead, (b) item-card was display:flex which
     Chrome/Safari split THROUGH the flex children. Fix:
       1. project-block → break-inside:auto (allow breaks BETWEEN cards).
       2. item-card → display:block in print + float-based sketch/info
          layout so break rules actually apply (flex containers ignore them
          on both engines historically).
       3. Add !important to override the non-print display:flex.
       4. Belt-and-suspenders: -webkit-column-break-inside for old Safari
          + transform: translateZ(0) to force a paint layer so the break
          engine sees the card as an atomic block. */
  @media print {
    @page { size: Letter; margin: 10mm; }
    html, body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { box-shadow: none; max-width: none; min-height: 0; }
    .bc-print-fab { display: none !important; }
    .bc-header, .bc-meta, .bc-summary, .bc-footer {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .bc-body { padding: 14px 16px; }
    .bc-project-block {
      break-inside: auto !important;
      page-break-inside: auto !important;
      margin-bottom: 14px;
      border-radius: 0;
    }
    .bc-proj-header { break-after: avoid !important; page-break-after: avoid !important; }
    .bc-item-grid {
      display: block !important;
      gap: 0;
      padding: 10px;
    }
    .bc-item-card {
      display: block !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
      -webkit-column-break-inside: avoid !important;
      transform: translateZ(0);
      margin: 0 0 10px 0;
      padding: 14px 14px 12px;
      overflow: hidden;
    }
    .bc-item-card .bc-item-sketch {
      float: left;
      width: 96px;
      margin-right: 14px;
      margin-bottom: 4px;
    }
    .bc-item-sketch svg { max-width: 88px; max-height: 88px; }
    .bc-item-card .bc-item-info {
      display: block;
      overflow: hidden;
    }
    .bc-item-card::after {
      content: "";
      display: block;
      clear: both;
    }
    .bc-item-num { top: -8px; }
    .bc-item-qty { top: 12px; right: 12px; }
  }
</style>
</head>
<body>
<button class="bc-print-fab" onclick="window.print()" aria-label="Imprimer ce bon de commande">🖨️ Imprimer / PDF</button>
<div class="page">

  <header class="bc-header">
    <div class="bc-brand">
      <div class="bc-brand-name">${escHtml((businessName || 'BlueWise').split(/[\s&]/)[0] || 'BlueWise')}</div>
      <div class="bc-brand-sub">${escHtml(businessName || '')}</div>
    </div>
    <div class="bc-title-block">
      <div class="bc-doc-type">BON DE COMMANDE</div>
      <div class="bc-number">${escHtml(bc_number)}</div>
      <div class="bc-date">${escHtml(fmtDate(date))}</div>
    </div>
  </header>

  <div class="bc-meta">
    <div class="meta-block">
      <span class="meta-label">Commandé par</span>
      <span class="meta-value">${escHtml(businessName || 'PÜR Construction & Rénovation')}</span>
      ${authorizedRep ? `<span class="meta-value-sm">${escHtml(authorizedRep)}</span>` : ''}
    </div>
    <div class="meta-block">
      <span class="meta-label">Date d&apos;émission</span>
      <span class="meta-value">${escHtml(fmtDate(date))}</span>
    </div>
  </div>

  <div class="bc-summary">
    <div class="summary-chip">Projets: <strong>${projects.length}</strong></div>
    <div class="summary-chip">Articles: <strong>${totalItems}</strong></div>
    <div class="summary-chip">Quantité totale: <strong>${totalQty}</strong></div>
  </div>

  <div class="bc-body">
    ${projectsHtml}
  </div>

  <footer class="bc-footer">
    <div class="footer-totals">
      <div class="footer-total-item">
        <span class="footer-total-label">Projets</span>
        <span class="footer-total-val">${projects.length}</span>
      </div>
      <div class="footer-total-item">
        <span class="footer-total-label">Articles</span>
        <span class="footer-total-val">${totalItems}</span>
      </div>
      <div class="footer-total-item">
        <span class="footer-total-label">Qté totale</span>
        <span class="footer-total-val">${totalQty}</span>
      </div>
    </div>
    <div class="footer-note">
      Émis par ${escHtml(businessName || 'l\'entreprise')}.<br/>
      Document interne · prix non divulgués.
    </div>
  </footer>

</div>
</body>
</html>`;
}


// ── Project assembly from item_refs ──────────────────────────────────────────
// Used by the viewer route to re-render fresh HTML on every load. Mirrors
// the lookup pipeline in pages/api/bons-de-commande/generate.js.

export async function assembleProjectsFromItemRefs(supabase, customerId, itemRefs) {
  if (!Array.isArray(itemRefs) || itemRefs.length === 0) {
    return { projects: [], totalItems: 0, totalQty: 0 };
  }
  const quoteIds = [...new Set(itemRefs.map((r) => r.quote_id).filter(Boolean))];
  const { data: quotes } = await supabase
    .from('quotes')
    .select('id, job_id, quote_number, project_ref, line_items, customer_id')
    .in('id', quoteIds)
    .eq('customer_id', customerId);
  if (!quotes || quotes.length === 0) {
    return { projects: [], totalItems: 0, totalQty: 0 };
  }
  const quoteMap = {};
  quotes.forEach((q) => { quoteMap[q.id] = q; });

  const jobIds = [...new Set(quotes.map((q) => q.job_id).filter(Boolean))];
  const jobsMap = {};
  if (jobIds.length > 0) {
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, job_id, client_name, client_address, customer_id')
      .in('id', jobIds)
      .eq('customer_id', customerId);
    (jobs || []).forEach((j) => { jobsMap[j.id] = j; });
  }

  const byJob = {};
  for (const ref of itemRefs) {
    const q = quoteMap[ref.quote_id];
    if (!q) continue;
    const items = Array.isArray(q.line_items) ? q.line_items : [];
    const it = items[ref.item_index];
    if (!it) continue;
    const job = jobsMap[q.job_id] || null;
    const key = q.job_id || `nojob_${q.id}`;
    if (!byJob[key]) {
      byJob[key] = {
        job_id: q.job_id,
        job_number: job?.job_id || null,
        // Mikael 2026-04-22: same sequential project_ref used on devis +
        // contrat (e.g. PUR-0042) — keeps the whole paper trail on one id
        // so Jérémy can match BDC ↔ devis ↔ contrat without hunting.
        project_ref: q.project_ref || null,
        client_name: job?.client_name || null,
        client_address: job?.client_address || null,
        items: [],
      };
    }
    byJob[key].items.push({ item: it, quote_id: ref.quote_id, item_index: ref.item_index });
  }
  const projects = Object.values(byJob);
  const totalItems = projects.reduce((s, p) => s + p.items.length, 0);
  const totalQty = projects.reduce((s, p) =>
    s + p.items.reduce((s2, e) => s2 + (Number(e.item.qty) || 1), 0), 0);
  return { projects, totalItems, totalQty };
}
