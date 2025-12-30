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
  const taskId = Number(id);

  if (!taskId || Number.isNaN(taskId)) {
    return res.status(400).json({ error: "Invalid task id" });
  }

  try {
    const nowIso = new Date().toISOString();

    // 1) Mark task as completed (scoped to this customer)
    const { data: updated, error: updateError } = await supabase
      .from("tasks")
      .update({
        status: "completed",
        completed_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", taskId)
      .eq("customer_id", customerId)
      .select(
        `
        id,
        lead_id,
        customer_id,
        type,
        title,
        description,
        due_at,
        status,
        completed_at,
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
      task_id: updated.id,
      task_type: updated.type,
      title: updated.title,
      due_at: updated.due_at,
      completed_at: nowIso,
    };

    const eventRow = {
      // Canonical thread linkage (if we found one)
      lead_id: inboxLeadId,
      customer_id: updated.customer_id,
      event_type: "task.completed",
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
      task: updated,
    });
  } catch (err) {
    console.error("[api/tasks/[id]/complete] unexpected error", err);
    return res.status(500).json({ error: "Failed to complete task" });
  }
}
