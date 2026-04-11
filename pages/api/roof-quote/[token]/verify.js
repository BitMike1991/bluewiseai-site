import { getSupabaseServerClient } from '../../../../lib/supabaseServer';

const TENANT_SLUG = 'bw-demo';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 60 * 1000;

function lastFourDigits(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '').slice(-4);
}

async function notifySlack(quote) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;
  try {
    const fmt = new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' });
    const total = fmt.format(Number(quote.total_client_ttc || 0));
    const base = process.env.PUBLIC_SITE_URL || 'https://bluewiseai.com';
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `:eyes: Devis BW Roofing consulté — *${quote.client_name}*`,
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: 'Devis BlueWise Roofing consulté' } },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Client*\n${quote.client_name}` },
              { type: 'mrkdwn', text: `*Total*\n${total}` },
              { type: 'mrkdwn', text: `*Surface*\n${quote.surface_sqft} pi²` },
              { type: 'mrkdwn', text: `*Téléphone*\n${quote.client_phone || '—'}` },
            ],
          },
          {
            type: 'actions',
            elements: [
              { type: 'button', text: { type: 'plain_text', text: 'Voir le devis' }, url: `${base}/d/${quote.token}` },
            ],
          },
        ],
      }),
    });
  } catch (err) {
    console.error('Slack notify failed:', err);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token } = req.query;
  const { code } = req.body || {};

  if (!token || typeof token !== 'string') return res.status(400).json({ error: 'Missing token' });
  if (!code || !/^\d{4}$/.test(code)) return res.status(400).json({ error: 'Code doit être 4 chiffres' });

  try {
    const supa = getSupabaseServerClient();
    const { data: quote, error: selErr } = await supa
      .from('roof_quotes')
      .select('*')
      .eq('token', token)
      .eq('tenant_slug', TENANT_SLUG)
      .maybeSingle();

    if (selErr) {
      console.error('verify select error:', selErr);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!quote) return res.status(404).json({ error: 'Devis introuvable' });
    if (quote.status === 'expired' || new Date(quote.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Devis expiré' });
    }

    const now = Date.now();
    const lastAttempt = quote.last_gate_attempt_at ? new Date(quote.last_gate_attempt_at).getTime() : 0;
    const inLockoutWindow = now - lastAttempt < LOCKOUT_MS;
    if (quote.gate_attempts >= MAX_ATTEMPTS && inLockoutWindow) {
      return res.status(429).json({ error: 'Trop de tentatives. Réessayer dans 1h.' });
    }

    const expected = lastFourDigits(quote.client_phone);
    if (code !== expected) {
      const attempts = (inLockoutWindow ? quote.gate_attempts : 0) + 1;
      await supa
        .from('roof_quotes')
        .update({
          gate_attempts: attempts,
          last_gate_attempt_at: new Date().toISOString(),
        })
        .eq('token', token);
      return res.status(401).json({
        error: 'Code incorrect',
        attempts_remaining: Math.max(0, MAX_ATTEMPTS - attempts),
      });
    }

    const firstView = !quote.first_viewed_at;
    const patch = {
      status: quote.status === 'draft' ? 'viewed' : quote.status,
      view_count: (quote.view_count || 0) + 1,
      last_viewed_at: new Date().toISOString(),
      gate_attempts: 0,
    };
    if (firstView) patch.first_viewed_at = patch.last_viewed_at;

    const { data: updated } = await supa
      .from('roof_quotes')
      .update(patch)
      .eq('token', token)
      .select()
      .single();

    if (firstView && !quote.slack_notified_at) {
      await notifySlack(quote);
      await supa
        .from('roof_quotes')
        .update({ slack_notified_at: new Date().toISOString() })
        .eq('token', token);
    }

    return res.status(200).json({
      success: true,
      quote: {
        token: updated.token,
        client: {
          name: updated.client_name,
          phone: updated.client_phone,
          email: updated.client_email,
          address: updated.client_address,
          city: updated.client_city,
          postal: updated.client_postal,
        },
        surface_sqft: updated.surface_sqft,
        pitch_category: updated.pitch_category,
        shingle_type: updated.shingle_type,
        total_client_ttc: updated.total_client_ttc,
        payload: updated.payload,
        status: updated.status,
        created_at: updated.created_at,
        expires_at: updated.expires_at,
      },
    });
  } catch (err) {
    console.error('roof-quote/verify error:', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err.message || err) });
  }
}
