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
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, job_id, client_name, quote_amount, deposit_amount, payment_terms, status, progress_pct")
      .eq("customer_id", customerId)
      .eq("id", id)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Pull the latest non-superseded quote — this is the live source of truth for
    // subtotal/taxes/ttc. jobs.quote_amount is kept as a denormalized field but can
    // drift when the editor saves line items; the quote row is always authoritative.
    const { data: quotes } = await supabase
      .from("quotes")
      .select("id, subtotal, tax_gst, tax_qst, total_ttc, line_items, meta, status, version")
      .eq("customer_id", customerId)
      .eq("job_id", job.id)
      .neq("status", "superseded")
      .order("version", { ascending: false })
      .limit(1);

    const latestQuote = (quotes && quotes[0]) || null;

    const subtotal = latestQuote
      ? Number(latestQuote.subtotal || 0)
      : Number(job.quote_amount || 0);
    const tps = latestQuote
      ? Number(latestQuote.tax_gst || 0)
      : subtotal * 0.05;
    const tvq = latestQuote
      ? Number(latestQuote.tax_qst || 0)
      : subtotal * 0.09975;
    const ttc = latestQuote
      ? Number(latestQuote.total_ttc || 0)
      : subtotal + tps + tvq;

    // Estimated supplier cost from the quote's line items (_supplier_cost || _cost × qty).
    // Field naming is historically inconsistent across codepaths:
    //   - Dispatcher (apply-dispatch.js) and backfill scripts write `_supplier_cost`
    //   - Legacy apply-supplier-pricing writes `_cost` for standard-matched items and
    //     `_supplier_cost` for hardcoded items
    //   - Hardcoded matches in the legacy route also write `_cost`
    // Accept either; fall back to 0 if both are absent.
    // This is Jérémy's PROJECTED material cost for margin forecasting — NOT a real expense
    // until he actually pays the supplier invoice (which he logs manually).
    const lineItems = Array.isArray(latestQuote?.line_items) ? latestQuote.line_items : [];
    const estimatedMaterialCost = lineItems.reduce((sum, li) => {
      const cost = Number(li._supplier_cost ?? li._cost ?? 0);
      const qty = Number(li.qty || 1);
      return sum + cost * qty;
    }, 0);

    // Deposit info
    let depositPct = 50;
    if (job.payment_terms && typeof job.payment_terms === "object") {
      depositPct = job.payment_terms.signature || job.payment_terms.deposit || 50;
    }
    const depositAmount = ttc * (depositPct / 100);

    // Real payments logged
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

    // Real expenses logged by Jérémy (supplier invoices paid, gas receipts, sous-traitance, etc.)
    // Auto-inserted rows with source='soumission_fournisseur' are legacy/incorrect and filtered out.
    const { data: rawExpenses } = await supabase
      .from("expenses")
      .select("id, total, vendor, category, description, paid_at, receipt_url, payment_method, source")
      .eq("customer_id", customerId)
      .eq("job_id", job.id)
      .order("paid_at", { ascending: true });

    const AUTO_SOURCES = new Set(["soumission_fournisseur", "supplier_return_global"]);
    const expenses = (rawExpenses || []).filter(e => !AUTO_SOURCES.has(e.source));
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.total || 0), 0);

    const balanceRemaining = Math.max(0, ttc - totalPaid);

    // Projected margin: what Jérémy will net if he pays estimated material cost + logged expenses
    // against the full client TTC. Shown during quote/contract phase.
    const marginProjected = ttc - estimatedMaterialCost - totalExpenses;
    const marginProjectedPct = ttc > 0 ? Math.round((marginProjected / ttc) * 100) : 0;

    // Realized margin: what Jérémy has actually netted based on logged payments vs logged expenses.
    // Only meaningful once money starts flowing.
    const marginRealized = totalPaid - totalExpenses;
    const marginRealizedPct = totalPaid > 0 ? Math.round((marginRealized / totalPaid) * 100) : 0;

    // Default "margin" field = projected (what Jérémy cares about in quote phase).
    // Frontend can switch to realized once payments come in.
    const useProjected = totalPaid === 0;
    const margin = useProjected ? marginProjected : marginRealized;
    const marginPct = useProjected ? marginProjectedPct : marginRealizedPct;

    const promoEnabled = !!(latestQuote?.meta?.promo_enabled);
    const promoRebate = Number(latestQuote?.meta?.promo_rebate || 0);

    return res.status(200).json({
      jobId: job.job_id,
      clientName: job.client_name,
      status: job.status,
      progressPct: job.progress_pct || 0,
      quoteAmount: subtotal,
      promoEnabled,
      promoRebate,
      subtotal: Math.round(subtotal * 100) / 100,
      tps: Math.round(tps * 100) / 100,
      tvq: Math.round(tvq * 100) / 100,
      ttc: Math.round(ttc * 100) / 100,
      estimatedMaterialCost: Math.round(estimatedMaterialCost * 100) / 100,
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
      expenses: expenses.map(e => ({
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
      marginProjected: Math.round(marginProjected * 100) / 100,
      marginProjectedPct,
      marginRealized: Math.round(marginRealized * 100) / 100,
      marginRealizedPct,
      marginMode: useProjected ? "projected" : "realized",
    });
  } catch (err) {
    console.error("[api/jobs/[id]/finances] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
