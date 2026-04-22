// pages/api/trash/restore.js
// POST { kind: 'lead'|'job', id } → clears deleted_at + logs to deletion_audit.
// Owner/admin only. Idempotent: if the row isn't currently deleted, returns 404.

import { getAuthContext } from "../../../lib/supabaseServer";
import { logRestore } from "../../../lib/deletionAudit";

const ALLOWED = { lead: "leads", job: "jobs", bon_de_commande: "bons_de_commande" };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user, role } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (!customerId) return res.status(403).json({ error: "No customer mapping" });
  if (!["owner", "admin"].includes(role || "owner")) {
    return res.status(403).json({ error: "Owner/admin only" });
  }

  const { kind, id } = req.body || {};
  const table = ALLOWED[kind];
  if (!table) return res.status(400).json({ error: "kind must be 'lead', 'job' or 'bon_de_commande'" });
  if (!id) return res.status(400).json({ error: "id required" });

  const SELECT_BY_KIND = {
    lead: "id, name, first_name, email, phone",
    job: "id, job_id, client_name",
    bon_de_commande: "id, bc_number, supplier",
  };

  try {
    // Snapshot label first for audit + return value
    const { data: row } = await supabase
      .from(table)
      .select(SELECT_BY_KIND[kind])
      .eq("id", id).eq("customer_id", customerId)
      .not("deleted_at", "is", null)
      .maybeSingle();

    if (!row) return res.status(404).json({ error: "Item not found in trash" });

    const label = kind === "lead"
      ? (row.name || row.first_name || row.email || row.phone || `Lead #${id}`)
      : kind === "job"
        ? (row.client_name || row.job_id || `Project #${id}`)
        : (row.bc_number || `BDC #${id}`);

    const { error: updErr } = await supabase
      .from(table)
      .update({
        deleted_at: null,
        deleted_by_user_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id).eq("customer_id", customerId);

    if (updErr) {
      console.error("[api/trash/restore] update error:", updErr);
      return res.status(500).json({ error: "Failed to restore" });
    }

    await logRestore({
      customerId,
      entityType: kind,
      entityId: Number(id),
      entityLabel: label,
      user,
    });

    return res.status(200).json({ success: true, kind, id: Number(id), label });
  } catch (err) {
    console.error("[api/trash/restore] error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
