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

    // Revenue this month
    const { data: monthPayments } = await supabase
      .from("payments")
      .select("amount, method, created_at, job_id, payment_type")
      .eq("customer_id", customerId)
      .eq("status", "succeeded")
      .gte("created_at", monthStart);

    const revenueMtd = (monthPayments || []).reduce((s, p) => s + Number(p.amount || 0), 0);

    // Revenue this week
    const weekPayments = (monthPayments || []).filter(p => p.created_at >= weekStart);
    const revenueWtd = weekPayments.reduce((s, p) => s + Number(p.amount || 0), 0);

    // Expenses this month
    const { data: monthExpenses } = await supabase
      .from("expenses")
      .select("total, category, vendor, paid_at, receipt_url, description, job_id")
      .eq("customer_id", customerId)
      .gte("paid_at", monthStart);

    const expensesMtd = (monthExpenses || []).reduce((s, e) => s + Number(e.total || 0), 0);

    // Expenses this week
    const weekExpenses = (monthExpenses || []).filter(e => e.paid_at >= weekStart);
    const expensesWtd = weekExpenses.reduce((s, e) => s + Number(e.total || 0), 0);

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = d.toISOString();
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
      const monthName = d.toLocaleDateString("fr-CA", { month: "short" });

      const { data: mPay } = await supabase
        .from("payments")
        .select("amount")
        .eq("customer_id", customerId)
        .eq("status", "succeeded")
        .gte("created_at", mStart)
        .lt("created_at", mEnd);

      const { data: mExp } = await supabase
        .from("expenses")
        .select("total")
        .eq("customer_id", customerId)
        .gte("paid_at", mStart)
        .lt("paid_at", mEnd);

      const rev = (mPay || []).reduce((s, p) => s + Number(p.amount || 0), 0);
      const exp = (mExp || []).reduce((s, e) => s + Number(e.total || 0), 0);
      monthlyTrend.push({ month: monthName, revenue: rev, expenses: exp, profit: rev - exp });
    }

    // Payment methods breakdown
    const methods = {};
    for (const p of monthPayments || []) {
      const m = p.method || "other";
      methods[m] = (methods[m] || 0) + Number(p.amount || 0);
    }
    const paymentMethods = Object.entries(methods).map(([name, value]) => ({ name, value }));

    // Top clients by revenue (all time)
    const { data: allPayments } = await supabase
      .from("payments")
      .select("amount, job_id")
      .eq("customer_id", customerId)
      .eq("status", "succeeded");

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
        jobNumber: jobMap[p.job_id]?.job_id || "—",
        jobDbId: p.job_id,
        amount: Number(p.amount || 0),
        type: p.payment_type,
        daysOverdue: Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400000),
      }));
    }

    // Recent expenses
    const recentExpenses = (monthExpenses || [])
      .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))
      .slice(0, 10)
      .map(e => ({
        vendor: e.vendor || "—",
        amount: Number(e.total || 0),
        category: e.category || "—",
        description: e.description || "",
        receiptUrl: e.receipt_url || null,
        date: e.paid_at,
      }));

    // Collection rate
    const { data: allJobs } = await supabase
      .from("jobs")
      .select("id, quote_amount")
      .eq("customer_id", customerId)
      .not("quote_amount", "is", null);

    const totalInvoiced = (allJobs || []).reduce((s, j) => s + Number(j.quote_amount || 0) * 1.14975, 0);
    const totalCollected = (allPayments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
    const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

    return res.status(200).json({
      revenueMtd,
      revenueWtd,
      expensesMtd,
      expensesWtd,
      profitMtd: revenueMtd - expensesMtd,
      profitWtd: revenueWtd - expensesWtd,
      collectionRate,
      monthlyTrend,
      paymentMethods,
      topClients,
      pendingPayments,
      recentExpenses,
    });
  } catch (err) {
    console.error("[api/finances] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
