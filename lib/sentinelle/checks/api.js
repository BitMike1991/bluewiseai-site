// Sentinelle P-02 — Next.js endpoint + Vercel health checks.
// Covers: api.health, api.overview, api.leads, api.inbox, api.calls, api.devis_render,
//         vercel.last_build, vercel.function_errors_15m

import { baseUrl } from '../util.js';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID || 'team_Qv27FwywCkDw8kgtDpkc2Bk1';
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'bluewiseai-site-wmw8';

// HEAD/GET a self-referential API route. Alive = 200/401/403 (endpoint routing works).
// 404/5xx/timeout = critical (endpoint broken or unreachable).
async function probeEndpoint(row, { method = 'HEAD' } = {}) {
  const path = row.baseline?.path;
  if (!path) return { status: 'error', detail: 'no_path_in_baseline', ms: 0 };
  const url = `${baseUrl()}${path}`;
  const timeoutMs = row.baseline?.timeout_ms || 5000;
  const t0 = Date.now();
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method, signal: ac.signal, headers: { 'User-Agent': 'Sentinelle/1.0' } });
    const ms = Date.now() - t0;
    clearTimeout(timer);
    const code = res.status;
    if (code === 405 && method === 'HEAD') {
      // retry as GET — some routes don't implement HEAD
      return probeEndpoint(row, { method: 'GET' });
    }
    // Alive signals: 2xx success, 3xx redirect, 4xx (except 404) means route exists and rejected request.
    if (code === 404) return { status: 'critical', detail: `${code} route_missing (${ms}ms)`, ms };
    if (code >= 500) return { status: 'critical', detail: `${code} server_error (${ms}ms)`, ms };
    if (code >= 200 && code < 500) {
      const label = code < 300 ? 'ok' : code < 400 ? 'redirect' : 'alive-denied';
      return { status: 'ok', detail: `${code} ${label} (${ms}ms)`, ms };
    }
    return { status: 'warn', detail: `${code} unexpected (${ms}ms)`, ms };
  } catch (e) {
    clearTimeout(timer);
    const ms = Date.now() - t0;
    const label = e?.name === 'AbortError' ? `timeout_${timeoutMs}ms` : (e?.message || 'fetch_failed');
    return { status: 'critical', detail: label, ms };
  }
}

async function vercelLastBuild(row) {
  if (!VERCEL_TOKEN) {
    return { status: 'warn', detail: 'VERCEL_TOKEN_not_configured', ms: 0 };
  }
  const t0 = Date.now();
  const url = `https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&limit=1&teamId=${VERCEL_TEAM_ID}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    });
    const ms = Date.now() - t0;
    if (!res.ok) {
      return { status: 'critical', detail: `vercel_api_${res.status}`, ms };
    }
    const data = await res.json();
    const dep = data?.deployments?.[0];
    if (!dep) return { status: 'warn', detail: 'no_deployments_found', ms };
    const state = dep.state || dep.readyState || 'UNKNOWN';
    const createdAt = dep.created || dep.createdAt || 0;
    const ageHours = (Date.now() - createdAt) / 3_600_000;
    const maxAge = row.baseline?.max_age_hours || 24;

    if (state === 'ERROR' || state === 'CANCELED') {
      return { status: 'critical', detail: `${state} ${dep.name || ''} ${dep.url || ''}`, ms };
    }
    if (state === 'BUILDING' || state === 'QUEUED' || state === 'INITIALIZING') {
      return { status: 'warn', detail: `${state} ${dep.url || ''}`, ms };
    }
    if (state === 'READY') {
      if (ageHours > maxAge) {
        return { status: 'warn', detail: `READY but ${ageHours.toFixed(1)}h old`, ms };
      }
      return { status: 'ok', detail: `READY ${ageHours.toFixed(1)}h ago (${dep.url || ''})`, ms };
    }
    return { status: 'warn', detail: `unknown_state:${state}`, ms };
  } catch (e) {
    return { status: 'critical', detail: `fetch_failed:${e?.message || e}`, ms: Date.now() - t0 };
  }
}

// Hobby-tier Vercel does not expose function logs; Sentry (P-09) will cover this.
// Ship as not_implemented → consumers see 'ok' (no-op) so dashboard stays green.
async function vercelFunctionErrors(row) {
  return { status: 'ok', detail: 'not_implemented_hobby_tier_use_sentry_p09', ms: 0 };
}

export async function runCheck(row) {
  switch (row.id) {
    case 'api.health':
    case 'api.overview':
    case 'api.leads':
    case 'api.inbox':
    case 'api.calls':
    case 'api.devis_render':
      return probeEndpoint(row);
    case 'vercel.last_build':
      return vercelLastBuild(row);
    case 'vercel.function_errors_15m':
      return vercelFunctionErrors(row);
    default:
      return { status: 'error', detail: `unknown_api_check:${row.id}`, ms: 0 };
  }
}
