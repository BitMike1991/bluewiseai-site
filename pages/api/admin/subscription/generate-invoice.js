// pages/api/admin/subscription/generate-invoice.js
// Called by n8n cron on 1st of month at 8 AM. Generates monthly invoice.
import { getSupabaseServerClient } from "../../../../lib/supabaseServer";
import { getSubscription, computeRevenueShare, logEvent, sendBillingSlack } from "../../../../lib/subscriptionGate";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Auth: CRON_SECRET (timing-safe comparison)
  const { checkCronSecret } = await import("../../../../lib/security");
  if (checkCronSecret(req, res)) return;

  const { customerId: targetId, month, year } = req.body;
  if (!targetId) {
    return res.status(400).json({ error: "customerId is required" });
  }
  const custId = targetId;

  try {
    const sub = await getSubscription(custId);
    if (!sub) return res.status(404).json({ error: "No subscription found" });

    // Compute period: previous month by default
    const now = new Date();
    const invoiceYear = year || (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
    const invoiceMonth = month || (now.getMonth() === 0 ? 12 : now.getMonth()); // 1-indexed

    const periodStart = `${invoiceYear}-${String(invoiceMonth).padStart(2, "0")}-01`;
    const periodEndDate = new Date(invoiceYear, invoiceMonth, 0); // last day of month
    const periodEnd = periodEndDate.toISOString().split("T")[0];
    const nextMonthStart = `${invoiceMonth === 12 ? invoiceYear + 1 : invoiceYear}-${String(invoiceMonth === 12 ? 1 : invoiceMonth + 1).padStart(2, "0")}-01`;

    // Invoice number: BW-YYYY-MM
    const invoiceNumber = `BW-${invoiceYear}-${String(invoiceMonth).padStart(2, "0")}`;

    // Check if invoice already exists
    const sb = getSupabaseServerClient();
    const { data: existing } = await sb
      .from("subscription_invoices")
      .select("id")
      .eq("invoice_number", invoiceNumber)
      .eq("customer_id", custId)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: "Invoice already exists", invoice_number: invoiceNumber });
    }

    // Compute revenue share
    const rate = parseFloat(sub.revenue_share_rate);
    const baseFee = parseFloat(sub.base_fee);
    const revenue = await computeRevenueShare(custId, periodStart, nextMonthStart, rate);

    const amountDue = baseFee + revenue.performanceFee;

    // Create invoice
    const { data: invoice, error: insertErr } = await sb
      .from("subscription_invoices")
      .insert({
        customer_id: custId,
        invoice_number: invoiceNumber,
        period_start: periodStart,
        period_end: periodEnd,
        gross_revenue: revenue.grossRevenue,
        base_fee: baseFee,
        share_rate: rate,
        performance_fee: revenue.performanceFee,
        amount_due: amountDue,
        status: "pending",
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Log event
    await logEvent(custId, "invoice_generated", "system", {
      invoice_id: invoice.id,
      invoice_number: invoiceNumber,
      amount_due: amountDue,
    });

    // Advance subscription period
    const newPeriodStart = nextMonthStart;
    const newPeriodEndDate = new Date(
      invoiceMonth === 12 ? invoiceYear + 1 : invoiceYear,
      invoiceMonth === 12 ? 1 : invoiceMonth,
      0
    );
    const newPeriodEnd = newPeriodEndDate.toISOString().split("T")[0];

    await sb
      .from("subscriptions")
      .update({
        current_period_start: newPeriodStart,
        current_period_end: newPeriodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq("customer_id", custId);

    // Slack notification
    await sendBillingSlack(
      `Invoice ${invoiceNumber} generated for customer ${custId}.\n` +
      `Gross revenue: $${revenue.grossRevenue.toFixed(2)}\n` +
      `Base fee: $${baseFee.toFixed(2)}\n` +
      `Performance fee (${(rate * 100).toFixed(0)}%): $${revenue.performanceFee.toFixed(2)}\n` +
      `Total due: $${amountDue.toFixed(2)}`,
      "info"
    );

    return res.status(200).json({
      success: true,
      invoice: {
        ...invoice,
        gross_revenue: revenue.grossRevenue,
        base_fee: baseFee,
        performance_fee: revenue.performanceFee,
        amount_due: amountDue,
      },
    });
  } catch (err) {
    console.error("Invoice generation error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
