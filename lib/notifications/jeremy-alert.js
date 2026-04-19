// lib/notifications/jeremy-alert.js
// Direct-to-Jérémy notification helper. Fires Slack message + optionally SMS
// on significant pipeline events. Pulls tenant config from customers row so
// each tenant can route to their own Slack channel + phone.
//
// Fire-and-forget: errors are logged but never bubble up — the main request
// must succeed even if Slack is down.
//
// Usage:
//   import { alertJeremy } from '@/lib/notifications/jeremy-alert';
//   alertJeremy(supabase, { customerId, eventType: 'quote_accepted', payload: { ... } });

import { sendSmsTelnyx } from '../providers/telnyx';
import { fetchWithTimeout } from '../fetch-with-timeout';

// Which events warrant BOTH a Slack message AND a direct SMS to Jérémy.
// The others get Slack only (visible but less intrusive).
const SMS_EVENT_TYPES = new Set([
  'quote_accepted',
  'contract_signed',
  'deposit_received',
]);

// Quiet hours — avoid waking Jérémy with SMS notifications overnight.
// Slack notifications are always delivered (Slack mobile app handles DND).
function isWithinSmsHours(tz = 'America/Toronto') {
  try {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour: 'numeric', hour12: false,
    });
    const hour = Number(fmt.format(now));
    return hour >= 7 && hour < 22;
  } catch {
    // Fallback to local time if TZ lookup fails
    const h = new Date().getHours();
    return h >= 7 && h < 22;
  }
}

function formatMoneyQC(n) {
  const num = Number(n) || 0;
  return num.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' $';
}

// Build the Slack text body for each event type.
function buildSlackMessage(eventType, payload = {}) {
  const p = payload || {};
  const jobRef = p.job_id_human || p.job_id || '?';
  const client = p.client_name || 'Client';
  const amount = p.total_ttc != null ? formatMoneyQC(p.total_ttc) : null;
  const url    = p.job_url ? `<${p.job_url}|Ouvrir le projet>` : null;

  switch (eventType) {
    case 'quote_accepted':
      return [
        ':white_check_mark: *Devis accepté!*',
        `:bust_in_silhouette: ${client}`,
        amount ? `:moneybag: ${amount}` : null,
        `:receipt: \`${jobRef}\``,
        url,
      ].filter(Boolean).join('\n');
    case 'contract_signed':
      return [
        ':pen_ballpoint: *Contrat signé!*',
        `:bust_in_silhouette: ${client}`,
        amount ? `:moneybag: ${amount}` : null,
        `:receipt: \`${jobRef}\``,
        p.deposit_amount ? `:hourglass_flowing_sand: Dépôt attendu: ${formatMoneyQC(p.deposit_amount)}` : null,
        url,
      ].filter(Boolean).join('\n');
    case 'deposit_received':
      return [
        ':money_with_wings: *Dépôt reçu!*',
        `:bust_in_silhouette: ${client}`,
        amount ? `:moneybag: ${amount}` : null,
        `:receipt: \`${jobRef}\``,
        p.method ? `:credit_card: ${p.method}` : null,
        url,
      ].filter(Boolean).join('\n');
    case 'quote_expired':
      return [
        ':warning: *Devis expiré sans réponse*',
        `:bust_in_silhouette: ${client}`,
        `:receipt: \`${jobRef}\``,
        url,
      ].filter(Boolean).join('\n');
    case 'contract_create_failed':
      return [
        ':rotating_light: *Création de contrat échouée*',
        `:bust_in_silhouette: ${client}`,
        `:receipt: \`${jobRef}\``,
        'Le client a accepté mais le contrat n\'a pas été généré. Intervention manuelle requise.',
        url,
      ].filter(Boolean).join('\n');
    default:
      return `:bell: *${eventType}* — ${client} \`${jobRef}\``;
  }
}

function buildSmsMessage(eventType, payload = {}) {
  const p = payload || {};
  const jobRef = p.job_id_human || p.job_id || '?';
  const client = p.client_name || 'Client';
  const amount = p.total_ttc != null ? formatMoneyQC(p.total_ttc) : '';

  switch (eventType) {
    case 'quote_accepted':
      return `✅ ${client} a accepté le devis ${amount} (${jobRef})`.trim();
    case 'contract_signed':
      return `✍️ ${client} a signé le contrat ${amount} (${jobRef}) — dépôt à venir`.trim();
    case 'deposit_received':
      return `💰 Dépôt reçu de ${client} (${jobRef})${amount ? ' — ' + amount : ''}`.trim();
    default:
      return `🔔 ${eventType} — ${client} (${jobRef})`;
  }
}

/**
 * Fire a Jérémy-targeted alert. Never throws.
 *
 * @param {any} supabase - server-side Supabase client
 * @param {Object} opts
 * @param {number} opts.customerId
 * @param {string} opts.eventType - e.g. 'quote_accepted'
 * @param {Object} [opts.payload] - { job_id_human, client_name, total_ttc, job_url, ... }
 * @param {boolean} [opts.smsOverride] - force SMS on/off regardless of defaults
 */
export async function alertJeremy(supabase, opts) {
  const { customerId, eventType, payload = {}, smsOverride } = opts || {};
  if (!customerId || !eventType) return;

  try {
    // Fetch tenant config
    const { data: cust } = await supabase
      .from('customers')
      .select('id, business_name, slack_channel_id, slack_channels, slack_bot_token, telnyx_sms_number, customer_phone, timezone')
      .eq('id', customerId)
      .maybeSingle();

    if (!cust) {
      console.warn('[jeremy-alert] customer not found', customerId);
      return;
    }

    // Slack message
    try {
      const botToken = cust.slack_bot_token;
      const channelId = cust.slack_channels?.quotes
        || cust.slack_channels?.alerts
        || cust.slack_channel_id;
      if (botToken && channelId) {
        const text = buildSlackMessage(eventType, payload);
        await fetchWithTimeout('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${botToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ channel: channelId, text, unfurl_links: false, unfurl_media: false }),
        }, 4000);
      }
    } catch (e) {
      console.warn('[jeremy-alert] Slack failed', e?.message);
    }

    // SMS (only for important events + within hours, unless override)
    const wantSms = smsOverride === true
      || (smsOverride !== false && SMS_EVENT_TYPES.has(eventType) && isWithinSmsHours(cust.timezone));

    if (wantSms && cust.telnyx_sms_number && cust.customer_phone) {
      try {
        await sendSmsTelnyx({
          to: cust.customer_phone,
          from: cust.telnyx_sms_number,
          body: buildSmsMessage(eventType, payload),
        });
      } catch (e) {
        console.warn('[jeremy-alert] SMS failed', e?.message);
      }
    }
  } catch (e) {
    // Absolute top-level catch — we NEVER want to break the calling request.
    console.warn('[jeremy-alert] top-level failure', e?.message);
  }
}
