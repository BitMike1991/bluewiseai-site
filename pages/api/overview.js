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

  // Rate limit: 120 read requests per minute per customer
  const { checkRateLimit } = await import("../../lib/security");
  if (checkRateLimit(req, res, `read:${customerId}`, 120)) return;

  try {
    const now = new Date();
    const since = new Date();
    since.setDate(now.getDate() - 7);
    const sinceIso = since.toISOString();
    const todayStr = now.toISOString().slice(0, 10);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // ── ALL QUERIES IN PARALLEL ──
    const [
      { data: newLeadsRows },
      { data: openTasksRows },
      { data: missedRows },
      { data: voiceRows },
      { data: aiRows },
      { data: hotRows },
      { data: allPayments },
      { data: allExpenses },
      { data: signedJobs },
      { data: pipelineQuotes },
      { data: pipelineJobs },
      { data: allLeadRows },
      { data: activeJobRows },
      { data: recentLeadRows },
      { data: eventRows },
      { data: messageRows },
    ] = await Promise.all([
      // 1) New leads this week
      supabase.from("leads").select("id").eq("customer_id", customerId).gte("created_at", sinceIso),
      // 2) Tasks
      supabase.from("tasks").select("id, status, due_at").eq("customer_id", customerId).not("status", "in", "(completed,cancelled)"),
      // 3) Missed calls this week
      supabase.from("leads").select("id").eq("customer_id", customerId).not("last_missed_call_at", "is", null).gte("last_missed_call_at", sinceIso),
      // 4) Voice AI answered
      supabase.from("messages").select("id").eq("customer_id", customerId).eq("channel", "call").eq("message_type", "call_transcript").gte("created_at", sinceIso),
      // 5) AI auto-replies
      supabase.from("messages").select("id").eq("customer_id", customerId).eq("channel", "sms").eq("direction", "outbound").gte("created_at", sinceIso),
      // 6) Hot leads
      supabase.from("leads").select("id").eq("customer_id", customerId).gte("hot_score", 40),
      // 7) Payments
      supabase.from("payments").select("amount, created_at").eq("customer_id", customerId).eq("status", "succeeded"),
      // 7b) Expenses
      supabase.from("expenses").select("total, paid_at").eq("customer_id", customerId),
      // 7c) Signed jobs
      supabase.from("jobs").select("id, quote_amount").eq("customer_id", customerId).in("status", ["signed", "contract_signed", "scheduled", "in_progress", "completed"]),
      // 8) Pipeline quotes
      supabase.from("quotes").select("total_ttc").eq("customer_id", customerId).not("status", "eq", "cancelled").gte("created_at", since30d),
      // 8) Pipeline jobs
      supabase.from("jobs").select("quote_amount").eq("customer_id", customerId).not("status", "in", "(cancelled,lost)").gte("created_at", since30d),
      // 8b) All leads
      supabase.from("leads").select("id, status").eq("customer_id", customerId),
      // 8c) Active jobs
      supabase.from("jobs").select("id").eq("customer_id", customerId).in("status", ["in_progress", "signed", "scheduled"]),
      // 9) Recent leads
      supabase.from("leads").select("id, name, email, phone, source, status, created_at").eq("customer_id", customerId).order("created_at", { ascending: false }).limit(10),
      // 10) Events
      supabase.from("inbox_lead_events").select("id, lead_id, event_type, created_at, payload").eq("customer_id", customerId).order("created_at", { ascending: false }).limit(50),
      // 11) Messages (select only needed columns, not *)
      supabase.from("messages").select("id, lead_id, direction, channel, message_type, subject, snippet, preview, body_preview, created_at").eq("customer_id", customerId).order("created_at", { ascending: false }).limit(50),
    ]);

    const newLeadsThisWeek = newLeadsRows?.length || 0;

    const openTasks = openTasksRows?.length || 0;
    const tasksDueToday = openTasksRows?.filter((t) => {
      if (!t.due_at) return false;
      return new Date(t.due_at).toISOString().slice(0, 10) === todayStr;
    }).length || 0;
    const tasksOverdue = openTasksRows?.filter((t) => {
      if (!t.due_at) return false;
      return new Date(t.due_at).toISOString().slice(0, 10) < todayStr;
    }).length || 0;

    const missedCallsThisWeek = missedRows?.length || 0;
    const voiceCallsThisWeek = voiceRows?.length || 0;
    const aiRepliesThisWeek = aiRows?.length || 0;
    const hotLeadsCount = hotRows?.length || 0;

    // ── FINANCIAL CALCULATIONS ──
    const totalRevenue = (allPayments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
    const revenue30d = (allPayments || []).filter((p) => p.created_at && new Date(p.created_at).toISOString() >= since30d).reduce((s, p) => s + Number(p.amount || 0), 0);
    const revenueMtd = (allPayments || []).filter((p) => p.created_at && new Date(p.created_at).toISOString() >= monthStart).reduce((s, p) => s + Number(p.amount || 0), 0);
    const revenueWtd = (allPayments || []).filter((p) => p.created_at && new Date(p.created_at).toISOString() >= sinceIso).reduce((s, p) => s + Number(p.amount || 0), 0);

    const totalExpenses = (allExpenses || []).reduce((s, e) => s + Number(e.total || 0), 0);
    const expenses30d = (allExpenses || []).filter((e) => e.paid_at && new Date(e.paid_at).toISOString() >= since30d).reduce((s, e) => s + Number(e.total || 0), 0);
    const expensesMtd = (allExpenses || []).filter((e) => e.paid_at && new Date(e.paid_at).toISOString() >= monthStart).reduce((s, e) => s + Number(e.total || 0), 0);

    const totalSignedTtc = (signedJobs || []).reduce((s, j) => s + Number(j.quote_amount || 0) * 1.14975, 0);
    const outstandingBalance = Math.max(0, totalSignedTtc - totalRevenue);

    const pipelineValue =
      (pipelineQuotes || []).reduce((s, q) => s + Number(q.total_ttc || 0), 0) +
      (pipelineJobs || []).reduce((s, j) => s + Number(j.quote_amount || 0) * 1.14975, 0);

    const totalLeads = allLeadRows?.length || 0;
    const wonLeads = (allLeadRows || []).filter((l) => l.status === "won").length;
    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
    const activeJobs = activeJobRows?.length || 0;

    const recentLeads = (recentLeadRows || []).map((l) => ({
      id: l.id,
      name: l.name || l.email || l.phone || "Unknown lead",
      phone: l.phone || null,
      city: null,
      source: l.source,
      status: l.status,
      createdAt: l.created_at,
    }));

    // 12) Map inbox_leads.id -> canonical leads.id (only query if needed)
    const inboxLeadIds = Array.from(
      new Set((eventRows || []).map((row) => row.lead_id).filter((id) => id != null))
    );

    const inboxToCanonical = {};
    if (inboxLeadIds.length > 0) {
      const { data: inboxMapRows, error: inboxMapError } = await supabase
        .from("inbox_leads")
        .select("id, lead_id")
        .in("id", inboxLeadIds);

      if (!inboxMapError) {
        for (const r of inboxMapRows || []) {
          if (r.id != null) inboxToCanonical[r.id] = r.lead_id || null;
        }
      }
    }

    // 13) Normalize events + messages
    const activityFromEvents = (eventRows || []).map((row) => {
      let label = row.event_type;
      if (row.event_type === "missed_call") label = "Missed call";
      else if (row.event_type === "sms_sent_auto_reply") label = "AI sent SMS auto-reply";
      else if (row.event_type === "lead_created") label = "New lead created";

      const inboxLeadId = row.lead_id || null;
      const canonicalLeadId = inboxLeadId && inboxToCanonical[inboxLeadId]
        ? inboxToCanonical[inboxLeadId] : null;

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

    const activityFromMessages = (messageRows || []).map((row) => {
      const kind = row.channel || "message";
      const direction = row.direction || "inbound";

      let baseLabel;
      if (kind === "sms") baseLabel = direction === "outbound" ? "You sent an SMS" : "Lead sent an SMS";
      else if (kind === "email") baseLabel = direction === "outbound" ? "You sent an email" : "Lead sent an email";
      else if (kind === "call") baseLabel = "Voice AI call";
      else baseLabel = direction === "outbound" ? "You sent a message" : "Lead sent a message";

      const preview = row.snippet || row.subject || row.preview || row.body_preview || null;
      const label = preview ? `${baseLabel} \u2013 ${String(preview).slice(0, 80)}` : baseLabel;

      return {
        id: `msg-${row.id}`,
        inboxLeadId: null,
        leadId: row.lead_id || null,
        type: `message.${kind}`,
        label,
        timestamp: row.created_at,
        payload: { kind, direction, subject: row.subject || null },
      };
    });

    // 14) Merge + sort + trim
    const combinedActivity = [...activityFromEvents, ...activityFromMessages];
    combinedActivity.sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta;
    });
    const activity = combinedActivity.slice(0, 30);

    res.setHeader("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
    return res.status(200).json({
      kpis: {
        // Financial — multiple time ranges
        totalRevenue,
        totalExpenses,
        totalProfit: totalRevenue - totalExpenses,
        revenue30d,
        expenses30d,
        profit30d: revenue30d - expenses30d,
        revenueMtd,
        revenueWtd,
        expensesMtd,
        profitMtd: revenueMtd - expensesMtd,
        outstandingBalance: Math.round(outstandingBalance),
        pipelineValue,
        // Leads & jobs
        totalLeads,
        activeJobs,
        conversionRate,
        // AI performance
        missedCallsThisWeek,
        voiceCallsThisWeek,
        aiRepliesThisWeek,
        newLeadsThisWeek,
        hotLeadsCount,
        // Tasks
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
