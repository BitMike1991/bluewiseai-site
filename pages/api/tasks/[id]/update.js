// pages/api/tasks/[id]/update.js
import { getAuthContext } from "../../../../lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (!customerId) return res.status(403).json({ error: "No customer mapping" });

  const { id } = req.query;
  const taskId = Number(id);
  if (!taskId || Number.isNaN(taskId)) {
    return res.status(400).json({ error: "Invalid task id" });
  }

  const allowedFields = ["title", "description", "priority", "due_at", "board", "status", "position", "lead_id", "type"];
  const validBoards = ["fire", "this_week", "backlog", "waiting_on", "done"];
  const validPriorities = ["normal", "high", "urgent"];
  const validStatuses = ["pending", "completed", "cancelled"];

  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  // Validate enums
  if (updates.board && !validBoards.includes(updates.board)) {
    return res.status(400).json({ error: `Invalid board. Valid: ${validBoards.join(", ")}` });
  }
  if (updates.priority && !validPriorities.includes(updates.priority)) {
    return res.status(400).json({ error: `Invalid priority` });
  }
  if (updates.status && !validStatuses.includes(updates.status)) {
    return res.status(400).json({ error: `Invalid status` });
  }

  // Moving to done = mark completed
  if (updates.board === "done" && !updates.status) {
    updates.status = "completed";
    updates.completed_at = new Date().toISOString();
  }
  // Moving out of done = mark pending
  if (updates.board && updates.board !== "done") {
    updates.status = "pending";
    updates.completed_at = null;
  }

  // Enforce max 3 in fire column
  if (updates.board === "fire") {
    const { count } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId)
      .eq("board", "fire")
      .not("status", "in", "(completed,cancelled)")
      .neq("id", taskId);

    if (count >= 3) {
      return res.status(400).json({ error: "FIRE column is limited to 3 tasks." });
    }
  }

  if (updates.title) updates.title = String(updates.title).slice(0, 500);
  if (updates.description) updates.description = String(updates.description).slice(0, 2000);

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .eq("customer_id", customerId)
    .select("*")
    .single();

  if (error) {
    console.error("[api/tasks/[id]/update]", error);
    return res.status(500).json({ error: "Failed to update task" });
  }
  if (!data) return res.status(404).json({ error: "Task not found" });

  return res.status(200).json({ success: true, task: data });
}
