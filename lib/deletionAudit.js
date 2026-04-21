// lib/deletionAudit.js
// Helpers for the trash + audit system. Every soft-delete / restore on a
// lead or a job calls logDeletion / logRestore so we have a tamper-proof
// trail in deletion_audit (separate from the entity's deleted_at flag).

import { getSupabaseServerClient } from "./supabaseServer";

export async function logDeletion({ customerId, entityType, entityId, entityLabel, user, payload }) {
  if (!customerId || !entityType || !entityId) return;
  const admin = getSupabaseServerClient();
  await admin.from("deletion_audit").insert({
    customer_id: customerId,
    entity_type: entityType,
    entity_id: entityId,
    entity_label: entityLabel || null,
    action: "deleted",
    user_id: user?.id || null,
    user_email: user?.email || null,
    payload: payload || {},
  });
}

export async function logRestore({ customerId, entityType, entityId, entityLabel, user, payload }) {
  if (!customerId || !entityType || !entityId) return;
  const admin = getSupabaseServerClient();
  await admin.from("deletion_audit").insert({
    customer_id: customerId,
    entity_type: entityType,
    entity_id: entityId,
    entity_label: entityLabel || null,
    action: "restored",
    user_id: user?.id || null,
    user_email: user?.email || null,
    payload: payload || {},
  });
}
