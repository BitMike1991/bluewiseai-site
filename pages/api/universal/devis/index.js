// Universal Quote Creation API — Multi-tenant
// Called by n8n after owner confirms quote in Slack
// Fetches per-customer branding, warranties, exclusions, payment schedule from quote_config
import crypto from 'crypto';
import { getSupabaseServerClient } from '../../../../lib/supabaseServer';
import { generatePurQuoteHtml } from '../../../../lib/quote-templates/pur.js';
import { mergeConfig } from '../../../../lib/quote-config.js';
import { applyCorsHeaders } from '../../../../lib/universal-api-auth';
import { resolveDivisionId } from '../../../../lib/divisions';

const supabase = getSupabaseServerClient();

function formatMoney(amount) {
  return Number(amount).toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' $';
}

// CSPRNG-backed quote token generation. 16 hex chars = 64 bits of entropy,
// making enumeration of the public /q/[token] surface computationally infeasible.
// Legacy 6-digit numeric tokens are still accepted on read paths for backward
// compatibility with quotes already sent to clients.
function generateQuoteNumber(prefix) {
  return (prefix || 'BW') + '-' + crypto.randomBytes(8).toString('hex');
}

function generateQuoteHtml(data, config) {
  const {
    quote_number, date, valid_days, start_date,
    client_name, client_phone, client_email, client_address, client_city,
    project_description, line_items, subtotal, tax_gst, tax_qst, total_ttc,
    notes
  } = data;

  const b = config.branding;
  const q = config.quote;
  const schedule = config.payment_schedule;
  const promos = config.promotions || [];

  const validUntil = new Date(new Date(date).getTime() + (valid_days || 30) * 86400000)
    .toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  const dateFormatted = new Date(date)
    .toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });

  // Line items table
  const lineItemsRows = (line_items || []).map(item => `
    <tr>
      <td>${item.description}</td>
      <td class="amt">${item.qty || ''}</td>
      <td class="amt">${item.unit_price ? formatMoney(item.unit_price) : '\u2014'}</td>
      <td class="amt">${item.total ? formatMoney(item.total) : '\u2014'}</td>
    </tr>
  `).join('');

  // Payment schedule — flexible number of tranches
  const paymentRows = schedule.map(r => {
    const amt = subtotal * r.percentage / 100;
    const amtTtc = Number((amt * 1.14975).toFixed(2));
    return `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 10px 0;"><strong>${r.label}</strong><br/><span style="font-size: 11px; color: #6b7280;">${r.description}</span></td>
      <td style="padding: 10px 0; text-align: right; white-space: nowrap;"><strong>${formatMoney(amt)}</strong><br/><span style="font-size: 11px; color: #6b7280;">${formatMoney(amtTtc)} TTC</span></td>
    </tr>`;
  }).join('');

  // Exclusions from config
  const exclusionItems = (q.exclusions || []).map(e => `<li>${e}</li>`).join('');

  // Warranties from config
  const warrantyHtml = (q.warranties && q.warranties.length > 0)
    ? `<h3>Garanties</h3><ul>${q.warranties.map(w => `<li><strong>${w.item} :</strong> ${w.duration}</li>`).join('')}</ul>`
    : '<p>Garantie conforme aux normes de l\'industrie.</p>';

  // Promotions
  const promoHtml = promos.length > 0
    ? `<div class="promo-box">${promos.map(p => `<p>\ud83c\udf81 <strong>${p.offer}</strong>${p.condition ? ` \u2014 ${p.condition}` : ''}</p>`).join('')}</div>`
    : '';

  // Interac email from contract config
  const interacEmail = config.contract?.interac_email || b.email;

  // Logo: handle missing gracefully
  const logoHtml = b.logo_url
    ? `<img src="${b.logo_url}" alt="${b.business_name}" style="max-height: 50px; max-width: 200px; object-fit: contain;" />`
    : '';

  // RBQ badge
  const rbqHtml = b.rbq_number ? `<p style="font-size: 11px; opacity: 0.85;">RBQ : ${b.rbq_number}</p>` : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Devis ${b.business_name} - ${quote_number}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      color: #1f2937; line-height: 1.7; font-size: 13px;
      padding: 0; margin: 0; background: #fff;
    }
    .page { max-width: 800px; margin: 0 auto; padding: 40px 50px; }
    .header {
      background: #ffffff; border-bottom: 4px solid ${b.primary_color};
      color: ${b.accent_color || '#1C1C1C'}; padding: 35px 50px; margin-bottom: 0;
      display: flex; align-items: center; gap: 20px;
    }
    .header h1 { font-size: 28px; font-weight: 700; letter-spacing: 1px; margin-bottom: 4px; }
    .header .subtitle { font-size: 14px; opacity: 0.9; font-weight: 400; }
    .contract-bar {
      background: ${b.primary_color}0a; border-left: 4px solid ${b.accent_color || b.primary_color};
      padding: 14px 20px; margin: 25px 0;
      display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;
    }
    .contract-bar p { margin: 2px 0; font-size: 13px; }
    .section { margin-bottom: 22px; page-break-inside: avoid; }
    .section h2 {
      color: ${b.primary_color}; font-size: 14px; text-transform: uppercase;
      letter-spacing: 0.8px; border-bottom: 2px solid #e5e7eb;
      padding-bottom: 6px; margin-bottom: 12px; font-weight: 700;
    }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
    .info-box {
      background: #f9fafb; padding: 16px; border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    .info-box .label {
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;
      color: #6b7280; font-weight: 700; margin-bottom: 8px;
    }
    .info-box p { margin: 3px 0; font-size: 13px; }
    .pay-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    .pay-table th, .pay-table td {
      padding: 10px 14px; text-align: left;
      border-bottom: 1px solid #e5e7eb; font-size: 13px;
    }
    .pay-table th { background: #f9fafb; font-weight: 700; color: #374151; }
    .pay-table .amt { text-align: right; font-weight: 600; }
    .pay-table .tax-row td { font-size: 12px; color: #6b7280; }
    .pay-table .total-row { background: ${b.primary_color}; color: white; }
    .pay-table .total-row td { font-weight: 700; font-size: 14px; border: none; }
    .warranty-box {
      background: #ecfdf5; border: 1px solid #10b981;
      padding: 16px; border-radius: 6px; margin: 10px 0;
    }
    .warranty-box h3 { color: #047857; margin: 0 0 8px 0; font-size: 13px; }
    .warranty-box li { font-size: 12px; margin-bottom: 4px; }
    .exclusion-box {
      background: #fef2f2; border: 1px solid #ef4444;
      padding: 16px; border-radius: 6px; margin: 10px 0;
    }
    .promo-box {
      background: #f0fdf4; border: 1px solid #22c55e;
      padding: 14px 16px; border-radius: 6px; margin: 12px 0;
    }
    .promo-box p { font-size: 13px; margin: 4px 0; }
    .note-box {
      background: ${b.primary_color}08; border: 1px solid ${b.primary_color}40;
      padding: 16px; border-radius: 6px; margin: 20px 0;
    }
    .note-box p { font-size: 13px; margin-bottom: 6px; color: ${b.primary_color}; }
    .accept-section {
      margin-top: 30px; padding: 30px; background: #f0fdf4; border: 2px solid #22c55e;
      border-radius: 12px; text-align: center;
    }
    .accept-section h2 { color: #16a34a; border: none; text-align: center; margin-bottom: 16px; }
    .accept-section p { font-size: 14px; margin-bottom: 20px; color: #374151; }
    .btn-accept {
      display: inline-block; padding: 16px 48px; font-size: 18px; font-weight: 700;
      color: white; background: linear-gradient(135deg, #16a34a, #22c55e);
      border: none; border-radius: 8px; cursor: pointer;
      text-decoration: none; transition: all 0.2s;
    }
    .btn-accept:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(34,197,94,0.4); }
    .btn-accept:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
    .accept-status {
      margin-top: 16px; padding: 16px; border-radius: 8px;
      font-size: 14px; display: none;
    }
    .accept-status.success { display: block; background: #ecfdf5; border: 1px solid #10b981; color: #047857; }
    .accept-status.error { display: block; background: #fef2f2; border: 1px solid #ef4444; color: #dc2626; }
    .accept-status.loading { display: block; background: #eff6ff; border: 1px solid #3b82f6; color: #1d4ed8; }
    .footer {
      margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb;
      font-size: 10px; color: #9ca3af; text-align: center;
    }
    .footer p { margin: 2px 0; }
    @media (max-width: 640px) {
      .page { padding: 16px; }
      .header { padding: 20px 16px; flex-direction: column; text-align: center; gap: 12px; }
      .header h1 { font-size: 20px; }
      .header img { width: 48px; height: 48px; }
      .contract-bar { flex-direction: column; padding: 12px 16px; gap: 4px; }
      .two-col { grid-template-columns: 1fr; gap: 12px; }
      .info-box { padding: 12px; }
      .pay-table { font-size: 12px; }
      .pay-table th, .pay-table td { padding: 8px 6px; }
      .pay-table .total-row td { font-size: 13px; }
      .accept-section { padding: 20px 16px; }
      .btn-accept { padding: 14px 32px; font-size: 16px; width: 100%; }
      .note-box { padding: 12px; }
      .promo-box { padding: 10px 12px; }
      .warranty-box, .exclusion-box { padding: 12px; }
      .footer { padding-top: 12px; font-size: 9px; }
      .footer p { word-break: break-word; }
    }
    @media print {
      body { padding: 0; }
      .page { max-width: 100%; padding: 20px 40px; }
      .header { padding: 25px 40px; }
      .accept-section { display: none !important; }
    }
  </style>
</head>
<body>

<div class="page">

  <div class="header">
    ${logoHtml}
    <div>
      <h1>${b.business_name.toUpperCase()}</h1>
      <div class="subtitle">Devis \u2014 Estimation des travaux</div>
      ${rbqHtml}
    </div>
  </div>

  <div class="contract-bar">
    <div>
      <p><strong>Devis n\u00BA :</strong> ${quote_number}</p>
      <p><strong>Date :</strong> ${dateFormatted}</p>
    </div>
    <div>
      ${start_date ? `<p><strong>D\u00e9but des travaux :</strong> ${start_date}</p>` : ''}
      <p><strong>Validit\u00e9 du devis :</strong> ${valid_days || 30} jours (jusqu'au ${validUntil})</p>
    </div>
  </div>

  <div class="section">
    <h2>Coordonn\u00e9es</h2>
    <div class="two-col">
      <div class="info-box">
        <div class="label">Entrepreneur</div>
        <p><strong>${b.business_name}</strong></p>
        ${b.address ? `<p>${b.address}</p>` : ''}
        ${b.phone ? `<p>T\u00e9l. : ${b.phone}</p>` : ''}
        ${b.email ? `<p>${b.email}</p>` : ''}
        ${b.rbq_number ? `<p>RBQ : ${b.rbq_number}</p>` : ''}
      </div>
      <div class="info-box">
        <div class="label">Client</div>
        <p><strong>${client_name}</strong></p>
        ${client_address ? `<p>${client_address}</p>` : ''}
        ${client_city ? `<p>${client_city}</p>` : ''}
        ${client_phone ? `<p>T\u00e9l. : ${client_phone}</p>` : ''}
        ${client_email ? `<p>${client_email}</p>` : ''}
      </div>
    </div>
  </div>

  ${promoHtml}

  <div class="section">
    <h2>Travaux propos\u00e9s</h2>
    ${project_description ? `<div class="info-box" style="margin-bottom: 16px;"><p>${project_description}</p></div>` : ''}

    <table class="pay-table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="amt">Qt\u00e9</th>
          <th class="amt">Prix unit.</th>
          <th class="amt">Total</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsRows}
        <tr style="border-top: 2px solid #e5e7eb;">
          <td colspan="3"><strong>Sous-total avant taxes</strong></td>
          <td class="amt"><strong>${formatMoney(subtotal)}</strong></td>
        </tr>
        <tr class="tax-row">
          <td colspan="3">TPS (5 %)</td>
          <td class="amt">${formatMoney(tax_gst)}</td>
        </tr>
        <tr class="tax-row">
          <td colspan="3">TVQ (9,975 %)</td>
          <td class="amt">${formatMoney(tax_qst)}</td>
        </tr>
        <tr class="total-row">
          <td colspan="3">TOTAL</td>
          <td class="amt">${formatMoney(total_ttc)} CAD</td>
        </tr>
      </tbody>
    </table>

    <p style="font-size: 11px; color: #6b7280; margin-top: 8px;">
      Paiement accept\u00e9 <strong>par virement Interac uniquement</strong> \u00e0 ${interacEmail}.
    </p>
  </div>

  <div class="section">
    <h2>Modalit\u00e9s de paiement</h2>
    <div class="info-box">
      <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
        ${paymentRows}
      </table>
    </div>
  </div>

  <div class="section">
    <h2>Garanties</h2>
    <div class="warranty-box">
      ${warrantyHtml}
    </div>
  </div>

  <div class="section">
    <h2>Exclusions</h2>
    <div class="exclusion-box">
      <p style="font-size: 12px; margin-bottom: 8px;"><strong>Les travaux suivants ne sont PAS inclus dans le pr\u00e9sent devis :</strong></p>
      <ul style="padding-left: 20px; font-size: 12px;">
        ${exclusionItems}
      </ul>
    </div>
  </div>

  ${notes ? `
  <div class="section">
    <h2>Notes</h2>
    <div class="info-box">${notes}</div>
  </div>` : ''}

  <div class="note-box">
    <p><strong>Ce document est un devis informatif.</strong> Un contrat d\u00e9taill\u00e9 incluant les conditions g\u00e9n\u00e9rales, la signature \u00e9lectronique et les termes complets sera pr\u00e9par\u00e9 automatiquement lors de la confirmation du projet.</p>
    ${b.phone || b.email ? `<p style="margin-top: 8px;">Pour confirmer ou pour toute question : ${b.phone ? `<strong>${b.phone}</strong>` : ''}${b.phone && b.email ? ' ou ' : ''}${b.email ? `<strong>${b.email}</strong>` : ''}</p>` : ''}
  </div>

  <div class="accept-section" id="acceptSection">
    <h2>Accepter ce devis</h2>
    <p>En cliquant sur le bouton ci-dessous, vous confirmez accepter les travaux et conditions d\u00e9crits dans ce devis.<br/>
    Un contrat d\u00e9taill\u00e9 vous sera envoy\u00e9 automatiquement pour signature \u00e9lectronique.</p>
    <button class="btn-accept" id="btnAccept" onclick="acceptQuote()">J'accepte ce devis</button>
    <div class="accept-status" id="acceptStatus"></div>
  </div>

  <div class="footer">
    <p>${b.business_name}${b.address ? ' | ' + b.address : ''}${b.phone ? ' | ' + b.phone : ''}${b.email ? ' | ' + b.email : ''}</p>
    <p>Devis g\u00e9n\u00e9r\u00e9 le ${dateFormatted}. Valide ${valid_days || 30} jours.</p>
  </div>

</div>

<script>
(function() {
  var QUOTE_NUMBER = '${quote_number}';
  var PHONE = '${b.phone || ''}';
  var accepted = false;

  window.acceptQuote = async function() {
    if (accepted) return;
    var btn = document.getElementById('btnAccept');
    var status = document.getElementById('acceptStatus');

    btn.disabled = true;
    status.className = 'accept-status loading';
    status.textContent = 'Traitement en cours...';

    try {
      var resp = await fetch('https://www.bluewiseai.com/api/universal/devis/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote_number: QUOTE_NUMBER })
      });

      var data = await resp.json();

      if (resp.ok && data.success) {
        accepted = true;
        status.className = 'accept-status success';
        status.innerHTML = '<strong>Devis accept\u00e9!</strong> Vous recevrez votre contrat par courriel et SMS sous peu. Merci de votre confiance!';
        btn.style.display = 'none';
      } else {
        status.className = 'accept-status error';
        status.textContent = data.error || ('Erreur. Veuillez r\u00e9essayer' + (PHONE ? ' ou nous contacter au ' + PHONE : '') + '.');
        btn.disabled = false;
      }
    } catch (err) {
      status.className = 'accept-status error';
      status.textContent = 'Erreur de connexion. Veuillez r\u00e9essayer.';
      btn.disabled = false;
    }
  };
})();
</script>

</body>
</html>`;
}

export default async function handler(req, res) {
  if (applyCorsHeaders(req, res, { methods: ['POST', 'OPTIONS'] })) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      customer_id,
      client_name, client_phone, client_email, client_address, client_city,
      job_id,
      lead_id,
      project_type = 'residential',
      project_description,
      start_date,
      line_items,
      subtotal,
      notes,
      valid_days,
      api_key
    } = req.body;

    // Auth: universal key (env var only) or per-customer key
    if (!process.env.UNIVERSAL_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const validKeys = [process.env.UNIVERSAL_API_KEY.trim()];
    if (!validKeys.includes(api_key)) {
      // Try per-customer key
      if (customer_id) {
        const { data: cust } = await supabase.from('customers').select('contract_api_key').eq('id', customer_id).single();
        if (!cust || !cust.contract_api_key || api_key !== cust.contract_api_key) {
          // Last resort: allow if api_key matches any known valid key
          if (!validKeys.includes(api_key)) {
            return res.status(401).json({ error: 'Unauthorized' });
          }
        }
      } else {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    if (!customer_id) {
      return res.status(400).json({ error: 'Required: customer_id' });
    }
    if (!client_name || !line_items || !subtotal) {
      return res.status(400).json({ error: 'Required: client_name, line_items, subtotal' });
    }

    // Fetch customer + quote_config
    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .select('id, business_name, domain, quote_config, contract_api_key, interac_email')
      .eq('id', customer_id)
      .single();

    if (custErr || !customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const config = mergeConfig(customer.quote_config);
    const qValid = valid_days || config.quote.valid_days || 30;

    // Tax calculations
    const tax_gst = Number((subtotal * 0.05).toFixed(2));
    const tax_qst = Number((subtotal * 0.09975).toFixed(2));
    const total_ttc = Number((subtotal + tax_gst + tax_qst).toFixed(2));
    const quote_number = generateQuoteNumber(config.quote.prefix);
    const date = new Date().toISOString().split('T')[0];

    // Ensure line_items have totals
    const processedItems = (line_items || []).map(item => ({
      ...item,
      total: item.total || (item.qty || 1) * (item.unit_price || 0)
    }));

    // 1. Find or create job
    let jobDbId = job_id;
    if (!jobDbId) {
      let existingJob = null;
      if (client_phone) {
        const phoneDigits = client_phone.replace(/\D/g, '');
        const last7 = phoneDigits.slice(-7);
        const { data: jobRows } = await supabase.rpc('find_job_by_client', {
          p_customer_id: customer_id,
          p_client_name: client_name,
          p_phone_last7: last7
        });
        if (jobRows && jobRows.length > 0) {
          existingJob = jobRows[0];
        }
      }

      if (existingJob) {
        jobDbId = existingJob.id;
        if (lead_id) {
          await supabase.from('jobs').update({ lead_id }).eq('id', jobDbId).is('lead_id', null);
        }
      } else {
        // Inherit division from linked lead if any, else tenant default.
        const newJobDivisionId = await resolveDivisionId(supabase, {
          customer_id,
          lead_id: lead_id || null,
        });
        const { data: newJob, error: jobErr } = await supabase
          .from('jobs')
          .insert({
            job_id: quote_number,
            customer_id,
            division_id: newJobDivisionId,
            client_name,
            client_phone: client_phone || null,
            client_email: client_email || null,
            status: 'quoted',
            project_type,
            project_description: project_description || null,
            quote_amount: subtotal,
            payment_terms: config.payment_schedule,
            address: client_address || null,
            lead_id: lead_id || null
          })
          .select('id')
          .single();
        if (jobErr) throw new Error('Job creation failed: ' + jobErr.message);
        jobDbId = newJob.id;
      }
    }

    // 2a. Pre-compute acceptance_url (needed for DB insert meta below)
    const acceptance_url = customer.id === 9
      ? `https://pur-construction-site.vercel.app/q/${quote_number}`
      : `https://${customer.domain || 'bluewiseai.com'}/q/${quote_number}`;

    // 2. Quote versioning — supersede old quotes
    const { data: existingQuotes } = await supabase
      .from('quotes')
      .select('id, version, project_ref')
      .eq('job_id', jobDbId)
      .eq('customer_id', customer_id)
      .order('version', { ascending: false })
      .limit(1);

    let version = 1;
    let inheritedProjectRef = null;
    if (existingQuotes && existingQuotes.length > 0) {
      version = existingQuotes[0].version + 1;
      // Mikael 2026-04-22 "fait ca robuste" — revision of an existing quote
      // MUST keep the same project_ref so devis v2 / v3 / contrat / BDC all
      // track as the same project (PUR-0042), not PUR-0042 + PUR-0043.
      inheritedProjectRef = existingQuotes[0].project_ref || null;
      await supabase
        .from('quotes')
        .update({ status: 'superseded', updated_at: new Date().toISOString() })
        .eq('id', existingQuotes[0].id);
    }

    // 2c. Project ref — reuse from prior version OR claim a fresh sequential
    // ref via atomic RPC. On RPC failure, synthesize a deterministic fallback
    // so the devis ALWAYS carries a user-visible ref (no silent null that
    // later breaks contrat/BDC linking).
    const prefix = String(config.quote.prefix || 'BW').toUpperCase();
    let projectRef = inheritedProjectRef;
    if (!projectRef) {
      try {
        const { data: claimed, error: rpcErr } = await supabase.rpc('claim_next_project_ref', {
          p_customer_id: customer_id,
          p_prefix: prefix,
        });
        if (!rpcErr && typeof claimed === 'string' && claimed.trim()) {
          projectRef = claimed.trim();
        } else if (rpcErr) {
          console.warn('[devis/create] claim_next_project_ref rpcErr:', rpcErr?.message);
        }
      } catch (err) {
        console.warn('[devis/create] claim_next_project_ref threw:', err?.message);
      }
    }
    if (!projectRef) {
      // Deterministic fallback: count existing quotes for this customer and
      // synthesize ${prefix}-${seq}. Keeps the paper trail usable even when
      // the sequential RPC is unavailable.
      const { count } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customer_id);
      const seq = String((count || 0) + 1).padStart(4, '0');
      projectRef = `${prefix}-${seq}`;
      console.warn('[devis/create] synthesized fallback project_ref:', projectRef);
    }

    // 3. Insert quote record — inherit division from the job we just wrote/fetched.
    const quoteDivisionId = await resolveDivisionId(supabase, {
      customer_id,
      job_id: jobDbId,
      lead_id: lead_id || null,
    });
    const { data: quoteRow, error: quoteErr } = await supabase
      .from('quotes')
      .insert({
        job_id: jobDbId,
        customer_id,
        division_id: quoteDivisionId,
        quote_number,
        project_ref: projectRef,
        version,
        line_items: processedItems,
        subtotal,
        tax_gst,
        tax_qst,
        total_ttc,
        payment_terms: config.payment_schedule,
        valid_until: new Date(Date.now() + qValid * 86400000).toISOString().split('T')[0],
        notes: notes || null,
        status: 'draft',
        meta: { acceptance_url }
      })
      .select('id')
      .single();
    if (quoteErr) throw new Error('Quote creation failed: ' + quoteErr.message);

    // 4. Generate HTML — route by template
    const templateData = {
      quote_number, date, valid_days: qValid, start_date,
      client_name, client_phone, client_email, client_address, client_city,
      project_description, line_items: processedItems, subtotal, tax_gst, tax_qst, total_ttc,
      notes, acceptance_url
    };

    let html;
    if (config.branding?.html_template === 'pur') {
      html = generatePurQuoteHtml(templateData, config);
    } else {
      html = generateQuoteHtml(templateData, config);
    }

    // 5. Update lead status
    if (lead_id) {
      await supabase
        .from('leads')
        .update({ status: 'quote_sent', updated_at: new Date().toISOString() })
        .eq('id', lead_id)
        .eq('customer_id', customer_id);
    }

    // 6. Finalize quote with filename
    const prefix = config.quote.prefix || 'BW';
    const filename = `${prefix}-devis-${quote_number.replace(prefix + '-', '')}.html`;
    await supabase
      .from('quotes')
      .update({ storage_path: filename, status: 'ready', updated_at: new Date().toISOString() })
      .eq('id', quoteRow.id);

    const domain = customer.domain || 'bluewiseai.com';

    return res.status(200).json({
      success: true,
      quote_number,
      version,
      job_id: jobDbId,
      quote_id: quoteRow.id,
      filename,
      html,
      total_ttc,
      url: `https://${domain}/${filename}`,
      public_url: acceptance_url
    });

  } catch (error) {
    console.error('Universal quote create error:', error);
    return res.status(500).json({
      error: 'Erreur lors de la création du devis',
      details: error.message
    });
  }
}
