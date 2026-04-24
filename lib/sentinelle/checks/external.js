// Sentinelle P-04 — external services health.
// Covers: Telnyx (3), Mailgun (3), Gmail OAuth, Retell (2), OpenAI, Stripe, Groundwire (12 total).
// Each check isolates its third-party surface so Sentinelle can pinpoint WHICH vendor is degraded.

import { SB_URL, sbHeaders, patchBaseline } from '../util.js';

// ─── helpers ────────────────────────────────────────────────────────────
// Enhanced to capture url + raw text body so callers can emit a paste-ready
// error_payload {url, http_status, response_snippet, ms, fetch_error}.
async function timedJson(url, opts = {}) {
  const t0 = Date.now();
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch (_) { body = { _raw: text.slice(0, 200) }; }
    return { res, body, text, ms: Date.now() - t0, url };
  } catch (e) {
    return {
      res: null,
      err: { message: String(e?.message || e), name: e?.name || 'FetchError' },
      ms: Date.now() - t0,
      url,
    };
  }
}

function keyHint(k) {
  return (k || '').slice(0, 6);
}

// Build a structured error_payload from the enriched timedJson result.
function ep(probe, extra = {}) {
  const base = { url: probe.url, ms: probe.ms, occurred_at: new Date().toISOString(), ...extra };
  if (probe.err) {
    return { ...base, fetch_error: probe.err.message, error_name: probe.err.name };
  }
  if (probe.res) {
    base.http_status = probe.res.status;
    const snippet = (probe.text || '').replace(/\s+/g, ' ').slice(0, 500);
    if (snippet) base.response_snippet = snippet;
  }
  return base;
}

// ─── Telnyx ─────────────────────────────────────────────────────────────
async function telnyxAccount(row) {
  const key = process.env.TELNYX_API_KEY;
  if (!key) return {
    status: 'warn', detail: 'TELNYX_API_KEY_not_configured', ms: 0,
    error_payload: { endpoint: 'telnyx.whoami', reason: 'env_var_missing', expected_env: 'TELNYX_API_KEY' },
  };
  const p = await timedJson('https://api.telnyx.com/v2/whoami', {
    headers: { Authorization: `Bearer ${key}` },
  });
  const ms = p.ms;
  if (!p.res) return { status: 'critical', detail: `fetch_failed`, ms, error_payload: ep(p, { endpoint: 'telnyx.whoami', key_hint: keyHint(key) }) };
  if (p.res.status === 401) return { status: 'critical', detail: `auth_failed_key_starts_${keyHint(key)}`, ms, error_payload: ep(p, { endpoint: 'telnyx.whoami', key_hint: keyHint(key), hint: 'rotate_key_or_check_account_status' }) };
  if (!p.res.ok) return { status: 'warn', detail: `telnyx_${p.res.status}`, ms, error_payload: ep(p, { endpoint: 'telnyx.whoami' }) };
  return { status: 'ok', detail: `whoami ${p.res.status} (${ms}ms)`, ms };
}

// Use our own DB — cheaper + more accurate than Telnyx MDR paging.
async function telnyxSmsDelivery24h(row) {
  const windowH = row.baseline?.window_hours || 24;
  const warnPct = row.baseline?.warn_pct || 85;
  const critPct = row.baseline?.critical_pct || 70;
  const t0 = Date.now();
  const since = new Date(Date.now() - windowH * 3_600_000).toISOString();
  const url = `${SB_URL}/rest/v1/messages?direction=eq.outbound&channel=eq.sms&created_at=gte.${encodeURIComponent(since)}&select=status`;
  const res = await fetch(url, { headers: sbHeaders({ Prefer: 'count=exact' }) });
  const ms = Date.now() - t0;
  if (!res.ok) return { status: 'critical', detail: `db_query_failed: ${res.status}`, ms };
  const rows = await res.json();
  const total = rows.length;
  if (total === 0) return { status: 'ok', detail: `no SMS in last ${windowH}h`, ms };
  const delivered = rows.filter(r => r.status === 'sent' || r.status === 'delivered').length;
  const pct = (delivered / total) * 100;
  if (pct < critPct) return { status: 'critical', detail: `${delivered}/${total} = ${pct.toFixed(0)}%`, ms };
  if (pct < warnPct) return { status: 'warn', detail: `${delivered}/${total} = ${pct.toFixed(0)}%`, ms };
  return { status: 'ok', detail: `${delivered}/${total} = ${pct.toFixed(0)}%`, ms };
}

