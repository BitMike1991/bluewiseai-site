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

    // Parse expand param: ?expand=quotes,contracts,payments,tasks,events,commande_drafts
    const expandParam = req.query.expand || "";
    const expand = new Set(expandParam.split(",").map((s) => s.trim()).filter(Boolean));
    // Default: always fetch contracts, payments, events, lead (backward compat)
    const fetchContracts = expand.size === 0 || expand.has("contracts");
    const fetchPayments  = expand.size === 0 || expand.has("payments");
    const fetchEvents    = expand.size === 0 || expand.has("events");
    const fetchQuotes    = expand.has("quotes");
    const fetchTasks     = expand.has("tasks");
    const fetchCommande  = expand.has("commande_drafts");

    // Fetch related data in parallel
    const [contractsRes, paymentsRes, eventsRes, leadRes, quotesRes, tasksRes, commandeRes] = await Promise.all([
      fetchContracts
        ? supabase
            .from("contracts")
            .select("*")
            .eq("job_id", job.id)
            .eq("customer_id", customerId)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      fetchPayments
        ? supabase
            .from("payments")
            .select("*")
            .eq("job_id", job.id)
            .eq("customer_id", customerId)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      fetchEvents
        ? supabase
            .from("job_events")
            .select("*")
            .eq("job_id", job.id)
            .eq("customer_id", customerId)
            .order("created_at", { ascending: false })
            .limit(50)
        : Promise.resolve({ data: [] }),
      job.lead_id
        ? supabase
            .from("leads")
            .select("id, name, first_name, phone, email, city, status, source")
            .eq("id", job.lead_id)
            .eq("customer_id", customerId)
            .single()
        : Promise.resolve({ data: null }),
      fetchQuotes
        ? supabase
            .from("quotes")
            .select("id, job_id, customer_id, quote_number, version, line_items, subtotal, tax_gst, tax_qst, total_ttc, status, valid_until, notes, storage_path, created_at, updated_at")
            .eq("job_id", job.id)
            .eq("customer_id", customerId)
            .order("version", { ascending: false })
        : Promise.resolve({ data: null }),
      fetchTasks
        ? supabase
            .from("tasks")
            .select("id, lead_id, type, title, description, due_at, status, priority, completed_at, created_at")
            .eq("customer_id", customerId)
            .or(
              job.lead_id
                ? `job_id.eq.${job.id},lead_id.eq.${job.lead_id}`
                : `job_id.eq.${job.id}`
            )
            .order("due_at", { ascending: true, nullsFirst: false })
        : Promise.resolve({ data: null }),
      fetchCommande
        ? supabase
            .from("commande_drafts")
            .select("id, job_id, supplier, items_count, status, created_at, updated_at")
            .eq("job_id", job.id)
            .eq("customer_id", customerId)
            .order("updated_at", { ascending: false })
            .limit(1)
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

    const response = {
      job,
      contracts: contractsRes.data || [],
      payments: paymentsRes.data || [],
      events: eventsRes.data || [],
      lead: leadRes.data || null,
      photos,
    };

    if (fetchQuotes)   response.quotes          = quotesRes.data   || [];
    if (fetchTasks)    response.tasks            = tasksRes.data    || [];
    if (fetchCommande) response.commande_draft   = commandeRes.data?.[0] ?? null;

    return res.status(200).json(response);
  } catch (err) {
    console.error("[api/jobs/[id]] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
