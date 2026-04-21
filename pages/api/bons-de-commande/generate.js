// pages/api/bons-de-commande/generate.js
// POST /api/bons-de-commande/generate
// Body: { supplier: 'royalty'|'touchette'|'other', item_refs: [{ quote_id, item_index }] }
// Creates a BC row, assigns bc_number, renders HTML, updates items.
// Multi-tenant: all refs validated against session customer_id.

import { getAuthContext, getSupabaseServerClient } from '../../../lib/supabaseServer';
import { itemSketchSvg } from '../../../lib/quote-templates/pur.js';
import { resolveDivisionId } from '../../../lib/divisions';
import { dedupeSpecs } from '../../../lib/devis/specs.js';

const NAVY    = '#2A2C35';
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
  const list = Array.isArray(specsRaw)
    ? specsRaw
    : String(specsRaw || '').split(/\s*,\s*|\s+·\s+/);
  const stripped = list
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

// ── BC HTML Template (card-based layout, mobile-safe, print-clean) ───────────
// Mikael 2026-04-21 — rewrite from horizontal table → per-item cards matching
// the devis PUR look. No horizontal scroll on mobile Safari; each card has
// `page-break-inside: avoid` so printing to PDF never splits a card mid-page.

// ── BC HTML — Manufacturer-grade layout ──────────────────────────────────────
// Mikael 2026-04-21 — modeled on PUR's reference fournisseur PDF
// (commande-royalty.html). Two columns COMMANDITAIRE | PROJET·LIVRAISON,
// items grouped by category (Fenêtres / Portes d'entrée / Portes patio),
// numbered cards with model·ouvrant header + sketch + dedupe'd specs.
// NEVER renders "coupe-froid" wording; NEVER renders duplicate Thermos lines.

function renderItemCardBc(item, idx) {
  const num = String(idx).padStart(2, '0');
  const sketchSvg = itemSketchSvg(item);
  const type = escHtml(item.type || item.description || '—');
  const model = item.model ? escHtml(item.model) : '';
  const ouvrant = item.ouvrant ? escHtml(item.ouvrant) : '';
  const headerKey = [model, ouvrant].filter(Boolean).join(' · ');
  const dims = (item.dimensions?.width && item.dimensions?.height)
    ? `${escHtml(String(item.dimensions.width))}" × ${escHtml(String(item.dimensions.height))}"`
    : '';
  const specs = cleanSpecs(item.specs);
  const specsHtml = specs.length > 0
    ? `<ul class="bc-spec-list">${specs.map(s => `<li>${escHtml(s)}</li>`).join('')}</ul>`
    : '';
  const qty = Number(item.qty) || 1;
  // Location pin (room / note) — small italic line under the specs, like
  // "Évier" / "Cuisine" on the reference PDF. Falls back gracefully if
  // the item has no room context.
  const room = item.room || item._room || item.location || item.note || null;
  const roomHtml = room
    ? `<div class="bc-item-room"><span class="bc-pin">📍</span>${escHtml(room)}</div>`
    : '';

  return `
    <article class="bc-item">
      <div class="bc-item-num">${num}</div>
      ${qty > 1 ? `<div class="bc-item-qty">× ${qty}</div>` : ''}
      <div class="bc-item-sketch">
        ${sketchSvg}
        ${dims ? `<div class="bc-item-dims">${dims}</div>` : ''}
      </div>
      <div class="bc-item-body">
        ${headerKey ? `<div class="bc-item-key">${headerKey}</div>` : ''}
        <div class="bc-item-type">${type}</div>
        ${specsHtml}
        ${roomHtml}
      </div>
    </article>`;
}

function renderCategoryBlock(label, items, startIdx) {
  if (!items.length) return '';
  const cards = items.map((it, i) => renderItemCardBc(it, startIdx + i + 1)).join('');
  return `
    <section class="bc-category">
      <h3 class="bc-category-title">${escHtml(label)} <span class="bc-category-count">· ${items.length}</span></h3>
      <div class="bc-category-items">${cards}</div>
    </section>`;
}

