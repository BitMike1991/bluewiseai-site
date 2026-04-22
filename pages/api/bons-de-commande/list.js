// pages/api/bons-de-commande/list.js
// GET /api/bons-de-commande/list?status=sent|received|draft
// Returns paginated BC list for Envoyés / Reçus tabs
// Multi-tenant

import { getAuthContext } from '../../../lib/supabaseServer';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'GET only' });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user)       return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });

  const { status, job_id } = req.query;
  const validStatuses = ['draft', 'sent', 'received'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'status must be draft | sent | received' });
  }

  // ?job_id=X — only return BCs that contain at least one item_ref pointing at
  // this job. Used by /platform/jobs/[id] Commande tab to list the project's
  // supplier orders + returns in one place. item_refs is jsonb[] so we filter
  // in JS after the tenant-scoped fetch (tens of BCs at most per tenant).
  const jobIdFilter = job_id ? Number(job_id) : null;
  if (job_id && !Number.isFinite(jobIdFilter)) {
    return res.status(400).json({ error: 'job_id must be a number' });
  }

  try {
    let query = supabase
      .from('bons_de_commande')
      .select('id, bc_number, supplier, status, item_refs, sent_at, received_at, created_at')
      .eq('customer_id', customerId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(jobIdFilter ? 200 : 50);

    if (status) query = query.eq('status', status);

    const { data: bcs, error } = await query;
    if (error) return res.status(500).json({ error: 'Failed to fetch BCs' });

    let filtered = bcs || [];
    if (jobIdFilter) {
      filtered = filtered.filter(bc =>
        Array.isArray(bc.item_refs)
        && bc.item_refs.some(ref => Number(ref?.job_id) === jobIdFilter)
      );
    }

    return res.status(200).json({
      bcs: filtered.map(bc => ({
        ...bc,
        item_count: Array.isArray(bc.item_refs) ? bc.item_refs.length : 0,
        // Count of items specifically tied to the filtered job (useful for the
        // project-scoped tab so Jérémy sees "3 of 12 items on BC-2026-0004").
        ...(jobIdFilter ? {
          item_count_for_job: Array.isArray(bc.item_refs)
            ? bc.item_refs.filter(r => Number(r?.job_id) === jobIdFilter).length
            : 0,
        } : {}),
      })),
    });
  } catch (err) {
    console.error('[bc/list] error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
