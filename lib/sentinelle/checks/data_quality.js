// Sentinelle P-06 — data quality checks.
// Covers: dq.sms_outbound_status_null, dq.inbound_silence_24h, dq.leads_no_customer_id,
//         dq.messages_orphan_lead_id, dq.jobs_no_lead_id, dq.contracts_payments_orphans
//
// Single aggregated RPC (sentinelle_dq_all) fetches all 6 metrics in one round-trip.
// We cache the snapshot per-run (module-level map keyed by args) so 6 check calls = 1 DB roundtrip.

import { SB_URL, sbHeaders } from '../util.js';

let snapshotCache = { key: null, promise: null, tsMs: 0 };
const CACHE_TTL_MS = 60_000; // re-fetch at most once/minute

async function getSnapshot(args) {
  const key = JSON.stringify(args);
  if (snapshotCache.key === key && Date.now() - snapshotCache.tsMs < CACHE_TTL_MS) {
    return snapshotCache.promise;
  }
  const promise = fetch(`${SB_URL}/rest/v1/rpc/sentinelle_dq_all`, {
    method: 'POST',
    headers: sbHeaders(),
    body: JSON.stringify(args),
  }).then(async (res) => {
    if (!res.ok) throw new Error(`dq_rpc_${res.status}: ${await res.text()}`);
    return res.json();
  });
  snapshotCache = { key, promise, tsMs: Date.now() };
  return promise;
}

// ─── Check implementations ──────────────────────────────────────────────

async function smsOutboundStuck(row) {
  const t0 = Date.now();
  const args = {
    p_outbound_sms_age_min: row.baseline?.age_minutes || 30,
    p_outbound_sms_window_h: row.baseline?.window_hours || 24,
    p_inbound_silence_hours: 24, p_active_tenant_days: 7, p_jobs_window_d: 7,
  };
  try {
    const snap = await getSnapshot(args);
    const ms = Date.now() - t0;
    const { count, sample_ids } = snap.sms_outbound_stuck || { count: 0, sample_ids: [] };
    const warnN = row.baseline?.warn_count || 1;
    const critN = row.baseline?.critical_count || 5;
    const sample = sample_ids.length ? ` sample=[${sample_ids.join(',')}]` : '';
    if (count >= critN) return { status: 'critical', detail: `${count} stuck${sample}`, ms };
    if (count >= warnN) return { status: 'warn', detail: `${count} stuck${sample}`, ms };
    return { status: 'ok', detail: `0 stuck in last ${args.p_outbound_sms_window_h}h`, ms };
  } catch (e) {
    return { status: 'critical', detail: `rpc_failed: ${e.message}`, ms: Date.now() - t0 };
  }
}

async function inboundSilence(row) {
  const t0 = Date.now();
  const args = {
    p_outbound_sms_age_min: 30, p_outbound_sms_window_h: 24,
    p_inbound_silence_hours: row.baseline?.window_hours || 24,
    p_active_tenant_days: row.baseline?.active_tenant_window_days || 7,
    p_jobs_window_d: 7,
  };
  try {
    const snap = await getSnapshot(args);
    const ms = Date.now() - t0;
    const silent = snap.inbound_silence || [];
    if (silent.length === 0) return { status: 'ok', detail: 'all active tenants received SMS in window', ms };
    // Silent overnight is normal for trades — this is a soft signal (warn, not critical).
    return { status: 'warn', detail: `silent tenants: cid=[${silent.join(',')}]`, ms };
  } catch (e) {
    return { status: 'critical', detail: `rpc_failed: ${e.message}`, ms: Date.now() - t0 };
  }
}

async function leadsNoCustomerId(row) {
  const t0 = Date.now();
  try {
    const snap = await getSnapshot({ p_outbound_sms_age_min: 30, p_outbound_sms_window_h: 24, p_inbound_silence_hours: 24, p_active_tenant_days: 7, p_jobs_window_d: 7 });
    const ms = Date.now() - t0;
    const n = snap.leads_no_customer_id || 0;
    if (n >= (row.baseline?.critical_count || 1)) return { status: 'critical', detail: `${n} leads with NULL customer_id — ISOLATION LEAK`, ms };
    if (n >= (row.baseline?.warn_count || 0) + 1) return { status: 'warn', detail: `${n} leads with NULL customer_id`, ms };
    return { status: 'ok', detail: '0 isolation leaks', ms };
  } catch (e) {
    return { status: 'critical', detail: `rpc_failed: ${e.message}`, ms: Date.now() - t0 };
  }
}

