// Sentinelle P-09 — events for one check (detail view + sparkline data).
// GET /api/sentinelle/events?check_id=...&hours=24
// Owner-gated.

import { getAuthContext, getSupabaseServerClient } from '../../../lib/supabaseServer';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { user, role } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: 'not_authenticated' });
  if (role !== 'owner') return res.status(403).json({ error: 'owner_role_required' });

  const checkId = String(req.query.check_id || '').trim();
  if (!checkId) return res.status(400).json({ error: 'check_id_required' });
  const hours = Math.min(Math.max(Number(req.query.hours) || 24, 1), 168); // 1h..7d
  const since = new Date(Date.now() - hours * 3_600_000).toISOString();

  const sb = getSupabaseServerClient();

  const [
    { data: events, error: evErr },
    { data: check, error: chErr },
  ] = await Promise.all([
    sb.from('system_health_events')
      .select('id,status,detail,ms,state_changed,acknowledged,acknowledged_at,error_payload,created_at')
      .eq('check_id', checkId)
      .gte('created_at', since)
      .order('created_at', { ascending: true }),
    sb.from('system_health_checks')
      .select('id,name,category,criticality,baseline,last_status,last_detail,last_ms,last_error_payload')
      .eq('id', checkId)
      .single(),
  ]);

  if (chErr) return res.status(404).json({ error: 'check_not_found', detail: chErr.message });
  if (evErr) return res.status(500).json({ error: 'events_query_failed', detail: evErr.message });

  // Compute simple stats for the sparkline / summary
  const evList = events || [];
  const stats = evList.reduce((acc, e) => {
    acc.total += 1;
    acc.byStatus[e.status] = (acc.byStatus[e.status] || 0) + 1;
    if (typeof e.ms === 'number') {
      acc.ms.push(e.ms);
    }
    return acc;
  }, { total: 0, byStatus: {}, ms: [] });
  const msSorted = [...stats.ms].sort((a, b) => a - b);
  const p50 = msSorted.length ? msSorted[Math.floor(msSorted.length * 0.5)] : null;
  const p95 = msSorted.length ? msSorted[Math.floor(msSorted.length * 0.95)] : null;

  return res.status(200).json({
    check,
    window_hours: hours,
    since,
    stats: { ...stats, p50_ms: p50, p95_ms: p95 },
    events: evList,
  });
}
