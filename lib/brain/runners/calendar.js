// lib/brain/runners/calendar.js
// Calendar tools for Brain v2
// No dedicated calendar/appointments table exists — uses jobs.scheduled_at/scheduled_start/scheduled_end

export async function runListAppointmentsTool(supabase, customerId, args) {
  const { date_from, date_to } = args || {};

  let q = supabase
    .from("jobs")
    .select(
      "id, job_id, customer_id, lead_id, client_name, client_phone, project_type, project_description, status, scheduled_at, scheduled_start, scheduled_end, address, notes, created_at"
    )
    .eq("customer_id", customerId)
    .not("status", "in", "(cancelled)");

  // Filter by date range using scheduled_at or scheduled_start
  if (date_from) {
    const from = new Date(date_from).toISOString();
    // Use or filter: scheduled_at >= from OR scheduled_start >= from
    q = q.or(`scheduled_at.gte.${from},scheduled_start.gte.${date_from}`);
  }

  if (date_to) {
    const to = new Date(date_to);
    to.setHours(23, 59, 59, 999);
    const toIso = to.toISOString();
    q = q.or(`scheduled_at.lte.${toIso},scheduled_start.lte.${date_to}`);
  }

  // Only return jobs that have some scheduled date
  q = q.or("scheduled_at.not.is.null,scheduled_start.not.is.null");

  q = q.order("scheduled_at", { ascending: true, nullsFirst: false }).limit(50);

  const { data: rows, error } = await q;

  if (error) {
    console.error("[brain/calendar] list_appointments error:", error);
    throw new Error("Failed to fetch scheduled jobs/appointments.");
  }

  const items = (rows || []).map((r) => ({
    id: r.id,
    jobId: r.job_id,
    leadId: r.lead_id,
    clientName: r.client_name,
    clientPhone: r.client_phone || null,
    projectType: r.project_type || null,
    description: r.project_description || null,
    status: r.status,
    scheduledAt: r.scheduled_at || null,
    scheduledStart: r.scheduled_start || null,
    scheduledEnd: r.scheduled_end || null,
    address: r.address || null,
    notes: r.notes || null,
    createdAt: r.created_at,
  }));

  const rangeLabel =
    date_from && date_to
      ? `${date_from} to ${date_to}`
      : date_from
      ? `from ${date_from}`
      : date_to
      ? `until ${date_to}`
      : "all upcoming";

  return {
    intent: "list_appointments",
    resultType: "appointment_list",
    title: "Schedule",
    items,
    aiSummary:
      items.length === 0
        ? `No scheduled jobs found (${rangeLabel}).`
        : `Found ${items.length} scheduled job(s) (${rangeLabel}).`,
  };
}
