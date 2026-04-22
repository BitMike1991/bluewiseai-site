// pages/api/bons-de-commande/[id]/delete.js
// POST — soft-delete a BDC (sets deleted_at + deleted_by_user_id, logs to
// deletion_audit). Recoverable from /platform/corbeille for 5 days.
// Mikael 2026-04-22: "rajoute l'option d'effacer les brouillons ... envoie
// les dans la corbeille". Owner/admin only — Jérémy shouldn't be able to
// delete-then-hide.

import { getAuthContext } from "../../../../lib/supabaseServer";
import { logDeletion } from "../../../../lib/deletionAudit";

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    res.setHeader("Allow", ["POST", "DELETE"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user, role } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (!customerId) return res.status(403).json({ error: "No customer mapping" });
  if (!["owner", "admin"].includes(role || "owner")) {
    return res.status(403).json({ error: "Owner/admin only" });
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "id required" });

  try {
    const { data: bc } = await supabase
      .from("bons_de_commande")
      .select("id, bc_number, customer_id, deleted_at")
      .eq("id", id)
      .eq("customer_id", customerId)
      .maybeSingle();

    if (!bc) return res.status(404).json({ error: "BDC not found" });
    if (bc.deleted_at) {
      return res.status(200).json({ success: true, already_deleted: true });
    }

    const { error: updErr } = await supabase
      .from("bons_de_commande")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by_user_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("customer_id", customerId);

    if (updErr) {
      console.error("[bdc/delete] update error:", updErr);
      return res.status(500).json({ error: "Failed to delete" });
    }

    await logDeletion({
      customerId,
      entityType: "bon_de_commande",
      entityId: Number(id),
      entityLabel: bc.bc_number || `BDC #${id}`,
      user,
    });

    return res.status(200).json({ success: true, id: Number(id), label: bc.bc_number });
  } catch (err) {
    console.error("[bdc/delete] error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
