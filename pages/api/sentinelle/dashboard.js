// Sentinelle P-09 — single dashboard endpoint.
// One GET returns everything the /platform/sentinelle page needs so the
// browser auto-refresh hits ONE Vercel function (not 4+) every 30s.
//
// Owner-gated: any user with role='owner' on customer_users (i.e. Mikael
// or another platform admin). Sentinelle is platform-wide, not per-tenant,
// so no customer_id filter is applied here.

import { getAuthContext, getSupabaseServerClient } from '../../../lib/supabaseServer';

const STATUS_RANK = { ok: 0, warn: 1, error: 2, critical: 3 };

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { user, role } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: 'not_authenticated' });
  if (role !== 'owner') return res.status(403).json({ error: 'owner_role_required' });

  const sb = getSupabaseServerClient();

  const todayStart = new Date(); todayStart.setUTCHours(0, 0, 0, 0);
  const recentAlertsSince = new Date(Date.now() - 24 * 3_600_000);

  const [
    { data: checks, error: checksErr },
    { data: runsToday, error: runsErr },
    { data: recentAlerts, error: alertsErr },
    { data: pendingEscalations, error: escErr },
    { data: lastRecentEvent },
  ] = await Promise.all([
    sb.from('system_health_checks')
      .select('id,name,category,criticality,enabled,interval_sec,last_run_at,last_status,last_detail,last_ms,last_error_payload,consecutive_failures,baseline')
      .eq('enabled', true)
      .order('category', { ascending: true })
      .order('id', { ascending: true }),
    sb.from('system_health_runs')
      .select('duration_ms,summary,events_written,alerted_count,http_status,started_at')
      .gte('started_at', todayStart.toISOString())
      .order('started_at', { ascending: false }),
    sb.from('system_health_alerts')
      .select('id,check_id,from_status,to_status,criticality,detail,channels,digest,forwarded_at,n8n_status,created_at')
      .gte('created_at', recentAlertsSince.toISOString())
      .order('created_at', { ascending: false })
      .limit(15),
    sb.from('system_health_escalations')
      .select('id,check_id,alert_id,escalate_after,triggered_at,status,voice_call_id')
      .in('status', ['pending', 'voice_sent'])
      .order('triggered_at', { ascending: false })
      .limit(10),
    // Latest acknowledged status per check
    sb.from('system_health_events')
      .select('check_id,acknowledged,acknowledged_at')
      .eq('acknowledged', true)
      .gte('created_at', recentAlertsSince.toISOString())
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  if (checksErr) return res.status(500).json({ error: 'checks_query_failed', detail: checksErr.message });

  const ackByCheck = new Map();
  for (const e of lastRecentEvent || []) {
    if (!ackByCheck.has(e.check_id)) ackByCheck.set(e.check_id, e.acknowledged_at);
  }

  // Summary across enabled checks
  const summary = (checks || []).reduce((acc, c) => {
    const s = c.last_status || 'ok';
    acc[s] = (acc[s] || 0) + 1;
    acc.total = (acc.total || 0) + 1;
    return acc;
  }, { ok: 0, warn: 0, error: 0, critical: 0, total: 0 });

  // Sort checks by severity desc so the worst tiles bubble to the top
  const enriched = (checks || []).map((c) => ({
    ...c,
    severity_rank: STATUS_RANK[c.last_status] ?? 0,
    acknowledged_at: ackByCheck.get(c.id) || null,
  })).sort((a, b) => {
    if (b.severity_rank !== a.severity_rank) return b.severity_rank - a.severity_rank;
    return (a.id || '').localeCompare(b.id || '');
  });

  const runs = runsToday || [];
  const runsCount = runs.length;
  const avgMs = runsCount > 0 ? Math.round(runs.reduce((s, r) => s + (r.duration_ms || 0), 0) / runsCount) : null;
  const lastRun = runs[0] || null;

  return res.status(200).json({
    generated_at: new Date().toISOString(),
    summary,
    checks: enriched,
    runs_today: { count: runsCount, avg_duration_ms: avgMs, last: lastRun },
    recent_alerts: recentAlerts || [],
    pending_escalations: pendingEscalations || [],
  });
}
