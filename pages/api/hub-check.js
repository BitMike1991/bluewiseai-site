// pages/api/hub-check.js
// Lightweight auth check for the /hub/* tools. Returns 200 if the current
// session has access (enabled_hub_tools includes at least one tool), 401
// otherwise. Used by the client-side catchall to redirect to login.

import { getAuthContext } from "../../lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user)       return res.status(401).json({ error: "Not authenticated" });
  if (!customerId) return res.status(403).json({ error: "No customer mapping" });

  const { data: cust } = await supabase
    .from("customers")
    .select("id, business_name, enabled_hub_tools")
    .eq("id", customerId)
    .maybeSingle();

  if (!cust) return res.status(403).json({ error: "Customer not found" });
  const tools = Array.isArray(cust.enabled_hub_tools) ? cust.enabled_hub_tools : [];
  if (tools.length === 0) {
    return res.status(403).json({ error: "No hub tools enabled for this tenant" });
  }

  return res.status(200).json({
    ok: true,
    customer_id: cust.id,
    business_name: cust.business_name,
    enabled_hub_tools: tools,
  });
}