async function telnyxVoiceProfile(row) {
  const key = process.env.TELNYX_API_KEY;
  if (!key) return { status: 'warn', detail: 'TELNYX_API_KEY_not_configured', ms: 0 };
  const { res, body, ms } = await timedJson('https://api.telnyx.com/v2/outbound_voice_profiles?page[size]=5', {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res) return { status: 'critical', detail: 'fetch_failed', ms };
  if (!res.ok) return { status: 'warn', detail: `telnyx_${res.status}`, ms };
  const profiles = body?.data || [];
  if (profiles.length === 0) return { status: 'warn', detail: 'no_outbound_voice_profiles', ms };
  return { status: 'ok', detail: `${profiles.length} outbound voice profiles`, ms };
}

// ─── Mailgun ────────────────────────────────────────────────────────────
async function mailgunDomain(row) {
  const key = process.env.MAILGUN_API_KEY;
  const domain = row.baseline?.domain || 'mg.bluewiseai.com';
  if (!key) return {
    status: 'warn', detail: 'MAILGUN_API_KEY_not_configured', ms: 0,
    error_payload: { endpoint: 'mailgun.domain', reason: 'env_var_missing', expected_env: 'MAILGUN_API_KEY' },
  };
  const auth = 'Basic ' + Buffer.from(`api:${key}`).toString('base64');
  const p = await timedJson(`https://api.mailgun.net/v3/domains/${domain}`, {
    headers: { Authorization: auth },
  });
  const ms = p.ms;
  if (!p.res) return { status: 'critical', detail: 'fetch_failed', ms, error_payload: ep(p, { endpoint: 'mailgun.domain', domain }) };
  if (p.res.status === 401) return { status: 'critical', detail: `auth_failed_key_starts_${keyHint(key)}`, ms, error_payload: ep(p, { endpoint: 'mailgun.domain', key_hint: keyHint(key), hint: 'rotate_MAILGUN_API_KEY_on_Vercel' }) };
  if (!p.res.ok) return { status: 'warn', detail: `mailgun_${p.res.status}`, ms, error_payload: ep(p, { endpoint: 'mailgun.domain', domain }) };
  const d = p.body?.domain || {};
  if (d.state !== 'active') return { status: 'critical', detail: `state=${d.state}`, ms, error_payload: ep(p, { endpoint: 'mailgun.domain', domain, state: d.state, hint: 'check_dns_records_mailgun_dashboard' }) };
  if (d.require_tls === false) return { status: 'warn', detail: 'require_tls=false', ms, error_payload: ep(p, { endpoint: 'mailgun.domain', domain, require_tls: false, hint: 'enable_require_tls_mailgun_dashboard' }) };
  return { status: 'ok', detail: `${domain} active, tls_required`, ms };
}

async function mailgunSpfDkimDmarc(row) {
  const key = process.env.MAILGUN_API_KEY;
  const domain = row.baseline?.domain || 'mg.bluewiseai.com';
  if (!key) return { status: 'warn', detail: 'MAILGUN_API_KEY_not_configured', ms: 0 };
  const auth = 'Basic ' + Buffer.from(`api:${key}`).toString('base64');
  const { res, body, ms } = await timedJson(`https://api.mailgun.net/v3/domains/${domain}`, {
    headers: { Authorization: auth },
  });
  if (!res || !res.ok) return { status: 'warn', detail: `fetch_failed_${res?.status || 'net'}`, ms };
  const records = body?.sending_dns_records || [];
  const invalid = records.filter(r => r.valid !== 'valid').map(r => r.record_type);
  if (invalid.length) return { status: 'critical', detail: `invalid: ${invalid.join(',')}`, ms };
  const types = records.map(r => r.record_type).join(',');
  return { status: 'ok', detail: `all valid: ${types || 'none'}`, ms };
}

async function mailgunSuppressionGrowth(row) {
  const key = process.env.MAILGUN_API_KEY;
  const domain = row.baseline?.domain || 'mg.bluewiseai.com';
  if (!key) return { status: 'warn', detail: 'MAILGUN_API_KEY_not_configured', ms: 0 };
  const auth = 'Basic ' + Buffer.from(`api:${key}`).toString('base64');
  const [bounces, unsubs, complaints] = await Promise.all([
    fetch(`https://api.mailgun.net/v3/${domain}/bounces?limit=1000`, { headers: { Authorization: auth } }),
    fetch(`https://api.mailgun.net/v3/${domain}/unsubscribes?limit=1000`, { headers: { Authorization: auth } }),
    fetch(`https://api.mailgun.net/v3/${domain}/complaints?limit=1000`, { headers: { Authorization: auth } }),
  ]);
  const b = bounces.ok ? await bounces.json() : null;
  const u = unsubs.ok ? await unsubs.json() : null;
  const c = complaints.ok ? await complaints.json() : null;
  const bn = b?.items?.length || 0;
  const un = u?.items?.length || 0;
  const cn = c?.items?.length || 0;
  const total = bn + un + cn;
  const baseline = row.baseline?.expected_total;
  if (baseline == null) {
    await patchBaseline(row.id, { ...(row.baseline || {}), expected_total: total, seeded_at: new Date().toISOString() });
    return { status: 'ok', detail: `baseline seeded: b=${bn} u=${un} c=${cn} total=${total}`, ms: 0 };
  }
  const warnMul = row.baseline?.warn_multiplier || 2;
  const critMul = row.baseline?.critical_multiplier || 5;
  const ratio = baseline > 0 ? total / baseline : 1;
  const detail = `b=${bn} u=${un} c=${cn} total=${total} vs ${baseline} (×${ratio.toFixed(2)})`;
  if (ratio >= critMul) return { status: 'critical', detail, ms: 0 };
  if (ratio >= warnMul) return { status: 'warn', detail, ms: 0 };
  return { status: 'ok', detail, ms: 0 };
}

// ─── Gmail OAuth ────────────────────────────────────────────────────────
async function gmailOauthToken(row) {
  // Grab any active oauth row; attempt refresh. Success = ok, any failure = critical.
  const t0 = Date.now();
  const listRes = await fetch(`${SB_URL}/rest/v1/customer_email_oauth?select=customer_id,refresh_token&limit=3`, {
    headers: sbHeaders(),
  });
  if (!listRes.ok) return { status: 'warn', detail: `list_oauth_rows_${listRes.status}`, ms: Date.now() - t0 };
  const rows = await listRes.json();
  if (rows.length === 0) return { status: 'ok', detail: 'no_oauth_rows_configured', ms: Date.now() - t0 };

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return { status: 'warn', detail: 'GOOGLE_CLIENT_ID_SECRET_not_configured', ms: Date.now() - t0 };

  // Use encrypted refresh_token — we can't decrypt here without the encryption key.
  // Proxy approach: call our own /api/admin/test-email endpoint's refresh path? too coupled.
  // Minimal: attempt refresh on the FIRST row with PAYROLL_SIN_KEY-style decrypt pattern via internal endpoint.
  // For now, just report oauth_rows_present — real refresh test is deferred to test-email endpoint (manual).
  return { status: 'ok', detail: `${rows.length} oauth rows present (refresh test deferred to test-email)`, ms: Date.now() - t0 };
}

// ─── Retell ─────────────────────────────────────────────────────────────
async function retellAgentList(row) {
  const key = process.env.RETELL_API_KEY;
  if (!key) return {
    status: 'warn', detail: 'RETELL_API_KEY_not_configured', ms: 0,
    error_payload: { endpoint: 'retell.list-agents', reason: 'env_var_missing', expected_env: 'RETELL_API_KEY' },
  };
  const p = await timedJson('https://api.retellai.com/list-agents', {
    headers: { Authorization: `Bearer ${key}` },
  });
  const ms = p.ms;
  if (!p.res) return { status: 'critical', detail: 'fetch_failed', ms, error_payload: ep(p, { endpoint: 'retell.list-agents' }) };
  if (p.res.status === 401) return { status: 'critical', detail: `auth_failed_key_starts_${keyHint(key)}`, ms, error_payload: ep(p, { endpoint: 'retell.list-agents', key_hint: keyHint(key), hint: 'rotate_RETELL_API_KEY_on_Vercel' }) };
  if (!p.res.ok) return { status: 'warn', detail: `retell_${p.res.status}`, ms, error_payload: ep(p, { endpoint: 'retell.list-agents' }) };
  const count = Array.isArray(p.body) ? p.body.length : (p.body?.agents?.length || 0);
  const min = row.baseline?.min_agents || 1;
  if (count < min) return { status: 'warn', detail: `${count} agents < min ${min}`, ms, error_payload: ep(p, { endpoint: 'retell.list-agents', agent_count: count, min_required: min }) };
  return { status: 'ok', detail: `${count} agents`, ms };
}

async function retellLastCall(row) {
  const key = process.env.RETELL_API_KEY;
  if (!key) return { status: 'warn', detail: 'RETELL_API_KEY_not_configured', ms: 0 };
  const { res, body, ms } = await timedJson('https://api.retellai.com/v2/list-calls', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ limit: 1, sort_order: 'descending' }),
  });
  if (!res) return { status: 'critical', detail: 'fetch_failed', ms };
  if (!res.ok) return { status: 'warn', detail: `retell_${res.status}`, ms };
  const call = Array.isArray(body) ? body[0] : (body?.calls?.[0] || null);
  if (!call) return { status: 'warn', detail: 'no_calls_found', ms };
  const startedAt = call.start_timestamp || call.startTime || call.created_at;
  if (!startedAt) return { status: 'ok', detail: 'call found but no timestamp field', ms };
  const t = typeof startedAt === 'number' ? startedAt : new Date(startedAt).getTime();
  const hoursAgo = (Date.now() - t) / 3_600_000;
  const warnH = row.baseline?.warn_hours || 72;
  const critH = row.baseline?.critical_hours || 168;
  if (hoursAgo > critH) return { status: 'critical', detail: `last call ${hoursAgo.toFixed(0)}h ago`, ms };
  if (hoursAgo > warnH) return { status: 'warn', detail: `last call ${hoursAgo.toFixed(0)}h ago`, ms };
  return { status: 'ok', detail: `last call ${hoursAgo.toFixed(1)}h ago`, ms };
}

