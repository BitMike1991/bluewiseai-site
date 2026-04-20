// pages/api/settings/gmail-send-test.js
// Sends a real test email through the customer's Gmail OAuth pipeline.
//
// GET  /api/settings/gmail-send-test               → sends to the authed user's email
// GET  /api/settings/gmail-send-test?to=foo@bar    → sends to an arbitrary address
//
// Response: { success, provider, message_id?, error?, from?, to? }
// This path is a direct probe of the Gmail path only (no Mailgun fallback) so a
// failure here isolates Gmail problems cleanly.

import { getAuthContext, getSupabaseServerClient } from '../../../lib/supabaseServer';
import { encryptToken } from '../../../lib/tokenEncryption';
import { sendEmailGmail } from '../../../lib/providers/gmail';
import { buildEmailSignatureHtml, PUR_SIGNATURE_DEFAULTS } from '../../../lib/email-templates/signature';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, customerId } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });

  const to = (req.query.to ? String(req.query.to) : user.email || '').trim();
  if (!to) return res.status(400).json({ error: 'No recipient — pass ?to=email@example.com' });

  const admin = getSupabaseServerClient();

  // Load the active Gmail OAuth row for this customer
  const { data: row } = await admin
    .from('customer_email_oauth')
    .select('id, provider, email_address, status, access_token, refresh_token, token_expiry')
    .eq('customer_id', customerId)
    .eq('provider', 'gmail')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row?.email_address) {
    return res.status(200).json({
      success: false,
      error: 'no_active_gmail_oauth',
      customer_id: customerId,
    });
  }

  // Load branding for a recognizable From
  const { data: customer } = await admin
    .from('customers')
    .select('business_name, quote_config')
    .eq('id', customerId)
    .maybeSingle();

  const branding = customer?.quote_config?.branding || {};
  const signature = customer?.quote_config?.email_signature || null;
  const businessName = branding.business_name || customer?.business_name || 'BlueWise';
  const primary = branding.primary_color || '#2A2C35';

  const from = `${businessName} <${row.email_address}>`;
  const subject = `Test d'envoi — ${businessName}`;
  const sentLabel = new Date().toLocaleString('fr-CA');
  const text = [
    'Ceci est un envoi de test via Gmail OAuth.',
    '',
    `Compagnie: ${businessName}`,
    `Customer ID: ${customerId}`,
    `From: ${row.email_address}`,
    `Envoyé à: ${sentLabel}`,
    '',
    'Si tu reçois ce courriel, la pipeline Gmail fonctionne de bout en bout.',
  ].join('\n');
  const signatureHtml = buildEmailSignatureHtml({
    branding,
    signature,
    defaults: PUR_SIGNATURE_DEFAULTS,
  });
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
            ✓ Courriel test
          </div>
          <p style="margin:18px 0 14px;font-size:16px;">Bonjour,</p>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:#374151;">
            Ceci confirme que la pipeline Gmail OAuth de <strong>${businessName}</strong> fonctionne de bout en bout. Les emails envoyés depuis la plateforme vont arriver aux clients avec ce même rendu.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border-radius:8px;margin:0 0 20px;width:100%;">
            <tr><td style="padding:14px 16px;font-size:12px;color:#6b7280;line-height:1.7;">
              <strong>De:</strong> ${row.email_address}<br/>
              <strong>Envoyé à:</strong> ${sentLabel}<br/>
              <strong>Customer ID:</strong> ${customerId}
            </td></tr>
          </table>
          ${signatureHtml}
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f9fafb;color:#9ca3af;font-size:11px;text-align:center;border-top:1px solid #e5e7eb;">
          Courriel test — pipeline Gmail OAuth vérifiée.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const sent = await sendEmailGmail(
    { to, from, subject, body: text, html },
    row,
    async (newAccessToken, newExpiry) => {
      try {
        await admin
          .from('customer_email_oauth')
          .update({
            access_token: encryptToken(newAccessToken),
            token_expiry: newExpiry,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);
      } catch (e) {
        console.warn('[gmail-send-test] persist refresh failed', e?.message);
      }
    }
  );

  return res.status(200).json({
    success: !!sent?.success,
    provider: 'gmail',
    message_id: sent?.provider_message_id || null,
    error: sent?.error || null,
    from,
    to,
    customer_id: customerId,
  });
}
