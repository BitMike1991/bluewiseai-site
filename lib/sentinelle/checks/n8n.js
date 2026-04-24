// Sentinelle P-03 — n8n health checks.
// Covers: n8n.active_count, n8n.error_rate_15m, n8n.webhook.*, n8n.pm2_running, n8n.sqlite_backups_fresh
//
// n8n REST API base: https://automation.bluewiseai.com (same VPS as Next.js? No — separate domain).
// Webhook tests: POST empty body; 200/400/403/405 = alive, 404/5xx/timeout = dead.

import { SB_URL, sbHeaders, patchBaseline } from '../util.js';

const N8N_BASE = process.env.N8N_BASE_URL || 'https://automation.bluewiseai.com';
const N8N_API_KEY = process.env.N8N_API_KEY;

// ───────── Helpers ─────────

async function n8nFetch(path, opts = {}) {
  if (!N8N_API_KEY) throw new Error('N8N_API_KEY not configured');
  const t0 = Date.now();
  const res = await fetch(`${N8N_BASE}${path}`, {
    ...opts,
    headers: { 'X-N8N-API-KEY': N8N_API_KEY, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  return { res, ms: Date.now() - t0 };
}

async function latestVpsPing() {
  const url = `${SB_URL}/rest/v1/system_health_vps_pings?select=collected_at,payload&order=collected_at.desc&limit=1`;
  const res = await fetch(url, { headers: sbHeaders() });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.[0] || null;
}

// ───────── Check implementations ─────────

async function activeCount(row) {
  const t0 = Date.now();
  try {
    const { res } = await n8nFetch('/api/v1/workflows?active=true&limit=250');
    if (!res.ok) return { status: 'critical', detail: `n8n_api_${res.status}`, ms: Date.now() - t0 };
    const data = await res.json();
    const current = data?.data?.length || 0;
    const ms = Date.now() - t0;
    const expected = row.baseline?.expected;

    // Lazy re-baseline on first real run if stale value doesn't match reality
    if (expected == null) {
      await patchBaseline(row.id, { ...(row.baseline || {}), expected: current, seeded_at: new Date().toISOString() });
      return { status: 'ok', detail: `baseline seeded: ${current}`, ms };
    }

    const warnDelta = row.baseline?.warn_delta || 1;
    const critDelta = row.baseline?.critical_delta || 3;
    const diff = current - expected;

    if (Math.abs(diff) >= critDelta) {
      return { status: 'critical', detail: `${current}/${expected} (Δ${diff > 0 ? '+' : ''}${diff})`, ms };
    }
    if (Math.abs(diff) >= warnDelta) {
      return { status: 'warn', detail: `${current}/${expected} (Δ${diff > 0 ? '+' : ''}${diff})`, ms };
    }
    return { status: 'ok', detail: `${current}/${expected} active`, ms };
  } catch (e) {
    return { status: 'critical', detail: `fetch_failed: ${e?.message}`, ms: Date.now() - t0 };
  }
}

async function errorRate15m(row) {
  const windowMin = row.baseline?.window_min || 15;
  const warnPct = row.baseline?.warn_pct || 10;
  const critPct = row.baseline?.critical_pct || 25;
  const t0 = Date.now();
  try {
    // n8n doesn't filter by time easily; get last 100 executions (both all + errors)
    // and filter client-side by startedAt within window.
    const [all, errors] = await Promise.all([
      n8nFetch('/api/v1/executions?limit=100'),
      n8nFetch('/api/v1/executions?status=error&limit=100'),
    ]);
    if (!all.res.ok || !errors.res.ok) {
      return { status: 'critical', detail: `n8n_api_${all.res.status}/${errors.res.status}`, ms: Date.now() - t0 };
    }
    const allData = await all.res.json();
    const errData = await errors.res.json();
    const cutoff = Date.now() - windowMin * 60_000;
    const recent = (allData?.data || []).filter(e => new Date(e.startedAt).getTime() > cutoff);
    const recentErrors = (errData?.data || []).filter(e => new Date(e.startedAt).getTime() > cutoff);
    const total = recent.length;
    const failures = recentErrors.length;
    const pct = total > 0 ? (failures / total) * 100 : 0;
    const ms = Date.now() - t0;

    if (pct >= critPct) return { status: 'critical', detail: `${failures}/${total} (${pct.toFixed(0)}%) in ${windowMin}min`, ms };
    if (pct >= warnPct) return { status: 'warn', detail: `${failures}/${total} (${pct.toFixed(0)}%) in ${windowMin}min`, ms };
    return { status: 'ok', detail: `${failures}/${total} err in ${windowMin}min`, ms };
  } catch (e) {
    return { status: 'critical', detail: `fetch_failed: ${e?.message}`, ms: Date.now() - t0 };
  }
}

async function webhookProbe(row) {
  const path = row.baseline?.path;
  if (!path) return { status: 'error', detail: 'no_path_in_baseline', ms: 0 };
  const timeoutMs = row.baseline?.timeout_ms || 5000;
  const okCodes = row.baseline?.ok_codes || [200, 400, 403, 405];
  const url = `${N8N_BASE}/webhook/${path}`;
  const t0 = Date.now();
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: ac.signal,
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Sentinelle/1.0' },
      body: '{}',
    });
    clearTimeout(timer);
    const ms = Date.now() - t0;
    const code = res.status;
    if (okCodes.includes(code)) return { status: 'ok', detail: `${code} alive (${ms}ms)`, ms };
    if (code === 404) return { status: 'critical', detail: `${code} not_registered (${ms}ms)`, ms };
    // 5xx — webhook is registered (alive) but workflow returned server error.
    // Could be validation failure on empty test body, could be a real bug.
    // Flag as warn so we don't page at 3am for a workflow that rejects {} by design;
    // critical=true only for unreachable/not-registered.
    if (code >= 500) return { status: 'warn', detail: `${code} server_error (${ms}ms)`, ms };
    return { status: 'warn', detail: `${code} unexpected (${ms}ms)`, ms };
  } catch (e) {
    clearTimeout(timer);
    const ms = Date.now() - t0;
    const label = e?.name === 'AbortError' ? `timeout_${timeoutMs}ms` : (e?.message || 'fetch_failed');
    return { status: 'critical', detail: label, ms };
  }
}

