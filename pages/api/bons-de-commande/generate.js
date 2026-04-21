// pages/api/bons-de-commande/generate.js
// POST /api/bons-de-commande/generate
// Body: { supplier: 'royalty'|'touchette'|'other', item_refs: [{ quote_id, item_index }] }
// Creates a BC row, assigns bc_number, renders HTML, updates items.
// Multi-tenant: all refs validated against session customer_id.

import { getAuthContext, getSupabaseServerClient } from '../../../lib/supabaseServer';
import { itemSketchSvg } from '../../../lib/quote-templates/pur.js';
import { resolveDivisionId } from '../../../lib/divisions';

const NAVY = '#2A2C35';
const SAGE = '#5A7A5A';

// ── Helpers ──────────────────────────────────────────────────────────────────

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(d) {
  const dt = d ? new Date(d) : new Date();
  return dt.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function buildItemLabel(item) {
  const parts = [];
  if (item.type)   parts.push(item.type);
  if (item.model)  parts.push(item.model);
  if (item.ouvrant) parts.push(item.ouvrant);
  if (item.dimensions?.width && item.dimensions?.height) {
    parts.push(`${item.dimensions.width}" × ${item.dimensions.height}"`);
  }
  return parts.join(' — ') || item.description || 'Article';
}

function supplierLabel(key) {
  if (key === 'royalty')   return 'Royalty Fenestration';
  if (key === 'touchette') return 'Touchette';
  return 'Autre fournisseur';
}

// ── BC HTML Template (card-based layout, mobile-safe, print-clean) ───────────
// Mikael 2026-04-21 — rewrite from horizontal table → per-item cards matching
// the devis PUR look. No horizontal scroll on mobile Safari; each card has
// `page-break-inside: avoid` so printing to PDF never splits a card mid-page.

function renderItemCardBc(item, idx) {
  const num = String(idx + 1).padStart(2, '0');
  const sketchSvg = itemSketchSvg(item);
  const type = escHtml(item.type || '—');
  const model = item.model ? `<span class="bc-item-model">${escHtml(item.model)}</span>` : '';
  const ouvrant = item.ouvrant ? `<span class="bc-item-ouvrant">${escHtml(item.ouvrant)}</span>` : '';
  const dims = (item.dimensions?.width && item.dimensions?.height)
    ? `${escHtml(String(item.dimensions.width))}" × ${escHtml(String(item.dimensions.height))}"`
    : '';
  const specsRaw = Array.isArray(item.specs) ? item.specs.join(' · ') : (item.specs || '');
  // Split long spec strings on commas so each bullet wraps cleanly on mobile.
  const specsParts = specsRaw
    ? specsRaw.split(/\s*,\s*|\s+·\s+/).map(s => s.trim()).filter(Boolean)
    : [];
  const specsHtml = specsParts.length > 0
    ? `<ul class="bc-item-specs">${specsParts.map(s => `<li>${escHtml(s)}</li>`).join('')}</ul>`
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
      </div>
    </div>`;
}

function buildBcHtml({ bc_number, supplier, date, projects, totalItems, totalQty, businessName, authorizedRep, hideSupplierName }) {
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

  /* Print — Letter, ½ inch margins, every card stays whole */
  @media print {
    @page { size: Letter; margin: 10mm; }
    html, body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { box-shadow: none; max-width: none; min-height: 0; }
    .bc-print-fab { display: none !important; }
    .bc-item-grid { display: block !important; gap: 0; padding: 12px; }
    .bc-item-card {
      break-inside: avoid;
      page-break-inside: avoid;
      margin: 0 0 10px 0;
      padding: 14px 14px 12px;
      gap: 12px;
    }
    .bc-item-sketch svg { max-width: 88px; max-height: 88px; }
    .bc-project-block {
      break-inside: avoid-page;
      page-break-inside: avoid;
      margin-bottom: 16px;
    }
    .bc-proj-header { break-after: avoid; page-break-after: avoid; }
    .bc-footer { break-inside: avoid; page-break-inside: avoid; }
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
