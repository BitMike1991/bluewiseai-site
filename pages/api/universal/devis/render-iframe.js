/**
 * GET /api/universal/devis/render-iframe?quote_number=X
 *
 * Returns raw HTML for direct iframe embedding.
 * Same logic as render.js but responds with Content-Type: text/html.
 * Auth: same-origin only (X-Frame-Options: SAMEORIGIN).
 */

import { createClient } from '@supabase/supabase-js';
import { generatePurQuoteHtml } from '../../../../lib/quote-templates/pur.js';
import { mergeConfig } from '../../../../lib/quote-config.js';
import { checkRateLimit } from '../../../../lib/security';
import { sanitizeProjectDescription } from '../../../../lib/devis/specs.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).end('GET only');
  }

  // 30 renders/min per IP — iframe preview reloads on every save, so this is
  // generous for legit use.
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  if (checkRateLimit(req, res, `devis-render-iframe:${ip}`, 30)) return;

  const { quote_number } = req.query;
  if (!quote_number) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(400).end('<p style="font-family:sans-serif;color:#ef4444;padding:2rem">Paramètre quote_number manquant.</p>');
  }

  const { data: quote, error: qErr } = await supabase
    .from('quotes')
    .select('id, customer_id, job_id, status, line_items, subtotal, tax_gst, tax_qst, total_ttc, valid_until, notes, meta, created_at, quote_number, project_ref')
    .eq('quote_number', quote_number)
    .maybeSingle();

  if (qErr || !quote) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(404).end('<p style="font-family:sans-serif;color:#ef4444;padding:2rem">Devis introuvable.</p>');
  }

  // Fetch job + customer in parallel
  const [jobRes, customerRes] = await Promise.all([
    supabase
      .from('jobs')
      .select('client_name, client_phone, client_email, address, project_type, project_description, client_address')
      .eq('id', quote.job_id)
      .maybeSingle(),
    supabase
      .from('customers')
      .select('quote_config, business_name, domain')
      .eq('id', quote.customer_id)
      .maybeSingle(),
  ]);

  const job      = jobRes.data;
  const customer = customerRes.data;
  const config   = mergeConfig(customer?.quote_config);

  if (config.branding?.html_template !== 'pur') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(501).end('<p style="font-family:sans-serif;color:#ef4444;padding:2rem">Template non supporté.</p>');
  }

  const acceptance_url = quote.meta?.acceptance_url ||
    `https://pur-construction-site.vercel.app/q/${quote_number}`;

  const clientAddress = job?.client_address || job?.address || '';

  const templateData = {
    quote_number,
    project_ref: quote.project_ref || null,
    date: quote.created_at ? quote.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    valid_days:          config.quote?.valid_days || 15,
    client_name:         job?.client_name         || '',
    client_phone:        job?.client_phone         || '',
    client_email:        job?.client_email         || '',
    client_address:      clientAddress,
    project_description: sanitizeProjectDescription(job?.project_description),
    line_items:          quote.line_items           || [],
    subtotal:            Number(quote.subtotal),
    tax_gst:             Number(quote.tax_gst),
    tax_qst:             Number(quote.tax_qst),
    total_ttc:           Number(quote.total_ttc),
    notes:               quote.notes,
    acceptance_url,
    meta:                quote.meta || {},
  };

  const html = generatePurQuoteHtml(templateData, config);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com data:; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'none'"
  );
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).end(html);
}
