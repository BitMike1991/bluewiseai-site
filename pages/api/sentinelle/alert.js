// Sentinelle P-08 — alert router entry point.
// Accepts one state_change at a time from the n8n Sentinelle Runner, enforces dedupe +
// digest logic, writes the decision to system_health_alerts, and forwards to the
// n8n "Sentinelle Alert Router" webhook which does the actual fan-out (email + SMS).
//
// Contract:
//   POST /api/sentinelle/alert
//   Authorization: Bearer SENTINELLE_SECRET
//   Body: { check_id, from, to, detail, criticality }
//   → 200 { alert_id, forwarded: boolean, deduped?: boolean, digest?: boolean, channels: [...] }
//
// Never calls Telnyx/Mailgun directly — all channel logic lives in n8n for forensic UI
// per SENTINELLE-CHAIN.md P-08 constraint.

const SB_URL = process.env.SUPABASE_URL || 'https://xwhqkgsurssixjadzklb.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const N8N_WEBHOOK = process.env.N8N_ALERT_WEBHOOK_URL ||
  'https://automation.bluewiseai.com/webhook/sentinelle-alert';

const SEV = { ok: 0, warn: 1, error: 2, critical: 3 };

function sbHeaders(extra = {}) {
  return {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

function channelsFor({ to, criticality }) {
  // Recovery messages always go out via email only (low-priority confirmation).
  if (to === 'ok') return ['email'];
  // Failing states escalate by criticality: low/med = email; high = sms+email; critical/error = sms+email+voice
  if (criticality === 'critical') return ['sms', 'email', 'voice'];
  if (criticality === 'high')     return ['sms', 'email'];
  return ['email'];
}

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

  const { check_id, from = null, to, detail = '', criticality } = req.body || {};
  if (!check_id || !to) {
    return res.status(400).json({ error: 'missing_fields', required: ['check_id', 'to'] });
  }

  // Load the check row for name + current criticality fallback
  const checkRes = await fetch(
    `${SB_URL}/rest/v1/system_health_checks?id=eq.${encodeURIComponent(check_id)}&select=id,name,criticality&limit=1`,
    { headers: sbHeaders() },
  );
  if (!checkRes.ok) {
    return res.status(500).json({ error: 'check_lookup_failed', status: checkRes.status });
  }
  const checkRows = await checkRes.json();
  if (checkRows.length === 0) return res.status(404).json({ error: 'unknown_check_id', check_id });
  const check = checkRows[0];
  const effectiveCriticality = criticality || check.criticality || 'medium';

  // Dedupe: same check_id alerted in the last 60 min at a severity >= incoming? Skip.
  // Recovery (to='ok') always forwards.
  let deduped = false;
  if (to !== 'ok') {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const dedupeRes = await fetch(
      `${SB_URL}/rest/v1/system_health_alerts?check_id=eq.${encodeURIComponent(check_id)}&created_at=gte.${encodeURIComponent(since)}&select=id,to_status&order=created_at.desc&limit=1`,
      { headers: sbHeaders() },
    );
    if (dedupeRes.ok) {
      const prior = await dedupeRes.json();
      if (prior.length > 0 && (SEV[to] ?? 0) <= (SEV[prior[0].to_status] ?? 0)) {
        deduped = true;
      }
    }
  }

  if (deduped) {
    return res.status(200).json({ deduped: true, check_id, to });
  }

  // Digest: if ≥ 3 non-ok state changes in the last 5 min across any check, mark this alert as
  // part of a digest so the Router can group notifications instead of spamming.
  const digestSince = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const digestRes = await fetch(
    `${SB_URL}/rest/v1/system_health_events?state_changed=eq.true&status=in.(warn,critical,error)&created_at=gte.${encodeURIComponent(digestSince)}&select=check_id,status,detail,created_at&order=created_at.desc&limit=10`,
    { headers: sbHeaders() },
  );
  const recent = digestRes.ok ? await digestRes.json() : [];
  const digest = recent.length >= 3;

  const channels = channelsFor({ to, criticality: effectiveCriticality });

  // Insert alert row
  const insertRes = await fetch(`${SB_URL}/rest/v1/system_health_alerts?select=id`, {
    method: 'POST',
    headers: sbHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify([{
      check_id,
      from_status: from,
      to_status: to,
      criticality: effectiveCriticality,
      detail: detail.slice(0, 1000),
      channels,
      digest,
      digest_items: digest ? recent : null,
    }]),
  });
  if (!insertRes.ok) {
    return res.status(500).json({ error: 'alert_insert_failed', status: insertRes.status, detail: await insertRes.text() });
  }
  const [row] = await insertRes.json();
  const alert_id = row.id;

  // Critical → queue a 30-min voice escalation (drained by separate poll workflow).
  if (to === 'critical' && channels.includes('voice')) {
    await fetch(`${SB_URL}/rest/v1/system_health_escalations`, {
      method: 'POST',
      headers: sbHeaders({ Prefer: 'return=minimal' }),
      body: JSON.stringify([{
        check_id,
        alert_id,
        escalate_after: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        status: 'pending',
      }]),
    }).catch(() => { /* non-fatal — escalation is secondary */ });
  }

  // Forward to n8n router webhook
  const forwardPayload = {
    alert_id,
    check_id,
    check_name: check.name,
    from_status: from,
    to_status: to,
    criticality: effectiveCriticality,
    detail: detail.slice(0, 1000),
    channels,
    digest,
    digest_items: digest ? recent.slice(0, 10) : null,
    dashboard_url: `https://www.bluewiseai.com/platform/sentinelle?check=${encodeURIComponent(check_id)}`,
  };

  let forwarded = false;
  let n8nStatus = null;
  try {
    const fwd = await fetch(N8N_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentinelle-Secret': secret,
      },
      body: JSON.stringify(forwardPayload),
    });
    n8nStatus = fwd.status;
    forwarded = fwd.ok;
  } catch (e) {
    n8nStatus = 599;
  }

  // Patch alert row with forward metadata (non-blocking on failure)
  fetch(`${SB_URL}/rest/v1/system_health_alerts?id=eq.${alert_id}`, {
    method: 'PATCH',
    headers: sbHeaders({ Prefer: 'return=minimal' }),
    body: JSON.stringify({ forwarded_at: new Date().toISOString(), n8n_status: n8nStatus }),
  }).catch(() => {});

  return res.status(200).json({
    alert_id,
    forwarded,
    deduped: false,
    digest,
    channels,
    n8n_status: n8nStatus,
  });
}
