// pages/api/settings/mailgun-send-test.js
// Sends a real test email through Mailgun and returns the verbatim provider
// response so "401 / stale API key / wrong domain / wrong region" is a single
// diagnostic hit away. Isolates Mailgun from the Gmail fallback chain.
//
// GET  /api/settings/mailgun-send-test               → sends to the authed user's email
// GET  /api/settings/mailgun-send-test?to=foo@bar    → sends to an arbitrary address
//
// Response: { success, provider, message_id?, error?, raw?, env: {domain, region, from, api_key_len} }

import { getAuthContext } from '../../../lib/supabaseServer';
import { sendEmailMailgun } from '../../../lib/providers/mailgun';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const to = (req.query.to ? String(req.query.to) : user.email || '').trim();
  if (!to) return res.status(400).json({ error: 'No recipient — pass ?to=email@example.com' });

  const env = {
    domain:     process.env.MAILGUN_DOMAIN || null,
    region:     process.env.MAILGUN_REGION || 'us',
    from:       process.env.MAILGUN_FROM || null,
    // Never leak the key; just surface whether it's set and its length for
    // an at-a-glance "did Vercel pick it up" check.
    api_key_set: !!process.env.MAILGUN_API_KEY,
    api_key_len: process.env.MAILGUN_API_KEY ? process.env.MAILGUN_API_KEY.length : 0,
  };

  const subject = `Test Mailgun — ${new Date().toISOString()}`;
  const text = [
    'Ceci est un envoi de test via Mailgun.',
    '',
    `Domain: ${env.domain || '(missing MAILGUN_DOMAIN)'}`,
    `Region: ${env.region}`,
    `From:   ${env.from || '(derived from MAILGUN_DOMAIN)'}`,
    `Sent at: ${new Date().toISOString()}`,
    '',
    'Si tu reçois ce courriel, le pipeline Mailgun fonctionne.',
  ].join('\n');
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;padding:24px;color:#111827;">
      <h2 style="margin:0 0 12px;font-size:18px;">Mailgun — test d'envoi</h2>
      <p style="font-size:14px;line-height:1.55;color:#374151;">
        Ceci est un envoi de test via la pipeline Mailgun de BlueWise.
      </p>
      <ul style="font-size:13px;color:#374151;line-height:1.8;">
        <li><strong>Domain:</strong> ${env.domain || '(missing)'}</li>
        <li><strong>Region:</strong> ${env.region}</li>
        <li><strong>From:</strong> ${env.from || '(derived from domain)'}</li>
        <li><strong>Envoyé à:</strong> ${new Date().toLocaleString('fr-CA')}</li>
      </ul>
      <p style="font-size:13px;color:#10b981;margin-top:16px;">
        ✓ Si tu lis ce message, le pipeline Mailgun fonctionne.
      </p>
    </div>`;

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
