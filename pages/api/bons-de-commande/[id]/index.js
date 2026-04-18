// pages/api/bons-de-commande/[id]/index.js
// GET /api/bons-de-commande/:id — fetch a single BC with HTML content
// Multi-tenant: verified against session customer_id

import { getAuthContext } from '../../../../lib/supabaseServer';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'GET only' });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user)       return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  try {
    const { data: bc, error } = await supabase
      .from('bons_de_commande')
      .select('*')
      .eq('id', id)
      .eq('customer_id', customerId)
      .maybeSingle();

    if (error || !bc) return res.status(404).json({ error: 'BC not found' });

    return res.status(200).json({ bc });
  } catch (err) {
    console.error('[bc/[id]] error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
