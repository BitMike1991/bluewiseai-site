import { useMemo } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xwhqkgsurssixjadzklb.supabase.co';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let _client = null;

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON,
    Authorization: `Bearer ${SUPABASE_ANON}`,
  };
}

/**
 * Lightweight Supabase REST client — no SDK dependency.
 * Matches the pattern used by the existing HTML tools.
 */
function createClient() {
  if (_client) return _client;

  _client = {
    url: SUPABASE_URL,
    headers: getHeaders(),

    async get(table, params = '') {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
        headers: { ...getHeaders(), Prefer: 'return=representation' },
      });
      if (!res.ok) throw new Error(`GET ${table}: ${res.status}`);
      return res.json();
    },

    async insert(table, body) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: { ...getHeaders(), Prefer: 'return=representation' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`INSERT ${table}: ${res.status}`);
      return res.json();
    },

    async update(table, id, body) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
        method: 'PATCH',
        headers: { ...getHeaders(), Prefer: 'return=representation' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`UPDATE ${table}: ${res.status}`);
      return res.json();
    },
  };

  return _client;
}

export default function useSupabase() {
  return useMemo(() => createClient(), []);
}

export { SUPABASE_URL, SUPABASE_ANON };
