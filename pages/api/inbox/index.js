// pages/api/inbox/index.js
import { getAuthContext } from "../../../lib/supabaseServer";

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

// UI-safe body normalization (prevents giant whitespace/signatures from flooding preview)
function normalizeMessageBody(raw) {
  if (!raw) return "";
  let s = raw.toString();

  s = s.replace(/\r\n/g, "\n");
  s = s.replace(/[ \t]+\n/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  s = s.trim();

  return s;
}

function truncateText(str, max = 220) {
  const s = normalizeMessageBody(str || "");
  if (!s) return "";
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

function classifyChannel(channelValue) {
  const s = (channelValue || "").toString().toLowerCase();
  if (
    s === "email" ||
    s.includes("email") ||
    s.includes("mailgun") ||
    s.includes("gmail") ||
    s.includes("smtp")
  )
    return "email";
  if (
    s === "sms" ||
    s.includes("sms") ||
    s.includes("telnyx") ||
    s.includes("text")
  )
    return "sms";
  return s || "unknown";
}

function ts(dateStr) {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  return Number.isNaN(t) ? null : t;
}

/**
 * Resolve authenticated tenant context from Supabase auth cookies:
 * - user from auth
 * - customerId from public.customer_users mapping
 */
async function requireCustomer(req, res) {
  const { supabase, user, customerId, error } = await getAuthContext(req, res);

  if (!user || !customerId) {
    return {
      supabase,
      customerId: null,
      error: error || new Error("Not authenticated / no customer mapping"),
    };
  }

  const cid = Number(customerId);
  if (!cid || Number.isNaN(cid)) {
    return {
      supabase,
      customerId: null,
      error: new Error("Invalid customer_id mapping"),
    };
  }

  return { supabase, customerId: cid, error: null };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  // IMPORTANT: use cookie-aware supabase (not service role) for tenant routes
  const { supabase, customerId, error } = await requireCustomer(req, res);
  if (error || !customerId) {
    return res.status(401).json({ error: error?.message || "Not authenticated" });
  }

  try {
    const { search, status = "open", channel = "all" } = req.query;

    // ------------------------------------------------------------------
    // 1) Base: canonical threads from leads
    // ------------------------------------------------------------------
    let leadsQuery = supabase
      .from("leads")
      .select(
        `
        id,
        customer_id,
        name,
        email,
        phone,
        source,
        status,
        created_at,
        profile_id,
        missed_call_count,
        last_missed_call_at,
        last_message_at,
        first_seen_at
      `
      )
      .eq("customer_id", customerId);

    // Status filtering
    if (status && status !== "all") {
      if (status === "open") {
        // broad "open": exclude explicit closed-ish values if present
        leadsQuery = leadsQuery.not(
          "status",
          "in",
          "(closed,closed-won,closed-lost)"
        );
      } else {
        leadsQuery = leadsQuery.eq("status", status);
      }
    }

    // Search (name/email/phone)
    if (isNonEmptyString(search)) {
      const term = search.trim();
      leadsQuery = leadsQuery.or(
        [`name.ilike.%${term}%`, `email.ilike.%${term}%`, `phone.ilike.%${term}%`].join(
          ","
        )
      );
    }

    // Sort rough; final sort after we merge activity
    leadsQuery = leadsQuery
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .order("last_missed_call_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    const { data: leads, error: leadsErr } = await leadsQuery;
    if (leadsErr) {
      console.error("[api/inbox] leads query error:", leadsErr);
      return res.status(500).json({ error: "Failed to load inbox leads" });
    }

    const leadRows = leads || [];
    if (leadRows.length === 0) return res.status(200).json({ items: [] });

    const leadIds = leadRows.map((l) => l.id).filter(Boolean);

    // ------------------------------------------------------------------
    // 2) Fetch inbox_leads rows for these leads (calls live here in your system)
    //    NOTE: inbox_leads.customer_id is TEXT in your schema
    // ------------------------------------------------------------------
    const { data: inboxLeadRows, error: inboxLeadErr } = await supabase
      .from("inbox_leads")
      .select(
        "id, lead_id, profile_id, status, summary, last_contact_at, missed_call_count, last_missed_call_at, source, from_email, customer_phone, customer_name"
      )
      .eq("customer_id", String(customerId))
      .in("lead_id", leadIds);

    if (inboxLeadErr) {
      console.error("[api/inbox] inbox_leads query error:", inboxLeadErr);
      // non-fatal; we can still build inbox from leads + messages
    }

    const inboxLeadByLeadId = new Map();
    for (const r of inboxLeadRows || []) {
      if (!r?.lead_id) continue;
      inboxLeadByLeadId.set(r.lead_id, r);
    }

    // ------------------------------------------------------------------
    // 3) Fetch recent messages for these leads; pick latest per lead
    // ------------------------------------------------------------------
    const { data: msgRows, error: msgErr } = await supabase
      .from("messages")
      .select("id, lead_id, direction, channel, subject, body, body_text, created_at")
      .eq("customer_id", customerId)
      .in("lead_id", leadIds)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (msgErr) {
      console.error("[api/inbox] messages query error:", msgErr);
      // non-fatal; calls/lead fields can still power inbox
    }

    const latestMsgByLead = new Map();
    for (const m of msgRows || []) {
      if (!m?.lead_id) continue;
      if (!latestMsgByLead.has(m.lead_id)) latestMsgByLead.set(m.lead_id, m);
    }

    const now = Date.now();

    // ------------------------------------------------------------------
    // 4) Build unified items
    // ------------------------------------------------------------------
    let items = leadRows.map((l) => {
      const leadId = l.id;

      const inboxRow = inboxLeadByLeadId.get(leadId) || null;
      const lastMsg = latestMsgByLead.get(leadId) || null;

      const lastMsgAtTs = ts(lastMsg?.created_at);
      const lastMissedCallTs = ts(
        inboxRow?.last_missed_call_at || l.last_missed_call_at
      );
      const lastContactTs = ts(inboxRow?.last_contact_at);

      // Choose latest activity among:
      // - latest message
      // - last missed call
      // - inbox_leads.last_contact_at (if you update it for other call-related events)
      const bestTs = Math.max(lastMsgAtTs || 0, lastMissedCallTs || 0, lastContactTs || 0);

      let lastContactAt =
        (bestTs ? new Date(bestTs).toISOString() : null) ||
        inboxRow?.last_contact_at ||
        l.last_message_at ||
        l.last_missed_call_at ||
        l.first_seen_at ||
        l.created_at ||
        null;

      // Preview defaults
      let previewChannel = "unknown"; // email | sms | call | unknown
      let previewLabel = null;
      let previewDirection = null;
      let preview = null;

      // If missed call is the latest signal -> show call preview
      if (bestTs && lastMissedCallTs && bestTs === lastMissedCallTs) {
        previewChannel = "call";
        previewLabel = "Missed call";
        preview = "Incoming call was missed.";
      }
      // Else if inbox last_contact is latest but we don't know exact event type -> "Call activity"
      else if (bestTs && lastContactTs && bestTs === lastContactTs && !lastMsgAtTs) {
        previewChannel = "call";
        previewLabel = "Call activity";
        preview = "Call activity logged.";
      }
      // Else show latest message
      else if (lastMsg) {
        previewChannel = classifyChannel(lastMsg.channel);
        previewDirection = lastMsg.direction || null;

        const subj = isNonEmptyString(lastMsg.subject) ? lastMsg.subject.trim() : "";
        const body = lastMsg.body_text || lastMsg.body || "";
        const snippet = truncateText(body, 260);

        previewLabel =
          previewChannel === "email"
            ? "Email"
            : previewChannel === "sms"
            ? "SMS"
            : "Message";

        preview = subj ? `${subj} — ${snippet}` : snippet;
      } else {
        previewLabel = "Lead";
        preview =
          inboxRow?.summary || (l.status ? `Status: ${l.status}` : "No recent activity.");
      }

      // Use inbox_leads status/summary if present (it may be more “thread-like”)
      const finalStatus = inboxRow?.status || l.status || "new";
      const finalSummary = inboxRow?.summary || null;

      const missedCallCount =
        (typeof inboxRow?.missed_call_count === "number" ? inboxRow.missed_call_count : null) ??
        (l.missed_call_count || 0);

      // Same heuristic you like (stale or missed call)
      const lastContactAtTs = ts(lastContactAt);
      const needsFollowup =
        (finalStatus || "").toLowerCase() !== "closed" &&
        (missedCallCount > 0 ||
          !lastContactAtTs ||
          now - lastContactAtTs > 24 * 60 * 60 * 1000);

      // Display identity: prefer leads.* but fall back to inbox_leads fields if leads are sparse
      const displayName =
        l.name ||
        inboxRow?.customer_name ||
        l.email ||
        inboxRow?.from_email ||
        l.phone ||
        inboxRow?.customer_phone ||
        "Lead";

      const displayEmail = l.email || inboxRow?.from_email || null;
      const displayPhone = l.phone || inboxRow?.customer_phone || null;

      return {
        id: leadId,
        leadId,
        profileId: l.profile_id || inboxRow?.profile_id || null,

        name: displayName,
        email: displayEmail,
        phone: displayPhone,
        source: l.source || inboxRow?.source || "unknown",
        status: finalStatus,
        summary: finalSummary,

        lastContactAt,
        createdAt: l.created_at,
        missedCallCount,
        lastMissedCallAt: inboxRow?.last_missed_call_at || l.last_missed_call_at || null,

        preview,
        previewLabel,
        previewChannel,
        previewDirection,

        needsFollowup,
      };
    });

    // ------------------------------------------------------------------
    // 5) Optional channel filter (API level)
    // ------------------------------------------------------------------
    const channelVal = (channel || "all").toString().toLowerCase();
    if (channelVal !== "all") {
      items = items.filter((it) => (it.previewChannel || "unknown") === channelVal);
    }

    // Final sort by lastContactAt desc
    items.sort((a, b) => {
      const ta = ts(a.lastContactAt) || 0;
      const tb = ts(b.lastContactAt) || 0;
      return tb - ta;
    });

    return res.status(200).json({ items });
  } catch (err) {
    console.error("[api/inbox] Unexpected error:", err);
    return res.status(500).json({ error: "Failed to load inbox" });
  }
}
