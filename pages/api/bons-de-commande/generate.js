// pages/api/bons-de-commande/generate.js
// POST /api/bons-de-commande/generate
// Body: { supplier: 'royalty'|'touchette'|'other', item_refs: [{ quote_id, item_index }] }
// Creates a BC row, assigns bc_number, renders HTML, updates items.
// Multi-tenant: all refs validated against session customer_id.

import { getAuthContext } from '../../../lib/supabaseServer';
import { itemSketchSvg } from '../../../lib/quote-templates/pur.js';

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

// ── BC HTML Template ─────────────────────────────────────────────────────────

function buildBcHtml({ bc_number, supplier, date, projects, totalItems, totalQty }) {
  const supplierName = supplierLabel(supplier);

  const projectsHtml = projects.map(proj => {
    const projHeader = `
      <div class="proj-header">
        <div class="proj-meta">
          <span class="proj-number">Projet ${escHtml(proj.job_number || proj.job_id || 'N/A')}</span>
          <span class="proj-client">${escHtml(proj.client_name || '—')}</span>
          ${proj.client_address ? `<span class="proj-addr">${escHtml(typeof proj.client_address === 'string' ? proj.client_address : [proj.client_address.street, proj.client_address.city].filter(Boolean).join(', '))}</span>` : ''}
        </div>
        <div class="proj-count">${proj.items.length} article${proj.items.length > 1 ? 's' : ''}</div>
      </div>`;

    const itemRows = proj.items.map((entry, rowIdx) => {
      const item = entry.item;
      const sketchSvg = itemSketchSvg(item);
      const specsText = item.specs ? escHtml(item.specs) : '—';
      const dimText = (item.dimensions?.width && item.dimensions?.height)
        ? `${escHtml(String(item.dimensions.width))}" × ${escHtml(String(item.dimensions.height))}"`
        : '—';

      return `
        <tr class="${rowIdx % 2 === 0 ? 'row-even' : 'row-odd'}">
          <td class="td-num">${String(rowIdx + 1).padStart(2, '0')}</td>
          <td class="td-sketch">${sketchSvg}</td>
          <td class="td-type">${escHtml(item.type || '—')}</td>
          <td class="td-model">${escHtml(item.model || '—')}</td>
          <td class="td-ouvrant">${escHtml(item.ouvrant || '—')}</td>
          <td class="td-dims">${dimText}</td>
          <td class="td-specs">${specsText}</td>
          <td class="td-qty">${escHtml(String(item.qty || 1))}</td>
        </tr>`;
    }).join('');

    return `
      <div class="project-block">
        ${projHeader}
        <table class="items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Croquis</th>
              <th>Type</th>
              <th>Modèle</th>
              <th>Ouvrant</th>
              <th>Dimensions</th>
              <th>Spécifications</th>
              <th>Qté</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
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
  .meta-block { display: flex; flex-direction: column; gap: 2px; }
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

  .project-block {
    margin-bottom: 32px;
    border: 1px solid #dde2db;
    border-radius: 10px;
    overflow: hidden;
  }

  .proj-header {
    background: #f0f3ef;
    border-bottom: 1px solid #dde2db;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .proj-meta { display: flex; flex-direction: column; gap: 2px; }
  .proj-number {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 700;
    color: ${NAVY};
  }
  .proj-client { font-size: 12px; font-weight: 600; color: ${NAVY}; }
  .proj-addr   { font-size: 11px; color: #666; }
  .proj-count  {
    font-size: 11px;
    font-weight: 600;
    color: ${SAGE};
    background: #e4ece4;
    padding: 3px 10px;
    border-radius: 20px;
  }

  /* Items table */
  .items-table { width: 100%; border-collapse: collapse; }
  .items-table th {
    background: ${NAVY};
    color: rgba(255,255,255,0.75);
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    padding: 8px 10px;
    text-align: left;
  }
  .items-table td { padding: 8px 10px; vertical-align: middle; font-size: 12px; }
  .row-even { background: #fff; }
  .row-odd  { background: #f7f9f7; }
  .items-table tr { border-bottom: 1px solid #e8ece7; }

  .td-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    color: #aaa;
    width: 28px;
  }
  .td-sketch { width: 64px; }
  .td-sketch svg { display: block; }
  .td-type   { font-weight: 600; min-width: 120px; }
  .td-model  { font-family: 'JetBrains Mono', monospace; font-size: 11px; }
  .td-ouvrant {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    color: ${SAGE};
  }
  .td-dims {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    white-space: nowrap;
  }
  .td-specs { font-size: 11px; color: #555; max-width: 160px; }
  .td-qty {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    font-size: 14px;
    text-align: center;
    color: ${NAVY};
  }

  /* Footer */
  .bc-footer {
    margin: 0 40px;
    padding: 16px 0;
    border-top: 2px solid ${NAVY};
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-totals { display: flex; gap: 24px; }
  .footer-total-item { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .footer-total-label {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: ${SAGE};
  }
  .footer-total-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 18px;
    font-weight: 700;
    color: ${NAVY};
  }
  .footer-note { font-size: 10px; color: #888; text-align: right; max-width: 220px; }

  @media print {
    body { background: #fff; }
    .page { max-width: none; }
  }
</style>
</head>
<body>
<div class="page">

  <header class="bc-header">
    <div class="bc-brand">
      <div class="bc-brand-name">PÜR</div>
      <div class="bc-brand-sub">CONSTRUCTION & RÉNOVATION INC.</div>
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
      <span class="meta-value">PÜR Construction &amp; Rénovation</span>
      <span class="meta-value-sm">Jeremy Caron</span>
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
      Ce bon de commande est émis par PÜR Construction &amp; Rénovation Inc.<br/>
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

  const { supabase, customerId, user } = await getAuthContext(req, res);
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

    // Render HTML
    const html = buildBcHtml({
      bc_number,
      supplier,
      date: new Date().toISOString(),
      projects,
      totalItems,
      totalQty,
    });

    // Insert BC row (status=draft)
    const { data: bcRow, error: insertErr } = await supabase
      .from('bons_de_commande')
      .insert({
        customer_id:          customerId,
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
