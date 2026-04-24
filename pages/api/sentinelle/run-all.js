// Sentinelle P-01 — central aggregator.
// POST only, bearer-auth with SENTINELLE_SECRET. Loads enabled checks, fans out with bounded concurrency,
// persists events + state changes, returns normalized snapshot.
//
// Contract (response JSON):
//   { run_id, started_at, duration_ms, summary: {ok,warn,critical,error}, state_changes: [...], results: [...] }

import { loadEnabledChecks } from '../../../lib/sentinelle/registry.js';
import { runAll } from '../../../lib/sentinelle/runner.js';
import { persistRun } from '../../../lib/sentinelle/persist.js';

// Fan out state_changes to /api/sentinelle/alert in parallel. Fire-and-forget so a
// slow alert router never blocks the run-all response.
function fanOutAlerts(stateChanges, checksById, secret, origin) {
  if (!stateChanges || stateChanges.length === 0) return Promise.resolve([]);
  const url = `${origin}/api/sentinelle/alert`;
  return Promise.all(stateChanges.map(async (sc) => {
    try {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), 8000);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
        body: JSON.stringify({
          check_id: sc.id,
          from: sc.from,
          to: sc.to,
          detail: sc.detail,
          criticality: sc.criticality || checksById.get(sc.id)?.criticality,
        }),
        signal: ac.signal,
      });
      clearTimeout(t);
      return { id: sc.id, status: res.status };
    } catch (e) {
      return { id: sc.id, status: 0, error: String(e?.message || e).slice(0, 120) };
    }
  }));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const secret = process.env.SENTINELLE_SECRET;
  if (!secret) {
    // Fail-closed: never run the endpoint open. Alert in response but don't echo anything identifying.
    return res.status(500).json({ error: 'sentinelle_secret_not_configured' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token || token !== secret) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const runId = globalThis.crypto?.randomUUID?.() ||
    // Node < 19 fallback — minimal RFC4122 v4
    (() => { const b = Buffer.from(Array.from({ length: 16 }, () => Math.floor(Math.random() * 256))); b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80; const h = b.toString('hex'); return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`; })();

  const startedAt = new Date();

  try {
    const checks = await loadEnabledChecks();
    const results = await runAll(checks, 20);
    const { events_written, state_changes } = await persistRun(checks, results);

    const summary = results.reduce(
      (acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; },
      { ok: 0, warn: 0, critical: 0, error: 0 },
    );

    const checksById = new Map(checks.map((c) => [c.id, c]));
    const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'www.bluewiseai.com';
    const origin = `${proto}://${host}`;
    const alertResults = await fanOutAlerts(state_changes, checksById, secret, origin);

    const payload = {
      run_id: runId,
      started_at: startedAt.toISOString(),
      duration_ms: Date.now() - startedAt.getTime(),
      summary,
      events_written,
      state_changes,
      alerts: alertResults,
      results,
    };

    return res.status(200).json(payload);
  } catch (e) {
    // System-level error — auth was ok so tell the caller but don't leak stack traces or the secret.
    // Logged via Vercel console for forensic (no secret material included).
    console.error('[sentinelle.run-all]', e?.message || e);
    return res.status(500).json({
      error: 'run_failed',
      message: String(e?.message || e).replace(secret, '***'),
      run_id: runId,
      started_at: startedAt.toISOString(),
      duration_ms: Date.now() - startedAt.getTime(),
    });
  }
}
