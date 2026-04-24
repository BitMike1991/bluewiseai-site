// Shared helpers for Sentinelle check modules.

const SB_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xwhqkgsurssixjadzklb.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function sbHeaders(extra = {}) {
  if (!SB_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  return {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

export { SB_URL };

/**
 * Base URL for self-referential checks (pinging our own /api/* routes).
 * Prefer explicit SENTINELLE_BASE_URL; else Vercel's auto-injected host; else localhost.
 */
export function baseUrl() {
  if (process.env.SENTINELLE_BASE_URL) return process.env.SENTINELLE_BASE_URL.replace(/\/+$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

/**
 * Update a check row's baseline JSONB — used for lazy first-run seeding.
 */
export async function patchBaseline(checkId, patch) {
  const res = await fetch(`${SB_URL}/rest/v1/system_health_checks?id=eq.${encodeURIComponent(checkId)}`, {
    method: 'PATCH',
    headers: sbHeaders({ Prefer: 'return=minimal' }),
    body: JSON.stringify({ baseline: patch }),
  });
  if (!res.ok) throw new Error(`patchBaseline ${checkId} ${res.status}: ${await res.text()}`);
}

/**
 * Time a promise, return {result, ms}.
 */
export async function timed(promise) {
  const t0 = Date.now();
  const result = await promise;
  return { result, ms: Date.now() - t0 };
}

/**
 * Fetch helper that always captures diagnostic metadata suitable for
 * Sentinelle alert emails. Returns {res, body, text, ms, url, error} where:
 *   - res: Response | null (null on network failure)
 *   - body: parsed JSON if possible, else { _raw: <first 300 chars> }
 *   - text: raw response body first 500 chars (for error_payload snippet)
 *   - ms: latency
 *   - url: the URL called (for error_payload)
 *   - error: {message, name} if fetch threw
 */
export async function probe(url, opts = {}) {
  const t0 = Date.now();
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch (_) { body = { _raw: text.slice(0, 200) }; }
    return { res, body, text, ms: Date.now() - t0, url };
  } catch (e) {
    return {
      res: null,
      body: null,
      text: '',
      ms: Date.now() - t0,
      url,
      error: { message: String(e?.message || e).slice(0, 300), name: e?.name || 'FetchError' },
    };
  }
}

/**
 * Build a structured error_payload from a probe() result.
 * `extra` gets merged (e.g. {endpoint:'mailgun.domain', key_hint:'abc123'}).
 */
export function errorFromProbe(p, extra = {}) {
  if (!p) return { reason: 'no_probe_result', ...extra };
  const base = {
    url: p.url,
    ms: p.ms,
    ...extra,
  };
  if (p.error) {
    return { ...base, fetch_error: p.error.message, error_name: p.error.name };
  }
  if (p.res) {
    base.http_status = p.res.status;
    const snippet = (p.text || '').replace(/\s+/g, ' ').slice(0, 500);
    if (snippet) base.response_snippet = snippet;
  }
  return base;
}
