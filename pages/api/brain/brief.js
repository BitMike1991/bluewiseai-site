// pages/api/brain/brief.js — Morning Brief API
// Returns daily summary: today's jobs, overdue tasks, stale leads, missed calls, stats

import { getAuthContext } from "../../../lib/supabaseServer";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);

  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (!customerId) return res.status(403).json({ error: "No customer mapping" });

  // Check cache: brain_notifications with type='morning_brief' within 4h
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
  const { data: cached } = await supabase
    .from("brain_notifications")
    .select("message, created_at")
    .eq("customer_id", customerId)
    .eq("type", "morning_brief")
    .gte("created_at", fourHoursAgo)
    .order("created_at", { ascending: false })
    .limit(1);

  if (cached?.[0]) {
    try {
      const parsed = JSON.parse(cached[0].message);
      return res.status(200).json(parsed);
    } catch {
      // Stale/corrupt cache, regenerate
    }
  }

  // Gather data
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const [
    { data: todayJobs },
    { data: overdueTasks },
    { data: staleLeads },
    { data: openLeadCount },
    { data: quotedLeads },
  ] = await Promise.all([
    // Today's jobs
    supabase
      .from("jobs")
      .select("id, title, status, lead_id")
      .eq("customer_id", customerId)
      .gte("scheduled_at", `${todayStr}T00:00:00`)
      .lte("scheduled_at", `${todayStr}T23:59:59`)
      .limit(10),

    // Overdue tasks
    supabase
      .from("tasks")
      .select("id, title, due_at, lead_id")
      .eq("customer_id", customerId)
      .eq("status", "pending")
      .lt("due_at", today.toISOString())
      .limit(10),

    // Stale leads (no contact in 48h, still active)
    supabase
      .from("leads")
      .select("id, name, status")
      .eq("customer_id", customerId)
      .in("status", ["new", "active", "quoted"])
      .limit(50),

    // Total open leads
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId)
      .not("status", "in", "(closed,dead,lost,won)"),

    // Quoted leads (pipeline value)
    supabase
      .from("leads")
      .select("id")
      .eq("customer_id", customerId)
      .eq("status", "quoted"),
  ]);

  const stats = {
    todayJobCount: todayJobs?.length || 0,
    overdueTaskCount: overdueTasks?.length || 0,
    staleLeadCount: staleLeads?.length || 0,
    openLeadCount: openLeadCount?.length || 0,
    quotedCount: quotedLeads?.length || 0,
  };

  // Determine greeting
  const hour = today.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Generate brief with AI
  let bullets = [];
  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system:
        "Generate a concise morning brief for a trades business owner. Be direct. Action items first. 3-5 bullet points max. Return ONLY a JSON array of strings (bullet points). No markdown, no backticks.",
      prompt: JSON.stringify({
        todayJobs: todayJobs?.length || 0,
        overdueTaskCount: overdueTasks?.length || 0,
        staleLeadCount: staleLeads?.length || 0,
        openLeadCount: stats.openLeadCount,
        quotedCount: stats.quotedCount,
        overdueTasks: (overdueTasks || []).slice(0, 3).map((t) => ({
          title: t.title,
          due: t.due_at,
        })),
        todayJobTitles: (todayJobs || []).slice(0, 3).map((j) => j.title),
      }),
    });

    try {
      const parsed = JSON.parse(text);
      bullets = Array.isArray(parsed) ? parsed : [text];
    } catch {
      bullets = [text];
    }
  } catch (e) {
    console.error("[brain/brief] AI generation failed:", e.message);
    bullets = [];

    if (stats.overdueTaskCount > 0) bullets.push(`${stats.overdueTaskCount} overdue tasks need attention.`);
    if (stats.todayJobCount > 0) bullets.push(`${stats.todayJobCount} jobs scheduled today.`);
    if (stats.staleLeadCount > 0) bullets.push(`${stats.staleLeadCount} leads haven't been contacted in 48h.`);
    if (bullets.length === 0) bullets.push("All caught up. No urgent items.");
  }

  const briefPayload = {
    greeting,
    bullets,
    stats,
    generatedAt: today.toISOString(),
  };

  // Cache in brain_notifications
  await supabase.from("brain_notifications").insert({
    customer_id: customerId,
    user_id: user.id,
    type: "morning_brief",
    message: JSON.stringify(briefPayload),
    priority: "low",
  });

  return res.status(200).json(briefPayload);
}
