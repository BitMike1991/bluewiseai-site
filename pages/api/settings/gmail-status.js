// pages/api/settings/gmail-status.js
// Returns Gmail OAuth connection status for the current customer
import { getAuthContext, getSupabaseServerClient } from "../../../lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user, customerId } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (!customerId) return res.status(403).json({ error: "No customer mapping" });

  const admin = getSupabaseServerClient();
  const { data, error } = await admin
    .from("customer_email_oauth")
    .select("email_address, status, last_poll_at, created_at")
    .eq("customer_id", customerId)
    .single();

  if (error || !data) {
    return res.status(200).json({ connected: false });
  }

  return res.status(200).json({
    connected: data.status === "active",
    email: data.email_address,
    status: data.status,
    lastPollAt: data.last_poll_at,
    connectedAt: data.created_at,
  });
}
