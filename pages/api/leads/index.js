// pages/api/leads/index.js
import { getAuthContext, getSupabaseServerClient } from "../../../lib/supabaseServer";
import { resolveDivisionId } from "../../../lib/divisions";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user, role, divisionId } = await getAuthContext(req, res);

  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (!customerId)
    return res.status(403).json({ error: "No customer mapping for this user" });

  const { checkRateLimit } = await import("../../../lib/security");

  // ── POST: create a new lead ──
  if (req.method === "POST") {
    if (checkRateLimit(req, res, `write:${customerId}`, 30)) return;

    try {
      const { name, phone, email, city, source, language, notes, status } = req.body || {};

      if (!name && !phone && !email) {
        return res.status(400).json({ error: "At least one of name, phone, or email is required" });
      }

      const validStatuses = ["new", "active", "in_convo", "quoted", "won", "lost", "dead"];
      const leadStatus = status && validStatuses.includes(status) ? status : "new";

      const admin = getSupabaseServerClient();
      const resolvedDivisionId = await resolveDivisionId(admin, {
        customer_id: customerId,
        role,
        user_division_id: divisionId,
        explicit: req.body?.division_id ?? null,
      });

      const insert = {
        customer_id: customerId,
        division_id: resolvedDivisionId,
        name: name || null,
        phone: phone || null,
        email: email || null,
        city: city || null,
        source: source || "manual",
        language: language || null,
        notes: notes || null,
        status: leadStatus,
        first_seen_at: new Date().toISOString(),
      };

      const { data, error: insertError } = await supabase
        .from("leads")
        .insert([insert])
        .select()
        .single();

      if (insertError) {
        console.error("[api/leads] POST insertError:", insertError);
        return res.status(500).json({ error: "Failed to create lead" });
      }

      return res.status(201).json({ success: true, lead: data });
    } catch (err) {
      console.error("[api/leads] POST error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (checkRateLimit(req, res, `read:${customerId}`, 120)) return;

  try {
    const { status, search, source, dateRange, sort, page = "1", pageSize = "20" } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const sizeNum = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
    const offset = (pageNum - 1) * sizeNum;

    const term = search && search.trim().length > 0 ? search.trim() : null;

    //
    // 1) Base query: canonical leads table
    //
    let leadsQuery = supabase
      .from("leads")
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
        notes,
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
        { count: "exact" }
      )
      .eq("customer_id", customerId);

    if (status && status !== "all") {
      leadsQuery = leadsQuery.eq("status", status);
    }

    if (term) {
      const { sanitizeSearchTerm } = await import("../../../lib/security");
      const safe = sanitizeSearchTerm(term);
      if (safe) {
        leadsQuery = leadsQuery.or(
          [
            `name.ilike.%${safe}%`,
            `first_name.ilike.%${safe}%`,
            `email.ilike.%${safe}%`,
            `phone.ilike.%${safe}%`,
          ].join(",")
        );
      }
    }

    // Source filter
    if (source && source !== "all") {
      leadsQuery = leadsQuery.eq("source", source);
    }

    // Date range filter
    if (dateRange && dateRange !== "all") {
      const days = parseInt(dateRange, 10);
      if (days > 0) {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        leadsQuery = leadsQuery.gte("first_seen_at", since);
      }
    }

    // Sort
    const sortMap = {
      newest: { col: "first_seen_at", ascending: false },
      oldest: { col: "first_seen_at", ascending: true },
      "name-az": { col: "name", ascending: true },
      "name-za": { col: "name", ascending: false },
      activity: { col: "last_message_at", ascending: false },
    };
    const sortConfig = sortMap[sort] || sortMap.activity;
    leadsQuery = leadsQuery
      .order(sortConfig.col, { ascending: sortConfig.ascending, nullsFirst: false })
      .range(offset, offset + sizeNum - 1);

    const { data: leadRows, error: leadError, count: totalCount } =
      await leadsQuery;
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
    // 2) Fetch inbox_leads threads for these leads
    // NOTE: keep your existing String(customerId) behavior to avoid type mismatch issues
    //
    const { data: inboxRows, error: inboxError } = await supabase
      .from("inbox_leads")
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
      .eq("customer_id", String(customerId))
      .in("lead_id", leadIds);

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
            summary: row.summary || null,
          });
        } else {
          const totalMissed = (existing.missed_call_count || 0) + missed;
          const best =
            lastContactMs > existing.last_contact_ms
              ? {
                  inbox_lead_id: row.id,
                  last_contact_at: lastContactAt,
                  last_contact_ms: lastContactMs,
                  missed_call_count: totalMissed,
                  summary: row.summary || existing.summary || null,
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
    // 3) Normalize into unified shape for frontend
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

      const statusValue = (lead.status || "").toLowerCase();
      const isOpenStatus = ["new", "open", "active", "in_progress", "pending"].includes(
        statusValue
      );

      const lastContactMs = lastContactAt ? new Date(lastContactAt).getTime() : 0;
      const isStale = !lastContactMs || nowMs - lastContactMs > ONE_DAY_MS;

      const needs_followup = !lead.do_not_contact && isOpenStatus && isStale;

      const displayName =
        lead.name ||
        (lead.first_name && `${lead.first_name}`) ||
        lead.phone ||
        `Lead #${lead.id}`;

      return {
        lead_id: lead.id,
        profile_id: lead.profile_id || null,
        inbox_lead_id: inboxInfo?.inbox_lead_id || null,

        name: displayName,
        phone: lead.phone || null,
        email: lead.email || null,
        city: lead.city || null,
        status: lead.status || "new",
        source: lead.source || "unknown",
        language: lead.language || null,

        last_contact_at: lastContactAt,
        missed_call_count,
        needs_followup,

        first_seen_at: leadFirstSeenAt,
        last_message_at: leadLastMessageAt,
        next_followup_at: lead.next_followup_at,

        notes: lead.notes || null,
        summary: inboxInfo?.summary || lead.notes || null,
      };
    });

    return res.status(200).json({
      items,
      total: totalCount || items.length,
      page: pageNum,
      pageSize: sizeNum,
    });
  } catch (err) {
    console.error("[api/leads] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