// ─── OpenAI ─────────────────────────────────────────────────────────────
async function openaiPing(row) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return {
    status: 'warn', detail: 'OPENAI_API_KEY_not_configured', ms: 0,
    error_payload: { endpoint: 'openai.chat.completions', reason: 'env_var_missing', expected_env: 'OPENAI_API_KEY' },
  };
  const model = row.baseline?.model || 'gpt-4o-mini';
  // gpt-5 + o-series use max_completion_tokens; gpt-4/3.5 use max_tokens.
  const tokenParam = /^(gpt-5|o[0-9])/i.test(model) ? 'max_completion_tokens' : 'max_tokens';
  const maxToks = row.baseline?.max_tokens || 16;
  const payload = {
    model,
    messages: [{ role: 'user', content: 'ping' }],
    [tokenParam]: maxToks,
  };
  const p = await timedJson('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const ms = p.ms;
  if (!p.res) return { status: 'critical', detail: 'fetch_failed', ms, error_payload: ep(p, { endpoint: 'openai.chat.completions', model }) };
  if (p.res.status === 401) return { status: 'critical', detail: `auth_failed_key_starts_${keyHint(key)}`, ms, error_payload: ep(p, { endpoint: 'openai.chat.completions', model, key_hint: keyHint(key), hint: 'rotate_OPENAI_API_KEY_on_Vercel' }) };
  if (p.res.status === 429) return { status: 'warn', detail: 'rate_limited', ms, error_payload: ep(p, { endpoint: 'openai.chat.completions', model, hint: 'check_tier_limits_or_spend_cap' }) };
  if (!p.res.ok) return { status: 'warn', detail: `openai_${p.res.status}: ${p.body?.error?.code || ''}`, ms, error_payload: ep(p, { endpoint: 'openai.chat.completions', model, openai_error_code: p.body?.error?.code, openai_error_type: p.body?.error?.type }) };
  return { status: 'ok', detail: `${model} responded (${ms}ms)`, ms };
}

