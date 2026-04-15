// lib/brain/runners/analytics.js
// Analytics/KPI tools for Brain v2

export async function runGetKpisTool(supabase, customerId, args) {
  const { period } = args || {};

  // Determine date range
  const now = new Date();
  let sinceIso = null;
  let periodLabel = "all time";
  let periodMs = null;

  if (period) {
    const p = String(period).toLowerCase();
    if (p === "today") {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      sinceIso = start.toISOString();
      periodLabel = "today";
      periodMs = now.getTime() - start.getTime();
    } else if (p === "week" || p === "7d") {
      periodMs = 7 * 86400000;
      sinceIso = new Date(now.getTime() - periodMs).toISOString();
      periodLabel = "last 7 days";
    } else if (p === "month" || p === "30d") {
      periodMs = 30 * 86400000;
      sinceIso = new Date(now.getTime() - periodMs).toISOString();
      periodLabel = "last 30 days";
    } else if (p === "quarter" || p === "90d") {
      periodMs = 90 * 86400000;
      sinceIso = new Date(now.getTime() - periodMs).toISOString();
      periodLabel = "last 90 days";
    } else if (p === "year" || p === "365d") {
      periodMs = 365 * 86400000;
      sinceIso = new Date(now.getTime() - periodMs).toISOString();
      periodLabel = "last 365 days";
    }
  }

  // ── Current period queries (parallel) ──
  let leadsQ = supabase.from("leads").select("id, status, source, created_at").eq("customer_id", customerId);
  let jobsQ = supabase.from("jobs").select("id, status, quote_amount, created_at").eq("customer_id", customerId);
  let paymentsQ = supabase.from("payments").select("id, amount, created_at").eq("customer_id", customerId).eq("status", "succeeded");
  let messagesQ = supabase.from("messages").select("channel, direction, created_at").eq("customer_id", customerId);
  let callsQ = supabase.from("call_scores").select("id, call_successful, total_score, meeting_booked, created_at").eq("customer_id", customerId);
  let tasksQ = supabase.from("tasks").select("id, status").eq("customer_id", customerId);
  let quotesQ = supabase.from("quotes").select("id, total_ttc, created_at").eq("customer_id", customerId).not("status", "eq", "draft");

  if (sinceIso) {
    leadsQ = leadsQ.gte("created_at", sinceIso);
    jobsQ = jobsQ.gte("created_at", sinceIso);
    paymentsQ = paymentsQ.gte("created_at", sinceIso);
    messagesQ = messagesQ.gte("created_at", sinceIso);
    callsQ = callsQ.gte("created_at", sinceIso);
    tasksQ = tasksQ.gte("created_at", sinceIso);
    quotesQ = quotesQ.gte("created_at", sinceIso);
  }

  const [
    { data: leads, error: leadsErr },
    { data: jobs },
    { data: payments },
    { data: messages },
    { data: calls },
    { data: tasks },
    { data: quotes },
  ] = await Promise.all([leadsQ, jobsQ, paymentsQ, messagesQ, callsQ, tasksQ, quotesQ]);

  if (leadsErr) {
    console.error("[brain/analytics] get_kpis leads error:", leadsErr);
    throw new Error("Failed to fetch lead data for KPIs.");
  }

  // ── Previous period (for comparison) ──
  let prevLeadCount = null;
  let prevRevenue = null;
  if (periodMs && sinceIso) {
    const prevSince = new Date(new Date(sinceIso).getTime() - periodMs).toISOString();
    const [{ data: pLeads }, { data: pPayments }] = await Promise.all([
      supabase.from("leads").select("id").eq("customer_id", customerId).gte("created_at", prevSince).lt("created_at", sinceIso),
      supabase.from("payments").select("amount").eq("customer_id", customerId).eq("status", "succeeded").gte("created_at", prevSince).lt("created_at", sinceIso),
    ]);
    prevLeadCount = (pLeads || []).length;
    prevRevenue = (pPayments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
  }

  // ── Compute metrics ──
  const allLeads = leads || [];
  const totalLeads = allLeads.length;

  // Status breakdown
  const statusCounts = {};
  for (const l of allLeads) statusCounts[l.status || "new"] = (statusCounts[l.status || "new"] || 0) + 1;

  // Source breakdown
  const sourceCounts = {};
  for (const l of allLeads) sourceCounts[l.source || "unknown"] = (sourceCounts[l.source || "unknown"] || 0) + 1;
  const topSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Jobs & conversion
  const allJobs = jobs || [];
  const signedJobs = allJobs.filter((j) => ["signed", "scheduled", "completed", "paid_in_full"].includes(j.status));
  const pipelineValue = allJobs.reduce((s, j) => s + Number(j.quote_amount || 0), 0);
  const wonValue = signedJobs.reduce((s, j) => s + Number(j.quote_amount || 0), 0);

  // Revenue from payments
  const allPayments = payments || [];
  const totalRevenue = allPayments.reduce((s, p) => s + Number(p.amount || 0), 0);

  // Quotes
  const allQuotes = quotes || [];
  const quotesValue = allQuotes.reduce((s, q) => s + Number(q.total_ttc || 0), 0);

  // Conversion
  const conversionRate = totalLeads > 0 ? Math.round((signedJobs.length / totalLeads) * 1000) / 10 : 0;

  // Communications
  const allMessages = messages || [];
  const msgByChannel = {};
  for (const m of allMessages) msgByChannel[m.channel || "other"] = (msgByChannel[m.channel || "other"] || 0) + 1;
  const outbound = allMessages.filter((m) => m.direction === "outbound").length;
  const inbound = allMessages.filter((m) => m.direction === "inbound").length;

  // Calls
  const allCalls = calls || [];
  const successfulCalls = allCalls.filter((c) => c.call_successful).length;
  const meetingsBooked = allCalls.filter((c) => c.meeting_booked).length;
  const avgCallScore = allCalls.length > 0 ? Math.round(allCalls.reduce((s, c) => s + (c.total_score || 0), 0) / allCalls.length) : null;

  // Tasks
  const allTasks = tasks || [];
  const openTasks = allTasks.filter((t) => t.status === "pending" || t.status === "open").length;
  const completedTasks = allTasks.filter((t) => t.status === "completed" || t.status === "done").length;

  // Trends
  const leadTrend = prevLeadCount !== null && prevLeadCount > 0 ? Math.round(((totalLeads - prevLeadCount) / prevLeadCount) * 100) : null;
  const revTrend = prevRevenue !== null && prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : null;

  // ── Build structured summary for AI (natural language context, NOT shown to user) ──
  const summaryParts = [];
  summaryParts.push(`Period: ${periodLabel}. ${totalLeads} leads${leadTrend !== null ? ` (${leadTrend >= 0 ? "+" : ""}${leadTrend}% vs previous period)` : ""}.`);
  if (topSources.length > 0) summaryParts.push(`Top sources: ${topSources.map(([s, c]) => `${s.replace(/_/g, " ")} (${c})`).join(", ")}.`);
  summaryParts.push(`Funnel: ${totalLeads} leads → ${allQuotes.length} quotes (${quotesValue > 0 ? "$" + Math.round(quotesValue).toLocaleString() : "$0"}) → ${signedJobs.length} signed → ${allPayments.length} payments. Conversion: ${conversionRate}%.`);
  if (totalRevenue > 0 || pipelineValue > 0) summaryParts.push(`Revenue: $${Math.round(totalRevenue).toLocaleString()}. Pipeline: $${Math.round(pipelineValue).toLocaleString()}. Won: $${Math.round(wonValue).toLocaleString()}.`);
  summaryParts.push(`Comms: ${allMessages.length} messages (${inbound} in, ${outbound} out). Channels: ${Object.entries(msgByChannel).map(([ch, c]) => `${ch}: ${c}`).join(", ")}.`);
  if (allCalls.length > 0) summaryParts.push(`Calls: ${allCalls.length} total, ${successfulCalls} successful, ${meetingsBooked} meetings booked${avgCallScore !== null ? `, avg score ${avgCallScore}/100` : ""}.`);
  summaryParts.push(`Tasks: ${openTasks} open, ${completedTasks} completed.`);
  const lines = summaryParts;

  return {
    intent: "get_kpis",
    resultType: "kpi_summary",
    title: `KPIs (${periodLabel})`,
    items: [{
      period: periodLabel,
      leads: { total: totalLeads, byStatus: statusCounts, bySource: sourceCounts, trend: leadTrend },
      funnel: { quotes: allQuotes.length, quotesValue: Math.round(quotesValue), signed: signedJobs.length, payments: allPayments.length, conversionRate },
      revenue: { total: Math.round(totalRevenue), pipeline: Math.round(pipelineValue), won: Math.round(wonValue), trend: revTrend },
      communications: { total: allMessages.length, byChannel: msgByChannel, inbound, outbound },
      calls: { total: allCalls.length, successful: successfulCalls, meetingsBooked, avgScore: avgCallScore },
      tasks: { open: openTasks, completed: completedTasks },
    }],
    aiSummary: lines.join("\n"),
  };
}

export async function runGetPipelineTool(supabase, customerId) {
  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, status")
    .eq("customer_id", customerId);

  if (error) {
    console.error("[brain/analytics] get_pipeline error:", error);
    throw new Error("Failed to fetch pipeline data.");
  }

  const allLeads = leads || [];
  const stages = {};
  for (const l of allLeads) {
    const s = l.status || "unknown";
    if (!stages[s]) stages[s] = { status: s, count: 0, leadIds: [] };
    stages[s].count++;
    if (stages[s].leadIds.length < 5) stages[s].leadIds.push(l.id);
  }

  const order = ["new", "contacted", "active", "quoted", "cold", "closed", "dead", "won"];
  const items = order
    .filter((s) => stages[s])
    .map((s) => stages[s])
    .concat(Object.values(stages).filter((s) => !order.includes(s.status)));

  return {
    intent: "get_pipeline",
    resultType: "pipeline",
    title: "Lead pipeline",
    items,
    aiSummary: `Pipeline: ${allLeads.length} total leads across ${items.length} stages. ${items.map((s) => `${s.status}: ${s.count}`).join(", ")}.`,
  };
}
