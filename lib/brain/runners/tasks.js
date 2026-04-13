// lib/brain/runners/tasks.js
// Extracted from /api/ask.js — DO NOT modify internal logic

import { resolveLeadForTask } from "./leads";

export async function runGetTasksTool(supabase, customerId, args) {
  const { status, lead_id } = args || {};

  let q = supabase
    .from("tasks")
    .select("id, lead_id, type, due_at, status, title, description, priority, created_at")
    .eq("customer_id", customerId);

  if (status && status !== "all") {
    q = q.eq("status", status);
  }

  if (lead_id) {
    q = q.eq("lead_id", lead_id);
  }

  q = q.order("due_at", { ascending: true }).limit(50);

  const { data: rows, error } = await q;

  if (error) {
    console.error("[brain/tasks] get_tasks error:", error);
    throw new Error("Failed to load tasks.");
  }

  const items =
    rows?.map((row) => ({
      id: row.id,
      leadId: row.lead_id,
      taskType: row.type || "general",
      dueAt: row.due_at,
      status: row.status,
      title: row.title || null,
      description: row.description || null,
      priority: row.priority || "normal",
      createdAt: row.created_at,
    })) || [];

  return {
    intent: "get_tasks",
    resultType: "task_list",
    title: "Tasks",
    items,
  };
}

