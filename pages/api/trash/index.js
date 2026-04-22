// pages/api/trash/index.js
// GET → unified list of soft-deleted leads + jobs (last 5 days, restorable)
//        + an audit log of every delete/restore action since the dawn of time.
// Owner/admin only — Mikael's audit safety net (Jeremy must not be able to
// delete-then-hide anything from the owner view).

import { getAuthContext } from "../../../lib/supabaseServer";

const TRASH_RETENTION_DAYS = 5;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user, role } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (!customerId) return res.status(403).json({ error: "No customer mapping" });
  if (!["owner", "admin"].includes(role || "owner")) {
    return res.status(403).json({ error: "Owner/admin only" });
  }

  const since = new Date(Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  try {
    // 1. Soft-deleted leads in last 5 days (still restorable)
    const { data: leads } = await supabase
      .from("leads")
      .select("id, name, first_name, email, phone, status, deleted_at, deleted_by_user_id, created_at")
      .eq("customer_id", customerId)
      .not("deleted_at", "is", null)
      .gte("deleted_at", since)
      .order("deleted_at", { ascending: false });

    // 2. Soft-deleted jobs in last 5 days
    const { data: jobs } = await supabase
      .from("jobs")
      .select("id, job_id, client_name, project_type, quote_amount, status, deleted_at, deleted_by_user_id, created_at")
      .eq("customer_id", customerId)
      .not("deleted_at", "is", null)
      .gte("deleted_at", since)
      .order("deleted_at", { ascending: false });

    // 2b. Soft-deleted bons de commande (Mikael 2026-04-22 — "rajoute
    // l'option d'effacer les brouillons ... envoie les dans la corbeille").
    const { data: bcs } = await supabase
      .from("bons_de_commande")
      .select("id, bc_number, supplier, status, item_refs, deleted_at, deleted_by_user_id, created_at")
      .eq("customer_id", customerId)
      .not("deleted_at", "is", null)
      .gte("deleted_at", since)
      .order("deleted_at", { ascending: false });

    // 3. Full audit history (no time limit — Mikael's "always know what happened")
    const { data: audit } = await supabase
      .from("deletion_audit")
      .select("id, entity_type, entity_id, entity_label, action, user_id, user_email, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(200);

    return res.status(200).json({
      retention_days: TRASH_RETENTION_DAYS,
      leads: (leads || []).map((l) => ({
        kind: "lead",
        id: l.id,
        label: l.name || l.first_name || l.email || l.phone || `Lead #${l.id}`,
        sub: [l.email, l.phone].filter(Boolean).join(" · "),
        status: l.status,
        deleted_at: l.deleted_at,
        deleted_by_user_id: l.deleted_by_user_id,
        days_remaining: Math.max(0, TRASH_RETENTION_DAYS - Math.floor((Date.now() - new Date(l.deleted_at).getTime()) / 86400000)),
      })),
      jobs: (jobs || []).map((j) => ({
        kind: "job",
        id: j.id,
        label: j.client_name || j.job_id || `Projet #${j.id}`,
        sub: [j.job_id, j.project_type, j.quote_amount ? `${Number(j.quote_amount).toLocaleString("fr-CA")}$` : null].filter(Boolean).join(" · "),
        status: j.status,
        deleted_at: j.deleted_at,
        deleted_by_user_id: j.deleted_by_user_id,
        days_remaining: Math.max(0, TRASH_RETENTION_DAYS - Math.floor((Date.now() - new Date(j.deleted_at).getTime()) / 86400000)),
      })),
      bons_de_commande: (bcs || []).map((b) => ({
        kind: "bon_de_commande",
        id: b.id,
        label: b.bc_number || `BDC #${b.id}`,
        sub: [b.supplier, b.status, `${Array.isArray(b.item_refs) ? b.item_refs.length : 0} items`].filter(Boolean).join(" · "),
        status: b.status,
        deleted_at: b.deleted_at,
        deleted_by_user_id: b.deleted_by_user_id,
        days_remaining: Math.max(0, TRASH_RETENTION_DAYS - Math.floor((Date.now() - new Date(b.deleted_at).getTime()) / 86400000)),
      })),
      audit: audit || [],
    });
  } catch (err) {
    console.error("[api/trash] error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
