// pages/api/universal/devis/send.js
// Send a devis to a client via SMS (Telnyx) and/or email (Gmail OAuth → Mailgun fallback).
//
// POST { quote_id, channel: 'sms'|'email'|'both', phone_override?, email_override? }
// Auth: logged-in user whose customer_id matches the quote's customer_id.
//       OR api_key header matching UNIVERSAL_API_KEY (for internal/n8n triggers).
//
// Side effects:
//   - For each channel: insert a row in `messages` (outbound) and `send_logs`.
//   - Emit a `job_events` row ('devis_sent') for ops visibility.
//   - DOES NOT flip quote or job status — that's the caller's responsibility (DevisEditor).
//   - Safe to call more than once (re-send). Each call produces a new message row.

import { getAuthContext } from '../../../../lib/supabaseServer';
import { checkRateLimit } from '../../../../lib/security';
import { applyCorsHeaders } from '../../../../lib/universal-api-auth';
import { sendSmsTelnyx } from '../../../../lib/providers/telnyx';
import { sendEmailGmail } from '../../../../lib/providers/gmail';
import { sendEmailMailgun } from '../../../../lib/providers/mailgun';
import { encryptToken } from '../../../../lib/tokenEncryption';
import { buildDevisNotifyEmail, buildDevisNotifySms } from '../../../../lib/email-templates/devis-notify';

function normStr(v) {
  if (v == null) return '';
  return String(v).trim();
}

