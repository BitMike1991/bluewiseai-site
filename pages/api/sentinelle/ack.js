// Sentinelle P-09 — acknowledge a check from the dashboard.
// POST /api/sentinelle/ack { check_id }
// Marks the latest event for that check_id as acknowledged with the caller's
// user_id and current timestamp. Alert dedupe (P-08) honors acknowledged=true
// (only fresh state changes after the ACK will re-page).
//
// Owner-gated.

import { getAuthContext, getSupabaseServerClient } from '../../../lib/supabaseServer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { user, role } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: 'not_authenticated' });
  if (role !== 'owner') return res.status(403).json({ error: 'owner_role_required' });

  const checkId = String(req.body?.check_id || '').trim();
  if (!checkId) return res.status(400).json({ error: 'check_id_required' });

  const sb = getSupabaseServerClient();

  // Find the latest event for this check
  const { data: events, error: eErr } = await sb.from('system_health_events')
    .select('id,acknowledged')
    .eq('check_id', checkId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (eErr) return res.status(500).json({ error: 'events_query_failed', detail: eErr.message });
  if (!events || events.length === 0) return res.status(404).json({ error: 'no_events_for_check' });

  const latest = events[0];
  if (latest.acknowledged) {
    return res.status(200).json({ alreadyAcked: true, event_id: latest.id });
  }

  const { error: updErr } = await sb.from('system_health_events')
    .update({
      acknowledged: true,
      acknowledged_by: user.id,
      acknowledged_at: new Date().toISOString(),
    })
    .eq('id', latest.id);

  if (updErr) return res.status(500).json({ error: 'ack_failed', detail: updErr.message });

  return res.status(200).json({ ok: true, event_id: latest.id, acknowledged_at: new Date().toISOString() });
}