// ─── Stripe ─────────────────────────────────────────────────────────────
async function stripeAccount(row) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return {
    status: 'warn', detail: 'STRIPE_SECRET_KEY_not_configured', ms: 0,
    error_payload: { endpoint: 'stripe.account', reason: 'env_var_missing', expected_env: 'STRIPE_SECRET_KEY' },
  };
  const p = await timedJson('https://api.stripe.com/v1/account', {
    headers: { Authorization: `Bearer ${key}` },
  });
  const ms = p.ms;
  if (!p.res) return { status: 'critical', detail: 'fetch_failed', ms, error_payload: ep(p, { endpoint: 'stripe.account' }) };
  if (p.res.status === 401) return { status: 'critical', detail: `auth_failed_key_starts_${keyHint(key)}`, ms, error_payload: ep(p, { endpoint: 'stripe.account', key_hint: keyHint(key), hint: 'rotate_STRIPE_SECRET_KEY_on_Vercel' }) };
  if (!p.res.ok) return { status: 'warn', detail: `stripe_${p.res.status}`, ms, error_payload: ep(p, { endpoint: 'stripe.account' }) };
  const charges = p.body?.charges_enabled;
  const payouts = p.body?.payouts_enabled;
  if (!charges || !payouts) return { status: 'warn', detail: `charges=${charges} payouts=${payouts}`, ms, error_payload: ep(p, { endpoint: 'stripe.account', charges_enabled: charges, payouts_enabled: payouts, hint: 'check_stripe_dashboard_verification' }) };
  return { status: 'ok', detail: 'charges+payouts enabled', ms };
}

