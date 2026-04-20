/**
 * POST /api/devis/track
 *
 * Lightweight engagement tracker for /q/[token] pages.
 * Events: opened, heartbeat, accept_clicked, tier_viewed
 *
 * SECURITY:
 *   - customer_id and job_id ALWAYS derived from quote_number DB lookup (never from client body)
 *   - SUPABASE_SERVICE_ROLE_KEY is server-side only (never in client bundles)
 *   - Slack alert fires at most once per quote (dedup on meta.first_opened_at)
 *   - Heartbeats capped at 20 per quote (cost control)
 */

import { sbSelect, sbInsert, sbUpdate } from '../../../lib/supabase-server.js';
import { checkRateLimit } from '../../../lib/security.js';

const VALID_EVENTS = ['opened', 'heartbeat', 'accept_clicked', 'tier_viewed'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[devis/track] Missing SUPABASE_SERVICE_ROLE_KEY');
    return res.status(500).json({ error: 'Missing service key' });
  }

  // F-015 — public endpoint writes DB per request. Per-IP rate limit
  // prevents flood → Supabase row churn + Slack webhook abuse. Heartbeat
  // events were already capped at 20/quote but opened/accept_clicked/
  // tier_viewed were uncapped.
  const ip = (
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    ''
  ).split(',')[0].trim() || 'unknown';
  if (checkRateLimit(req, res, `track:${ip}`, 60)) return;

  const { quote_number, event, scroll_pct, elapsed_seconds, referrer } = req.body || {};

  if (!quote_number || !event || !VALID_EVENTS.includes(event)) {
    return res.status(400).json({ error: 'Bad request — quote_number and valid event required' });
  }
  const userAgent = (req.headers['user-agent'] || '').slice(0, 500);

  // Resolve customer_id + job_id from quote_number — NEVER trust client for these
  let quotes;
  try {
    quotes = await sbSelect('quotes', {
      match: { quote_number },
      columns: 'id,customer_id,job_id,meta,total_ttc,status',
      limit: 1,
    });
  } catch (err) {
    console.error('[devis/track] sbSelect quotes error:', err);
    return res.status(500).json({ error: 'DB error' });
  }

  const quote = quotes?.[0];
  if (!quote) return res.status(404).json({ error: 'Quote not found' });

  // Cap heartbeats to avoid runaway costs
  if (event === 'heartbeat' && (quote.meta?.heartbeat_count || 0) >= 20) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  // Log event to job_events
  try {
    await sbInsert('job_events', {
      job_id: quote.job_id,
      customer_id: quote.customer_id,
      event_type: 'quote_' + event,
      payload: {
        scroll_pct: scroll_pct != null ? scroll_pct : undefined,
        elapsed_seconds: elapsed_seconds != null ? elapsed_seconds : undefined,
        referrer: referrer || undefined,
        user_agent: userAgent,
        ip,
        quote_number,
      },
    });
  } catch (err) {
    // Log but don't fail the request — tracking is best-effort
    console.error('[devis/track] event insert error:', err);
  }

  // Update quote meta
  const newMeta = { ...(quote.meta || {}) };
  newMeta.last_viewed_at = new Date().toISOString();

  if (event === 'heartbeat') {
    newMeta.heartbeat_count = (newMeta.heartbeat_count || 0) + 1;
    if (scroll_pct != null) {
      if (newMeta.max_scroll_pct == null || scroll_pct > newMeta.max_scroll_pct) {
        newMeta.max_scroll_pct = scroll_pct;
      }
    }
  }

  let isFirstOpen = false;
  if (event === 'opened' && !newMeta.first_opened_at) {
    newMeta.first_opened_at = new Date().toISOString();
    isFirstOpen = true;
  }

  try {
    await sbUpdate('quotes', { id: quote.id }, {
      meta: newMeta,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[devis/track] meta update error:', err);
  }

  // Slack alert — exactly once per quote (isFirstOpen dedup)
  if (isFirstOpen) {
    await fireSlackAlert(quote);
  }

  return res.status(200).json({ ok: true });
}

async function fireSlackAlert(quote) {
  try {
    const customers = await sbSelect('customers', {
      match: { id: quote.customer_id },
      columns: 'quote_config',
      limit: 1,
    });
    const cust = customers?.[0];
    const webhook =
      cust?.quote_config?.branding?.slack_webhook_url ||
      cust?.quote_config?.slack_webhook_url;

    if (!webhook) return; // Slack not configured for this customer — silent skip

    const jobs = await sbSelect('jobs', {
      match: { id: quote.job_id },
      columns: 'client_name',
      limit: 1,
    });
    const name = jobs?.[0]?.client_name || 'Client';
    const total = Number(quote.total_ttc || 0).toLocaleString('fr-CA', {
      minimumFractionDigits: 2,
    });

    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `👀 ${name} vient d'ouvrir son devis ${quote.quote_number || ''} (${total} $ TTC)`,
      }),
    });
  } catch (err) {
    console.error('[devis/track] Slack alert error:', err);
  }
}
