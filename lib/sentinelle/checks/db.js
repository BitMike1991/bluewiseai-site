// Sentinelle P-02 — Supabase health checks.
// Covers: db.connect, db.query_leads_ms, db.query_messages_ms,
//         db.row_anomaly_leads, db.row_anomaly_messages, db.rls_policy_count
//
// Lazy-baseline pattern: if baseline.expected is null on row-anomaly + rls checks,
// seed the live value on first run and return `ok` with detail "baseline seeded: N".
// Next run compares normally.

import { SB_URL, sbHeaders, patchBaseline } from '../util.js';

// ─── Helpers ────────────────────────────────────────────────────────────
async function timedFetch(url, opts = {}) {
  const t0 = Date.now();
  try {
    const res = await fetch(url, { ...opts, headers: { ...sbHeaders(), ...(opts.headers || {}) } });
    return { res, ms: Date.now() - t0 };
  } catch (e) {
    return { res: null, err: e, ms: Date.now() - t0 };
  }
}

async function countRows(table) {
  // HEAD with Prefer: count=exact returns count in Content-Range: 0-*/N
  const { res, err, ms } = await timedFetch(
    `${SB_URL}/rest/v1/${table}?select=id`,
    { method: 'HEAD', headers: { Prefer: 'count=exact', Range: '0-0' } }
  );
  if (err || !res?.ok) {
    throw new Error(err?.message || `HEAD ${table} ${res?.status}`);
  }
  const cr = res.headers.get('content-range') || '';
  const m = cr.match(/\/(\d+)$/);
  if (!m) throw new Error(`unexpected content-range on ${table}: ${cr}`);
  return { count: Number(m[1]), ms };
}

function deltaPct(actual, expected) {
  if (!expected || expected === 0) return 0;
  return Math.abs(actual - expected) / expected;
}

// ─── Check implementations ─────────────────────────────────────────────

async function dbConnect(row) {
  const warn = row.baseline?.warn_ms || 1000;
  const crit = row.baseline?.critical_ms || 3000;
  const { res, err, ms } = await timedFetch(
    `${SB_URL}/rest/v1/system_health_checks?select=id&limit=1`
  );
  if (err || !res?.ok) return { status: 'critical', detail: `connect_failed: ${err?.message || res?.status}`, ms };
  if (ms > crit) return { status: 'critical', detail: `slow ${ms}ms > ${crit}ms`, ms };
  if (ms > warn) return { status: 'warn', detail: `slow ${ms}ms > ${warn}ms`, ms };
  return { status: 'ok', detail: `${ms}ms`, ms };
}

async function queryLatency(row, table) {
  const warn = row.baseline?.warn_ms || 500;
  const crit = row.baseline?.critical_ms || 1500;
  const { res, err, ms } = await timedFetch(
    `${SB_URL}/rest/v1/${table}?select=id&limit=1`
  );
  if (err || !res?.ok) return { status: 'critical', detail: `query_failed: ${err?.message || res?.status}`, ms };
  if (ms > crit) return { status: 'critical', detail: `${table} slow ${ms}ms > ${crit}ms`, ms };
  if (ms > warn) return { status: 'warn', detail: `${table} slow ${ms}ms > ${warn}ms`, ms };
  return { status: 'ok', detail: `${table} ${ms}ms`, ms };
}

async function rowAnomaly(row, table) {
  const t0 = Date.now();
  let current;
  try {
    ({ count: current } = await countRows(table));
  } catch (e) {
    return { status: 'critical', detail: `count_failed: ${e.message}`, ms: Date.now() - t0 };
  }
  const expected = row.baseline?.expected;
  const ms = Date.now() - t0;

  if (expected == null) {
    // Lazy seed on first run
    try {
      await patchBaseline(row.id, { ...(row.baseline || {}), expected: current, seeded_at: new Date().toISOString() });
    } catch (e) {
      return { status: 'warn', detail: `seed_failed: ${e.message} current=${current}`, ms };
    }
    return { status: 'ok', detail: `baseline seeded: ${current}`, ms };
  }

  const warnPct = (row.baseline?.warn_delta_pct || 30) / 100;
  const critPct = (row.baseline?.critical_delta_pct || 60) / 100;
  const d = deltaPct(current, expected);
  if (d >= critPct) return { status: 'critical', detail: `${table}: ${current} vs expected ${expected} (Δ ${(d * 100).toFixed(0)}%)`, ms };
  if (d >= warnPct) return { status: 'warn', detail: `${table}: ${current} vs expected ${expected} (Δ ${(d * 100).toFixed(0)}%)`, ms };
  return { status: 'ok', detail: `${table}=${current} (Δ ${(d * 100).toFixed(0)}%)`, ms };
}

async function rlsPolicyCount(row) {
  const t0 = Date.now();
  const res = await fetch(`${SB_URL}/rest/v1/rpc/sentinelle_policy_count`, {
    method: 'POST',
    headers: sbHeaders(),
    body: JSON.stringify({}),
  });
  const ms = Date.now() - t0;
  if (!res.ok) return { status: 'critical', detail: `rpc_failed: ${res.status}`, ms };
  const current = Number(await res.json());
  const expected = row.baseline?.expected;

  if (expected == null) {
    await patchBaseline(row.id, { ...(row.baseline || {}), expected: current, seeded_at: new Date().toISOString() });
    return { status: 'ok', detail: `baseline seeded: ${current} policies`, ms };
  }

  const tolerance = row.baseline?.tolerance ?? 0;
  if (current < expected - tolerance) return { status: 'critical', detail: `${current} vs ${expected} (dropped!)`, ms };
  if (current !== expected) return { status: 'warn', detail: `${current} vs ${expected}`, ms };
  return { status: 'ok', detail: `${current} policies`, ms };
}

// ─── Dispatcher ────────────────────────────────────────────────────────
export async function runCheck(row) {
  switch (row.id) {
    case 'db.connect':            return dbConnect(row);
    case 'db.query_leads_ms':     return queryLatency(row, 'leads');
    case 'db.query_messages_ms':  return queryLatency(row, 'messages');
    case 'db.row_anomaly_leads':  return rowAnomaly(row, 'leads');
    case 'db.row_anomaly_messages': return rowAnomaly(row, 'messages');
    case 'db.rls_policy_count':   return rlsPolicyCount(row);
    default:
      return { status: 'error', detail: `unknown_db_check:${row.id}`, ms: 0 };
  }
}
