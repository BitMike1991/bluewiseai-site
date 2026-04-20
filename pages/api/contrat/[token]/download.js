/**
 * /api/contrat/[token]/download
 *
 * Streams the signed contract HTML to the client as a download attachment.
 *
 * Trust model: same as /q/[token]/success — anyone holding the quote_number
 * token already has the sign link (sent to them by email / SMS). No login
 * required, but we 404 if the contract isn't actually signed yet, and scope
 * everything through the service-role client so RLS doesn't get in the way
 * while keeping tenant isolation enforced by the `customer_id` join.
 *
 * Query: /api/contrat/{quote_number}/download
 */

import { getSupabaseServerClient } from '../../../../lib/supabaseServer';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query || {};
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Missing token' });
  }

  const supabase = getSupabaseServerClient();

  // 1. Resolve the quote → job_id
  const { data: quote, error: quoteErr } = await supabase
    .from('quotes')
    .select('id, job_id, customer_id, quote_number, status')
    .eq('quote_number', token)
    .maybeSingle();

  if (quoteErr || !quote) {
    return res.status(404).json({ error: 'Devis introuvable' });
  }

  // 2. Fetch the most recent signed contract for that job
  const { data: contract, error: cErr } = await supabase
    .from('contracts')
    .select('id, customer_id, signature_status, storage_path, storage_bucket, signature_request_id, html_content, signed_at')
    .eq('job_id', quote.job_id)
    .eq('customer_id', quote.customer_id)
    .eq('signature_status', 'signed')
    .order('signed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cErr || !contract) {
    return res.status(404).json({ error: 'Contrat signé introuvable' });
  }

  // 3. Prefer downloading the frozen signed HTML from Storage. Fall back to
  // the html_content column if the storage read fails (older records may
  // not have a storage copy, and we still want the download to work).
  let htmlBuffer = null;
  const bucket = contract.storage_bucket || 'contracts';
  if (contract.storage_path) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(contract.storage_path);
      if (!error && data) {
        htmlBuffer = Buffer.from(await data.arrayBuffer());
      }
    } catch {
      /* fall through to html_content */
    }
  }

  if (!htmlBuffer && contract.html_content) {
    htmlBuffer = Buffer.from(contract.html_content, 'utf-8');
  }

  if (!htmlBuffer) {
    return res.status(404).json({ error: 'Aucun contenu disponible' });
  }

  const safeName = `contrat-${(contract.signature_request_id || quote.quote_number || 'signe').replace(/[^A-Za-z0-9_-]/g, '')}.html`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.status(200).send(htmlBuffer);
}
