// pages/api/settings/qbo/taxes.js
// GET   → list realm TaxCodes + current per-tenant mappings
// PATCH → upsert one mapping { bw_tax_type, qbo_tax_code_id }
// (Owner/admin only.)

import { getAuthContext, getSupabaseServerClient } from "../../../../lib/supabaseServer";
import { getQboClient } from "../../../../lib/qbo/client";
import { fetchRealmTaxCodes } from "../../../../lib/qbo/taxMappings";

const VALID_TYPES = ["tps", "tvq", "both", "exempt"];

export default async function handler(req, res) {
  try {
    const { user, customerId, role } = await getAuthContext(req, res);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    if (!customerId) return res.status(403).json({ error: "No customer mapping" });
    if (!["owner", "admin"].includes(role || "owner")) {
      return res.status(403).json({ error: "Owner/admin only" });
    }

    const admin = getSupabaseServerClient();

    if (req.method === "GET") {
      let realmCodes = [];
      let qboError = null;
      try {
        const qbo = await getQboClient(customerId);
        realmCodes = await fetchRealmTaxCodes(qbo);
      } catch (e) {
        qboError = e.message;
      }

      const { data: mappings } = await admin
        .from("qbo_tax_mappings")
        .select("bw_tax_type, qbo_tax_code_id, qbo_tax_code_name, qbo_description, auto_seeded, updated_at")
        .eq("customer_id", customerId)
        .order("bw_tax_type");

      return res.status(200).json({
        mappings: mappings || [],
        realm_codes: realmCodes.map(c => ({
          id: String(c.Id),
          name: c.Name,
          description: c.Description || null,
          active: c.Active !== false,
        })),
        qbo_error: qboError,
      });
    }

    if (req.method === "PATCH") {
      const { bw_tax_type, qbo_tax_code_id, qbo_tax_code_name } = req.body || {};
      if (!VALID_TYPES.includes(bw_tax_type)) {
        return res.status(400).json({ error: `bw_tax_type must be one of ${VALID_TYPES.join(",")}` });
      }
      if (!qbo_tax_code_id) {
        return res.status(400).json({ error: "qbo_tax_code_id required" });
      }
      const { error } = await admin
        .from("qbo_tax_mappings")
        .upsert({
          customer_id: customerId,
          bw_tax_type,
          qbo_tax_code_id: String(qbo_tax_code_id),
          qbo_tax_code_name: qbo_tax_code_name || null,
          auto_seeded: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: "customer_id,bw_tax_type" });
      if (error) return res.status(500).json({ error: "Upsert failed", details: error.message });
      return res.status(200).json({ success: true });
    }

    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[qbo-settings-taxes] Unhandled:", err);
    return res.status(500).json({ error: "Internal error", details: err?.message || "see logs" });
  }
}
