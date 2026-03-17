// pages/api/settings/outlook-status.js
import { getAuthContext, getSupabaseServerClient } from "../../../lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { user, customerId } = await getAuthContext(req, res);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    if (!customerId) return res.status(403).json({ error: "No customer mapping" });

    const admin = getSupabaseServerClient();
    const { data } = await admin
      .from("customer_email_oauth")
      .select("email_address, status")
      .eq("customer_id", customerId)
      .eq("provider", "outlook")
      .single();

    if (data && data.status === "active") {
      return res.status(200).json({ connected: true, email: data.email_address });
    }

    return res.status(200).json({ connected: false });
  } catch (err) {
    console.error("[outlook-status] Error:", err);
    return res.status(200).json({ connected: false });
  }
}
