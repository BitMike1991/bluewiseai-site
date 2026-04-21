// pages/api/divisions/index.js
// GET /api/divisions — list divisions for the current tenant.
// Used by the lead-detail division reassignment dropdown and any future
// per-tenant UI that needs to render division names/slugs.
import { getAuthContext } from "../../../lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user, role, divisionId } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (!customerId) return res.status(403).json({ error: "No customer mapping" });

  try {
    const { data, error } = await supabase
      .from("divisions")
      .select("id, slug, name, owner_share_pct, enabled_hub_tools, active")
      .eq("customer_id", customerId)
      .eq("active", true)
      .order("id", { ascending: true });

    if (error) {
      console.error("[api/divisions] fetch error", error);
      return res.status(500).json({ error: "Failed to load divisions" });
    }

    // Scoped users only see their own division — prevents them from learning
    // about other divisions inside the tenant via this endpoint.
    let divisions = data || [];
    if (role && role !== 'owner' && role !== 'admin' && divisionId != null) {
      divisions = divisions.filter((d) => d.id === divisionId);
    }

    res.setHeader("Cache-Control", "private, max-age=60");
    return res.status(200).json({ divisions, role: role || 'owner', divisionId: divisionId || null });
  } catch (err) {
    console.error("[api/divisions] unexpected", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
