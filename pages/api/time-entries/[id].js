// pages/api/time-entries/[id].js
// Delete a time entry. No edit endpoint yet — Jer delete + re-add is fine at
// MVP scale. If entry has been paid (pay_run_id set), refuse delete to
// protect the audit trail.

import { getAuthContext } from '../../../lib/supabaseServer';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user)       return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });

  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data: existing } = await supabase
    .from('time_entries')
    .select('id, pay_run_id, paid_at')
    .eq('id', id)
    .eq('customer_id', customerId)
    .maybeSingle();
  if (!existing) return res.status(404).json({ error: 'Time entry not found' });

  if (existing.pay_run_id || existing.paid_at) {
    return res.status(409).json({ error: 'Entry already part of a paid run — cannot delete' });
  }

  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', id)
    .eq('customer_id', customerId);

  if (error) {
    console.error('[api/time-entries/:id] delete error', error);
    return res.status(500).json({ error: 'Delete failed' });
  }

  return res.status(200).json({ success: true, deleted: true });
}
