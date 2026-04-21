// pages/api/bons-de-commande/generate.js
// POST /api/bons-de-commande/generate
// Body: { supplier: 'royalty'|'touchette'|'other', item_refs: [{ quote_id, item_index }] }
// Creates a BC row, assigns bc_number, renders HTML, updates items.
// Multi-tenant: all refs validated against session customer_id.

import { getAuthContext, getSupabaseServerClient } from '../../../lib/supabaseServer';
import { resolveDivisionId } from '../../../lib/divisions';
import { buildBcHtml } from '../../../lib/bons-de-commande/template.js';


// Helpers + template extracted to lib/bons-de-commande/template.js (2026-04-21).


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
