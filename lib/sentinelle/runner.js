// Sentinelle P-01 — check dispatcher.
// Each real check module (P-02 through P-06) exports `runCheck(checkRow) → CheckResult`.
// P-01 seeds stubs so run-all is callable end-to-end; subsequent prompts replace stubs with real logic.

import { runCheck as runN8n } from './checks/n8n.js';
import { runCheck as runApi } from './checks/api.js';
import { runCheck as runDb } from './checks/db.js';
import { runCheck as runExternal } from './checks/external.js';
import { runCheck as runInfra } from './checks/infra.js';
import { runCheck as runDq } from './checks/data_quality.js';

// Some checks share the `external` module (telnyx, mailgun, gmail, retell, openai, stripe, groundwire).
// Others share 'api' (api.* and vercel.*). Route by category field stored in the row.
const CATEGORY_DISPATCH = {
  n8n: runN8n,
  api: runApi,
  db: runDb,
  external: runExternal,
  infra: runInfra,
  data_quality: runDq,
};

// Wrap a check in a timeout. Per-check timeout from baseline.timeout_ms, fallback 10s.
// On timeout / throw, synthesizes a rich error_payload so alerts carry a paste-ready diagnostic
// even when the underlying check did not opt in to structured errors.
function withTimeout(promise, ms, checkId) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({
        id: checkId,
        status: 'error',
        detail: `timeout_${ms}ms`,
        ms,
        error_payload: {
          source: 'runner_timeout',
          timeout_ms: ms,
          check_id: checkId,
          occurred_at: new Date().toISOString(),
        },
      });
    }, ms);
    Promise.resolve(promise).then(
      (r) => { clearTimeout(timer); resolve(r); },
      (e) => {
        clearTimeout(timer);
        const msg = String(e?.message || e);
        const stack = typeof e?.stack === 'string' ? e.stack.split('\n').slice(0, 4).join('\n') : null;
        resolve({
          id: checkId,
          status: 'error',
          detail: `throw: ${msg.slice(0, 140)}`,
          ms: null,
          error_payload: {
            source: 'runner_throw',
            exception_message: msg.slice(0, 500),
            exception_name: e?.name || null,
            stack_head: stack,
            check_id: checkId,
            occurred_at: new Date().toISOString(),
          },
        });
      },
    );
  });
}

/**
 * Run a single check with timeout + normalized error envelope.
 * @param {object} checkRow — full system_health_checks row
 * @returns {Promise<{id, status, detail, ms}>}
 */
export async function runOne(checkRow) {
  const fn = CATEGORY_DISPATCH[checkRow.category];
  if (!fn) {
    return { id: checkRow.id, status: 'error', detail: `unknown_category:${checkRow.category}`, ms: 0 };
  }
  const timeoutMs = Number(checkRow.baseline?.timeout_ms) || 10000;
  const t0 = Date.now();
  const result = await withTimeout(fn(checkRow), timeoutMs, checkRow.id);
  // Guarantee the contract even if a check module returns malformed data.
  const normalized = {
    id: checkRow.id,
    status: result?.status || 'error',
    detail: String(result?.detail ?? ''),
    ms: result?.ms ?? (Date.now() - t0),
    error_payload: result?.error_payload || null,
  };
  // Runner fallback: if a non-ok check did not emit a structured error_payload,
  // synthesize a minimal one so alerts always carry paste-ready context.
  if (normalized.status !== 'ok' && !normalized.error_payload) {
    normalized.error_payload = {
      source: 'runner_fallback',
      detail: normalized.detail,
      ms: normalized.ms,
      category: checkRow.category,
      criticality: checkRow.criticality,
      baseline: checkRow.baseline || null,
      occurred_at: new Date().toISOString(),
    };
  }
  return normalized;
}

/**
 * Fan-out runner with bounded concurrency.
 * @param {Array<object>} checks
 * @param {number} concurrency — default 20
 * @returns {Promise<Array<{id, status, detail, ms}>>}
 */
export async function runAll(checks, concurrency = 20) {
  const results = new Array(checks.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, checks.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= checks.length) return;
      results[i] = await runOne(checks[i]);
    }
  });
  await Promise.all(workers);
  return results;
}
