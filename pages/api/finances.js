import { getAuthContext } from "../../lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (!customerId) return res.status(403).json({ error: "No customer mapping" });

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const weekStart = (() => {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay());
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    })();

    // ALL payments (succeeded) — single query, filter in JS for time ranges
    const { data: allPayments } = await supabase
      .from("payments")
      .select("amount, created_at, job_id, payment_type")
      .eq("customer_id", customerId)
      .eq("status", "succeeded");

    const totalRevenue = (allPayments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
    const monthPayments = (allPayments || []).filter(p => p.created_at >= monthStart);
    const revenueMtd = monthPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const weekPayments = (allPayments || []).filter(p => p.created_at >= weekStart);
    const revenueWtd = weekPayments.reduce((s, p) => s + Number(p.amount || 0), 0);

    // ALL expenses — single query, filter in JS
    const { data: allExpenses } = await supabase
      .from("expenses")
      .select("total, category, vendor, paid_at, receipt_url, description, job_id")
      .eq("customer_id", customerId);

    const totalExpenses = (allExpenses || []).reduce((s, e) => s + Number(e.total || 0), 0);
    const monthExpenses = (allExpenses || []).filter(e => e.paid_at >= monthStart);
    const expensesMtd = monthExpenses.reduce((s, e) => s + Number(e.total || 0), 0);
    const weekExpenses = (allExpenses || []).filter(e => e.paid_at >= weekStart);
    const expensesWtd = weekExpenses.reduce((s, e) => s + Number(e.total || 0), 0);

    // Monthly trend (last 6 months) — computed from already-fetched data
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = d.toISOString();
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
      const monthName = d.toLocaleDateString("fr-CA", { month: "short" });

      const rev = (allPayments || [])
        .filter(p => p.created_at >= mStart && p.created_at < mEnd)
        .reduce((s, p) => s + Number(p.amount || 0), 0);
      const exp = (allExpenses || [])
        .filter(e => e.paid_at >= mStart && e.paid_at < mEnd)
        .reduce((s, e) => s + Number(e.total || 0), 0);
      monthlyTrend.push({ month: monthName, revenue: rev, expenses: exp, profit: rev - exp });
    }

    // Payment methods breakdown (all time, by payment_type)
    const methods = {};
    for (const p of allPayments || []) {
      const m = (p.payment_type || "other").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      methods[m] = (methods[m] || 0) + Number(p.amount || 0);
    }
    const paymentMethods = Object.entries(methods).map(([name, value]) => ({ name, value }));

    // Top clients by revenue (all time)
    const jobRevenue = {};
    for (const p of allPayments || []) {
      jobRevenue[p.job_id] = (jobRevenue[p.job_id] || 0) + Number(p.amount || 0);
    }

    const topJobIds = Object.entries(jobRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => Number(id));

    let topClients = [];
    if (topJobIds.length > 0) {
      const { data: topJobs } = await supabase
        .from("jobs")
        .select("id, client_name, job_id")
        .in("id", topJobIds);

      topClients = (topJobs || []).map(j => ({
        name: j.client_name,
        jobId: j.job_id,
        revenue: jobRevenue[j.id] || 0,
      })).sort((a, b) => b.revenue - a.revenue);
    }

    // Outstanding balance (TTC owed - total paid across non-cancelled jobs)
    const { data: jobsWithQuotes } = await supabase
      .from("jobs")
      .select("id, quote_amount, status")
      .eq("customer_id", customerId)
      .not("status", "in", "(cancelled,lost)");

    let totalTtcOwed = 0;
    const activeJobIds = [];
    for (const j of jobsWithQuotes || []) {
      if (j.quote_amount) {
        totalTtcOwed += Number(j.quote_amount) * 1.14975;
        activeJobIds.push(j.id);
      }
    }

    let totalPaidOnJobs = 0;
    if (activeJobIds.length > 0) {
      const { data: jobPayments } = await supabase
        .from("payments")
        .select("amount")
        .eq("customer_id", customerId)
        .eq("status", "succeeded")
        .in("job_id", activeJobIds);

      totalPaidOnJobs = (jobPayments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
    }
    const outstandingBalance = Math.max(0, totalTtcOwed - totalPaidOnJobs);

    // Collection rate
    const collectionRate = totalTtcOwed > 0 ? Math.round((totalPaidOnJobs / totalTtcOwed) * 100) : 0;

    // Pending payments
    const { data: pendingRows } = await supabase
      .from("payments")
      .select("id, amount, created_at, job_id, payment_type")
      .eq("customer_id", customerId)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    let pendingPayments = [];
    if (pendingRows && pendingRows.length > 0) {
      const pendingJobIds = [...new Set(pendingRows.map(p => p.job_id))];
      const { data: pendingJobs } = await supabase
        .from("jobs")
        .select("id, client_name, job_id")
        .in("id", pendingJobIds);

      const jobMap = {};
      for (const j of pendingJobs || []) jobMap[j.id] = j;

      pendingPayments = pendingRows.map(p => ({
        id: p.id,
        client: jobMap[p.job_id]?.client_name || "Unknown",
        jobNumber: jobMap[p.job_id]?.job_id || "\u2014",
        jobDbId: p.job_id,
        amount: Number(p.amount || 0),
        type: p.payment_type,
        daysOverdue: Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400000),
      }));
    }

    // By person breakdown (from financial_logs)
    const { data: financialLogs } = await supabase
      .from("financial_logs")
      .select("log_type, amount, submitted_by")
      .eq("customer_id", customerId);

    const byPerson = {};
    for (const log of financialLogs || []) {
      const person = log.submitted_by || "Unknown";
      if (!byPerson[person]) byPerson[person] = { payments: 0, expenses: 0 };
      const amt = parseFloat(log.amount) || 0;
      if (log.log_type === "payment") byPerson[person].payments += amt;
      else if (log.log_type === "expense") byPerson[person].expenses += amt;
    }

    // Recent expenses (all time, latest 10)
    const recentExpenses = (allExpenses || [])
      .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))
      .slice(0, 10)
      .map(e => ({
        vendor: e.vendor || "\u2014",
        amount: Number(e.total || 0),
        category: e.category || "\u2014",
        description: e.description || "",
        receiptUrl: e.receipt_url || null,
        date: e.paid_at,
      }));

    return res.status(200).json({
      totalRevenue,
      totalExpenses,
      totalProfit: totalRevenue - totalExpenses,
      revenueMtd,
      revenueWtd,
      expensesMtd,
      expensesWtd,
      profitMtd: revenueMtd - expensesMtd,
      profitWtd: revenueWtd - expensesWtd,
      outstandingBalance: Math.round(outstandingBalance),
      collectionRate,
      monthlyTrend,
      paymentMethods,
      topClients,
      pendingPayments,
      recentExpenses,
      byPerson,
    });
  } catch (err) {
    console.error("[api/finances] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
