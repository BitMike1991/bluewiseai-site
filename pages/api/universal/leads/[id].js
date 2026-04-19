/**
 * GET /api/universal/leads/[id]
 *
 * Returns minimal lead data for cross-domain prefill (e.g. PUR Hub commande ?prefill=).
 * Authentication: api_key header — accepts either a per-customer `contract_api_key` OR
 * the master `UNIVERSAL_API_KEY`.
 *
 * IMPORTANT — multi-tenant isolation:
 *   Before 2026-04-19 this endpoint had no customer_id filter. A caller holding the
 *   master UNIVERSAL_API_KEY could enumerate every lead from every tenant by iterating
 *   numeric ids. Now:
 *     - Per-customer key → restricts query to that customer_id.
 *     - Master key → derives customer_id from the Origin header (PUR origins → cid=9,
 *       BW origins → cid=1). If origin doesn't match an allowlisted tenant, 403.
 */

import { getSupabaseServerClient } from '../../../../lib/supabaseServer';
import {
  applyCorsHeaders,
  resolveCustomerFromApiKey,
  apiKeyPreview,
} from '../../../../lib/universal-api-auth';

// Map of Origin → customer_id used ONLY when the master UNIVERSAL_API_KEY
// is presented. Per-customer keys bypass this map entirely.
const ORIGIN_TO_CUSTOMER = {
  'https://hub.purconstruction.com': 9,
  'https://www.purconstruction.com': 9,
  'https://purconstruction.com': 9,
  'https://pur-construction-site.vercel.app': 9,
  'https://www.bluewiseai.com': 1,
  'https://bluewiseai.com': 1,
  'http://localhost:3000': null,   // dev — let through without tenant restriction
  'http://localhost:3001': null,
};

export default async function handler(req, res) {
  if (applyCorsHeaders(req, res, {
    methods: ['GET', 'OPTIONS'],
    headers: ['api_key'],
  })) return;

  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const { id } = req.query;
  const apiKey = req.headers['api_key'];

  // Step 1: resolve caller
  const resolved = await resolveCustomerFromApiKey(apiKey);
  if (resolved === false) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Step 2: determine which customer_id to filter by
  let tenantFilter; // number | null — null means "no tenant restriction"
  if (typeof resolved === 'number') {
    // Per-customer key → trust that mapping
    tenantFilter = resolved;
  } else {
    // Master key path — three cases:
    //   a) Browser request (Origin header present) → enforce allowlist → tenant from origin
    //   b) S2S with explicit ?customer_id=N query param → use that (validated next)
    //   c) Neither → REJECT. Previously returned tenant-agnostic, which meant
    //      a leaked master key let any lead be read by ID enumeration.
    const origin = req.headers?.origin || '';
    if (origin) {
      if (!(origin in ORIGIN_TO_CUSTOMER)) {
        console.warn('[universal/leads] master key with unknown origin', origin, 'key=' + apiKeyPreview(apiKey));
        return res.status(403).json({ error: 'Origin not allowed' });
      }
      tenantFilter = ORIGIN_TO_CUSTOMER[origin];
    } else {
      const cidParam = Number(req.query.customer_id);
      if (!Number.isInteger(cidParam) || cidParam <= 0) {
        console.warn('[universal/leads] master key without Origin and no customer_id param', { lead_id: id });
        return res.status(400).json({ error: 'customer_id query param required for server-to-server master-key calls' });
      }
      tenantFilter = cidParam;
    }
  }

  if (!id || typeof id !== 'string' || !/^\d+$/.test(id)) {
    return res.status(400).json({ error: 'Invalid lead id' });
  }

  const supabase = getSupabaseServerClient();
  let query = supabase
    .from('leads')
    .select('id, customer_id, name, phone, email, address, notes')
    .eq('id', id);
  if (tenantFilter != null) query = query.eq('customer_id', tenantFilter);

  const { data: lead, error } = await query.maybeSingle();

  if (error) {
    console.error('[universal/leads] supabase error', error.message);
    return res.status(500).json({ error: 'Database error' });
  }

  if (!lead) {
    return res.status(404).json({ error: 'Not found' });
  }

  return res.status(200).json({ lead });
}
