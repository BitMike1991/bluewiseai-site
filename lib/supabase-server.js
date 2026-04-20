// Minimal Supabase REST client for server-side API routes.
// Uses service_role key via env SUPABASE_SERVICE_ROLE_KEY and base URL via SUPABASE_URL.
// Avoids pulling in the @supabase/supabase-js SDK — PUR site is lean and only needs simple CRUD.

const SB_URL = process.env.SUPABASE_URL || 'https://xwhqkgsurssixjadzklb.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function headers(extra) {
  if (!SB_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  return {
    apikey: SB_KEY,
    Authorization: 'Bearer ' + SB_KEY,
    'Content-Type': 'application/json',
    ...extra,
  };
}

export async function sbInsert(table, row) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase insert ${table} failed ${res.status}: ${err}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

export async function sbSelect(table, { match = {}, columns = '*', limit } = {}) {
  const params = new URLSearchParams();
  params.set('select', columns);
  for (const [k, v] of Object.entries(match)) params.set(k, `eq.${v}`);
  if (limit) params.set('limit', String(limit));
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${params.toString()}`, {
    headers: headers(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase select ${table} failed ${res.status}: ${err}`);
  }
  return res.json();
}

export async function sbUpdate(table, match, patch) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(match)) params.set(k, `eq.${v}`);
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${params.toString()}`, {
    method: 'PATCH',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase update ${table} failed ${res.status}: ${err}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

/**
 * Call a Postgres function via PostgREST. Used for atomic operations that
 * can't be expressed cleanly as insert/update (e.g. claim_next_project_ref).
 */
export async function sbRpc(fn, args = {}) {
  const res = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase rpc ${fn} failed ${res.status}: ${err}`);
  }
  return res.json();
}

export function generateToken(len = 12) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz';
  const crypto = require('crypto');
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export function lastFourDigits(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  return digits.slice(-4);
}