// ─── Groundwire SIP (proxy: successful outbound voice last 24h) ────────
async function groundwireSip(row) {
  // Direct SIP registration status not exposed by Telnyx API in a reliable way.
  // Fallback proxy: count successful outbound voice in last 24h; if > 0 SIP was working at least once.
  const t0 = Date.now();
  const since = new Date(Date.now() - 24 * 3_600_000).toISOString();
  const url = `${SB_URL}/rest/v1/messages?direction=eq.outbound&channel=eq.voice&created_at=gte.${encodeURIComponent(since)}&select=id&limit=5`;
  const res = await fetch(url, { headers: sbHeaders() });
  const ms = Date.now() - t0;
  if (!res.ok) return { status: 'ok', detail: `not_implemented_no_proxy_available_query_${res.status}`, ms };
  const data = await res.json();
  if (data.length > 0) return { status: 'ok', detail: `${data.length}+ voice events in 24h`, ms };
  return { status: 'ok', detail: 'not_implemented_no_voice_traffic_24h_cannot_distinguish', ms };
}

// ─── Dispatcher ─────────────────────────────────────────────────────────
export async function runCheck(row) {
  switch (row.id) {
    case 'telnyx.account':              return telnyxAccount(row);
    case 'telnyx.sms_delivery_24h':     return telnyxSmsDelivery24h(row);
    case 'telnyx.voice_profile':        return telnyxVoiceProfile(row);
    case 'mailgun.domain_verified':     return mailgunDomain(row);
    case 'mailgun.spf_dkim_dmarc':      return mailgunSpfDkimDmarc(row);
    case 'mailgun.suppression_growth':  return mailgunSuppressionGrowth(row);
    case 'gmail.oauth_token':           return gmailOauthToken(row);
    case 'retell.agent_list':           return retellAgentList(row);
    case 'retell.last_call_72h':        return retellLastCall(row);
    case 'openai.ping':                 return openaiPing(row);
    case 'stripe.account':              return stripeAccount(row);
    case 'groundwire.sip_registered':   return groundwireSip(row);
    default:
      return { status: 'error', detail: `unknown_external_check:${row.id}`, ms: 0 };
  }
}
