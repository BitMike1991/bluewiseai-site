// pages/api/admin/subscription/kill-switch.js
// Called by n8n cron after check-due detects customers to suspend.
import { suspendCustomer, toggleN8nWorkflows, sendBillingSlack } from "../../../../lib/subscriptionGate";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Auth: CRON_SECRET header
  const secret = req.headers["x-cron-secret"] || req.headers["authorization"]?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const { customerIds } = req.body;
  if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
    return res.status(400).json({ error: "customerIds array required" });
  }

  const results = [];

  for (const customerId of customerIds) {
    try {
      // Suspend in DB
      await suspendCustomer(customerId, "kill-switch-cron");

      // Deactivate n8n workflows for this customer
      const n8nResult = await toggleN8nWorkflows(customerId, false);

      results.push({ customer_id: customerId, success: true, n8n: n8nResult });

      await sendBillingSlack(
        `KILL SWITCH ACTIVATED for customer ${customerId}. All platform access and automations disabled. Grace period expired.`,
        "critical"
      );
    } catch (err) {
      console.error(`[kill-switch] Error for customer ${customerId}:`, err);
      results.push({ customer_id: customerId, success: false, error: "Operation failed" });
    }
  }

  return res.status(200).json({ success: true, results });
}
