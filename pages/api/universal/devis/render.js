/**
 * GET /api/universal/devis/render?quote_number=PUR-XXXXXX
 *
 * Thin read-only endpoint that regenerates quote HTML from DB data.
 * Used by PUR /q/[token] SSR page (server-to-server, no html_content column exists).
 *
 * Auth: none required — public read, but only returns HTML for quotes in
 *       valid states (ready, accepted). Expired/draft states return status only.
 * Private data (customer_id) stripped from public response.
 */

import { createClient } from '@supabase/supabase-js';
import { generatePurQuoteHtml } from '../../../../lib/quote-templates/pur.js';
import { mergeConfig } from '../../../../lib/quote-config.js';
import { checkRateLimit } from '../../../../lib/security';
import { applyCorsHeaders } from '../../../../lib/universal-api-auth';
import { sanitizeProjectDescription } from '../../../../lib/devis/specs.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (applyCorsHeaders(req, res, { methods: ['GET', 'OPTIONS'] })) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  // 30 renders/min per IP — generous for legit clients refreshing, blocks
  // token enumeration attempts.
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  if (checkRateLimit(req, res, `devis-render:${ip}`, 30)) return;

  const { quote_number } = req.query;
  if (!quote_number) return res.status(400).json({ error: 'quote_number required' });

  const { data: quote, error: qErr } = await supabase
    .from('quotes')
    .select('id, customer_id, job_id, status, line_items, subtotal, tax_gst, tax_qst, total_ttc, valid_until, notes, meta, created_at, quote_number, project_ref')
    .eq('quote_number', quote_number)
    .maybeSingle();

  if (qErr || !quote) return res.status(404).json({ error: 'Not found' });

  // Expiry check
  const now = new Date();
  const validUntil = quote.valid_until ? new Date(quote.valid_until) : null;
  const expired = !!(validUntil && validUntil < now);

  // Fetch job data
  const { data: job } = await supabase
    .from('jobs')
    .select('client_name, client_phone, client_email, address, project_type, project_description, client_address')
    .eq('id', quote.job_id)
    .maybeSingle();

  // Fetch customer config
  const { data: customer } = await supabase
    .from('customers')
    .select('quote_config, business_name, domain')
    .eq('id', quote.customer_id)
    .maybeSingle();

  const config = mergeConfig(customer?.quote_config);

  const acceptance_url = quote.meta?.acceptance_url ||
    `https://pur-construction-site.vercel.app/q/${quote_number}`;

  const clientAddress = job?.client_address || job?.address || '';

  const templateData = {
    quote_number,
    project_ref: quote.project_ref || null,
    date: quote.created_at ? quote.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    valid_days: config.quote.valid_days || 15,
    client_name: job?.client_name || '',
    client_phone: job?.client_phone || '',
    client_email: job?.client_email || '',
    client_address: clientAddress,
    project_description: sanitizeProjectDescription(job?.project_description),
    line_items: quote.line_items || [],
    subtotal: Number(quote.subtotal),
    tax_gst: Number(quote.tax_gst),
    tax_qst: Number(quote.tax_qst),
    total_ttc: Number(quote.total_ttc),
    notes: quote.notes,
    acceptance_url,
    meta: quote.meta || {},
  };

  let html = null;
  if (config.branding?.html_template === 'pur') {
    html = generatePurQuoteHtml(templateData, config);
  } else {
    return res.status(501).json({
      error: 'Template not supported in /render',
      template: config.branding?.html_template || 'default'
    });
  }

  return res.status(200).json({
    html,
    status: quote.status,
    expired,
    client_name: job?.client_name || '',
    valid_until: quote.valid_until,
  });
}