async function pm2Running(row) {
  const t0 = Date.now();
  const ping = await latestVpsPing();
  const ms = Date.now() - t0;
  if (!ping) return { status: 'warn', detail: 'no_vps_ping_yet — sidecar may not be running', ms };

  const ageSec = (Date.now() - new Date(ping.collected_at).getTime()) / 1000;
  const maxAge = row.baseline?.max_ping_age_sec || 180;
  if (ageSec > maxAge) return { status: 'critical', detail: `last_ping ${ageSec.toFixed(0)}s ago > ${maxAge}s`, ms };

  const processes = ping.payload?.pm2 || [];
  const n8nProc = processes.find(p => p.name === 'n8n');
  if (!n8nProc) return { status: 'critical', detail: 'n8n_not_in_pm2_list', ms };
  if (n8nProc.status !== 'online') return { status: 'critical', detail: `pm2_status=${n8nProc.status}`, ms };
  return { status: 'ok', detail: `online, uptime=${n8nProc.uptime_h || '?'}h, restarts=${n8nProc.restarts ?? 0}`, ms };
}

async function backupsFresh(row) {
  const t0 = Date.now();
  const ping = await latestVpsPing();
  const ms = Date.now() - t0;
  if (!ping) return { status: 'warn', detail: 'no_vps_ping_yet', ms };

  const backupAgeH = ping.payload?.backup_age_hours;
  if (backupAgeH == null) return { status: 'warn', detail: 'backup_age_not_in_payload', ms };
  const maxH = row.baseline?.max_age_hours || 48;
  if (backupAgeH > maxH) return { status: 'critical', detail: `backup ${backupAgeH.toFixed(1)}h old > ${maxH}h`, ms };
  return { status: 'ok', detail: `backup ${backupAgeH.toFixed(1)}h old`, ms };
}

// ───────── Dispatcher ─────────

export async function runCheck(row) {
  if (row.id.startsWith('n8n.webhook.')) return webhookProbe(row);
  switch (row.id) {
    case 'n8n.active_count':          return activeCount(row);
    case 'n8n.error_rate_15m':        return errorRate15m(row);
    case 'n8n.pm2_running':           return pm2Running(row);
    case 'n8n.sqlite_backups_fresh':  return backupsFresh(row);
    default:
      return { status: 'error', detail: `unknown_n8n_check:${row.id}`, ms: 0 };
  }
}
