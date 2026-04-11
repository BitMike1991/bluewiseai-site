import { getSupabaseServerClient } from '../../../../lib/supabaseServer';

const TENANT_SLUG = 'bw-demo';

function lastFourDigits(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '').slice(-4);
}

function normalizePhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  if (raw.startsWith('+')) return raw;
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  try {
    const supa = getSupabaseServerClient();
    const { data: quote } = await supa
      .from('roof_quotes')
      .select('*')
      .eq('token', token)
      .eq('tenant_slug', TENANT_SLUG)
      .maybeSingle();

    if (!quote) return res.status(404).json({ error: 'Devis introuvable' });

    const to = normalizePhone(quote.client_phone);
    if (!to) return res.status(400).json({ error: 'Numéro de téléphone client invalide' });

    const TELNYX_KEY = process.env.TELNYX_API_KEY;
    const FROM = process.env.TELNYX_FROM_NUMBER || process.env.BW_SMS_FROM || '+15144184743';
    if (!TELNYX_KEY) return res.status(500).json({ error: 'SMS service not configured' });

    const base = process.env.PUBLIC_SITE_URL || 'https://bluewiseai.com';
    const link = `${base}/d/${token}`;
    const gate = lastFourDigits(quote.client_phone);
    const fmt = new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' });
    const total = fmt.format(Number(quote.total_client_ttc || 0));
    const firstName = (quote.client_name || '').split(' ')[0];

    const text =
      `Bonjour ${firstName}, voici votre devis toiture: ${total}.\n` +
      `${link}\n` +
      `Code d'accès: ${gate} (4 derniers chiffres de votre tel).\n` +
      `BlueWise Roofing`;

    const telnyxRes = await fetch('https://api.telnyx.com/v2/messages', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + TELNYX_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to, text }),
    });

    if (!telnyxRes.ok) {
      const err = await telnyxRes.text();
      console.error('Telnyx error:', telnyxRes.status, err);
      return res.status(500).json({ error: 'Failed to send SMS', detail: err });
    }

    await supa
      .from('roof_quotes')
      .update({
        sms_sent_at: new Date().toISOString(),
        status: quote.status === 'draft' ? 'sent' : quote.status,
      })
      .eq('token', token);

    return res.status(200).json({ success: true, sent_to: to });
  } catch (err) {
    console.error('roof-quote/send-sms error:', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err.message || err) });
  }
}
