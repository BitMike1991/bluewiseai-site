// pages/api/jobs/[id].js
import { getAuthContext } from "../../../lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);

  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (!customerId)
    return res.status(403).json({ error: "No customer mapping for this user" });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing job id" });

  try {
    // Fetch job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("customer_id", customerId)
      .eq("id", id)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Fetch related data in parallel
    const [contractsRes, paymentsRes, eventsRes, leadRes] = await Promise.all([
      supabase
        .from("contracts")
        .select("*")
        .eq("job_id", job.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("payments")
        .select("*")
        .eq("job_id", job.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("job_events")
        .select("*")
        .eq("job_id", job.id)
        .order("created_at", { ascending: false })
        .limit(50),
      job.lead_id
        ? supabase
            .from("leads")
            .select("id, name, first_name, phone, email, city, status, source")
            .eq("id", job.lead_id)
            .single()
        : Promise.resolve({ data: null }),
    ]);

    // If lead exists, fetch their photos
    let photos = [];
    if (job.lead_id) {
      // Get inbox_messages for this lead that have attachments
      const { data: messages } = await supabase
        .from("inbox_messages")
        .select("id")
        .eq("lead_id", job.lead_id);

      if (messages && messages.length > 0) {
        const messageIds = messages.map((m) => m.id);
        const { data: attachments } = await supabase
          .from("inbox_attachments")
          .select("id, message_id, file_url, content_type, created_at")
          .in("message_id", messageIds)
          .order("created_at", { ascending: false });

        photos = (attachments || []).filter((a) =>
          (a.content_type || "").startsWith("image/")
        );
      }
    }

    return res.status(200).json({
      job,
      contracts: contractsRes.data || [],
      payments: paymentsRes.data || [],
      events: eventsRes.data || [],
      lead: leadRes.data || null,
      photos,
    });
  } catch (err) {
    console.error("[api/jobs/[id]] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
