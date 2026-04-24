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
