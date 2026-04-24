// Sentinelle P-08x — raw error feed for fast debugging.
// GET /api/sentinelle/errors?limit=20&status=critical,warn,error&since=<iso>
// Authorization: Bearer SENTINELLE_SECRET
//
// Returns a copy-pasteable JSON array of the most recent non-ok events with their
// error_payload plus check metadata. The response is designed to be pasted into a
// JARVIS conversation and acted on immediately.
//
// Response shape:
//   {
//     generated_at, count,
//     events: [
//       { check_id, check_name, criticality, status, detail, ms, created_at,
//         error_payload, paste_block }
//     ]
//   }

const SB_URL = process.env.SUPABASE_URL || 'https://xwhqkgsurssixjadzklb.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function sbHeaders(extra = {}) {
  return {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

function buildPasteBlock({ check_id, check_name, criticality, status, detail, ms, created_at, error_payload }) {
  const lines = [];
  lines.push('```');
  lines.push(`[Sentinelle ${(status || '?').toUpperCase()}] ${check_name || check_id}`);
  lines.push(`check_id: ${check_id}`);
  lines.push(`criticality: ${criticality}`);
  lines.push(`status: ${status}`);
  lines.push(`detail: ${String(detail || '').slice(0, 300)}`);
  lines.push(`ms: ${ms ?? '?'}`);
  lines.push(`occurred: ${created_at}`);
  if (error_payload && typeof error_payload === 'object') {
    lines.push('');
    lines.push('diagnostic:');
    for (const [k, v] of Object.entries(error_payload)) {
      if (v == null) continue;
      const val = typeof v === 'object' ? JSON.stringify(v) : String(v);
      lines.push(`  ${k}: ${val.length > 400 ? val.slice(0, 400) + '…' : val}`);
    }
  }
  lines.push('```');
  return lines.join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  const secret = process.env.SENTINELLE_SECRET;
  if (!secret) return res.status(500).json({ error: 'sentinelle_secret_not_configured' });
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token || token !== secret) return res.status(401).json({ error: 'unauthorized' });

  const limit = Math.min(Number(req.query.limit) || 20, 200);
  const statusList = String(req.query.status || 'warn,critical,error')
    .split(',').map(s => s.trim()).filter(Boolean);
  const since = req.query.since
    ? new Date(req.query.since).toISOString()
    : new Date(Date.now() - 24 * 3_600_000).toISOString();

  const eventsUrl = `${SB_URL}/rest/v1/system_health_events?status=in.(${statusList.map(encodeURIComponent).join(',')})&created_at=gte.${encodeURIComponent(since)}&select=check_id,status,detail,ms,error_payload,created_at&order=created_at.desc&limit=${limit}`;
  const evtRes = await fetch(eventsUrl, { headers: sbHeaders() });
  if (!evtRes.ok) {
    return res.status(500).json({ error: 'events_query_failed', status: evtRes.status, detail: await evtRes.text() });
  }
  const events = await evtRes.json();

  // Batch-load check metadata for the unique check_ids in the result
  const uniqueIds = [...new Set(events.map(e => e.check_id))];
  let checksById = new Map();
  if (uniqueIds.length > 0) {
    const checkUrl = `${SB_URL}/rest/v1/system_health_checks?id=in.(${uniqueIds.map(encodeURIComponent).join(',')})&select=id,name,category,criticality`;
    const chkRes = await fetch(checkUrl, { headers: sbHeaders() });
    if (chkRes.ok) {
      checksById = new Map((await chkRes.json()).map(c => [c.id, c]));
    }
  }

  const enriched = events.map(e => {
    const c = checksById.get(e.check_id) || {};
    const row = {
      check_id: e.check_id,
      check_name: c.name || e.check_id,
      category: c.category,
      criticality: c.criticality,
      status: e.status,
      detail: e.detail,
      ms: e.ms,
      created_at: e.created_at,
      error_payload: e.error_payload,
    };
    row.paste_block = buildPasteBlock(row);
    return row;
  });

  return res.status(200).json({
    generated_at: new Date().toISOString(),
    window_since: since,
    count: enriched.length,
    statuses: statusList,
    events: enriched,
  });
}
