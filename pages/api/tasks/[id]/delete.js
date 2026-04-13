// pages/api/tasks/[id]/delete.js
import { getAuthContext } from "../../../../lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
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

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("customer_id", customerId);

  if (error) {
    console.error("[api/tasks/[id]/delete]", error);
    return res.status(500).json({ error: "Failed to delete task" });
  }

  return res.status(200).json({ success: true });
}
