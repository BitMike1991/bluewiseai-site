// pages/api/jobs/[id]/roof-quote.js
// GET the roof_quote row linked to a toiture job (if any).
// Used by the TabCommande toiture branch on /platform/jobs/[id] to build
// the morning truck-loading checklist from the original calculator payload.
import { getAuthContext } from '../../../../lib/supabaseServer';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });

  const jobId = Number(req.query.id);
  if (!jobId) return res.status(400).json({ error: 'Invalid job id' });

  try {
    // RLS on roof_quotes + jobs takes care of tenant + division scope
    const { data, error } = await supabase
      .from('roof_quotes')
      .select('id, token, customer_id, job_id, surface_sqft, pitch_category, shingle_type, total_client_ttc, payload, status, created_at')
      .eq('job_id', jobId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[api/jobs/roof-quote] error', error);
      return res.status(500).json({ error: 'Failed to load roof quote' });
    }

    res.setHeader('Cache-Control', 'private, max-age=30');
    return res.status(200).json({ roof_quote: data || null });
  } catch (err) {
    console.error('[api/jobs/roof-quote] unexpected', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
