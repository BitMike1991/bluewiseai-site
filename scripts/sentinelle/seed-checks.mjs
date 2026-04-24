#!/usr/bin/env node
/**
 * Sentinelle seed — idempotent registry of every check the system watches.
 * Run anytime: `node scripts/sentinelle/seed-checks.mjs` — uses ON CONFLICT (id) DO UPDATE.
 *
 * Env required:
 *   SUPABASE_URL                 (default: https://xwhqkgsurssixjadzklb.supabase.co)
 *   SUPABASE_SERVICE_ROLE_KEY    (required)
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xwhqkgsurssixjadzklb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY env var required');
  process.exit(1);
}

const FAST = 300, MED = 900, SLOW = 3600;

// Baseline rationale lives here. Modify here, re-run script — idempotent.
const CHECKS = [
  // ============ n8n (10) ============
  { id: 'n8n.active_count', name: 'n8n — active workflow count', category: 'n8n', criticality: 'high', interval_sec: FAST,
    baseline: { expected: 39, warn_delta: 1, critical_delta: 3, note: 'baseline seeded 2026-04-22' } },
  { id: 'n8n.error_rate_15m', name: 'n8n — execution error rate 15min', category: 'n8n', criticality: 'high', interval_sec: FAST,
    baseline: { window_min: 15, warn_pct: 10, critical_pct: 25 } },
  { id: 'n8n.webhook.universal-inbound', name: 'n8n webhook — universal-inbound', category: 'n8n', criticality: 'critical', interval_sec: FAST,
    baseline: { path: 'universal-inbound', timeout_ms: 5000, ok_codes: [200, 400, 403, 405] } },
  { id: 'n8n.webhook.retell-tools', name: 'n8n webhook — retell-tools', category: 'n8n', criticality: 'critical', interval_sec: FAST,
    baseline: { path: 'retell-tools', timeout_ms: 5000, ok_codes: [200, 400, 403, 405] } },
  { id: 'n8n.webhook.retell-post-call', name: 'n8n webhook — retell-post-call', category: 'n8n', criticality: 'critical', interval_sec: FAST,
    baseline: { path: 'retell-post-call', timeout_ms: 5000, ok_codes: [200, 400, 403, 405] } },
  { id: 'n8n.webhook.retell-inbound-webhook', name: 'n8n webhook — retell-inbound-webhook', category: 'n8n', criticality: 'critical', interval_sec: FAST,
    baseline: { path: 'retell-inbound-webhook', timeout_ms: 5000, ok_codes: [200, 400, 403, 405] } },
  { id: 'n8n.webhook.telnyx-master-voice-router-bw', name: 'n8n webhook — telnyx-master-voice-router-bw', category: 'n8n', criticality: 'critical', interval_sec: FAST,
    baseline: { path: 'telnyx-master-voice-router-bw', timeout_ms: 5000, ok_codes: [200, 400, 403, 405] } },
  { id: 'n8n.webhook.bluewise-facebook-leads', name: 'n8n webhook — bluewise-facebook-leads', category: 'n8n', criticality: 'critical', interval_sec: FAST,
    baseline: { path: 'bluewise-facebook-leads', timeout_ms: 5000, ok_codes: [200, 400, 403, 405] } },
  { id: 'n8n.pm2_running', name: 'n8n — pm2 process alive (VPS ping)', category: 'n8n', criticality: 'critical', interval_sec: FAST,
    baseline: { via: 'vps_ping', max_ping_age_sec: 180 } },
  { id: 'n8n.sqlite_backups_fresh', name: 'n8n — SQLite backup fresh (VPS ping)', category: 'n8n', criticality: 'low', interval_sec: SLOW,
    baseline: { via: 'vps_ping', max_age_hours: 48 } },

  // ============ api (8) ============
  { id: 'api.health', name: 'Next.js — /api/health', category: 'api', criticality: 'critical', interval_sec: FAST,
    baseline: { path: '/api/health', timeout_ms: 3000, requires_auth: false } },
  { id: 'api.overview', name: 'Next.js — /api/overview', category: 'api', criticality: 'medium', interval_sec: FAST,
    baseline: { path: '/api/overview', timeout_ms: 5000, requires_auth: true } },
  { id: 'api.leads', name: 'Next.js — /api/leads', category: 'api', criticality: 'medium', interval_sec: FAST,
    baseline: { path: '/api/leads', timeout_ms: 5000, requires_auth: true } },
  { id: 'api.inbox', name: 'Next.js — /api/inbox', category: 'api', criticality: 'medium', interval_sec: FAST,
    baseline: { path: '/api/inbox', timeout_ms: 5000, requires_auth: true } },
  { id: 'api.calls', name: 'Next.js — /api/calls', category: 'api', criticality: 'medium', interval_sec: FAST,
    baseline: { path: '/api/calls', timeout_ms: 5000, requires_auth: true } },
  { id: 'api.devis_render', name: 'Next.js — /api/universal/devis/render', category: 'api', criticality: 'medium', interval_sec: FAST,
    baseline: { path: '/api/universal/devis/render', timeout_ms: 5000, requires_auth: false } },
  { id: 'vercel.last_build', name: 'Vercel — last build status', category: 'api', criticality: 'high', interval_sec: MED,
    baseline: { project_hint: 'bluewiseai-site-wmw8', max_age_hours: 24 } },
  { id: 'vercel.function_errors_15m', name: 'Vercel — function errors 15min', category: 'api', criticality: 'high', interval_sec: FAST,
    baseline: { window_min: 15, warn_count: 5, critical_count: 20 } },

  // ============ db (6) ============
  { id: 'db.connect', name: 'Supabase — connect + SELECT 1', category: 'db', criticality: 'critical', interval_sec: FAST,
    baseline: { warn_ms: 1000, critical_ms: 3000 } },
  { id: 'db.query_leads_ms', name: 'Supabase — leads query latency', category: 'db', criticality: 'medium', interval_sec: FAST,
    baseline: { warn_ms: 500, critical_ms: 1500 } },
  { id: 'db.query_messages_ms', name: 'Supabase — messages query latency', category: 'db', criticality: 'medium', interval_sec: FAST,
    baseline: { warn_ms: 500, critical_ms: 1500 } },
  { id: 'db.row_anomaly_leads', name: 'DB anomaly — leads total drift', category: 'db', criticality: 'high', interval_sec: MED,
    baseline: { warn_delta_pct: 30, critical_delta_pct: 60, expected: null, note: 'set by P-02 first run' } },
  { id: 'db.row_anomaly_messages', name: 'DB anomaly — messages total drift', category: 'db', criticality: 'high', interval_sec: MED,
    baseline: { warn_delta_pct: 30, critical_delta_pct: 60, expected: null, note: 'set by P-02 first run' } },
  { id: 'db.rls_policy_count', name: 'DB — RLS policy count drift', category: 'db', criticality: 'high', interval_sec: MED,
    baseline: { expected: null, tolerance: 0, note: 'set by P-02 first run — any drop is critical' } },

  // ============ external (12) ============
  { id: 'telnyx.account', name: 'Telnyx — account reachable', category: 'external', criticality: 'critical', interval_sec: FAST,
    baseline: { timeout_ms: 8000 } },
  { id: 'telnyx.sms_delivery_24h', name: 'Telnyx — SMS delivery rate 24h', category: 'external', criticality: 'high', interval_sec: MED,
    baseline: { warn_pct: 85, critical_pct: 70, window_hours: 24 } },
  { id: 'telnyx.voice_profile', name: 'Telnyx — outbound voice profile enabled', category: 'external', criticality: 'medium', interval_sec: MED },
  { id: 'mailgun.domain_verified', name: 'Mailgun — domain active + TLS required', category: 'external', criticality: 'critical', interval_sec: FAST,
    baseline: { domain: 'mg.bluewiseai.com' } },
  { id: 'mailgun.spf_dkim_dmarc', name: 'Mailgun — SPF/DKIM/DMARC valid', category: 'external', criticality: 'medium', interval_sec: MED,
    baseline: { domain: 'mg.bluewiseai.com' } },
  { id: 'mailgun.suppression_growth', name: 'Mailgun — suppression list growth', category: 'external', criticality: 'low', interval_sec: SLOW,
    baseline: { domain: 'mg.bluewiseai.com', warn_multiplier: 2, critical_multiplier: 5, note: 'needs 7d baseline' } },
  { id: 'gmail.oauth_token', name: 'Gmail OAuth — token refresh', category: 'external', criticality: 'high', interval_sec: MED },
  { id: 'retell.agent_list', name: 'Retell — agent list reachable', category: 'external', criticality: 'high', interval_sec: MED,
    baseline: { min_agents: 1 } },
  { id: 'retell.last_call_72h', name: 'Retell — last call < 72h', category: 'external', criticality: 'medium', interval_sec: SLOW,
    baseline: { warn_hours: 72, critical_hours: 168 } },
  { id: 'openai.ping', name: 'OpenAI — chat completion ping', category: 'external', criticality: 'medium', interval_sec: MED,
    baseline: { model: 'gpt-5-nano', timeout_ms: 10000, max_tokens: 1 } },
  { id: 'stripe.account', name: 'Stripe — account charges+payouts enabled', category: 'external', criticality: 'medium', interval_sec: SLOW },
  { id: 'groundwire.sip_registered', name: 'Groundwire — SIP registration (proxy: 24h voice traffic)', category: 'external', criticality: 'medium', interval_sec: MED,
    baseline: { not_implemented: true, fallback: 'count successful outbound voice calls last 24h' } },

  // ============ infra (4) ============
  { id: 'infra.ssl_expiry', name: 'SSL — cert expiry per domain', category: 'infra', criticality: 'medium', interval_sec: SLOW,
    baseline: {
      domains: [
        'bluewiseai.com', 'crm.bluewiseai.com', 'automation.bluewiseai.com',
        'pur-construction-site.vercel.app', 'serviceplus.plus', 'www.serviceplus.plus'
      ],
      warn_days: 14, critical_days: 3
    } },
  { id: 'infra.dns_resolve', name: 'DNS — A/MX/TXT resolve', category: 'infra', criticality: 'medium', interval_sec: SLOW,
    baseline: {
      domains: ['bluewiseai.com', 'automation.bluewiseai.com', 'serviceplus.plus'],
      record_types: ['A', 'MX', 'TXT']
    } },
  { id: 'infra.domain_expiry', name: 'Domain — Namecheap registration expiry', category: 'infra', criticality: 'low', interval_sec: SLOW,
    baseline: { warn_days: 30, critical_days: 7 } },
  { id: 'infra.vps_disk_ram', name: 'VPS — disk + RAM thresholds (ping)', category: 'infra', criticality: 'high', interval_sec: FAST,
    baseline: { via: 'vps_ping', disk_warn_pct: 85, disk_critical_pct: 95, ram_warn_mb: 200, ram_critical_mb: 50 } },

  // ============ data_quality (6) ============
  { id: 'dq.sms_outbound_status_null', name: 'DQ — outbound SMS stuck status=null > 30min', category: 'data_quality', criticality: 'high', interval_sec: FAST,
    baseline: { age_minutes: 30, warn_count: 1, critical_count: 5 } },
  { id: 'dq.inbound_silence_24h', name: 'DQ — inbound silence 24h per active tenant', category: 'data_quality', criticality: 'critical', interval_sec: MED,
    baseline: { window_hours: 24, active_tenant_window_days: 7 } },
  { id: 'dq.leads_no_customer_id', name: 'DQ — leads with NULL customer_id', category: 'data_quality', criticality: 'critical', interval_sec: MED,
    baseline: { warn_count: 0, critical_count: 1 } },
  { id: 'dq.messages_orphan_lead_id', name: 'DQ — inbox_messages.lead_id without matching inbox_leads', category: 'data_quality', criticality: 'critical', interval_sec: MED,
    baseline: { warn_count: 0, critical_count: 1 } },
  { id: 'dq.jobs_no_lead_id', name: 'DQ — jobs with NULL lead_id', category: 'data_quality', criticality: 'medium', interval_sec: MED,
    baseline: { warn_count: 1, critical_count: 5 } },
  { id: 'dq.contracts_payments_orphans', name: 'DQ — contracts/payments without matching job', category: 'data_quality', criticality: 'critical', interval_sec: MED,
    baseline: { warn_count: 0, critical_count: 1 } },
];

async function upsertAll() {
  const rows = CHECKS.map(c => ({
    id: c.id,
    name: c.name,
    category: c.category,
    criticality: c.criticality,
    interval_sec: c.interval_sec || FAST,
    enabled: true,
    baseline: c.baseline || {},
  }));

  const res = await fetch(`${SUPABASE_URL}/rest/v1/system_health_checks?on_conflict=id`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error(`FAILED (${res.status}): ${t}`);
    process.exit(2);
  }
  console.log(`OK — upserted ${rows.length} checks`);

  // Count + category summary
  const count = await fetch(`${SUPABASE_URL}/rest/v1/system_health_checks?select=category`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
  });
  const data = await count.json();
  const byCat = data.reduce((a, r) => { a[r.category] = (a[r.category] || 0) + 1; return a; }, {});
  console.log('Total:', data.length, 'By category:', byCat);
}

upsertAll().catch(e => { console.error(e); process.exit(3); });
