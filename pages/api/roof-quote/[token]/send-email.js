import { getSupabaseServerClient } from '../../../../lib/supabaseServer';

const TENANT_SLUG = 'bw-demo';

function lastFourDigits(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '').slice(-4);
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
    if (!quote.client_email) return res.status(400).json({ error: 'Client email manquant' });

    const MAILGUN_KEY = process.env.MAILGUN_API_KEY;
    const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'mg.bluewiseai.com';
    if (!MAILGUN_KEY) return res.status(500).json({ error: 'Email service not configured' });

    const base = process.env.PUBLIC_SITE_URL || 'https://bluewiseai.com';
    const link = `${base}/d/${token}`;
    const gate = lastFourDigits(quote.client_phone);
    const fmt = new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' });
    const total = fmt.format(Number(quote.total_client_ttc || 0));
    const firstName = (quote.client_name || '').split(' ')[0];

    const subject = `Votre devis toiture — ${total}`;
    const text = [
      `Bonjour ${firstName},`,
      '',
      `Voici votre devis personnalisé pour le projet de toiture${quote.client_address ? ` à ${quote.client_address}` : ''}.`,
      '',
      `Total : ${total} (toutes taxes incluses)`,
      `Surface : ${quote.surface_sqft} pi²`,
      '',
      `Lien sécurisé : ${link}`,
      `Code d'accès : les 4 derniers chiffres de votre téléphone (${gate}).`,
      '',
      'Le devis est valide 60 jours.',
      '',
      'BlueWise Roofing',
      'bluewiseai.com',
    ].join('\n');

    const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Devis toiture</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F5F7F4;color:#2A2C35;margin:0;padding:24px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:#2A2C35;color:#fff;padding:28px 32px;">
    <div style="font-family:monospace;font-size:11px;letter-spacing:0.2em;opacity:0.7;">BLUEWISE ROOFING</div>
    <h1 style="font-family:monospace;font-size:22px;margin:8px 0 0;font-weight:700;">Votre devis toiture</h1>
  </div>
  <div style="padding:32px;">
    <p style="margin:0 0 16px;">Bonjour <strong>${firstName}</strong>,</p>
    <p style="margin:0 0 16px;">Voici votre devis personnalisé pour le projet de toiture${quote.client_address ? ` à ${quote.client_address}` : ''}.</p>
    <div style="background:#E9EFE7;border-left:4px solid #2A2C35;padding:18px 22px;margin:20px 0;border-radius:4px;">
      <div style="font-family:monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;opacity:0.55;">Total toutes taxes incluses</div>
      <div style="font-family:monospace;font-size:28px;font-weight:700;margin-top:4px;">${total}</div>
      <div style="font-size:12px;opacity:0.75;margin-top:4px;">${quote.surface_sqft} pi²</div>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${link}" style="display:inline-block;background:#2A2C35;color:#fff;padding:14px 32px;text-decoration:none;font-family:monospace;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;border-radius:4px;">Voir le devis complet</a>
    </div>
    <div style="background:#F5F7F4;padding:14px 18px;border-radius:4px;font-size:13px;">
      <strong>Code d'accès :</strong> les 4 derniers chiffres de votre téléphone (<strong>${gate}</strong>).
    </div>
    <p style="margin:24px 0 0;font-size:13px;opacity:0.8;">Le devis est valide 60 jours.</p>
  </div>
  <div style="background:#F5F7F4;padding:18px 32px;font-size:11px;color:#6b7280;border-top:1px solid #e5e7eb;">
    BlueWise Roofing · bluewiseai.com
  </div>
</div>
</body>
</html>`;

    const form = new URLSearchParams();
    form.append('from', `BlueWise Roofing <devis@${MAILGUN_DOMAIN}>`);
    form.append('to', quote.client_email);
    form.append('subject', subject);
    form.append('text', text);
    form.append('html', html);

    const auth = Buffer.from('api:' + MAILGUN_KEY.trim()).toString('base64');
    const mgRes = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });

    if (!mgRes.ok) {
      const err = await mgRes.text();
      console.error('Mailgun error:', mgRes.status, err);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    await supa
      .from('roof_quotes')
      .update({
        email_sent_at: new Date().toISOString(),
        status: quote.status === 'draft' ? 'sent' : quote.status,
      })
      .eq('token', token);

    return res.status(200).json({ success: true, sent_to: quote.client_email });
  } catch (err) {
    console.error('roof-quote/send-email error:', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err.message || err) });
  }
}