function buildBcHtml({ bc_number, supplier, date, projects, totalItems, totalQty, businessName, authorizedRep, hideSupplierName }) {
  void supplier; void hideSupplierName;
  // Flatten all items across all projects into one list, then group by
  // category. Each item carries its parent project's job_number/client.
  const allItems = [];
  for (const proj of projects) {
    for (const entry of proj.items) {
      allItems.push({
        ...entry.item,
        _project_label: proj.job_number || proj.job_id || 'N/A',
        _project_client: proj.client_name || '',
      });
    }
  }
  const groups = groupByCategory(allItems);
  const order = ['fenetre', 'porte', 'patio', 'autre'];
  let runningIdx = 0;
  const categoryHtml = order.map((key) => {
    const items = groups[key];
    if (!items.length) return '';
    const block = renderCategoryBlock(CATEGORY_LABELS[key], items, runningIdx);
    runningIdx += items.length;
    return block;
  }).join('');

  // Project · Livraison block — when multiple projects on one BDC, list
  // the job numbers stacked. Client name is intentionally omitted (B2B
  // confidentiality on outbound supplier docs — matches reference PDF
  // showing "Client final : —").
  const projectsList = projects.map((p) =>
    `<div class="bc-proj-line">${escHtml(p.job_number || p.job_id || 'N/A')}</div>`
  ).join('');

  const businessLine1 = businessName || 'Entreprise';
  const businessShort = businessLine1.split(/[\s&]/)[0] || 'Entreprise';
  const repLine = authorizedRep ? escHtml(authorizedRep) : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escHtml(businessShort)} — Bon de commande fournisseur</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy:  ${NAVY};
    --red:   ${RED};
    --paper: ${PAPER};
    --rule:  ${RULE};
    --muted: ${MUTED};
    --text:  ${TEXT};
  }

  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: var(--paper);
    color: var(--text);
    font-size: 13px;
    line-height: 1.55;
  }

  .bc-page {
    max-width: 880px;
    margin: 0 auto;
    background: #fff;
    padding: 56px 64px 64px;
    min-height: 100vh;
  }

  /* Header — PÜR CONSTRUCTION (left) + DOCUMENT block (right) + red rule */
  .bc-head {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: end;
    gap: 24px;
    margin-bottom: 24px;
    padding-top: 60px;
  }
  .bc-brand {
    font-family: 'JetBrains Mono', monospace;
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--navy);
  }
  .bc-doc {
    text-align: right;
  }
  .bc-doc-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.32em;
    color: var(--muted);
    margin-bottom: 6px;
  }
  .bc-doc-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0.16em;
    color: var(--navy);
    text-transform: uppercase;
  }
  .bc-doc-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.18em;
    color: var(--muted);
    margin-top: 6px;
  }
  .bc-rule {
    height: 3px;
    background: var(--red);
    margin: 0 0 24px;
  }

  /* Strip — ÉMIS LE / LIVRAISON SOUHAITÉE / PRIORITÉ */
  .bc-strip {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 32px;
    margin-bottom: 36px;
  }
  .bc-strip-cell {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .bc-strip-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.28em;
    color: var(--muted);
    text-transform: uppercase;
  }
  .bc-strip-val {
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
  }

  /* Section title (PROJET ET LIVRAISON / ARTICLES À FABRIQUER) */
  .bc-section-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.24em;
    color: var(--muted);
    text-transform: uppercase;
    margin: 32px 0 14px;
  }

  /* Cards — Commanditaire | Projet · Livraison */
  .bc-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .bc-card {
    border-left: 3px solid var(--red);
    padding: 4px 0 4px 18px;
  }
  .bc-card-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.28em;
    color: var(--muted);
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .bc-card-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--navy);
    margin-bottom: 4px;
  }
  .bc-card p {
    font-size: 12.5px;
    color: var(--text);
    line-height: 1.6;
  }
  .bc-proj-line {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    font-weight: 600;
    color: var(--navy);
    margin-bottom: 4px;
  }
  .bc-proj-client {
    font-size: 12px;
    color: var(--muted);
    margin-top: 8px;
  }

  /* Categories */
  .bc-category {
    margin-top: 24px;
    break-inside: auto;
  }
  .bc-category-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: var(--text);
    padding-left: 12px;
    border-left: 3px solid var(--navy);
    margin: 18px 0 14px;
  }
  .bc-category-count {
    color: var(--muted);
    font-weight: 400;
  }
  .bc-category-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* Item card */
  .bc-item {
    position: relative;
    display: grid;
    grid-template-columns: 132px 1fr;
    gap: 24px;
    padding: 18px 18px 14px;
    border: 1px solid var(--rule);
    border-radius: 6px;
    background: #fff;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .bc-item-num {
    position: absolute;
    top: 14px;
    left: 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.12em;
    color: var(--muted);
  }
  .bc-item-qty {
    position: absolute;
    top: 14px;
    right: 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    color: var(--red);
    background: #fdf3f2;
    padding: 2px 8px;
    border-radius: 999px;
  }
  .bc-item-sketch {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding-top: 18px;
  }
  .bc-item-sketch svg {
    display: block;
    max-width: 100px;
    max-height: 100px;
    height: auto;
  }
  .bc-item-dims {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    color: var(--text);
    text-align: center;
    white-space: nowrap;
  }
  .bc-item-body {
    padding-top: 14px;
    min-width: 0;
  }
  .bc-item-key {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.14em;
    color: var(--muted);
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .bc-item-type {
    font-size: 15px;
    font-weight: 700;
    color: var(--navy);
    margin-bottom: 8px;
    line-height: 1.25;
  }
  .bc-spec-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .bc-spec-list li {
    font-size: 12px;
    color: var(--text);
    line-height: 1.55;
    padding: 1px 0;
  }
  .bc-item-room {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px dashed var(--rule);
    font-size: 12px;
    font-style: italic;
    color: var(--muted);
  }
  .bc-pin {
    margin-right: 4px;
    font-style: normal;
  }

  /* Footer */
  .bc-foot {
    margin-top: 36px;
    padding-top: 18px;
    border-top: 1px solid var(--rule);
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 16px;
    font-size: 11px;
    color: var(--muted);
  }
  .bc-foot-right {
    text-align: right;
  }
  .bc-foot-strong { color: var(--text); font-weight: 500; }

  /* Print FAB */
  .bc-print-fab {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 10;
    background: var(--navy);
    color: #fff;
    border: none;
    padding: 10px 16px;
    border-radius: 10px;
    cursor: pointer;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  .bc-print-fab:hover { opacity: 0.9; }

  /* Mobile */
  @media (max-width: 768px) {
    .bc-page { padding: 32px 18px 36px; }
    .bc-head { padding-top: 24px; grid-template-columns: 1fr; }
    .bc-doc { text-align: left; }
    .bc-strip { grid-template-columns: 1fr 1fr; gap: 16px; }
    .bc-cards { grid-template-columns: 1fr; }
    .bc-item { grid-template-columns: 96px 1fr; gap: 14px; padding: 14px 12px 12px; }
    .bc-item-sketch svg { max-width: 90px; max-height: 90px; }
  }

  /* Print — Letter, every card stays whole.
     - bc-item is display:grid in screen for clean alignment, BUT grid items
       break unreliably on Chrome/Safari. Switch to block + float in print
       so break-inside:avoid actually applies per item. */
  @media print {
    @page { size: Letter; margin: 12mm 14mm; }
    html, body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .bc-page { box-shadow: none; max-width: none; padding: 0; min-height: 0; }
    .bc-print-fab { display: none !important; }
    .bc-head, .bc-rule, .bc-strip, .bc-cards, .bc-foot {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .bc-section-title, .bc-category-title { break-after: avoid; page-break-after: avoid; }
    .bc-category { break-inside: auto; }
    .bc-category-items { display: block !important; }

    .bc-item {
      display: block !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
      -webkit-column-break-inside: avoid !important;
      transform: translateZ(0);
      margin: 0 0 10px 0;
      padding: 14px 14px 12px;
      overflow: hidden;
    }
    .bc-item-sketch {
      float: left;
      width: 110px;
      padding-top: 6px;
      margin-right: 16px;
      margin-bottom: 4px;
    }
    .bc-item-body {
      display: block;
      overflow: hidden;
      padding-top: 4px;
    }
    .bc-item::after {
      content: "";
      display: block;
      clear: both;
    }
    .bc-item-num { top: 4px; left: 4px; }
    .bc-item-qty { top: 4px; right: 4px; }
  }
</style>
</head>
<body>
<button class="bc-print-fab" onclick="window.print()" aria-label="Imprimer ce bon de commande">🖨️ Imprimer / PDF</button>

<main class="bc-page">

  <header class="bc-head">
    <div class="bc-brand">${escHtml(businessShort)} CONSTRUCTION</div>
    <div class="bc-doc">
      <div class="bc-doc-label">DOCUMENT</div>
      <div class="bc-doc-title">BON DE COMMANDE</div>
      <div class="bc-doc-num">${escHtml(bc_number)}</div>
    </div>
  </header>
  <div class="bc-rule"></div>

  <div class="bc-strip">
    <div class="bc-strip-cell">
      <div class="bc-strip-label">Émis le</div>
      <div class="bc-strip-val">${escHtml(fmtDate(date))}</div>
    </div>
    <div class="bc-strip-cell">
      <div class="bc-strip-label">Livraison souhaitée</div>
      <div class="bc-strip-val">—</div>
    </div>
    <div class="bc-strip-cell">
      <div class="bc-strip-label">Priorité</div>
      <div class="bc-strip-val">Standard</div>
    </div>
  </div>

  <h2 class="bc-section-title">Projet et livraison</h2>
  <div class="bc-cards">
    <div class="bc-card">
      <div class="bc-card-label">Commanditaire</div>
      <div class="bc-card-name">${escHtml(businessLine1)}</div>
      <p>366 Rue du Lac-Légaré<br/>Saint-Colomban, QC J5K 2K4</p>
      ${repLine ? `<p>Contact : ${repLine} · (514) 926-7669</p>` : `<p>(514) 926-7669</p>`}
      <p>RBQ 5827-6668-01</p>
    </div>
    <div class="bc-card">
      <div class="bc-card-label">Projet · Livraison</div>
      ${projectsList}
      <div class="bc-proj-client">Client final : —</div>
    </div>
  </div>

  <h2 class="bc-section-title">Articles à fabriquer · ${totalItems}</h2>
  ${categoryHtml}

  <footer class="bc-foot">
    <div>
      <span class="bc-foot-strong">${escHtml(businessLine1)}</span> · ${escHtml(bc_number)}<br/>
      Commande directe
    </div>
    <div class="bc-foot-right">
      <span class="bc-foot-strong">RBQ 5827-6668-01</span><br/>
      Membre APCHQ
    </div>
  </footer>

</main>
</body>
</html>`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'POST only' });
  }

  const { supabase, customerId, user, role, divisionId } = await getAuthContext(req, res);
  if (!user)       return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });

  const { supplier, item_refs } = req.body || {};

  if (!supplier || !['royalty', 'touchette', 'other'].includes(supplier)) {
    return res.status(400).json({ error: 'supplier must be royalty | touchette | other' });
  }
  if (!Array.isArray(item_refs) || item_refs.length === 0) {
    return res.status(400).json({ error: 'item_refs must be a non-empty array' });
  }
  for (const ref of item_refs) {
    if (!ref.quote_id || ref.item_index == null) {
      return res.status(400).json({ error: 'Each item_ref must have quote_id and item_index' });
    }
  }

  try {
    // Fetch all unique quote IDs needed
    const quoteIds = [...new Set(item_refs.map(r => r.quote_id))];

    const { data: quotes, error: qErr } = await supabase
      .from('quotes')
      .select('id, job_id, quote_number, project_ref, line_items, customer_id')
      .in('id', quoteIds)
      .eq('customer_id', customerId); // TENANT GUARD

    if (qErr || !quotes || quotes.length !== quoteIds.length) {
      return res.status(403).json({ error: 'One or more quotes not found or not authorized' });
    }

    const quoteMap = {};
    quotes.forEach(q => { quoteMap[q.id] = q; });

    // Fetch jobs for project context
    const jobIds = [...new Set(quotes.map(q => q.job_id).filter(Boolean))];
    let jobsMap = {};
    if (jobIds.length > 0) {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, job_number, client_name, client_address, customer_id')
        .in('id', jobIds)
        .eq('customer_id', customerId);
      (jobs || []).forEach(j => { jobsMap[j.id] = j; });
    }

    // Generate BC number: BC-YYYY-NNNN sequential per customer
    const year = new Date().getFullYear();
    const prefix = `BC-${year}-`;

    const { data: lastBcRow } = await supabase
      .from('bons_de_commande')
      .select('bc_number')
      .eq('customer_id', customerId)
      .like('bc_number', `${prefix}%`)
      .order('bc_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    let seqNum = 1;
    if (lastBcRow?.bc_number) {
      const lastSeq = parseInt(lastBcRow.bc_number.slice(prefix.length), 10);
      if (!isNaN(lastSeq)) seqNum = lastSeq + 1;
    }
    const bc_number = `${prefix}${String(seqNum).padStart(4, '0')}`;

    // Build project groups for HTML
    const byJob = {};
    const resolvedRefs = [];

    for (const ref of item_refs) {
      const quote = quoteMap[ref.quote_id];
      if (!quote) continue;
      const items = Array.isArray(quote.line_items) ? quote.line_items : [];
      const item = items[ref.item_index];
      if (!item) continue;

      const job = jobsMap[quote.job_id] || null;
      const jobKey = quote.job_id || `nojob_${quote.id}`;

      if (!byJob[jobKey]) {
        byJob[jobKey] = {
          job_id:         quote.job_id,
          job_number:     job?.job_number || null,
          client_name:    job?.client_name || null,
          client_address: job?.client_address || null,
          items: [],
        };
      }
      byJob[jobKey].items.push({ item, quote_id: ref.quote_id, item_index: ref.item_index });

      resolvedRefs.push({
        quote_id:      ref.quote_id,
        item_index:    ref.item_index,
        job_id:        quote.job_id,
        job_number:    job?.job_number || null,
      });
    }

    const projects = Object.values(byJob);
    const totalItems = resolvedRefs.length;
    const totalQty = projects.reduce((sum, proj) => {
      return sum + proj.items.reduce((s2, e) => s2 + (Number(e.item.qty) || 1), 0);
    }, 0);

    // Pull tenant identity from quote_config so the BC PDF says the right
    // company + signing rep instead of the legacy "Jeremy Caron" hardcode.
    const { data: tenantRow } = await supabase
      .from('customers')
      .select('business_name, quote_config')
      .eq('id', customerId)
      .maybeSingle();
    const cfg = tenantRow?.quote_config || {};
    const businessName  = cfg.branding?.business_name || tenantRow?.business_name || 'Entreprise';
    const authorizedRep = cfg.contract?.authorized_rep
      || cfg.email_signature?.name
      || null;
    // Mikael 2026-04-21 — PUR sends the same BC to multiple suppliers when
    // shopping a project around. Hide the chosen supplier name so the same
    // PDF can go to Royalty + Touchette without revealing the competition.
    const hideSupplierName = req.body?.hide_supplier_name !== false;

    // Render HTML
    const html = buildBcHtml({
      bc_number,
      supplier,
      date: new Date().toISOString(),
      projects,
      totalItems,
      totalQty,
      businessName,
      authorizedRep,
      hideSupplierName,
    });

    // Resolve division_id — BC inherits from the first referenced job.
    // All items on a given BC come from one session, so they share a division
    // in practice. Edge case of mixed divisions is gated: scoped users cannot
    // see jobs outside their division to begin with, so `resolvedRefs[0].job_id`
    // always matches their scope.
    const firstJobId = resolvedRefs[0]?.job_id || null;
    const admin = getSupabaseServerClient();
    const bcDivisionId = await resolveDivisionId(admin, {
      customer_id: customerId,
      role,
      user_division_id: divisionId,
      job_id: firstJobId,
    });

    // Insert BC row (status=draft)
    const { data: bcRow, error: insertErr } = await supabase
      .from('bons_de_commande')
      .insert({
        customer_id:          customerId,
        division_id:          bcDivisionId,
        bc_number,
        supplier,
        status:               'draft',
        item_refs:            resolvedRefs,
        html_content:         html,
        created_by_user_id:   user?.id || null,
        created_at:           new Date().toISOString(),
        updated_at:           new Date().toISOString(),
      })
      .select()
      .single();

    if (insertErr) {
      console.error('[generate] insert BC error:', insertErr);
      return res.status(500).json({ error: 'Failed to create BC record' });
    }

    // Update each item in their quotes: set _bc_number, clear _queued_for_bc
    // Group updates by quote_id to batch per quote
    const updatesByQuote = {};
    for (const ref of item_refs) {
      if (!updatesByQuote[ref.quote_id]) updatesByQuote[ref.quote_id] = [];
      updatesByQuote[ref.quote_id].push(ref.item_index);
    }

    const updatePromises = Object.entries(updatesByQuote).map(async ([quoteId, idxs]) => {
      const quote = quoteMap[quoteId];
      if (!quote) return;
      const updatedItems = [...(quote.line_items || [])];
      for (const idx of idxs) {
        if (updatedItems[idx]) {
          updatedItems[idx] = {
            ...updatedItems[idx],
            _bc_number:      bc_number,
            _queued_for_bc:  false,  // moved from queued → batched
          };
        }
      }
      await supabase
        .from('quotes')
        .update({ line_items: updatedItems, updated_at: new Date().toISOString() })
        .eq('id', quoteId)
        .eq('customer_id', customerId);
    });

    await Promise.all(updatePromises);

    return res.status(200).json({
      success: true,
      bc_id:       bcRow.id,
      bc_number,
      html,
      preview_url: `/hub/commande/${bcRow.id}`,
    });
  } catch (err) {
    console.error('[generate] error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
