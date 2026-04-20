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

  const businessName =
    customer?.quote_config?.branding?.business_name
    || customer?.business_name
    || 'BlueWise';

  const from = `${businessName} <${row.email_address}>`;
  const subject = `Test Gmail OAuth — ${new Date().toISOString()}`;
  const text = [
    'Ceci est un envoi de test via Gmail OAuth.',
    '',
    `Customer ID: ${customerId}`,
    `From (OAuth account): ${row.email_address}`,
    `Sent at: ${new Date().toISOString()}`,
    '',
    'Si tu reçois ce courriel, la pipeline Gmail fonctionne de bout en bout.',
  ].join('\n');
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;padding:24px;color:#111827;">
      <h2 style="margin:0 0 12px;font-size:18px;">Gmail OAuth — test d'envoi</h2>
      <p style="font-size:14px;line-height:1.55;color:#374151;">
        Ceci est un envoi de test via la pipeline Gmail OAuth de BlueWise.
      </p>
      <ul style="font-size:13px;color:#374151;line-height:1.8;">
        <li><strong>Customer&nbsp;ID:</strong> ${customerId}</li>
        <li><strong>From:</strong> ${row.email_address}</li>
        <li><strong>Envoyé à:</strong> ${new Date().toLocaleString('fr-CA')}</li>
      </ul>
      <p style="font-size:13px;color:#10b981;margin-top:16px;">
        ✓ Si tu lis ce message, le pipeline marche de bout en bout.
      </p>
    </div>`;

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
