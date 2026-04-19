// pages/api/hub/lead-prefill.js
// Lead prefill endpoint used by /hub (CommandePage) when the user arrived
// via ?prefill=<leadId>. Looks up the lead scoped to the session's customer_id.
// Replaces the old hub.purconstruction.com proxy that used the master
// UNIVERSAL_API_KEY — now authenticated by Supabase session directly.

import { getAuthContext } from "../../../lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user)       return res.status(401).json({ error: "Non autorisé" });
  if (!customerId) return res.status(403).json({ error: "No customer mapping" });

  const { lead_id } = req.query;
  if (!lead_id || !/^\d+$/.test(String(lead_id))) {
    return res.status(400).json({ error: "lead_id invalide" });
  }

  const { data: lead, error } = await supabase
    .from("leads")
    .select("id, name, phone, email, address, notes")
    .eq("id", Number(lead_id))
    .eq("customer_id", customerId)
    .maybeSingle();

  if (error) {
    console.error("[hub/lead-prefill] supabase error", error.message);
    return res.status(500).json({ error: "Database error" });
  }
  if (!lead) return res.status(404).json({ error: "Lead non trouvé" });

  return res.status(200).json({ lead });
}
