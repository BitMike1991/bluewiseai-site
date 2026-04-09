// pages/api/jobs/[id].js
import { getAuthContext } from "../../../lib/supabaseServer";

export default async function handler(req, res) {
  const allowed = ["GET", "PATCH"];
  if (!allowed.includes(req.method)) {
    res.setHeader("Allow", allowed);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);

  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (!customerId)
    return res.status(403).json({ error: "No customer mapping for this user" });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing job id" });

  // ── PATCH: update job fields (notes, status) ──
  if (req.method === "PATCH") {
    try {
      const { notes, status } = req.body;
      const updates = { updated_at: new Date().toISOString() };
      if (notes !== undefined) updates.notes = notes;
      if (status) updates.status = status;

      if (Object.keys(updates).length === 1) {
        return res.status(400).json({ error: "Nothing to update" });
      }

      const { data, error: updateError } = await supabase
        .from("jobs")
        .update(updates)
        .eq("id", id)
        .eq("customer_id", customerId)
        .select()
        .single();

      if (updateError) {
        console.error("[api/jobs/[id]] updateError", updateError);
        return res.status(500).json({ error: "Failed to update job" });
      }
      if (!data) return res.status(404).json({ error: "Job not found" });

      return res.status(200).json({ success: true, job: data });
    } catch (err) {
      console.error("[api/jobs/[id]] PATCH error", err);
      return res.status(500).json({ error: "Server error" });
    }
  }

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
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false }),
      supabase
        .from("payments")
        .select("*")
        .eq("job_id", job.id)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false }),
      supabase
        .from("job_events")
        .select("*")
        .eq("job_id", job.id)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(50),
      job.lead_id
        ? supabase
            .from("leads")
            .select("id, name, first_name, phone, email, city, status, source")
            .eq("id", job.lead_id)
            .eq("customer_id", customerId)
            .single()
        : Promise.resolve({ data: null }),
    ]);

    // If lead exists, fetch their photos via inbox_leads -> inbox_messages -> inbox_attachments
    // inbox_messages.lead_id = inbox_leads.id (NOT leads.id)
    let photos = [];
    if (job.lead_id) {
      const { data: inboxLead } = await supabase
        .from("inbox_leads")
        .select("id")
        .eq("customer_id", String(customerId))
        .eq("lead_id", job.lead_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (inboxLead) {
        const { data: inboxMsgIds } = await supabase
          .from("inbox_messages")
          .select("id")
          .eq("lead_id", inboxLead.id);

        if (inboxMsgIds && inboxMsgIds.length > 0) {
          const messageIds = inboxMsgIds.map((m) => m.id);
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
