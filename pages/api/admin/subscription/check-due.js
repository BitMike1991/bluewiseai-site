// pages/api/admin/subscription/check-due.js
// Called by n8n cron daily at 9 AM. Protected by CRON_SECRET.
import { getSupabaseServerClient } from "../../../../lib/supabaseServer";
import { enterGracePeriod, sendBillingSlack } from "../../../../lib/subscriptionGate";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Auth: CRON_SECRET (timing-safe comparison)
  const { checkCronSecret } = await import("../../../../lib/security");
  if (checkCronSecret(req, res)) return;

  try {
    const sb = getSupabaseServerClient();
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Fetch all active/grace subscriptions
    const { data: subs, error } = await sb
      .from("subscriptions")
      .select("*")
      .in("status", ["active", "grace"]);

    if (error) throw error;

    const results = { toGrace: [], toSuspend: [], reminders: [] };

    for (const sub of subs || []) {
      const periodEnd = new Date(sub.current_period_end);
      const daysPastDue = Math.floor((today - periodEnd) / (1000 * 60 * 60 * 24));

      if (sub.status === "active" && daysPastDue >= 1) {
        // Period ended, move to grace
        await enterGracePeriod(sub.customer_id);
        results.toGrace.push({ customer_id: sub.customer_id, days_past_due: daysPastDue });

        await sendBillingSlack(
          `Customer ${sub.customer_id} entered GRACE PERIOD. Invoice is past due. ${sub.grace_days} days until suspension.`,
          "warning"
        );
      } else if (sub.status === "grace") {
        // Check if grace period expired
        if (daysPastDue >= sub.grace_days) {
          // Ready for suspension — don't suspend here, let kill-switch do it
          results.toSuspend.push({ customer_id: sub.customer_id, days_past_due: daysPastDue });
        } else {
          // Send reminders at day 7, 14
          const graceDayNum = daysPastDue;
          if (graceDayNum === 7 || graceDayNum === 14) {
            results.reminders.push({
              customer_id: sub.customer_id,
              grace_day: graceDayNum,
              days_remaining: sub.grace_days - graceDayNum,
            });

            const urgency = graceDayNum === 14 ? "critical" : "warning";
            await sendBillingSlack(
              `Customer ${sub.customer_id} — Day ${graceDayNum} of grace period. ${sub.grace_days - graceDayNum} days until suspension.`,
              urgency
            );
          }
        }
      }
    }

    return res.status(200).json({ success: true, results });
  } catch (err) {
    console.error("Check-due error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
