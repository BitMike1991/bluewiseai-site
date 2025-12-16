// pages/api/tasks/[id]/complete.js

import { getAuthContext } from "../../../../lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);

  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (!customerId) {
    return res.status(403).json({ error: "No customer mapping for this user" });
  }

  const { id } = req.query;
  const followupId = Number(id);

  if (!followupId || Number.isNaN(followupId)) {
    return res.status(400).json({ error: "Invalid followup id" });
  }

  try {
    const nowIso = new Date().toISOString();

    // 1) Mark followup as completed (scoped to this customer)
    const { data: updated, error: updateError } = await supabase
      .from("followups")
      .update({
        status: "completed",
        updated_at: nowIso,
      })
      .eq("id", followupId)
      .eq("customer_id", customerId)
      .select(
        `
        id,
        lead_id,
        customer_id,
        followup_type,
        sequence_stage,
        scheduled_for,
        status,
        created_at,
        updated_at
      `
      )
      .single();

    if (updateError) {
      console.error("[api/tasks/[id]/complete] updateError", updateError);
      return res.status(500).json({ error: "Failed to complete task" });
    }

    if (!updated) {
      return res.status(404).json({ error: "Task not found" });
    }

    // 2) Resolve the corresponding inbox_leads thread for this CRM lead
    // Canonical pattern: inbox_lead_events.lead_id → inbox_leads.id (thread)
    let inboxLeadId = null;

    const { data: inboxLead, error: inboxLeadError } = await supabase
      .from("inbox_leads")
      .select("id")
      .eq("customer_id", String(updated.customer_id))
      .eq("lead_id", updated.lead_id)
      .order("last_contact_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (inboxLeadError) {
      console.error(
        "[api/tasks/[id]/complete] inbox_leads lookup error",
        inboxLeadError
      );
    } else if (inboxLead && inboxLead.id) {
      inboxLeadId = inboxLead.id;
    }

    // 3) Log an event in inbox_lead_events so it appears in the timeline
    const payload = {
      followup_id: updated.id,
      followup_type: updated.followup_type,
      sequence_stage: updated.sequence_stage,
      scheduled_for: updated.scheduled_for,
      completed_at: nowIso,
    };

    const eventRow = {
      // Canonical thread linkage (if we found one)
      lead_id: inboxLeadId,
      customer_id: updated.customer_id,
      event_type: "followup.completed",
      payload,
      created_at: nowIso,
    };

    const { error: insertEventError } = await supabase
      .from("inbox_lead_events")
      .insert([eventRow]);

    if (insertEventError) {
      console.error(
        "[api/tasks/[id]/complete] insertEventError",
        insertEventError
      );
      // We still return success for the task completion itself
    }

    return res.status(200).json({
      success: true,
      followup: updated,
    });
  } catch (err) {
    console.error("[api/tasks/[id]/complete] unexpected error", err);
    return res.status(500).json({ error: "Failed to complete task" });
  }
}