export default async function handler(req, res) {
  if (applyCorsHeaders(req, res, { methods: ['POST', 'OPTIONS'], headers: ['api_key'] })) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── Auth: session OR master api_key ──
  const { supabase, customerId: sessionCustomerId, user } = await getAuthContext(req, res);
  const apiKey = normStr(req.headers['api_key']);
  const masterKey = normStr(process.env.UNIVERSAL_API_KEY);
  const isMaster = masterKey && apiKey === masterKey;
  if (!user && !isMaster) return res.status(401).json({ error: 'Not authenticated' });

  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  if (checkRateLimit(req, res, `devis-send:${sessionCustomerId || ip}`, 30)) return;

  // ── Payload ──
  const { quote_id, channel, phone_override, email_override } = req.body || {};
  if (!quote_id || typeof quote_id !== 'number' && typeof quote_id !== 'string') {
    return res.status(400).json({ error: 'quote_id required' });
  }
  if (!['sms', 'email', 'both'].includes(channel)) {
    return res.status(400).json({ error: "channel must be 'sms', 'email' or 'both'" });
  }

  // ── Fetch quote + job + customer ──
  const { data: quote, error: qErr } = await supabase
    .from('quotes')
    .select('id, customer_id, job_id, quote_number, status, total_ttc, valid_until, meta')
    .eq('id', quote_id)
    .maybeSingle();

  if (qErr || !quote) return res.status(404).json({ error: 'Quote not found' });

  // Tenant guard for session auth
  if (!isMaster && quote.customer_id !== sessionCustomerId) {
    return res.status(403).json({ error: 'Forbidden — wrong tenant' });
  }

  const customerIdResolved = quote.customer_id;

  const [{ data: job }, { data: customer }] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, lead_id, client_name, client_phone, client_email')
      .eq('id', quote.job_id)
      .eq('customer_id', customerIdResolved)
      .maybeSingle(),
    supabase
      .from('customers')
      .select('id, domain, business_name, quote_config, telnyx_sms_number')
      .eq('id', customerIdResolved)
      .maybeSingle(),
  ]);

  if (!job)      return res.status(404).json({ error: 'Job linked to quote not found' });
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  // ── Resolve recipients + acceptance URL ──
  const phoneTo = normStr(phone_override) || normStr(job.client_phone);
  const emailTo = normStr(email_override) || normStr(job.client_email);

  const domain = customer.domain || 'bluewiseai.com';
  const qNum = quote.quote_number || '';
  // Prefer the meta.acceptance_url baked in at creation; fall back to canonical.
  const acceptanceUrl = quote.meta?.acceptance_url || `https://${domain}/q/${qNum}`;

  const branding = customer.quote_config?.branding || { business_name: customer.business_name || 'BlueWise' };
  const validDays = Number(customer.quote_config?.quote?.valid_days || 15);

  const results = {
    sms:   { attempted: false, success: false, provider_message_id: null, error: null },
    email: { attempted: false, success: false, provider_message_id: null, error: null, provider: null },
  };

  const wantSms   = channel === 'sms'   || channel === 'both';
  const wantEmail = channel === 'email' || channel === 'both';

  // ── SMS via Telnyx ──
  if (wantSms) {
    results.sms.attempted = true;
    if (!phoneTo) {
      results.sms.error = 'Missing recipient phone';
    } else if (!customer.telnyx_sms_number) {
      results.sms.error = 'Missing customers.telnyx_sms_number';
    } else {
      const smsBody = buildDevisNotifySms({
        clientName: job.client_name,
        businessName: branding.business_name,
        acceptanceUrl,
        phone: branding.phone,
      });

      const r = await sendSmsTelnyx({
        to: phoneTo,
        from: customer.telnyx_sms_number,
        body: smsBody,
      });
      results.sms.success = !!r.success;
      results.sms.provider_message_id = r.provider_message_id || null;
      results.sms.error = r.error || null;

      // Log outbound message
      try {
        await supabase.from('messages').insert({
          customer_id: customerIdResolved,
          lead_id: job.lead_id || null,
          direction: 'outbound',
          channel: 'sms',
          message_type: 'sms',
          body: smsBody,
          provider: 'telnyx',
          provider_message_id: r.provider_message_id || null,
          status: r.success ? 'sent' : 'failed',
          error: r.success ? null : (r.error || null),
          to_address: phoneTo,
          from_address: customer.telnyx_sms_number,
          meta: { devis_sent: true, quote_id: quote.id, quote_number: qNum },
        });
      } catch (e) {
        console.warn('[devis/send] messages log sms failed', e?.message);
      }
    }
  }

  // ── Email via Gmail OAuth → Mailgun fallback ──
  if (wantEmail) {
    results.email.attempted = true;
    if (!emailTo) {
      results.email.error = 'Missing recipient email';
    } else {
      const { subject, html, text } = buildDevisNotifyEmail({
        clientName: job.client_name,
        quoteNumber: qNum,
        totalTtc: Number(quote.total_ttc || 0),
        acceptanceUrl,
        validDays,
        branding,
      });

      // Try Gmail OAuth first
      const { data: oauthRow } = await supabase
        .from('customer_email_oauth')
        .select('id, provider, access_token, refresh_token, token_expiry, email_address, status')
        .eq('customer_id', customerIdResolved)
        .eq('status', 'active')
        .eq('provider', 'gmail')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let sent = null;
      let provider = null;

      if (oauthRow?.email_address) {
        provider = 'gmail';
        const from = `${branding.business_name || 'BlueWise'} <${oauthRow.email_address}>`;
        sent = await sendEmailGmail(
          { to: emailTo, from, subject, body: text, html },
          oauthRow,
          async (newAccessToken, newExpiry) => {
            try {
              await supabase
                .from('customer_email_oauth')
                .update({
                  access_token: encryptToken(newAccessToken),
                  token_expiry: newExpiry,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', oauthRow.id);
            } catch (e) {
              console.warn('[devis/send] oauth token update failed', e?.message);
            }
          }
        );
      }

      // Fallback to Mailgun on Gmail failure OR no OAuth configured
      if (!sent || !sent.success) {
        const mgFrom = process.env.MAILGUN_FROM
          || (process.env.MAILGUN_DOMAIN ? `${branding.business_name || 'BlueWise'} <noreply@${process.env.MAILGUN_DOMAIN}>` : '');
        if (mgFrom) {
          const prevErr = sent?.error;
          provider = 'mailgun';
          sent = await sendEmailMailgun({
            to: emailTo,
            from: mgFrom,
            subject,
            body: text,
            html,
          });
          if (!sent.success && prevErr) sent.error = `gmail:${prevErr} | mailgun:${sent.error}`;
        }
      }

      results.email.success = !!sent?.success;
      results.email.provider_message_id = sent?.provider_message_id || null;
      results.email.error = sent?.error || null;
      results.email.provider = provider;

      try {
        await supabase.from('messages').insert({
          customer_id: customerIdResolved,
          lead_id: job.lead_id || null,
          direction: 'outbound',
          channel: 'email',
          message_type: 'email',
          subject,
          body: text,
          provider,
          provider_message_id: sent?.provider_message_id || null,
          status: sent?.success ? 'sent' : 'failed',
          error: sent?.success ? null : (sent?.error || null),
          to_address: emailTo,
          from_address: provider === 'gmail' ? oauthRow?.email_address : process.env.MAILGUN_FROM,
          meta: { devis_sent: true, quote_id: quote.id, quote_number: qNum },
        });
      } catch (e) {
        console.warn('[devis/send] messages log email failed', e?.message);
      }
    }
  }

  // ── Emit job_event for ops visibility ──
  try {
    await supabase.from('job_events').insert({
      job_id: quote.job_id,
      customer_id: customerIdResolved,
      event_type: 'devis_sent',
      details: {
        quote_id: quote.id,
        quote_number: qNum,
        channel,
        sms: results.sms,
        email: results.email,
        acceptance_url: acceptanceUrl,
        triggered_by: user?.email || (isMaster ? 'api_key' : 'unknown'),
      },
    });
  } catch (e) {
    console.warn('[devis/send] job_event log failed', e?.message);
  }

  const anySuccess = (results.sms.attempted && results.sms.success)
    || (results.email.attempted && results.email.success);

  return res.status(anySuccess ? 200 : 502).json({
    success: anySuccess,
    quote_id: quote.id,
    quote_number: qNum,
    acceptance_url: acceptanceUrl,
    results,
  });
}
