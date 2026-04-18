/**
 * GET /api/universal/leads/[id]
 *
 * Returns minimal lead data for cross-domain prefill (e.g. PUR Hub commande ?prefill=).
 * Authentication: UNIVERSAL_API_KEY header (api_key).
 * CORS: allows hub.purconstruction.com and localhost for development.
 *
 * Used by PUR Hub getServerSideProps to seed commande projectInfo from a CRM lead.
 */

import { getSupabaseServerClient } from '../../../../lib/supabaseServer';

const ALLOWED_ORIGINS = [
  'https://hub.purconstruction.com',
  'https://pur-construction-site.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
];

export default async function handler(req, res) {
  // CORS
  const origin = req.headers.origin || '';
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'api_key, Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const { id } = req.query;
  const apiKey = req.headers['api_key'];

  if (!apiKey || apiKey.trim() !== (process.env.UNIVERSAL_API_KEY || '').trim()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!id || typeof id !== 'string' || !/^\d+$/.test(id)) {
    return res.status(400).json({ error: 'Invalid lead id' });
  }

  const supabase = getSupabaseServerClient();
  const { data: lead, error } = await supabase
    .from('leads')
    .select('id, customer_id, name, phone, email, address, notes')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[universal/leads] supabase error', error.message);
    return res.status(500).json({ error: 'Database error' });
  }

  if (!lead) {
    return res.status(404).json({ error: 'Not found' });
  }

  return res.status(200).json({ lead });
}
