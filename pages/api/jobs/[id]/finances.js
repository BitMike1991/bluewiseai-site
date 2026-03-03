import { getAuthContext } from "../../../../lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (!customerId) return res.status(403).json({ error: "No customer mapping" });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing job id" });

  try {
    // Fetch job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, job_id, client_name, quote_amount, deposit_amount, payment_terms, status, progress_pct")
      .eq("customer_id", customerId)
      .eq("id", id)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const quoteAmount = Number(job.quote_amount || 0);
    const tps = quoteAmount * 0.05;
    const tvq = quoteAmount * 0.09975;
    const ttc = quoteAmount * 1.14975;

    // Deposit info
    let depositPct = 50;
    if (job.payment_terms && typeof job.payment_terms === "object") {
      depositPct = job.payment_terms.signature || job.payment_terms.deposit || 50;
    }
    const depositAmount = ttc * (depositPct / 100);

    // Payments
    const { data: payments } = await supabase
      .from("payments")
      .select("id, amount, payment_method, payment_type, status, created_at, receipt_url")
      .eq("job_id", job.id)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: true });

    const totalPaid = (payments || [])
      .filter(p => p.status === "succeeded")
      .reduce((s, p) => s + Number(p.amount || 0), 0);

    const pendingAmount = (payments || [])
      .filter(p => p.status === "pending")
      .reduce((s, p) => s + Number(p.amount || 0), 0);

    // Expenses for this job
    const { data: expenses } = await supabase
      .from("expenses")
      .select("id, total, vendor, category, description, paid_at, receipt_url, payment_method")
      .eq("customer_id", customerId)
      .eq("job_id", job.id)
      .order("paid_at", { ascending: true });

    const totalExpenses = (expenses || []).reduce((s, e) => s + Number(e.total || 0), 0);

    const balanceRemaining = Math.max(0, ttc - totalPaid);
    const margin = totalPaid - totalExpenses;
    const marginPct = totalPaid > 0 ? Math.round((margin / totalPaid) * 100) : 0;

    return res.status(200).json({
      jobId: job.job_id,
      clientName: job.client_name,
      status: job.status,
      progressPct: job.progress_pct || 0,
      quoteAmount,
      subtotal: quoteAmount,
      tps: Math.round(tps * 100) / 100,
      tvq: Math.round(tvq * 100) / 100,
      ttc: Math.round(ttc * 100) / 100,
      depositPct,
      depositAmount: Math.round(depositAmount * 100) / 100,
      payments: (payments || []).map(p => ({
        id: p.id,
        amount: Number(p.amount || 0),
        method: p.payment_method,
        type: p.payment_type,
        status: p.status,
        date: p.created_at,
        receiptUrl: p.receipt_url,
      })),
      expenses: (expenses || []).map(e => ({
        id: e.id,
        amount: Number(e.total || 0),
        vendor: e.vendor,
        category: e.category,
        description: e.description,
        date: e.paid_at,
        receiptUrl: e.receipt_url,
        method: e.payment_method,
      })),
      totalPaid,
      pendingAmount,
      totalExpenses,
      balanceRemaining: Math.round(balanceRemaining * 100) / 100,
      margin: Math.round(margin * 100) / 100,
      marginPct,
    });
  } catch (err) {
    console.error("[api/jobs/[id]/finances] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
