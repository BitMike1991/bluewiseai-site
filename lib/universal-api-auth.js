// lib/universal-api-auth.js
// Shared CORS + customer_id resolution for /api/universal/* endpoints.
// Before this helper existed, every universal endpoint sent
// `Access-Control-Allow-Origin: *` — letting any malicious page CSRF-POST
// the accept / sign / create flows. Now origins are strictly allowlisted.

import { createClient } from '@supabase/supabase-js';

const PROD_ORIGINS = [
  'https://hub.purconstruction.com',
  'https://www.purconstruction.com',
  'https://purconstruction.com',
  'https://pur-construction-site.vercel.app',
  'https://www.bluewiseai.com',
  'https://bluewiseai.com',
];

// localhost is appended only in dev — prod should never echo a localhost origin
// back, even though browser CORS would still block the request. Principle of
// least privilege — and cleaner output in security scanner reports.
const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
];

export const ALLOWED_ORIGINS = process.env.NODE_ENV === 'development'
  ? [...PROD_ORIGINS, ...DEV_ORIGINS]
  : PROD_ORIGINS;

/**
 * Apply CORS headers with strict origin allowlist.
 * Returns true on OPTIONS preflight (caller should `return` immediately).
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {Object} [opts]
 * @param {string[]} [opts.methods] - e.g. ['POST', 'OPTIONS']
 * @param {string[]} [opts.headers] - extra allowed request headers
 * @returns {boolean} true if preflight was handled
 */
export function applyCorsHeaders(req, res, opts = {}) {
  const origin = req.headers?.origin || '';
  const match = ALLOWED_ORIGINS.find(o => o === origin);
  // Fallback to first allowlist entry for non-browser callers (n8n, curl) so
  // we still emit a valid ACAO but never echo an untrusted origin back.
  const allowOrigin = match || ALLOWED_ORIGINS[0];

  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Vary', 'Origin');

  const methods = opts.methods || ['GET', 'POST', 'OPTIONS'];
  res.setHeader('Access-Control-Allow-Methods', methods.join(', '));

  const headers = ['Content-Type', 'api_key', ...(opts.headers || [])];
  res.setHeader('Access-Control-Allow-Headers', [...new Set(headers)].join(', '));

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

/**
 * Resolve which customer a caller is acting for based on the api_key header.
 *
 * Precedence:
 *   1. Match against `customers.contract_api_key` per-customer key → returns that customer_id
 *   2. Match against `UNIVERSAL_API_KEY` master env var → returns null (caller is trusted but
 *      tenant-agnostic; the endpoint must then restrict by a separate signal such as the
 *      referenced row's customer_id or an explicit body field that is validated)
 *   3. No match → returns false (caller is unauthorized)
 *
 * @param {string|undefined} apiKey - header value
 * @returns {Promise<number|null|false>} customer_id | null (master) | false (unauth)
 */
export async function resolveCustomerFromApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') return false;
  const key = apiKey.trim();
  if (!key) return false;

  // Master key fallback first (cheap check, no DB round-trip)
  const master = (process.env.UNIVERSAL_API_KEY || '').trim();
  if (master && key === master) return null;

  // Per-customer key lookup
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
  const { data, error } = await supabase
    .from('customers')
    .select('id, contract_api_key')
    .eq('contract_api_key', key)
    .maybeSingle();

  if (error || !data) return false;
  return data.id;
}

/**
 * Short preview of an api_key for debug logs (safe to print).
 * Never print the full key.
 */
export function apiKeyPreview(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') return '<none>';
  const k = apiKey.trim();
  if (k.length < 8) return '<short>';
  return `${k.slice(0, 6)}…${k.slice(-2)}`;
}
