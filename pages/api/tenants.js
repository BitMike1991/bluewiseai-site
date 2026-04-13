// pages/api/tenants.js — List tenants for current user + switch active tenant
import { getAuthContext } from "../../lib/supabaseServer";
import { getSupabaseServerClient } from "../../lib/supabaseServer";

export default async function handler(req, res) {
  const { user, allCustomerIds, customerId } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  if (req.method === "GET") {
    // Return all tenants this user can access
    if (!allCustomerIds || allCustomerIds.length <= 1) {
      return res.status(200).json({ tenants: [], activeTenant: customerId, canSwitch: false });
    }

    const sb = getSupabaseServerClient();
    const { data: customers } = await sb
      .from("customers")
      .select("id, business_name, branding")
      .in("id", allCustomerIds);

    const tenants = (customers || []).map(c => ({
      id: c.id,
      name: c.business_name,
      displayName: c.branding?.company_display_name || c.business_name,
      logoText: c.branding?.logo_text || c.business_name.charAt(0),
      primaryColor: c.branding?.primary_color || "#6c63ff",
    }));

    return res.status(200).json({ tenants, activeTenant: customerId, canSwitch: true });
  }

  if (req.method === "POST") {
    // Switch active tenant
    const { tenantId } = req.body;
    const id = parseInt(tenantId, 10);

    if (!id || !allCustomerIds?.includes(id)) {
      return res.status(403).json({ error: "Not authorized for this tenant" });
    }

    // Set cookie — no httpOnly so the client can read it for UI state
    res.setHeader("Set-Cookie", `__active_tenant=${id}; Path=/; SameSite=Lax; Secure; Max-Age=${60 * 60 * 24 * 30}`);

    return res.status(200).json({ success: true, activeTenant: id });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method not allowed" });
}
