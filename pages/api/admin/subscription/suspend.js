// pages/api/admin/subscription/suspend.js
import { getAuthContext } from "../../../../lib/supabaseServer";
import { suspendCustomer, toggleN8nWorkflows } from "../../../../lib/subscriptionGate";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { user, customerId } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (customerId !== 1) return res.status(403).json({ error: "Admin only" });

  // CSRF protection
  const { checkCsrf } = await import("../../../../lib/csrf");
  if (checkCsrf(req, res)) return;

  const { targetCustomerId } = req.body;
  if (!targetCustomerId) return res.status(400).json({ error: "targetCustomerId required" });

  try {
    await suspendCustomer(targetCustomerId, user.email);

    // Deactivate n8n workflows for this customer
    const n8nResult = await toggleN8nWorkflows(targetCustomerId, false);

    return res.status(200).json({
      success: true,
      message: `Customer ${targetCustomerId} suspended`,
      n8n: n8nResult,
    });
  } catch (err) {
    console.error("Suspension error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
