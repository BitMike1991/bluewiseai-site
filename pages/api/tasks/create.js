// pages/api/tasks/create.js
import { getAuthContext } from "../../../lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (!customerId) return res.status(403).json({ error: "No customer mapping" });

  const { title, description, priority, due_at, board, lead_id, type } = req.body;

  if (!title || typeof title !== "string" || title.length > 500) {
    return res.status(400).json({ error: "Title is required (max 500 chars)" });
  }

  const validBoards = ["fire", "this_week", "backlog", "waiting_on", "done"];
  const validPriorities = ["normal", "high", "urgent"];

  const row = {
    customer_id: customerId,
    title: title.trim(),
    description: description ? String(description).slice(0, 2000) : null,
    priority: validPriorities.includes(priority) ? priority : "normal",
    board: validBoards.includes(board) ? board : "backlog",
    due_at: due_at || null,
    lead_id: lead_id ? Number(lead_id) : null,
    type: type || "general",
    status: board === "done" ? "completed" : "pending",
    source: "manual",
  };

  // Enforce max 3 in fire column
  if (row.board === "fire") {
    const { count } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId)
      .eq("board", "fire")
      .not("status", "in", "(completed,cancelled)");

    if (count >= 3) {
      return res.status(400).json({ error: "FIRE column is limited to 3 tasks. Complete or move one first." });
    }
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert([row])
    .select("*")
    .single();

  if (error) {
    console.error("[api/tasks/create]", error);
    return res.status(500).json({ error: "Failed to create task" });
  }

  return res.status(201).json({ success: true, task: data });
}
