// lib/brain/runners/analytics.js
// Analytics/KPI tools for Brain v2

export async function runGetKpisTool(supabase, customerId, args) {
  const { period } = args || {};

  // Determine date range
  let sinceIso = null;
  let periodLabel = "all time";

  if (period) {
    const now = new Date();
    const p = String(period).toLowerCase();

    if (p === "today") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      sinceIso = start.toISOString();
      periodLabel = "today";
    } else if (p === "week" || p === "7d") {
      sinceIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      periodLabel = "last 7 days";
    } else if (p === "month" || p === "30d") {
      sinceIso = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      periodLabel = "last 30 days";
    } else if (p === "quarter" || p === "90d") {
      sinceIso = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      periodLabel = "last 90 days";
    } else if (p === "year" || p === "365d") {
      sinceIso = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
      periodLabel = "last 365 days";
    }
  }

  // Fetch leads
  let leadsQ = supabase
    .from("leads")
    .select("id, status, source, created_at")
    .eq("customer_id", customerId);

  if (sinceIso) {
    leadsQ = leadsQ.gte("created_at", sinceIso);
  }

  const { data: leads, error: leadsErr } = await leadsQ;

  if (leadsErr) {
    console.error("[brain/analytics] get_kpis leads error:", leadsErr);
    throw new Error("Failed to fetch lead data for KPIs.");
  }

  const allLeads = leads || [];
  const totalLeads = allLeads.length;

  // Count by status
  const statusCounts = {};
  for (const l of allLeads) {
    const s = l.status || "unknown";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }

  // Count by source
  const sourceCounts = {};
  for (const l of allLeads) {
    const s = l.source || "unknown";
    sourceCounts[s] = (sourceCounts[s] || 0) + 1;
  }

  // Fetch jobs for revenue/conversion
  let jobsQ = supabase
    .from("jobs")
    .select("id, status, quote_amount, created_at")
    .eq("customer_id", customerId);

  if (sinceIso) {
    jobsQ = jobsQ.gte("created_at", sinceIso);
  }

  const { data: jobs, error: jobsErr } = await jobsQ;

  if (jobsErr) {
    console.error("[brain/analytics] get_kpis jobs error:", jobsErr);
  }

  const allJobs = jobs || [];
  const totalJobs = allJobs.length;
  const signedJobs = allJobs.filter((j) =>
    ["signed", "scheduled", "completed", "paid_in_full"].includes(j.status)
  );
  const pipelineValue = allJobs.reduce(
    (sum, j) => sum + (j.quote_amount ? Number(j.quote_amount) : 0),
    0
  );
  const wonValue = signedJobs.reduce(
    (sum, j) => sum + (j.quote_amount ? Number(j.quote_amount) : 0),
    0
  );
  const conversionRate =
    totalLeads > 0
      ? Math.round((signedJobs.length / totalLeads) * 100 * 10) / 10
      : 0;

  // Fetch calls summary
  let callsQ = supabase
    .from("call_scores")
    .select("id, call_successful, total_score, meeting_booked")
    .eq("customer_id", customerId);

  if (sinceIso) {
    callsQ = callsQ.gte("created_at", sinceIso);
  }

  const { data: calls } = await callsQ;
  const allCalls = calls || [];
  const totalCalls = allCalls.length;
  const successfulCalls = allCalls.filter((c) => c.call_successful).length;
  const meetingsBooked = allCalls.filter((c) => c.meeting_booked).length;
  const avgCallScore =
    allCalls.length > 0
      ? Math.round(
          allCalls.reduce((s, c) => s + (c.total_score || 0), 0) / allCalls.length
        )
      : null;

  // Fetch pending tasks count
  let tasksQ = supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .eq("status", "pending");

  const { count: pendingTasks } = await tasksQ;

  const kpis = {
    period: periodLabel,
    leads: {
      total: totalLeads,
      byStatus: statusCounts,
      bySource: sourceCounts,
    },
    jobs: {
      total: totalJobs,
      signed: signedJobs.length,
      pipelineValue,
      wonValue,
      conversionRate,
    },
    calls: {
      total: totalCalls,
      successful: successfulCalls,
      meetingsBooked,
      avgScore: avgCallScore,
    },
    tasks: {
      pending: pendingTasks || 0,
    },
  };

  return {
    intent: "get_kpis",
    resultType: "kpi_summary",
    title: `KPIs (${periodLabel})`,
    items: [kpis],
    aiSummary: `${periodLabel}: ${totalLeads} leads, ${totalJobs} jobs ($${pipelineValue.toLocaleString()} pipeline, $${wonValue.toLocaleString()} won), ${conversionRate}% conversion, ${totalCalls} calls.`,
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

  // Group by status
  const stages = {};
  for (const l of allLeads) {
    const s = l.status || "unknown";
    if (!stages[s]) {
      stages[s] = { status: s, count: 0, leadIds: [] };
    }
    stages[s].count++;
    if (stages[s].leadIds.length < 5) {
      stages[s].leadIds.push(l.id);
    }
  }

  // Order: new -> contacted -> active -> quoted -> closed/dead/lost/won
  const order = ["new", "contacted", "active", "quoted", "cold", "closed", "dead", "won"];
  const items = order
    .filter((s) => stages[s])
    .map((s) => stages[s])
    .concat(
      Object.values(stages).filter((s) => !order.includes(s.status))
    );

  const total = allLeads.length;

  return {
    intent: "get_pipeline",
    resultType: "pipeline",
    title: "Lead pipeline",
    items,
    aiSummary: `Pipeline: ${total} total leads across ${items.length} stages. ${
      items
        .map((s) => `${s.status}: ${s.count}`)
        .join(", ")
    }.`,
  };
}
