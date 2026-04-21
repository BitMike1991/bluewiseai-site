// pages/api/qbo/taxes/auto-seed.js
// POST → query the realm's TaxCode list, fuzzy-match BW types, write mappings.
// Idempotent — never overwrites existing rows.

import { getAuthContext } from "../../../../lib/supabaseServer";
import { getQboClient } from "../../../../lib/qbo/client";
import { autoSeedTaxMappings } from "../../../../lib/qbo/taxMappings";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { user, customerId, role } = await getAuthContext(req, res);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    if (!customerId) return res.status(403).json({ error: "No customer mapping" });
    if (!["owner", "admin"].includes(role || "owner")) {
      return res.status(403).json({ error: "Owner/admin only" });
    }

    let qbo;
    try {
      qbo = await getQboClient(customerId);
    } catch (e) {
      return res.status(412).json({ error: "QBO not connected", details: e.message });
    }

    const result = await autoSeedTaxMappings(customerId, qbo);
    return res.status(200).json({ success: true, realm: qbo.realmId, ...result });
  } catch (err) {
    console.error("[qbo-taxes-auto-seed] Unhandled:", err);
    return res.status(500).json({ error: "Internal error", details: err?.message || "see logs" });
  }
}
