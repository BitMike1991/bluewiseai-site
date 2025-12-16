// pages/api/overview.js
import { createSupabaseServerClient } from "../../lib/supabaseServer";

function getCustomerIdFromRequest(req) {
  // 🔴 TEMP: hardcoded for YOUR own tenant while we’re wiring Auth.
  return 1;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const customerId = getCustomerIdFromRequest(req);
  if (!customerId) {
    return res
      .status(401)
      .json({ error: "Not authenticated / no customer_id" });
  }

  const supabase = createSupabaseServerClient(req, res);

  try {
    const now = new Date();
    const since = new Date();
    since.setDate(now.getDate() - 7); // last 7 days

    const sinceIso = since.toISOString();
    const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

    //
    // 1) New leads this week – canonical LEADS table
    //
    const { data: newLeadsRows, error: newLeadsError } = await supabase
      .from("leads")
      .select("id")
      .eq("customer_id", customerId)
      .gte("created_at", sinceIso);

    if (newLeadsError) throw newLeadsError;
    const newLeadsThisWeek = newLeadsRows?.length || 0;

    //
    // 2) Tasks (followups): open + due today + overdue
    // "Open" = anything NOT completed/cancelled
    //
    const { data: openTasksRows, error: openTasksError } = await supabase
      .from("followups")
      .select("id, status, scheduled_for")
      .eq("customer_id", customerId)
      .not("status", "in", "(completed,cancelled)");

    if (openTasksError) throw openTasksError;

    const openTasks = openTasksRows?.length || 0;

    const tasksDueToday =
      openTasksRows?.filter((t) => {
        if (!t.scheduled_for) return false;
        const d = new Date(t.scheduled_for);
        return d.toISOString().slice(0, 10) === todayStr;
      }).length || 0;

    const tasksOverdue =
      openTasksRows?.filter((t) => {
        if (!t.scheduled_for) return false;
        const d = new Date(t.scheduled_for);
        const iso = d.toISOString().slice(0, 10);
        return iso < todayStr;
      }).length || 0;

    //
    // 3) Missed calls this week (via inbox_lead_events)
    //
    const { data: missedRows, error: missedError } = await supabase
      .from("inbox_lead_events")
      .select("id")
      .eq("customer_id", customerId)
      .eq("event_type", "missed_call")
      .gte("created_at", sinceIso);

    if (missedError) throw missedError;
    const missedCallsThisWeek = missedRows?.length || 0;

    //
    // 4) AI auto-replies this week
    //
    const { data: aiRows, error: aiError } = await supabase
      .from("inbox_lead_events")
      .select("id")
      .eq("customer_id", customerId)
      .eq("event_type", "sms_sent_auto_reply")
      .gte("created_at", sinceIso);

    if (aiError) throw aiError;
    const aiRepliesThisWeek = aiRows?.length || 0;

    //
    // 5) Recent LEADS (canonical) – last 10 leads
    //
    const { data: recentLeadRows, error: recentLeadError } = await supabase
      .from("leads")
      .select("id, name, email, phone, source, status, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (recentLeadError) throw recentLeadError;

    const recentLeads = (recentLeadRows || []).map((l) => ({
      id: l.id, // canonical lead.id for /platform/leads/[id]
      name: l.name || l.email || l.phone || "Unknown lead",
      phone: l.phone || null,
      // city not stored on leads yet – keep shape for UI
      city: null,
      source: l.source,
      status: l.status,
      createdAt: l.created_at,
    }));

    //
    // 6) Activity from inbox_lead_events (calls, auto-SMS, etc.)
    //
    const { data: eventRows, error: activityError } = await supabase
      .from("inbox_lead_events")
      .select("id, lead_id, event_type, created_at, payload")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(50); // we’ll merge & trim later

    if (activityError) throw activityError;

    //
    // 7) Activity from messages (email/SMS/etc.) – canonical leads
    //
    const { data: messageRows, error: messageError } = await supabase
      .from("messages")
      .select("*") // keep flexible; schema may evolve
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (messageError) throw messageError;

    //
    // 8) Build map: inbox_leads.id -> canonical leads.id
    //    so events (which point to inbox_leads) can link to /platform/leads/[id]
    //
    const inboxLeadIds = Array.from(
      new Set(
        (eventRows || [])
          .map((row) => row.lead_id)
          .filter((id) => id != null)
      )
    );

    const inboxToCanonical = {};
    if (inboxLeadIds.length > 0) {
      const { data: inboxMapRows, error: inboxMapError } = await supabase
        .from("inbox_leads")
        .select("id, lead_id")
        .in("id", inboxLeadIds);

      if (inboxMapError) {
        console.error("[api/overview] inbox map error:", inboxMapError);
      } else {
        for (const r of inboxMapRows || []) {
          if (r.id != null) {
            inboxToCanonical[r.id] = r.lead_id || null;
          }
        }
      }
    }

    //
    // 9) Normalize inbox_lead_events → activity items (calls, auto-SMS)
    //
    const activityFromEvents = (eventRows || []).map((row) => {
      let label = row.event_type;

      if (row.event_type === "missed_call") {
        label = "Missed call";
      } else if (row.event_type === "sms_sent_auto_reply") {
        label = "AI sent SMS auto-reply";
      } else if (row.event_type === "lead_created") {
        label = "New lead created";
      }

      const inboxLeadId = row.lead_id || null;
      const canonicalLeadId =
        inboxLeadId && inboxToCanonical[inboxLeadId]
          ? inboxToCanonical[inboxLeadId]
          : null;

      return {
        id: `evt-${row.id}`,
        inboxLeadId,
        leadId: canonicalLeadId, // canonical lead for /platform/leads/[id]
        type: row.event_type,
        label,
        timestamp: row.created_at,
        payload: row.payload || null,
      };
    });

    //
    // 10) Normalize messages → activity items (email/SMS linked directly to leads)
    //
    const activityFromMessages = (messageRows || []).map((row) => {
      const kind = row.kind || row.channel || "message";
      const direction = row.direction || "inbound";

      let baseLabel;
      if (kind === "sms" || kind === "text") {
        baseLabel =
          direction === "outbound" ? "You sent an SMS" : "Lead sent an SMS";
      } else if (kind === "email") {
        baseLabel =
          direction === "outbound" ? "You sent an email" : "Lead sent an email";
      } else {
        baseLabel =
          direction === "outbound"
            ? "You sent a message"
            : "Lead sent a message";
      }

      const preview =
        row.snippet ||
        row.subject ||
        row.preview ||
        row.body_preview ||
        null;

      const label = preview
        ? `${baseLabel} – ${String(preview).slice(0, 80)}`
        : baseLabel;

      return {
        id: `msg-${row.id}`,
        inboxLeadId: null,
        leadId: row.lead_id || null, // messages already point to canonical leads
        type: `message.${kind}`,
        label,
        timestamp: row.created_at,
        payload: {
          kind,
          direction,
          subject: row.subject || null,
        },
      };
    });

    //
    // 11) Merge + sort activity, then trim to latest 30
    //
    const combinedActivity = [...activityFromEvents, ...activityFromMessages];

    combinedActivity.sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta; // newest first
    });

    const activity = combinedActivity.slice(0, 30);

    //
    // 12) Build final response
    //
    const response = {
      kpis: {
        newLeadsThisWeek, // canonical leads
        conversionRate: null, // TODO: compute from won vs total
        openTasks,
        tasksDueToday,
        tasksOverdue,
        pipelineValue: null, // TODO: sum of deal amounts once we add that
        missedCallsThisWeek,
        aiRepliesThisWeek,
      },
      // Recent LEADS card uses canonical leads only
      recentLeads,
      // Recent Activity card uses BOTH inbox_lead_events + messages
      activity,
    };

    return res.status(200).json(response);
  } catch (err) {
    console.error("[api/overview] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
