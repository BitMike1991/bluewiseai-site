// Sentinelle P-01 — persist results + compute state_changed.
// Uses checks[].last_status (in-memory from loadEnabledChecks) as the "previous" state.
// Writes events + UPSERTs check last_* columns. All batched in 2 REST calls.

const SB_URL = process.env.SUPABASE_URL || 'https://xwhqkgsurssixjadzklb.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function sbHeaders(extra = {}) {
  return {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

/**
 * @param {Array<object>} checks — rows loaded with last_status
 * @param {Array<{id, status, detail, ms}>} results
 * @returns {Promise<{events_written: number, state_changes: Array}>}
 */
export async function persistRun(checks, results) {
  if (!SB_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');

  const byId = new Map(checks.map((c) => [c.id, c]));
  const stateChanges = [];
  const eventRows = [];
  const checkUpserts = [];
  const nowIso = new Date().toISOString();

  for (const r of results) {
    const prior = byId.get(r.id);
    if (!prior) continue; // unknown id — ignore

    // state_changed: previous status existed AND differs from current
    const priorStatus = prior.last_status || null;
    const stateChanged = priorStatus != null && priorStatus !== r.status;

    if (stateChanged) {
      stateChanges.push({
        id: r.id,
        from: priorStatus,
        to: r.status,
        detail: r.detail,
        criticality: prior.criticality,
      });
    }

    eventRows.push({
      check_id: r.id,
      status: r.status,
      detail: r.detail || null,
      ms: r.ms ?? null,
      state_changed: stateChanged,
      alerted: false,
      alert_channels: [],
    });

    const consecutiveFailures = r.status === 'ok'
      ? 0
      : ((prior.consecutive_failures || 0) + (priorStatus === r.status ? 1 : 1));

    checkUpserts.push({
      id: prior.id,
      name: prior.name,
      category: prior.category,
      criticality: prior.criticality,
      interval_sec: prior.interval_sec,
      enabled: prior.enabled,
      baseline: prior.baseline,
      last_run_at: nowIso,
      last_status: r.status,
      last_detail: r.detail || null,
      last_ms: r.ms ?? null,
      consecutive_failures: consecutiveFailures,
    });
  }

  // Batch INSERT events
  if (eventRows.length > 0) {
    const res = await fetch(`${SB_URL}/rest/v1/system_health_events`, {
      method: 'POST',
      headers: sbHeaders({ Prefer: 'return=minimal' }),
      body: JSON.stringify(eventRows),
    });
    if (!res.ok) {
      throw new Error(`events insert ${res.status}: ${await res.text()}`);
    }
  }

  // PATCH each check (parallel). We can't UPSERT because baseline may have been
  // lazy-seeded during the check (e.g. row_anomaly) and we'd overwrite it with
  // the stale in-memory row. PATCH only touches last_* + consecutive_failures.
  await Promise.all(checkUpserts.map(async (u) => {
    const patch = {
      last_run_at: u.last_run_at,
      last_status: u.last_status,
      last_detail: u.last_detail,
      last_ms: u.last_ms,
      consecutive_failures: u.consecutive_failures,
    };
    const res = await fetch(`${SB_URL}/rest/v1/system_health_checks?id=eq.${encodeURIComponent(u.id)}`, {
      method: 'PATCH',
      headers: sbHeaders({ Prefer: 'return=minimal' }),
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      // Don't abort the whole run on one PATCH failure — log and continue.
      console.error(`[sentinelle.persist] PATCH ${u.id} failed ${res.status}: ${await res.text()}`);
    }
  }));

  return { events_written: eventRows.length, state_changes: stateChanges };
}
