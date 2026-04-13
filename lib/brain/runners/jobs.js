// lib/brain/runners/jobs.js
// CRM job tools for Brain v2

import { resolveLeadForTask } from "./leads";

export async function runListJobsTool(supabase, customerId, args) {
  const { status, lead_id, limit } = args || {};
  const max = Math.min(Math.max(Number(limit) || 25, 1), 100);

  let q = supabase
    .from("jobs")
    .select(
      "id, job_id, customer_id, lead_id, client_name, client_phone, client_email, project_type, project_description, quote_amount, status, scheduled_at, scheduled_start, scheduled_end, progress_pct, notes, created_at, updated_at"
    )
    .eq("customer_id", customerId);

  if (status && status !== "all") {
    q = q.eq("status", status);
  }

  if (lead_id) {
    q = q.eq("lead_id", lead_id);
  }

  q = q.order("created_at", { ascending: false }).limit(max);

  const { data: rows, error } = await q;

  if (error) {
    console.error("[brain/jobs] list_jobs error:", error);
    throw new Error("Failed to fetch jobs.");
  }

  const items = (rows || []).map((r) => ({
    id: r.id,
    jobId: r.job_id,
    customerId: r.customer_id,
    leadId: r.lead_id,
    clientName: r.client_name,
    clientPhone: r.client_phone || null,
    clientEmail: r.client_email || null,
    projectType: r.project_type || null,
    projectDescription: r.project_description || null,
    quoteAmount: r.quote_amount ? Number(r.quote_amount) : null,
    status: r.status,
    scheduledAt: r.scheduled_at || null,
    scheduledStart: r.scheduled_start || null,
    scheduledEnd: r.scheduled_end || null,
    progressPct: r.progress_pct || null,
    notes: r.notes || null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  return {
    intent: "list_jobs",
    resultType: "job_list",
    title: "Jobs",
    items,
    aiSummary:
      items.length === 0
        ? "No jobs found."
        : `Found ${items.length} job(s).`,
  };
}

export async function runGetJobTool(supabase, customerId, args) {
  const { job_id } = args || {};

  if (!job_id) {
    throw new Error("job_id is required.");
  }

  // job_id could be the text job_id or the numeric id
  let q = supabase
    .from("jobs")
    .select(
      "id, job_id, customer_id, lead_id, client_name, client_phone, client_email, client_address, project_type, project_description, quote_amount, deposit_amount, deposit_percentage, status, intake_source, scheduled_at, scheduled_start, scheduled_end, progress_pct, notes, quote_sent_at, contract_sent_at, signed_at, deposit_paid_at, started_at, completed_at, cancelled_at, address, created_at, updated_at"
    )
    .eq("customer_id", customerId);

  // Try text job_id first, fall back to numeric id
  const isNumeric = /^\d+$/.test(String(job_id));
  if (isNumeric) {
    q = q.eq("id", Number(job_id));
  } else {
    q = q.eq("job_id", String(job_id));
  }

  const { data: rows, error } = await q.limit(1);

  if (error) {
    console.error("[brain/jobs] get_job error:", error);
    throw new Error("Failed to fetch job.");
  }

  if (!rows || rows.length === 0) {
    throw new Error(`Job "${job_id}" not found.`);
  }

  const r = rows[0];

  // Try to fetch related lead data
  let leadData = null;
  if (r.lead_id) {
    const { data: lead } = await supabase
      .from("leads")
      .select("id, name, phone, email, status, source, city")
      .eq("customer_id", customerId)
      .eq("id", r.lead_id)
      .maybeSingle();
    leadData = lead || null;
  }

  const item = {
    id: r.id,
    jobId: r.job_id,
    customerId: r.customer_id,
    leadId: r.lead_id,
    clientName: r.client_name,
    clientPhone: r.client_phone || null,
    clientEmail: r.client_email || null,
    clientAddress: r.client_address || null,
    projectType: r.project_type || null,
    projectDescription: r.project_description || null,
    quoteAmount: r.quote_amount ? Number(r.quote_amount) : null,
    depositAmount: r.deposit_amount ? Number(r.deposit_amount) : null,
    depositPercentage: r.deposit_percentage || null,
    status: r.status,
    intakeSource: r.intake_source || null,
    scheduledAt: r.scheduled_at || null,
    scheduledStart: r.scheduled_start || null,
    scheduledEnd: r.scheduled_end || null,
    progressPct: r.progress_pct || null,
    notes: r.notes || null,
    quoteSentAt: r.quote_sent_at || null,
    contractSentAt: r.contract_sent_at || null,
    signedAt: r.signed_at || null,
    depositPaidAt: r.deposit_paid_at || null,
    startedAt: r.started_at || null,
    completedAt: r.completed_at || null,
    cancelledAt: r.cancelled_at || null,
    address: r.address || null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    lead: leadData,
  };

  return {
    intent: "get_job",
    resultType: "job_detail",
    title: `Job ${r.job_id}`,
    items: [item],
    aiSummary: `Job ${r.job_id} — ${r.client_name} — status: ${r.status}${
      r.quote_amount ? ` — $${Number(r.quote_amount).toLocaleString()}` : ""
    }`,
  };
}

export async function runCreateJobTool(supabase, customerId, args) {
  const {
    lead_id,
    lead_name,
    client_name,
    project_type,
    project_description,
    quote_amount,
    scheduled_date,
    status,
  } = args || {};

  // Resolve lead if provided
  let resolvedLeadId = null;
  if (lead_id || lead_name) {
    const resolved = await resolveLeadForTask(supabase, customerId, {
      lead_id,
      lead_name,
    });
    resolvedLeadId = resolved.leadId || null;
  }

  // Generate a job_id
  const prefix = "JOB";
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  const generatedJobId = `${prefix}-${ts}-${rand}`;

  // If we have a resolved lead, fetch their name for client_name fallback
  let effectiveClientName = client_name;
  if (!effectiveClientName && resolvedLeadId) {
    const { data: lead } = await supabase
      .from("leads")
      .select("name, phone, email")
      .eq("customer_id", customerId)
      .eq("id", resolvedLeadId)
      .maybeSingle();
    effectiveClientName = lead?.name || lead?.phone || lead?.email || "Unknown";
  }

  if (!effectiveClientName) {
    throw new Error("client_name is required (or provide a lead_id/lead_name to auto-fill).");
  }

  const insertPayload = {
    job_id: generatedJobId,
    customer_id: Number(customerId),
    lead_id: resolvedLeadId || null,
    client_name: effectiveClientName,
    project_type: project_type || null,
    project_description: project_description || null,
    quote_amount: quote_amount ? Number(quote_amount) : null,
    status: status || "quoted",
    scheduled_at: scheduled_date ? new Date(scheduled_date).toISOString() : null,
  };

  const { data, error } = await supabase
    .from("jobs")
    .insert(insertPayload)
    .select("id, job_id, customer_id, lead_id, client_name, project_type, status, quote_amount, scheduled_at, created_at")
    .single();

  if (error) {
    console.error("[brain/jobs] create_job error:", error);
    throw new Error("Failed to create job.");
  }

  return {
    intent: "create_job",
    resultType: "job_created",
    title: "Job created",
    items: [data],
    aiSummary: `Created job ${data.job_id} for ${data.client_name} (status: ${data.status}).`,
  };
}

export async function runUpdateJobTool(supabase, customerId, args) {
  const {
    job_id,
    status,
    notes,
    scheduled_date,
    project_description,
    quote_amount,
  } = args || {};

  if (!job_id) {
    throw new Error("job_id is required to update a job.");
  }

  // Find the job
  let findQ = supabase
    .from("jobs")
    .select("id, job_id")
    .eq("customer_id", customerId);

  const isNumeric = /^\d+$/.test(String(job_id));
  if (isNumeric) {
    findQ = findQ.eq("id", Number(job_id));
  } else {
    findQ = findQ.eq("job_id", String(job_id));
  }

  const { data: found, error: findErr } = await findQ.limit(1);

  if (findErr) {
    console.error("[brain/jobs] update_job find error:", findErr);
    throw new Error("Failed to locate job.");
  }

  if (!found || found.length === 0) {
    throw new Error(`Job "${job_id}" not found.`);
  }

  const existing = found[0];
  const updates = {};

  if (status) updates.status = status;
  if (notes !== undefined && notes !== null) updates.notes = notes;
  if (project_description !== undefined && project_description !== null) {
    updates.project_description = project_description;
  }
  if (quote_amount !== undefined && quote_amount !== null) {
    updates.quote_amount = Number(quote_amount);
  }
  if (scheduled_date) {
    updates.scheduled_at = new Date(scheduled_date).toISOString();
  }

  // Set lifecycle timestamps based on status
  if (status === "scheduled" && !updates.scheduled_at) {
    // Keep existing scheduled_at
  }
  if (status === "signed") updates.signed_at = new Date().toISOString();
  if (status === "completed") updates.completed_at = new Date().toISOString();
  if (status === "cancelled") updates.cancelled_at = new Date().toISOString();

  updates.updated_at = new Date().toISOString();

  if (Object.keys(updates).length <= 1) {
    throw new Error("Nothing to update. Provide at least one field to change.");
  }

  const { data, error } = await supabase
    .from("jobs")
    .update(updates)
    .eq("id", existing.id)
    .eq("customer_id", customerId)
    .select("id, job_id, customer_id, lead_id, client_name, status, quote_amount, scheduled_at, notes, updated_at")
    .single();

  if (error) {
    console.error("[brain/jobs] update_job error:", error);
    throw new Error("Failed to update job.");
  }

  return {
    intent: "update_job",
    resultType: "job_updated",
    title: "Job updated",
    items: [data],
    aiSummary: `Updated job ${data.job_id} — status: ${data.status}.`,
  };
}
