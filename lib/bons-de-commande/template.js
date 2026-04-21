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

function supplierLabel(key) {
  if (key === 'royalty')   return 'Royalty Fenestration';
  if (key === 'touchette') return 'Touchette';
  return 'Autre fournisseur';
}

// ── Spec sanitizers ──────────────────────────────────────────────────────────
// Mikael 2026-04-21: NEVER "coupe-froid" wording, NEVER duplicate Thermos lines.
// Per memory rule feedback_thermos_wording.md: only "Thermos double 7/8″" or
// "Thermos triple 1 1/4″" (with gas) is allowed.

function stripCoupeFroid(s) {
  if (!s) return s;
  return String(s)
    // "Triple coupe-froid (vs double standard)" → drop entirely
    .replace(/\bTriple\s+coupe[-\s]?froid[^,·\n]*/gi, '')
    // "double coupe-froid"   → "double"
    .replace(/\b(double|triple)\s+coupe[-\s]?froid\b/gi, '$1')
    // bare "coupe-froid" / "coupe froid" / "coupefroid"
    .replace(/\bcoupe[-\s]?froid\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([·,])/g, '$1')
    .trim();
}

function cleanSpecs(specsRaw) {
  // Accept array or comma-separated string. Strip coupe-froid wording from
  // each line BEFORE dedup (so two Thermos lines that only differ by
  // "coupe-froid" get collapsed into one).
  // ONLY split on commas — "·" is a legitimate intra-line separator
  // ("Configuration : volet mobile · volet fixe" is ONE spec, not two).
  const list = Array.isArray(specsRaw)
    ? specsRaw
    : String(specsRaw || '').split(/\s*,\s*/);
  const stripped = list
    .map((s) => stripCoupeFroid(String(s || '').trim()))
    .filter(Boolean);
  return dedupeSpecs(stripped);
}

// ── Standard manufacturer inclusions per category ────────────────────────────
// Mikael 2026-04-21: BDC must show the same level of detail as the supplier's
// own PDF (~15-20 spec lines per item) — what Royalty/Touchette ship by
// default on every product. These are concatenated to item.specs then deduped
// (so user-set values override defaults when they overlap).

const FENETRE_DEFAULTS = [
  'Profilé cadre uPVC 5 5/8" haute performance',
  'Thermos 7/8" double Low-E Argon',
  'Intercalaire à conductivité réduite (warm edge)',
  'Verre trempé certifié sur toutes les ouvertures < 18"',
  'Verrous automatiques anti-effraction',
  'Roulettes en acier inoxydable sans friction',
  'Mécanisme de verrouillage multi-points',
  'Joint d’étanchéité EPDM triple compression',
  'Drainage extérieur intégré au profilé',
  'Moustiquaire en aluminium incluse',
  'Rencontre la norme egress (sortie de secours)',
  'Collection PVC — uPVC',
  'Couleur extérieure : Blanc · Couleur intérieure : Blanc',
  'Recouvrement aluminium extérieur',
  'Calfeutrage acrylique professionnel',
  'Étiquette ENERGY STAR Zone climatique B/C apposée',
  'Conformité CSA A440 / NAFS-08',
  'Quincaillerie inox grade marine',
  'Vis et accessoires de fixation inclus',
  'Garantie 25 ans unité scellée · 10 ans quincaillerie',
];

const PORTE_DEFAULTS = [
  'Panneau R16 acier galvanisé · peinture garantie 10 ans',
  'Cadre de porte en pin jointé vissé',
  'Moulure 1 1/2" aluminium extrudé',
  'Recouvrement aluminium intérieur et extérieur',
  'Balai de porte certifié ENERGY STAR',
  'Seuil aluminium anodisé clair · brise-thermique',
  'Serrure standard 1 point + pêne dormant',
  'Pentures finis argent · 4 par porte',
  'Verrous de sécurité multi-points (option)',
  'Couleurs : extérieur Blanc · intérieur Blanc',
  'Œil judas 180° inclus',
  'Heurtoir et numéro civique en option',
  'Joint d’étanchéité périmétrique double lèvre',
  'Coupe-bise rétractable au seuil',
  'Cadre renforcé acier au point de gâche',
  'Vitrage thermos décoratif optionnel',
  'Conformité CSA A440 / NAFS-08',
  'Vis et accessoires de fixation inclus',
  'Garantie 20 ans panneau · 5 ans peinture · 10 ans quincaillerie',
];

