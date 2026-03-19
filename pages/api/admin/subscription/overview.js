// pages/api/admin/subscription/overview.js
import { getAuthContext, getSupabaseServerClient } from "../../../../lib/supabaseServer";
import { getSubscription, computeRevenueShare } from "../../../../lib/subscriptionGate";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { user, customerId } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (customerId !== 1) return res.status(403).json({ error: "Admin only" });

  const rawTargetId = req.query.customer_id;
  if (!rawTargetId) return res.status(400).json({ error: "customer_id query parameter is required" });
  const targetId = parseInt(rawTargetId, 10);

  try {
    const sub = await getSubscription(targetId);
    if (!sub) return res.status(404).json({ error: "No subscription found" });

    // Fetch all invoices
    const sb = getSupabaseServerClient();
    const { data: invoices } = await sb
      .from("subscription_invoices")
      .select("*")
      .eq("customer_id", targetId)
      .order("created_at", { ascending: false });

    // Current period revenue preview
    const periodStart = sub.current_period_start;
    const periodEnd = new Date(new Date(sub.current_period_end).getTime() + 86400000)
      .toISOString()
      .split("T")[0];
    const revenuePreview = await computeRevenueShare(
      targetId,
      periodStart,
      periodEnd,
      parseFloat(sub.revenue_share_rate)
    );

    // Recent events
    const { data: events } = await sb
      .from("subscription_events")
      .select("*")
      .eq("customer_id", targetId)
      .order("created_at", { ascending: false })
      .limit(20);

    return res.status(200).json({
      subscription: sub,
      invoices: invoices || [],
      currentPeriodPreview: {
        ...revenuePreview,
        baseFee: parseFloat(sub.base_fee),
        totalDue: parseFloat(sub.base_fee) + revenuePreview.performanceFee,
        periodStart: sub.current_period_start,
        periodEnd: sub.current_period_end,
      },
      events: events || [],
    });
  } catch (err) {
    console.error("Subscription overview error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
