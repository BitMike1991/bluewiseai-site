// pages/api/bons-de-commande/pending.js
// GET /api/bons-de-commande/pending
// Returns all line items flagged _queued_for_bc=true AND _bc_sent_at=null,
// grouped by supplier, then by project.
// Multi-tenant: customer_id from session only.

import { getAuthContext } from '../../../lib/supabaseServer';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'GET only' });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user)       return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });

  try {
    // Fetch all quotes for this customer that have awaiting_supplier status
    // OR any quote that has _queued_for_bc items (items can be queued in any status)
    const { data: quotes, error: qErr } = await supabase
      .from('quotes')
      .select('id, job_id, quote_number, project_ref, line_items, status, customer_id')
      .eq('customer_id', customerId)
      .not('line_items', 'is', null);

    if (qErr) {
      console.error('[pending] quotes fetch error:', qErr);
      return res.status(500).json({ error: 'Failed to fetch quotes' });
    }

    // Fetch jobs for those quote job_ids to get project info
    const jobIds = [...new Set((quotes || []).map(q => q.job_id).filter(Boolean))];
    let jobsMap = {};
    if (jobIds.length > 0) {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, job_number, client_name, client_address, status, customer_id')
        .in('id', jobIds)
        .eq('customer_id', customerId);

      (jobs || []).forEach(j => { jobsMap[j.id] = j; });
    }

    // Bucket by supplier
    const suppliers = {
      royalty:   { pendingItems: [], noSupplierItems: [] },
      touchette:  { pendingItems: [], noSupplierItems: [] },
      other:      { pendingItems: [], noSupplierItems: [] },
    };
    const noSupplierItems = [];

    for (const quote of (quotes || [])) {
      const items = Array.isArray(quote.line_items) ? quote.line_items : [];
      const job = jobsMap[quote.job_id] || null;

      items.forEach((item, idx) => {
        // Skip Installation-type rows
        if ((item.type || '').toLowerCase() === 'installation') return;
        // Skip items already dispatched to a BC
        if (item._bc_sent_at) return;
        // Skip items not queued
        if (!item._queued_for_bc) return;

        const supplierKey = (item._supplier || '').toLowerCase();

        const entry = {
          quote_id:       quote.id,
          quote_number:   quote.quote_number,
          project_ref:    quote.project_ref || null,
          item_index:     idx,
          item,
          job_id:         quote.job_id,
          job_number:     job?.job_number || null,
          client_name:    job?.client_name || null,
          client_address: job?.client_address || null,
          bc_number:      item._bc_number || null,
        };

        if (supplierKey === 'royalty' || supplierKey === 'touchette') {
          suppliers[supplierKey].pendingItems.push(entry);
        } else if (supplierKey === 'other') {
          suppliers.other.pendingItems.push(entry);
        } else {
          // No supplier set
          noSupplierItems.push(entry);
        }
      });
    }

    // Group each supplier's pending items by job_id
    function groupByJob(items) {
      const byJob = {};
      for (const entry of items) {
        const key = entry.job_id || 'unknown';
        if (!byJob[key]) {
          byJob[key] = {
            job_id:         entry.job_id,
            job_number:     entry.job_number,
            project_ref:    entry.project_ref,
            client_name:    entry.client_name,
            client_address: entry.client_address,
            items: [],
          };
        }
        byJob[key].items.push(entry);
      }
      return Object.values(byJob);
    }

    const result = {};
    for (const [supplierKey, data] of Object.entries(suppliers)) {
      if (data.pendingItems.length === 0) continue;
      result[supplierKey] = {
        totalItems:    data.pendingItems.length,
        totalProjects: groupByJob(data.pendingItems).length,
        projects:      groupByJob(data.pendingItems),
      };
    }

    return res.status(200).json({
      suppliers: result,
      noSupplierItems: noSupplierItems.length > 0 ? noSupplierItems : null,
      noSupplierCount: noSupplierItems.length,
    });
  } catch (err) {
    console.error('[pending] error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