const PATIO_DEFAULTS = [
  'Verre Low-E avec gaz argon · U 1.48 · R 3.85',
  'Intercalaire non conducteur (warm edge)',
  'Renforts d’acier galvanisé calibre 16',
  'Système exclusif de roulement à billes tandem',
  'Seuil tout PVC qui ne pourrit pas',
  'Cadre de bois jointé 1 3/16" (jambages + tête)',
  'Jambages et tête extrudés d’une seule pièce',
  'Recouvrement intérieur PVC haute performance',
  'Moustiquaire aluminium extrudé + treillis fibre de verre',
  'Poignée mortaise standard / Euro mortaise',
  'Verrou central anti-soulèvement',
  'Brise-thermique au cadre périmétrique',
  'Drainage caché à 3 points',
  'Compatible serrure d’appoint (option)',
  'Couleurs : extérieur Blanc · intérieur Blanc',
  'Étiquette ENERGY STAR Zone climatique B/C apposée',
  'Conformité CSA A440 / NAFS-08',
  'Vis et accessoires de fixation inclus',
  'Garantie 20 ans unité scellée · 10 ans PVC · transférable',
];

function defaultsForItem(item) {
  const cat = String(item._category || '').toLowerCase();
  const type = String(item.type || item.description || '').toLowerCase();
  if (cat === 'patio' || type.includes('patio') || type.includes('porte-fenêtre')) return PATIO_DEFAULTS;
  if (cat === 'door' || cat === 'porte' || (type.includes('porte') && !type.includes('patio'))) return PORTE_DEFAULTS;
  // Fallback: window
  return FENETRE_DEFAULTS;
}

/**
 * Enriched + sanitized specs for a single item:
 *   1. Start from the standard inclusions for its category.
 *   2. Append the user-provided item.specs (these take precedence on dedupe
 *      because dedupeSpecs prefers numeric/hand-punctuated entries over
 *      generic catalog defaults).
 *   3. Strip coupe-froid wording.
 *   4. dedupeSpecs collapses duplicate categories (Thermos, Configuration,
 *      Couleur, Épaisseur du cadre, etc.).
 *
 * Result: ~15-20 lines per item, matching the reference manufacturer PDF.
 */
function enrichItemSpecs(item) {
  const defaults = defaultsForItem(item);
  const userSpecs = Array.isArray(item.specs)
    ? item.specs
    : String(item.specs || '').split(/\s*,\s*|\s+·\s+/);
  const merged = [...defaults, ...userSpecs];
  const stripped = merged
    .map((s) => stripCoupeFroid(String(s || '').trim()))
    .filter(Boolean);
  return dedupeSpecs(stripped);
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
  const dims = (item.dimensions?.width && item.dimensions?.height)
    ? `${escHtml(String(item.dimensions.width))}" × ${escHtml(String(item.dimensions.height))}"`
    : '';
  // Enriched + sanitized specs: standard manufacturer inclusions (15+ lines)
  // merged with item.specs, stripped of coupe-froid wording, deduped by
  // category. Matches the level of detail of the reference fournisseur PDF.
  const specsParts = enrichItemSpecs(item);
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
  const supplierName = hideSupplierName ? 'À compléter par le fournisseur' : supplierLabel(supplier);

  const projectsHtml = projects.map(proj => {
    const addrStr = proj.client_address
      ? (typeof proj.client_address === 'string'
          ? proj.client_address
          : [proj.client_address.street, proj.client_address.city].filter(Boolean).join(', '))
      : '';
    const projHeader = `
      <div class="bc-proj-header">
        <div class="bc-proj-meta">
          <span class="bc-proj-number">Projet ${escHtml(proj.job_number || proj.job_id || 'N/A')}</span>
          <span class="bc-proj-client">${escHtml(proj.client_name || '—')}</span>
          ${addrStr ? `<span class="bc-proj-addr">${escHtml(addrStr)}</span>` : ''}
        </div>
        <div class="bc-proj-count">${proj.items.length} article${proj.items.length > 1 ? 's' : ''}</div>
      </div>`;

    const itemsHtml = proj.items.map((entry, idx) => renderItemCardBc(entry.item, idx)).join('');

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

  /* Item card grid (matches devis layout) */
  .bc-item-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    padding: 16px;
  }

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
    .bc-item-grid { grid-template-columns: 1fr; gap: 12px; padding: 12px; }
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
      <span class="meta-label">Fournisseur</span>
      <span class="meta-value">${escHtml(supplierName)}</span>
    </div>
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
      Ce bon de commande est émis par ${escHtml(businessName || 'l\'entreprise')}.<br/>
      Les prix fournisseurs sont confidentiels et ne figurent pas sur ce document.
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
    .select('id, job_id, quote_number, line_items, customer_id')
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
