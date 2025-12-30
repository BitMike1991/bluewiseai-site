// pages/api/overview.js
import { getAuthContext } from "../../lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);

  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (!customerId) {
    return res.status(403).json({ error: "No customer mapping for this user" });
  }

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
    // 2) Tasks: open + due today + overdue
    //
    const { data: openTasksRows, error: openTasksError } = await supabase
      .from("tasks")
      .select("id, status, due_at")
      .eq("customer_id", customerId)
      .not("status", "in", "(completed,cancelled)");

    if (openTasksError) throw openTasksError;

    const openTasks = openTasksRows?.length || 0;

    const tasksDueToday =
      openTasksRows?.filter((t) => {
        if (!t.due_at) return false;
        const d = new Date(t.due_at);
        return d.toISOString().slice(0, 10) === todayStr;
      }).length || 0;

    const tasksOverdue =
      openTasksRows?.filter((t) => {
        if (!t.due_at) return false;
        const d = new Date(t.due_at);
        const iso = d.toISOString().slice(0, 10);
        return iso < todayStr;
      }).length || 0;

    //
    // 3) Missed calls this week (via leads table)
    //
    const { data: missedRows, error: missedError } = await supabase
      .from("leads")
      .select("id")
      .eq("customer_id", customerId)
      .not("last_missed_call_at", "is", null)
      .gte("last_missed_call_at", sinceIso);

    if (missedError) throw missedError;
    const missedCallsThisWeek = missedRows?.length || 0;

    //
    // 4) Voice AI answered calls this week (call transcripts)
    //
    const { data: voiceRows, error: voiceError } = await supabase
      .from("messages")
      .select("id")
      .eq("customer_id", customerId)
      .eq("channel", "call")
      .eq("message_type", "call_transcript")
      .gte("created_at", sinceIso);

    if (voiceError) throw voiceError;
    const voiceCallsThisWeek = voiceRows?.length || 0;

    //
    // 5) AI auto-replies this week (SMS outbound)
    //
    const { data: aiRows, error: aiError } = await supabase
      .from("messages")
      .select("id")
      .eq("customer_id", customerId)
      .eq("channel", "sms")
      .eq("direction", "outbound")
      .gte("created_at", sinceIso);

    if (aiError) throw aiError;
    const aiRepliesThisWeek = aiRows?.length || 0;

    //
    // 6) Hot leads (leads with hot_score > 0 or >= 40)
    //
    const { data: hotRows, error: hotError } = await supabase
      .from("leads")
      .select("id")
      .eq("customer_id", customerId)
      .gte("hot_score", 40);

    if (hotError) throw hotError;
    const hotLeadsCount = hotRows?.length || 0;

    //
    // 7) Revenue protected calculation ($300 per voice call answered)
    //
    const revenueProtected = voiceCallsThisWeek * 300;

    //
    // 8) Recent LEADS (canonical) – last 10 leads
    //
    const { data: recentLeadRows, error: recentLeadError } = await supabase
      .from("leads")
      .select("id, name, email, phone, source, status, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (recentLeadError) throw recentLeadError;

    const recentLeads = (recentLeadRows || []).map((l) => ({
      id: l.id,
      name: l.name || l.email || l.phone || "Unknown lead",
      phone: l.phone || null,
      city: null,
      source: l.source,
      status: l.status,
      createdAt: l.created_at,
    }));

    //
    // 9) Activity from inbox_lead_events
    //
    const { data: eventRows, error: activityError } = await supabase
      .from("inbox_lead_events")
      .select("id, lead_id, event_type, created_at, payload")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (activityError) throw activityError;

    //
    // 10) Activity from messages
    //
    const { data: messageRows, error: messageError } = await supabase
      .from("messages")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (messageError) throw messageError;

    //
    // 11) Map: inbox_leads.id -> canonical leads.id
    //
    const inboxLeadIds = Array.from(
      new Set((eventRows || []).map((row) => row.lead_id).filter((id) => id != null))
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
          if (r.id != null) inboxToCanonical[r.id] = r.lead_id || null;
        }
      }
    }

    //
    // 12) Normalize inbox_lead_events → activity
    //
    const activityFromEvents = (eventRows || []).map((row) => {
      let label = row.event_type;

      if (row.event_type === "missed_call") label = "Missed call";
      else if (row.event_type === "sms_sent_auto_reply") label = "AI sent SMS auto-reply";
      else if (row.event_type === "lead_created") label = "New lead created";

      const inboxLeadId = row.lead_id || null;
      const canonicalLeadId =
        inboxLeadId && inboxToCanonical[inboxLeadId] ? inboxToCanonical[inboxLeadId] : null;

      return {
        id: `evt-${row.id}`,
        inboxLeadId,
        leadId: canonicalLeadId,
        type: row.event_type,
        label,
        timestamp: row.created_at,
        payload: row.payload || null,
      };
    });

    //
    // 13) Normalize messages → activity
    //
    const activityFromMessages = (messageRows || []).map((row) => {
      const kind = row.channel || "message";
      const direction = row.direction || "inbound";

      let baseLabel;
      if (kind === "sms") {
        baseLabel = direction === "outbound" ? "You sent an SMS" : "Lead sent an SMS";
      } else if (kind === "email") {
        baseLabel = direction === "outbound" ? "You sent an email" : "Lead sent an email";
      } else if (kind === "call") {
        baseLabel = "Voice AI call";
      } else {
        baseLabel = direction === "outbound" ? "You sent a message" : "Lead sent a message";
      }

      const preview = row.snippet || row.subject || row.preview || row.body_preview || null;

      const label = preview ? `${baseLabel} – ${String(preview).slice(0, 80)}` : baseLabel;

      return {
        id: `msg-${row.id}`,
        inboxLeadId: null,
        leadId: row.lead_id || null,
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
    // 14) Merge + sort + trim
    //
    const combinedActivity = [...activityFromEvents, ...activityFromMessages];

    combinedActivity.sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta;
    });

    const activity = combinedActivity.slice(0, 30);

    //
    // 15) Response
    //
    return res.status(200).json({
      kpis: {
        missedCallsThisWeek,
        voiceCallsThisWeek,
        aiRepliesThisWeek,
        newLeadsThisWeek,
        hotLeadsCount,
        revenueProtected,
        // Legacy KPIs (kept for backwards compatibility)
        openTasks,
        tasksDueToday,
        tasksOverdue,
      },
      recentLeads,
      activity,
    });
  } catch (err) {
    console.error("[api/overview] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
