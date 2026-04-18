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

  const { status } = req.query;
  const validStatuses = ['draft', 'sent', 'received'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'status must be draft | sent | received' });
  }

  try {
    let query = supabase
      .from('bons_de_commande')
      .select('id, bc_number, supplier, status, item_refs, sent_at, received_at, created_at')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (status) query = query.eq('status', status);

    const { data: bcs, error } = await query;
    if (error) return res.status(500).json({ error: 'Failed to fetch BCs' });

    return res.status(200).json({
      bcs: (bcs || []).map(bc => ({
        ...bc,
        item_count: Array.isArray(bc.item_refs) ? bc.item_refs.length : 0,
      })),
    });
  } catch (err) {
    console.error('[bc/list] error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