async function messagesOrphanLeadId(row) {
  const t0 = Date.now();
  try {
    const snap = await getSnapshot({ p_outbound_sms_age_min: 30, p_outbound_sms_window_h: 24, p_inbound_silence_hours: 24, p_active_tenant_days: 7, p_jobs_window_d: 7 });
    const ms = Date.now() - t0;
    const n = snap.messages_orphan_lead_id || 0;
    if (n >= (row.baseline?.critical_count || 1)) return { status: 'critical', detail: `${n} inbox_messages with dangling lead_id`, ms };
    if (n >= (row.baseline?.warn_count || 0) + 1) return { status: 'warn', detail: `${n} inbox_messages with dangling lead_id`, ms };
    return { status: 'ok', detail: '0 orphan lead_id', ms };
  } catch (e) {
    return { status: 'critical', detail: `rpc_failed: ${e.message}`, ms: Date.now() - t0 };
  }
}

async function jobsNoLeadId(row) {
  const t0 = Date.now();
  const jobsWindow = row.baseline?.window_days || 7;
  const args = { p_outbound_sms_age_min: 30, p_outbound_sms_window_h: 24, p_inbound_silence_hours: 24, p_active_tenant_days: 7, p_jobs_window_d: jobsWindow };
  try {
    const snap = await getSnapshot(args);
    const ms = Date.now() - t0;
    const n = snap.jobs_no_lead_id || 0;
    const warnN = row.baseline?.warn_count || 1;
    const critN = row.baseline?.critical_count || 5;
    if (n >= critN) return { status: 'critical', detail: `${n} jobs no lead_id in last ${jobsWindow}d`, ms };
    if (n >= warnN) return { status: 'warn', detail: `${n} jobs no lead_id in last ${jobsWindow}d`, ms };
    return { status: 'ok', detail: `${n} jobs no lead_id in ${jobsWindow}d`, ms };
  } catch (e) {
    return { status: 'critical', detail: `rpc_failed: ${e.message}`, ms: Date.now() - t0 };
  }
}

async function contractsPaymentsOrphans(row) {
  const t0 = Date.now();
  try {
    const snap = await getSnapshot({ p_outbound_sms_age_min: 30, p_outbound_sms_window_h: 24, p_inbound_silence_hours: 24, p_active_tenant_days: 7, p_jobs_window_d: 7 });
    const ms = Date.now() - t0;
    const co = snap.contracts_orphans || 0;
    const po = snap.payments_orphans || 0;
    const total = co + po;
    if (total >= (row.baseline?.critical_count || 1)) return { status: 'critical', detail: `contracts=${co} payments=${po} orphaned from jobs`, ms };
    if (total >= (row.baseline?.warn_count || 0) + 1) return { status: 'warn', detail: `contracts=${co} payments=${po} orphaned`, ms };
    return { status: 'ok', detail: 'no orphans', ms };
  } catch (e) {
    return { status: 'critical', detail: `rpc_failed: ${e.message}`, ms: Date.now() - t0 };
  }
}

// ─── Dispatcher ─────────────────────────────────────────────────────────
export async function runCheck(row) {
  switch (row.id) {
    case 'dq.sms_outbound_status_null':  return smsOutboundStuck(row);
    case 'dq.inbound_silence_24h':       return inboundSilence(row);
    case 'dq.leads_no_customer_id':      return leadsNoCustomerId(row);
    case 'dq.messages_orphan_lead_id':   return messagesOrphanLeadId(row);
    case 'dq.jobs_no_lead_id':           return jobsNoLeadId(row);
    case 'dq.contracts_payments_orphans': return contractsPaymentsOrphans(row);
    default:
      return { status: 'error', detail: `unknown_dq_check:${row.id}`, ms: 0 };
  }
}
