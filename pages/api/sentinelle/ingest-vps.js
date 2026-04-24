// Sentinelle P-03 — VPS sidecar ingestion endpoint.
// POST only, Bearer auth with SENTINELLE_SECRET. Inserts one row into system_health_vps_pings.
// Sidecar script `/root/scripts/sentinelle/vps-sidecar.sh` pings this every 60s with pm2/disk/RAM/backup snapshot.

const SB_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xwhqkgsurssixjadzklb.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const secret = process.env.SENTINELLE_SECRET;
  if (!secret) return res.status(500).json({ error: 'sentinelle_secret_not_configured' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token || token !== secret) return res.status(401).json({ error: 'unauthorized' });

  const body = req.body || {};
  if (!body.host || !body.collected_at || !body.payload) {
    return res.status(400).json({ error: 'missing_fields', required: ['host', 'collected_at', 'payload'] });
  }

  try {
    const insertRes = await fetch(`${SB_URL}/rest/v1/system_health_vps_pings`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        host: String(body.host).slice(0, 128),
        collected_at: body.collected_at,
        payload: body.payload,
      }),
    });
    if (!insertRes.ok) {
      return res.status(500).json({ error: 'insert_failed', status: insertRes.status, detail: await insertRes.text() });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'internal', message: String(e?.message || e) });
  }
}