export async function runCreateTaskTool(supabase, customerId, args) {
  const {
    lead_id,
    lead_name,
    email,
    phone,
    followup_type,
    scheduled_for_iso,
    note,
  } = args || {};

  const resolved = await resolveLeadForTask(supabase, customerId, {
    lead_id,
    lead_name,
    email,
    phone,
  });

  if (!resolved.leadId) {
    throw new Error(
      "Could not resolve which lead to attach this task to. " +
        "Please mention the lead's name, email, or phone."
    );
  }

  let scheduledDate = null;
  if (scheduled_for_iso) {
    const d = new Date(scheduled_for_iso);
    if (!Number.isNaN(d.getTime())) {
      scheduledDate = d;
    }
  }

  const now = new Date();

  if (scheduledDate) {
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    if (scheduledDate.getTime() < now.getTime() - THIRTY_DAYS_MS) {
      const fixed = new Date(now);
      fixed.setHours(scheduledDate.getHours(), scheduledDate.getMinutes(), 0, 0);
      if (fixed.getTime() <= now.getTime()) fixed.setDate(fixed.getDate() + 1);
      scheduledDate = fixed;
    }
  }

  if (!scheduledDate) {
    const d = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    d.setHours(9, 0, 0, 0);
    scheduledDate = d;
  }

  const taskType = followup_type || "general";
  const taskTitle = note
    ? note.length > 100
      ? note.substring(0, 100) + "..."
      : note
    : `${taskType.charAt(0).toUpperCase() + taskType.slice(1)} task`;

  const insertPayload = {
    customer_id: Number(customerId),
    lead_id: resolved.leadId,
    type: taskType,
    title: taskTitle,
    description: note || null,
    due_at: scheduledDate.toISOString(),
    status: "pending",
    priority: "normal",
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert(insertPayload)
    .select("id, lead_id, type, title, description, due_at, status, priority, created_at")
    .single();

  if (error) {
    console.error("[brain/tasks] create_task error:", error);
    throw new Error("Failed to create task.");
  }

  const item = {
    id: data.id,
    leadId: data.lead_id,
    taskType: data.type || "general",
    title: data.title,
    description: data.description,
    dueAt: data.due_at,
    status: data.status,
    priority: data.priority,
    createdAt: data.created_at,
  };

  const localScheduled = new Date(item.dueAt).toLocaleString("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const chosenReason =
    resolved.matchReason && resolved.matchReason !== "lead_id"
      ? ` (matched by ${resolved.matchReason})`
      : "";

  const aiSummary = `Created ${item.taskType} task for lead #${item.leadId}${chosenReason} due ${localScheduled}.`;

  return {
    intent: "create_task",
    resultType: "task_created",
    title: "Task created",
    items: [item],
    aiSummary,
  };
}

export async function runUpdateTaskTool(supabase, customerId, args) {
  const {
    task_id,
    lead_id,
    lead_name,
    followup_type,
    new_status,
    new_scheduled_for_iso,
    note,
  } = args || {};

  let effectiveLeadId = lead_id || null;
  let resolvedMeta = null;

  if (!task_id && !effectiveLeadId && lead_name) {
    resolvedMeta = await resolveLeadForTask(supabase, customerId, { lead_name });
    effectiveLeadId = resolvedMeta.leadId || null;
  }

  if (!task_id && !effectiveLeadId) {
    throw new Error(
      "To update a task, I need either the task id or the lead id / lead name."
    );
  }

  let q = supabase
    .from("tasks")
    .select("id, lead_id, type, title, description, due_at, status, priority, created_at")
    .eq("customer_id", customerId)
    .limit(1);

  if (task_id) {
    q = q.eq("id", task_id);
  } else if (effectiveLeadId) {
    q = q.eq("lead_id", effectiveLeadId);
    if (followup_type) q = q.eq("type", followup_type);
    q = q.order("due_at", { ascending: false });
  }

  const { data: rows, error: fetchError } = await q;

  if (fetchError) {
    console.error("[brain/tasks] update_task fetch error:", fetchError);
    throw new Error("Failed to locate task to update.");
  }

  if (!rows || rows.length === 0) {
    throw new Error("No matching task found to update.");
  }

  const existing = rows[0];

  const updates = {};
  const now = new Date();
  let scheduledDate = null;

  if (new_scheduled_for_iso) {
    const d = new Date(new_scheduled_for_iso);
    if (!Number.isNaN(d.getTime())) scheduledDate = d;

    if (scheduledDate) {
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      if (scheduledDate.getTime() < now.getTime() - THIRTY_DAYS_MS) {
        const fixed = new Date(now);
        fixed.setHours(scheduledDate.getHours(), scheduledDate.getMinutes(), 0, 0);
        if (fixed.getTime() <= now.getTime()) fixed.setDate(fixed.getDate() + 1);
        scheduledDate = fixed;
      }
    }

    if (scheduledDate) updates.due_at = scheduledDate.toISOString();
  }

  if (new_status) {
    if (new_status === "open") {
      updates.status = "pending";
    } else if (new_status === "completed") {
      updates.status = "completed";
      updates.completed_at = new Date().toISOString();
    } else {
      updates.status = new_status;
    }
  }

  if (note) {
    updates.description = note;
  }

  if (Object.keys(updates).length === 0) {
    throw new Error(
      "Nothing to update on this task. Provide a new status or a new date."
    );
  }

  const { data, error: updateError } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", existing.id)
    .eq("customer_id", customerId)
    .select("id, lead_id, type, title, description, due_at, status, priority, created_at")
    .single();

  if (updateError) {
    console.error("[brain/tasks] update_task error:", updateError);
    throw new Error("Failed to update task.");
  }

  const item = {
    id: data.id,
    leadId: data.lead_id,
    taskType: data.type || "general",
    title: data.title,
    description: data.description,
    dueAt: data.due_at,
    status: data.status,
    priority: data.priority,
    createdAt: data.created_at,
  };

  const localScheduled = item.dueAt
    ? new Date(item.dueAt).toLocaleString("en-CA", {
        timeZone: "America/Toronto",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  let summaryParts = [`Task #${item.id} for lead #${item.leadId}`];

  if (resolvedMeta?.matchReason) summaryParts.push(`(matched by ${resolvedMeta.matchReason})`);
  if (new_status) summaryParts.push(`status set to "${item.status}"`);
  if (localScheduled) summaryParts.push(`due ${localScheduled}`);

  return {
    intent: "update_task",
    resultType: "task_updated",
    title: "Task updated",
    items: [item],
    aiSummary: summaryParts.join(" · "),
  };
}
