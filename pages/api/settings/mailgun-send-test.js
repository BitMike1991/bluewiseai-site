// pages/api/settings/mailgun-send-test.js
// Sends a real test email through Mailgun and returns the verbatim provider
// response so "401 / stale API key / wrong domain / wrong region" is a single
// diagnostic hit away. Isolates Mailgun from the Gmail fallback chain.
//
// GET  /api/settings/mailgun-send-test               → sends to the authed user's email
// GET  /api/settings/mailgun-send-test?to=foo@bar    → sends to an arbitrary address
//
// Response: { success, provider, message_id?, error?, raw?, env: {domain, region, from, api_key_len} }

import { getAuthContext, getSupabaseServerClient } from '../../../lib/supabaseServer';
import { sendEmailMailgun } from '../../../lib/providers/mailgun';
import { buildEmailSignatureHtml, PUR_SIGNATURE_DEFAULTS } from '../../../lib/email-templates/signature';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, customerId } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const to = (req.query.to ? String(req.query.to) : user.email || '').trim();
  if (!to) return res.status(400).json({ error: 'No recipient — pass ?to=email@example.com' });

  // Pull branding + signature so the test email looks like a production email.
  const admin = getSupabaseServerClient();
  const { data: customer } = customerId
    ? await admin.from('customers').select('business_name, quote_config').eq('id', customerId).maybeSingle()
    : { data: null };
  const branding  = customer?.quote_config?.branding || {};
  const signature = customer?.quote_config?.email_signature || null;
  const businessName = branding.business_name || customer?.business_name || 'BlueWise';
  const primary = branding.primary_color || '#2A2C35';
  const sentLabel = new Date().toLocaleString('fr-CA');
  const signatureHtml = buildEmailSignatureHtml({ branding, signature, defaults: PUR_SIGNATURE_DEFAULTS });

  const env = {
    domain:     process.env.MAILGUN_DOMAIN || null,
    region:     process.env.MAILGUN_REGION || 'us',
    from:       process.env.MAILGUN_FROM || null,
    // Never leak the key; just surface whether it's set and its length for
    // an at-a-glance "did Vercel pick it up" check.
    api_key_set: !!process.env.MAILGUN_API_KEY,
    api_key_len: process.env.MAILGUN_API_KEY ? process.env.MAILGUN_API_KEY.length : 0,
  };

  const subject = `Test Mailgun — ${businessName}`;
  const text = [
    'Ceci est un envoi de test via Mailgun.',
    '',
    `Compagnie: ${businessName}`,
    `Domain: ${env.domain || '(missing MAILGUN_DOMAIN)'}`,
    `Region: ${env.region}`,
    `From:   ${env.from || '(derived from MAILGUN_DOMAIN)'}`,
    `Sent at: ${sentLabel}`,
    '',
    'Si tu reçois ce courriel, le pipeline Mailgun fonctionne.',
  ].join('\n');
  const html = `<!doctype html>
<html lang="fr-CA">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr><td style="padding:28px 32px 20px;background:${primary};color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.01em;">
          ${businessName}
        </td></tr>
        <tr><td style="padding:28px 32px 8px;">
          <div style="display:inline-block;padding:4px 12px;background:#ecfdf5;color:#047857;border:1px solid #10b981;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">
            ✓ Courriel test — Mailgun
          </div>
          <p style="margin:18px 0 14px;font-size:16px;">Bonjour,</p>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:#374151;">
            Ceci confirme que la pipeline <strong>Mailgun</strong> fonctionne.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border-radius:8px;margin:0 0 20px;width:100%;">
            <tr><td style="padding:14px 16px;font-size:12px;color:#6b7280;line-height:1.7;">
              <strong>Domain:</strong> ${env.domain || '(missing)'}<br/>
              <strong>Region:</strong> ${env.region}<br/>
              <strong>From:</strong> ${env.from || '(derived from domain)'}<br/>
              <strong>Envoyé à:</strong> ${sentLabel}
            </td></tr>
          </table>
          ${signatureHtml}
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f9fafb;color:#9ca3af;font-size:11px;text-align:center;border-top:1px solid #e5e7eb;">
          Courriel test — pipeline Mailgun vérifiée.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const sent = await sendEmailMailgun({
    to,
    subject,
    body: text,
    html,
    // from: undefined → provider uses MAILGUN_FROM env default
  });

  return res.status(200).json({
    success: !!sent?.success,
    provider: 'mailgun',
    message_id: sent?.provider_message_id || null,
    error: sent?.error || null,
    raw: sent?.raw || null,
    to,
    env,
  });
}
