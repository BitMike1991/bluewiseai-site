// pages/api/leads/index.js
import { getSupabaseServerClient } from '../../../lib/supabaseServer';

// TEMP: hardcoded until auth is wired
function getCustomerIdFromRequest(req) {
  return 1;
}

export default async function handler(req, res) {
  const customerId = getCustomerIdFromRequest(req);
  if (!customerId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getSupabaseServerClient();

  try {
    const {
      status, // e.g. "new", "open", "won", "lost", "all"
      search, // phone, name, email fragment
      page = '1',
      pageSize = '20',
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const sizeNum = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
    const offset = (pageNum - 1) * sizeNum;

    const term = search && search.trim().length > 0 ? search.trim() : null;

    //
    // 1) Base query: canonical leads table
    //
    let leadsQuery = supabase
      .from('leads')
      .select(
        `
        id,
        customer_id,
        profile_id,
        name,
        first_name,
        phone,
        email,
        city,
        status,
        source,
        language,
        first_seen_at,
        last_message_at,
        last_missed_call_at,
        missed_call_count,
        next_followup_at,
        do_not_contact
      `,
        { count: 'exact' }
      )
      .eq('customer_id', customerId);

    if (status && status !== 'all') {
      leadsQuery = leadsQuery.eq('status', status);
    }

    if (term) {
      // Search across name, first_name, email, phone
      leadsQuery = leadsQuery.or(
        [
          `name.ilike.%${term}%`,
          `first_name.ilike.%${term}%`,
          `email.ilike.%${term}%`,
          `phone.ilike.%${term}%`,
        ].join(',')
      );
    }

    // Order by most recent message (fallback will be handled in Node)
    leadsQuery = leadsQuery
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + sizeNum - 1);

    const { data: leadRows, error: leadError, count: totalCount } = await leadsQuery;
    if (leadError) throw leadError;

    const leads = leadRows || [];

    if (leads.length === 0) {
      return res.status(200).json({
        items: [],
        total: totalCount || 0,
        page: pageNum,
        pageSize: sizeNum,
      });
    }

    const leadIds = leads.map((l) => l.id);

    //
    // 2) Fetch inbox_leads threads for these leads (canonical join: inbox_leads.lead_id = leads.id)
    //    We only need minimal fields to compute last_contact_at + missed_call_count + a primary thread.
    //
    const { data: inboxRows, error: inboxError } = await supabase
      .from('inbox_leads')
      .select(
        `
        id,
        lead_id,
        customer_id,
        last_contact_at,
        created_at,
        missed_call_count,
        status,
        source,
        summary
      `
      )
      .eq('customer_id', String(customerId))
      .in('lead_id', leadIds);

    if (inboxError) throw inboxError;

    const inboxByLeadId = new Map();

    if (inboxRows && inboxRows.length > 0) {
      for (const row of inboxRows) {
        const leadId = row.lead_id;
        if (!leadId) continue;

        const key = String(leadId);
        const existing = inboxByLeadId.get(key);

        const lastContactAt = row.last_contact_at || row.created_at || null;
        const lastContactMs = lastContactAt ? new Date(lastContactAt).getTime() : 0;
        const missed = row.missed_call_count || 0;

        if (!existing) {
          inboxByLeadId.set(key, {
            inbox_lead_id: row.id,
            last_contact_at: lastContactAt,
            last_contact_ms: lastContactMs,
            missed_call_count: missed,
          });
        } else {
          // Aggregate missed_call_count and keep the most recent thread as primary
          const totalMissed = (existing.missed_call_count || 0) + missed;
          const best =
            lastContactMs > existing.last_contact_ms
              ? {
                  inbox_lead_id: row.id,
                  last_contact_at: lastContactAt,
                  last_contact_ms: lastContactMs,
                  missed_call_count: totalMissed,
                }
              : {
                  ...existing,
                  missed_call_count: totalMissed,
                };

          inboxByLeadId.set(key, best);
        }
      }
    }

    //
    // 3) Normalize into a unified shape for the frontend
    //
    const nowMs = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    const items = leads.map((lead) => {
      const key = String(lead.id);
      const inboxInfo = inboxByLeadId.get(key);

      const leadLastMessageAt = lead.last_message_at;
      const leadFirstSeenAt = lead.first_seen_at;
      const leadLastMissedAt = lead.last_missed_call_at;

      const inboxLastContactAt = inboxInfo?.last_contact_at || null;

      // Choose the best "last_contact_at" across sources
      const candidateDates = [
        inboxLastContactAt,
        leadLastMessageAt,
        leadLastMissedAt,
        leadFirstSeenAt,
      ].filter(Boolean);

      let lastContactAt = null;
      if (candidateDates.length > 0) {
        lastContactAt = candidateDates.reduce((latest, curr) => {
          const latestMs = new Date(latest).getTime();
          const currMs = new Date(curr).getTime();
          return currMs > latestMs ? curr : latest;
        });
      }

      const leadMissed = lead.missed_call_count || 0;
      const inboxMissed = inboxInfo?.missed_call_count || 0;
      const missed_call_count = Math.max(leadMissed, inboxMissed);

      const statusValue = (lead.status || '').toLowerCase();
      const isOpenStatus = ['new', 'open', 'active', 'in_progress', 'pending'].includes(
        statusValue
      );

      const lastContactMs = lastContactAt ? new Date(lastContactAt).getTime() : 0;
      const isStale = !lastContactMs || nowMs - lastContactMs > ONE_DAY_MS;

      const needs_followup =
        !lead.do_not_contact && isOpenStatus && isStale;

      // Prefer full name, fall back to phone / id
      const displayName =
        lead.name ||
        (lead.first_name && `${lead.first_name}`) ||
        lead.phone ||
        `Lead #${lead.id}`;

      return {
        // Core IDs
        lead_id: lead.id,
        profile_id: lead.profile_id || null,
        inbox_lead_id: inboxInfo?.inbox_lead_id || null,

        // Identity
        name: displayName,
        phone: lead.phone || null,
        email: lead.email || null,
        city: lead.city || null,
        status: lead.status || 'new',
        source: lead.source || 'unknown',
        language: lead.language || null,

        // Activity
        last_contact_at: lastContactAt,
        missed_call_count,
        needs_followup,

        // Optional extras that might be useful later
        first_seen_at: leadFirstSeenAt,
        last_message_at: leadLastMessageAt,
        next_followup_at: lead.next_followup_at,
      };
    });

    return res.status(200).json({
      items,
      total: totalCount || items.length,
      page: pageNum,
      pageSize: sizeNum,
    });
  } catch (err) {
    console.error('[api/leads] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
