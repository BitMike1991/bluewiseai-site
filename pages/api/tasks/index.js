// pages/api/tasks/index.js

import { createSupabaseServerClient } from "../../../lib/supabaseServer";

// TEMP: until auth/session is wired, we hardcode a tenant id but
// keep the pattern so it's easy to swap later.
function getCustomerIdFromRequest(req) {
  // In the future, derive from session / JWT.
  return "1";
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Server-side Supabase client (aligned with other APIs)
  const supabase = createSupabaseServerClient(req, res);

  const {
    page = "1",
    pageSize = "25",
    customerId: customerIdQuery,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNum = Math.min(
    100,
    Math.max(1, parseInt(pageSize, 10) || 25)
  );

  const from = (pageNum - 1) * pageSizeNum;
  const to = from + pageSizeNum - 1;

  // Multi-tenant discipline:
  // - Prefer explicit ?customerId=... if provided (useful for testing)
  // - Otherwise, fall back to the tenant inferred from the request
  const tenantCustomerId = customerIdQuery || getCustomerIdFromRequest(req);

  if (!tenantCustomerId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    // Base query: followups + joined lead
    let query = supabase
      .from("followups")
      .select(
        `
        id,
        lead_id,
        followup_type,
        scheduled_for,
        status,
        payload,
        created_at,
        updated_at,
        sequence_stage,
        customer_id,
        leads:lead_id (
          id,
          name,
          email,
          phone,
          source
        )
      `,
        { count: "exact" }
      )
      // Tenant filter is ALWAYS applied
      .eq("customer_id", tenantCustomerId)
      .order("scheduled_for", { ascending: true, nullsFirst: false })
      .order("id", { ascending: true })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("[/api/tasks] Supabase error:", error);
      return res
        .status(500)
        .json({ error: error.message || "Failed to fetch tasks" });
    }

    const now = Date.now();

    const tasks = (data || []).map((row) => {
      const lead = row.leads || {};
      const dueAt = row.scheduled_for;

      // Simple overdue logic:
      // - has a due date
      // - due date is in the past
      // - status is not done/completed/cancelled
      let isOverdue = false;
      if (dueAt) {
        const dueTs = new Date(dueAt).getTime();
        if (!Number.isNaN(dueTs) && dueTs < now) {
          const status = (row.status || "").toLowerCase();
          if (
            status !== "done" &&
            status !== "completed" &&
            status !== "cancelled"
          ) {
            isOverdue = true;
          }
        }
      }

      return {
        id: row.id,
        leadId: row.lead_id,
        customerId: row.customer_id,
        followupType: row.followup_type,
        status: row.status || null,
        dueAt,
        sequenceStage: row.sequence_stage,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        payload: row.payload || null,

        // Lead-facing fields for deep-linking and display
        leadName: lead.name || null,
        leadEmail: lead.email || null,
        leadPhone: lead.phone || null,
        leadSource: lead.source || null,

        // UX helpers
        isOverdue,
      };
    });

    const total = typeof count === "number" ? count : tasks.length;
    const hasMore = to + 1 < total;

    return res.status(200).json({
      data: tasks,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        hasMore,
      },
    });
  } catch (err) {
    console.error("[/api/tasks] Unexpected error:", err);
    return res
      .status(500)
      .json({ error: "Unexpected error while fetching tasks" });
  }
}
