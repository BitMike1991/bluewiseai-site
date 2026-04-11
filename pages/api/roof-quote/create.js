import { getSupabaseServerClient } from '../../../lib/supabaseServer';
import crypto from 'crypto';

const TENANT_SLUG = 'bw-demo';

function generateToken(len = 12) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz';
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const client = body.client || {};
    const result = body.result || {};

    if (!client.name || !client.phone) {
      return res.status(400).json({ error: 'client.name and client.phone are required' });
    }
    if (result.total_client_ttc == null || result.surface_sqft == null) {
      return res.status(400).json({ error: 'result.total_client_ttc and result.surface_sqft are required' });
    }

    const supa = getSupabaseServerClient();
    const token = generateToken(12);

    const row = {
      token,
      tenant_slug: TENANT_SLUG,
      customer_id: 1, // BlueWise
      client_name: client.name,
      client_phone: client.phone,
      client_email: client.email || null,
      client_address: client.address || null,
      client_city: client.city || null,
      client_postal: client.postal || null,
      surface_sqft: Number(result.surface_sqft) || 0,
      pitch_category: body.measures?.pitch_category || null,
      shingle_type: body.shingle_type || null,
      total_client_ttc: Number(result.total_client_ttc) || 0,
      net_profit: Number(result.net_profit) || 0,
      net_margin_pct: Number(result.net_margin_pct) || 0,
      payload: body,
      status: 'draft',
    };

    const { data, error } = await supa
      .from('roof_quotes')
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error('roof-quote create error:', error);
      return res.status(500).json({ error: 'Database error', detail: error.message });
    }

    const base = process.env.PUBLIC_SITE_URL || 'https://bluewiseai.com';
    return res.status(200).json({
      success: true,
      token: data.token,
      id: data.id,
      url: `${base}/d/${data.token}`,
      gate_hint: `Derniers 4 chiffres du téléphone de ${client.name}`,
    });
  } catch (err) {
    console.error('roof-quote/create error:', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err.message || err) });
  }
}
