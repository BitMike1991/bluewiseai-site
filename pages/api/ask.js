// pages/api/ask.js

import { getAuthContext } from "../../lib/supabaseServer";
import OpenAI from "openai";
import { sendSmsTelnyx } from "../../lib/providers/telnyx";
import { sendEmailMailgun } from "../../lib/providers/mailgun";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Conservative SMS guardrail
const SMS_MAX_LEN = 1200;

// -----------------------------
// Small helpers
// -----------------------------

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function safeJson(v) {
  try {
    return v ?? null;
  } catch {
    return null;
  }
}

// -----------------------------
// Lead resolution helpers
// -----------------------------

function normalizeEmail(email) {
  if (!email || typeof email !== "string") return null;
  return email.trim().toLowerCase();
}

function normalizePhone(phone) {
  if (!phone || typeof phone !== "string") return null;
  // keep digits only
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  // If you store E.164 in normalized_phone, you'd normalize to +1... here.
  // For now, we just return digits-only and also compute last7.
  return digits;
}

function phoneLast7FromDigits(digits) {
  if (!digits || digits.length < 7) return digits || null;
  return digits.slice(-7);
}

function safeLeadDescriptor(row) {
  // No PII in logs; keep it minimal.
  return `lead_id=${row?.id || "?"}`;
}

function looksLikeDraftRequest(q) {
  const s = (q || "").toLowerCase();
  return (
    s.includes("draft") ||
    s.includes("write an") ||
    s.includes("write a") ||
    s.includes("compose") ||
    s.includes("reply") ||
    s.includes("email reply") ||
    s.includes("sms") ||
    s.includes("text")
  );
}

function looksLikeSummaryReference(q) {
  const s = (q || "").toLowerCase();
  return (
    s.includes("this summary") ||
    s.includes("that summary") ||
    s.includes("based on this summary") ||
    s.includes("from this summary") ||
    s.includes("for this summary") ||
    s.includes("based on the summary") ||
    s.includes("from the summary")
  );
}

// NEW: detect send intent
function looksLikeSendRequest(q) {
  const s = (q || "").toLowerCase();
  return (
    s.includes("send") ||
    s.includes("send it") ||
    s.includes("text it") ||
    s.includes("email it") ||
    s.includes("envoie") ||
    s.includes("envoyer")
  );
}

async function fetchInboxActivityByLeadIds(supabase, customerId, leadIds) {
  if (!leadIds || leadIds.length === 0) return {};

  const { data, error } = await supabase
    .from("inbox_leads")
    .select("lead_id,last_contact_at,last_missed_call_at,missed_call_count")
    .eq("customer_id", customerId)
    .in("lead_id", leadIds);

  if (error) {
    console.error("[/api/ask] inbox activity fetch error:", error);
    return {};
  }

  const byLead = {};
  for (const r of data || []) {
    const lid = r.lead_id;
    if (!lid) continue;

    const existing = byLead[lid] || {
      lastContactAt: null,
      lastMissedCallAt: null,
      missedCallCount: 0,
    };

    if (r.last_contact_at) {
      if (
        !existing.lastContactAt ||
        new Date(r.last_contact_at) > new Date(existing.lastContactAt)
      ) {
        existing.lastContactAt = r.last_contact_at;
      }
    }

    if (r.last_missed_call_at) {
      if (
        !existing.lastMissedCallAt ||
        new Date(r.last_missed_call_at) > new Date(existing.lastMissedCallAt)
      ) {
        existing.lastMissedCallAt = r.last_missed_call_at;
      }
    }

    existing.missedCallCount += r.missed_call_count || 0;
    byLead[lid] = existing;
  }

  return byLead;
}

// -----------------------------
// Tool runner: list_leads (CRM-centric)
// -----------------------------

async function runListLeadsTool(supabase, customerId, args) {
  const {
    status, // e.g. "open", "won", "lost", "all"
    no_reply_hours, // e.g. 24
    missed_calls_only, // boolean
    source, // optional source filter
  } = args || {};

  let leadsQuery = supabase
    .from("leads")
    .select(
      `
      id,
      customer_id,
      name,
      email,
      phone,
      source,
      status,
      language,
      created_at
    `
    )
    .eq("customer_id", customerId);

  if (status && status !== "all") {
    if (status === "open") {
      leadsQuery = leadsQuery.not("status", "in", "(closed,dead,lost,won)");
    } else {
      leadsQuery = leadsQuery.eq("status", status);
    }
  }

  if (source && typeof source === "string") {
    leadsQuery = leadsQuery.eq("source", source);
  }

  const { data: leadsRows, error: leadsError } = await leadsQuery;

  if (leadsError) {
    console.error("[/api/ask] list_leads leads error:", leadsError);
    throw new Error("Failed to fetch CRM leads.");
  }

  if (!leadsRows || leadsRows.length === 0) {
    return {
      intent: "list_leads",
      resultType: "lead_list",
      title: "Lead list",
      items: [],
    };
  }

  const leadIds = leadsRows.map((l) => l.id).filter((id) => id != null);

  let inboxStatsByLeadId = {};
  let primaryInboxByLeadId = {};

  if (leadIds.length > 0) {
    const { data: inboxRows, error: inboxError } = await supabase
      .from("inbox_leads")
      .select(
        `
        id,
        lead_id,
        customer_id,
        last_contact_at,
        last_missed_call_at,
        missed_call_count
      `
      )
      .eq("customer_id", customerId)
      .in("lead_id", leadIds);

    if (inboxError) {
      console.error("[/api/ask] list_leads inbox_leads error:", inboxError);
    } else {
      for (const row of inboxRows || []) {
        const lid = row.lead_id;
        if (!lid) continue;

        const existing = inboxStatsByLeadId[lid] || {
          lastContactAt: null,
          lastMissedCallAt: null,
          missedCallCount: 0,
        };

        if (row.last_contact_at) {
          if (
            !existing.lastContactAt ||
            new Date(row.last_contact_at) > new Date(existing.lastContactAt)
          ) {
            existing.lastContactAt = row.last_contact_at;
            primaryInboxByLeadId[lid] = row.id;
          }
        }

        if (row.last_missed_call_at) {
          if (
            !existing.lastMissedCallAt ||
            new Date(row.last_missed_call_at) >
              new Date(existing.lastMissedCallAt)
          ) {
            existing.lastMissedCallAt = row.last_missed_call_at;
          }
        }

        const mCount = row.missed_call_count || 0;
        existing.missedCallCount += mCount;

        inboxStatsByLeadId[lid] = existing;
      }
    }
  }

  let filteredLeads = leadsRows;

  let cutoffIso = null;
  if (typeof no_reply_hours === "number" && no_reply_hours > 0) {
    cutoffIso = new Date(
      Date.now() - no_reply_hours * 60 * 60 * 1000
    ).toISOString();
  }

  if (cutoffIso || missed_calls_only) {
    filteredLeads = leadsRows.filter((lead) => {
      const stats = inboxStatsByLeadId[lead.id] || {};
      const effectiveLastContact = stats.lastContactAt || null;
      const missedCount = stats.missedCallCount || 0;

      if (missed_calls_only && missedCount <= 0) return false;

      if (cutoffIso) {
        if (!effectiveLastContact) return true;
        return new Date(effectiveLastContact) < new Date(cutoffIso);
      }

      return true;
    });
  }

  const items = filteredLeads.map((lead) => {
    const stats = inboxStatsByLeadId[lead.id] || {};
    const inboxLeadId = primaryInboxByLeadId[lead.id] || null;

    const lastContactAt = stats.lastContactAt || null;

    return {
      inboxLeadId,
      leadId: lead.id,
      profileId: null,
      customerId: lead.customer_id,
      name: lead.name || lead.email || lead.phone || "Lead",
      email: lead.email || null,
      phone: lead.phone || null,
      source: lead.source || "unknown",
      status: lead.status || "new",
      language: lead.language || null,
      summary: null,
      lastContactAt,
      lastMissedCallAt: stats.lastMissedCallAt || null,
      missedCallCount: stats.missedCallCount || 0,
      createdAt: lead.created_at,
    };
  });

  items.sort((a, b) => {
    const aTs = a.lastContactAt || a.createdAt || 0;
    const bTs = b.lastContactAt || b.createdAt || 0;
    return new Date(bTs) - new Date(aTs);
  });

  return {
    intent: "list_leads",
    resultType: "lead_list",
    title: "Lead list",
    items,
  };
}

// -----------------------------
// Tool runner: find_lead
// -----------------------------
async function runFindLeadTool(supabase, customerId, args) {
  // (UNCHANGED — your code continues here exactly as pasted)
  // ...
  // Keep your existing runFindLeadTool implementation.
  // -----------------------------
  // NOTE: I am not truncating your file in the repo — this snippet assumes
  // you keep the entire function body you pasted.
  // -----------------------------

  const { query, email, phone, name, limit } = args || {};
  const max = Math.min(Math.max(Number(limit) || 5, 1), 10);

  const normEmail = normalizeEmail(email);
  const phoneDigits = normalizePhone(phone);
  const phoneLast7 = phoneLast7FromDigits(phoneDigits);

  const text = (typeof query === "string" ? query : "") || "";
  const nameQuery = (typeof name === "string" ? name : "") || "";

  const maybeEmail =
    !normEmail && text.includes("@") ? normalizeEmail(text) : null;
  const maybePhoneDigits =
    !phoneDigits && /\d/.test(text) ? normalizePhone(text) : null;
  const maybePhoneLast7 = phoneLast7FromDigits(maybePhoneDigits);

  const effectiveEmail = normEmail || maybeEmail;
  const effectivePhoneDigits = phoneDigits || maybePhoneDigits;
  const effectivePhoneLast7 = phoneLast7 || maybePhoneLast7;

  let candidates = [];
  let matchReason = "unknown";

  if (effectiveEmail) {
    matchReason = "email_exact";
    let { data, error } = await supabase
      .from("leads")
      .select(
        "id, customer_id, name, email, phone, source, status, language, created_at"
      )
      .eq("customer_id", customerId)
      .eq("normalized_email", effectiveEmail)
      .limit(max);

    if (error) {
      console.warn(
        "[/api/ask] find_lead: normalized_email query failed, falling back to email"
      );
      const fallback = await supabase
        .from("leads")
        .select(
          "id, customer_id, name, email, phone, source, status, language, created_at"
        )
        .eq("customer_id", customerId)
        .eq("email", effectiveEmail)
        .limit(max);
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error("[/api/ask] find_lead email error:", error);
      throw new Error("Failed to search leads by email.");
    }

    candidates = data || [];
  }

  if (
    (!candidates || candidates.length === 0) &&
    (effectivePhoneDigits || effectivePhoneLast7)
  ) {
    matchReason = "phone_exact_or_last7";
    let q = supabase
      .from("leads")
      .select(
        "id, customer_id, name, email, phone, source, status, language, created_at"
      )
      .eq("customer_id", customerId)
      .limit(max);

    if (effectivePhoneDigits) {
      q = q.eq("normalized_phone", effectivePhoneDigits);
    }

    let { data, error } = await q;

    if (error) {
      console.warn(
        "[/api/ask] find_lead: normalized_phone query failed, falling back to phone"
      );
      let fq = supabase
        .from("leads")
        .select(
          "id, customer_id, name, email, phone, source, status, language, created_at"
        )
        .eq("customer_id", customerId)
        .limit(max);

      if (effectivePhoneDigits) fq = fq.eq("phone", effectivePhoneDigits);
      const fallback = await fq;
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error("[/api/ask] find_lead phone error:", error);
      throw new Error("Failed to search leads by phone.");
    }

    candidates = data || [];

    if ((!candidates || candidates.length === 0) && effectivePhoneLast7) {
      matchReason = "phone_last7";
      const { data: data7, error: err7 } = await supabase
        .from("leads")
        .select(
          "id, customer_id, name, email, phone, source, status, language, created_at"
        )
        .eq("customer_id", customerId)
        .eq("phone_last7", effectivePhoneLast7)
        .limit(max);

      if (err7) {
        console.error("[/api/ask] find_lead phone_last7 error:", err7);
        throw new Error("Failed to search leads by phone_last7.");
      }

      candidates = data7 || [];
    }
  }

  if (!candidates || candidates.length === 0) {
    const effectiveName = nameQuery || text;
    if (
      effectiveName &&
      typeof effectiveName === "string" &&
      effectiveName.trim().length > 0
    ) {
      matchReason = "name_ilike";
      const { data, error } = await supabase
        .from("leads")
        .select(
          "id, customer_id, name, email, phone, source, status, language, created_at"
        )
        .eq("customer_id", customerId)
        .ilike("name", `%${effectiveName.trim()}%`)
        .order("created_at", { ascending: false })
        .limit(max);

      if (error) {
        console.error("[/api/ask] find_lead name error:", error);
        throw new Error("Failed to search leads by name.");
      }

      candidates = data || [];
    } else {
      candidates = [];
    }
  }

  const ids = (candidates || []).map((c) => c.id).filter(Boolean);
  const activityByLead = await fetchInboxActivityByLeadIds(
    supabase,
    customerId,
    ids
  );

  const items = (candidates || []).map((lead) => {
    const a = activityByLead[lead.id] || {};
    return {
      inboxLeadId: null,
      leadId: lead.id,
      customerId: lead.customer_id,
      name: lead.name || lead.email || lead.phone || "Lead",
      email: lead.email || null,
      phone: lead.phone || null,
      source: lead.source || "unknown",
      status: lead.status || "new",
      language: lead.language || null,
      lastContactAt: a.lastContactAt || null,
      lastMissedCallAt: a.lastMissedCallAt || null,
      missedCallCount: a.missedCallCount || 0,
      createdAt: lead.created_at,
      matchReason,
    };
  });

  items.sort((a, b) => {
    const aTs = a.lastContactAt || a.createdAt || 0;
    const bTs = b.lastContactAt || b.createdAt || 0;
    return new Date(bTs) - new Date(aTs);
  });

  if (items.length > 0) {
    console.log(
      "[/api/ask] find_lead:",
      `reason=${matchReason}`,
      `candidates=${items.length}`,
      `top_lead_id=${items[0].leadId}`
    );
  } else {
    console.log(
      "[/api/ask] find_lead:",
      `reason=${matchReason}`,
      "candidates=0"
    );
  }

  return {
    intent: "find_lead",
    resultType: "lead_list",
    title: "Lead search results",
    items,
    aiSummary:
      items.length === 0
        ? "No matching leads found."
        : `Found ${items.length} matching lead(s). Top match lead #${items[0].leadId}.`,
  };
}

// -----------------------------
// Tool runner: get_tasks
// -----------------------------
async function runGetTasksTool(supabase, customerId, args) {
  const { status, lead_id } = args || {};

  let q = supabase
    .from("tasks")
    .select(
      `
      id,
      lead_id,
      type,
      due_at,
      status,
      title,
      description,
      priority,
      created_at
    `
    )
    .eq("customer_id", customerId);

  if (status && status !== "all") {
    q = q.eq("status", status);
  }

  if (lead_id) {
    q = q.eq("lead_id", lead_id);
  }

  q = q.order("due_at", { ascending: true }).limit(50);

  const { data: rows, error } = await q;

  if (error) {
    console.error("[/api/ask] get_tasks error:", error);
    throw new Error("Failed to load tasks.");
  }

  const items =
    rows?.map((row) => ({
      id: row.id,
      leadId: row.lead_id,
      taskType: row.type || "general",
      dueAt: row.due_at,
      status: row.status,
      title: row.title || null,
      description: row.description || null,
      priority: row.priority || "normal",
      createdAt: row.created_at,
    })) || [];

  return {
    intent: "get_tasks",
    resultType: "task_list",
    title: "Tasks",
    items,
  };
}

// -----------------------------
// Helper: robust lead resolver
// -----------------------------
async function resolveLeadForTask(supabase, customerId, args) {
  // (UNCHANGED — keep your implementation)
  const { lead_id, lead_name, email, phone } = args || {};

  if (lead_id) {
    return {
      leadId: lead_id,
      matchReason: "lead_id",
      candidates: [],
    };
  }

  const normEmail = normalizeEmail(email);
  const phoneDigits = normalizePhone(phone);
  const phoneLast7 = phoneLast7FromDigits(phoneDigits);

  if (normEmail) {
    let { data, error } = await supabase
      .from("leads")
      .select("id, created_at")
      .eq("customer_id", customerId)
      .eq("normalized_email", normEmail)
      .limit(5);

    if (error) {
      console.warn(
        "[/api/ask] resolveLead: normalized_email failed, fallback to email"
      );
      const fallback = await supabase
        .from("leads")
        .select("id, created_at")
        .eq("customer_id", customerId)
        .eq("email", normEmail)
        .limit(5);
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error("[/api/ask] resolveLead email error:", error);
    } else if (data && data.length > 0) {
      console.log(
        "[/api/ask] resolveLead: reason=email_exact",
        `top_${safeLeadDescriptor(data[0])}`
      );
      return { leadId: data[0].id, matchReason: "email_exact", candidates: data };
    }
  }

  if (phoneDigits || phoneLast7) {
    if (phoneDigits) {
      let { data, error } = await supabase
        .from("leads")
        .select("id, created_at")
        .eq("customer_id", customerId)
        .eq("normalized_phone", phoneDigits)
        .limit(5);

      if (error) {
        console.warn(
          "[/api/ask] resolveLead: normalized_phone failed, fallback to phone"
        );
        const fallback = await supabase
          .from("leads")
          .select("id, created_at")
          .eq("customer_id", customerId)
          .eq("phone", phoneDigits)
          .limit(5);
        data = fallback.data;
        error = fallback.error;
      }

      if (!error && data && data.length > 0) {
        console.log(
          "[/api/ask] resolveLead: reason=phone_exact",
          `top_${safeLeadDescriptor(data[0])}`
        );
        return {
          leadId: data[0].id,
          matchReason: "phone_exact",
          candidates: data,
        };
      }
    }

    if (phoneLast7) {
      const { data, error } = await supabase
        .from("leads")
        .select("id, created_at")
        .eq("customer_id", customerId)
        .eq("phone_last7", phoneLast7)
        .limit(10);

      if (error) {
        console.error("[/api/ask] resolveLead phone_last7 error:", error);
      } else if (data && data.length > 0) {
        const ids = data.map((x) => x.id).filter(Boolean);
        const activityByLead = await fetchInboxActivityByLeadIds(
          supabase,
          customerId,
          ids
        );

        const ranked = [...data].sort((a, b) => {
          const aTs = activityByLead[a.id]?.lastContactAt || a.created_at || 0;
          const bTs = activityByLead[b.id]?.lastContactAt || b.created_at || 0;
          return new Date(bTs) - new Date(aTs);
        });

        console.log(
          "[/api/ask] resolveLead: reason=phone_last7",
          `candidates=${ranked.length}`,
          `top_${safeLeadDescriptor(ranked[0])}`
        );

        return {
          leadId: ranked[0].id,
          matchReason: "phone_last7",
          candidates: ranked,
        };
      }
    }
  }

  if (lead_name) {
    const { data, error } = await supabase
      .from("leads")
      .select("id, created_at")
      .eq("customer_id", customerId)
      .ilike("name", `%${lead_name}%`)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("[/api/ask] resolveLead name error:", error);
    } else if (data && data.length > 0) {
      const ids = data.map((x) => x.id).filter(Boolean);
      const activityByLead = await fetchInboxActivityByLeadIds(
        supabase,
        customerId,
        ids
      );

      const ranked = [...data].sort((a, b) => {
        const aTs = activityByLead[a.id]?.lastContactAt || a.created_at || 0;
        const bTs = activityByLead[b.id]?.lastContactAt || b.created_at || 0;
        return new Date(bTs) - new Date(aTs);
      });

      console.log(
        "[/api/ask] resolveLead: reason=name_ilike",
        `candidates=${ranked.length}`,
        `top_${safeLeadDescriptor(ranked[0])}`
      );

      return {
        leadId: ranked[0].id,
        matchReason: "name_ilike",
        candidates: ranked,
      };
    }
  }

  return { leadId: null, matchReason: "not_found", candidates: [] };
}

async function resolveLeadIdForTask(supabase, customerId, args) {
  const r = await resolveLeadForTask(supabase, customerId, args);
  return r.leadId || null;
}

// -----------------------------
// Tool runner: create_task
// -----------------------------
// (UNCHANGED — keep your runCreateTaskTool)
// -----------------------------

async function runCreateTaskTool(supabase, customerId, args) {
  const {
    lead_id,
    lead_name,
    email,
    phone,
    followup_type,
    scheduled_for_iso,
    note,
  } = args || {};

  const resolved = await resolveLeadForTask(supabase, customerId, {
    lead_id,
    lead_name,
    email,
    phone,
  });

  if (!resolved.leadId) {
    throw new Error(
      "Could not resolve which lead to attach this task to. " +
        "Please mention the lead's name, email, or phone."
    );
  }

  let scheduledDate = null;
  if (scheduled_for_iso) {
    const d = new Date(scheduled_for_iso);
    if (!Number.isNaN(d.getTime())) {
      scheduledDate = d;
    }
  }

  const now = new Date();

  if (scheduledDate) {
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    if (scheduledDate.getTime() < now.getTime() - THIRTY_DAYS_MS) {
      const fixed = new Date(now);
      fixed.setHours(scheduledDate.getHours(), scheduledDate.getMinutes(), 0, 0);
      if (fixed.getTime() <= now.getTime()) fixed.setDate(fixed.getDate() + 1);

      console.warn(
        "[/api/ask] create_task: AI returned stale date, remapped to",
        fixed.toISOString()
      );
      scheduledDate = fixed;
    }
  }

  if (!scheduledDate) {
    console.warn(
      "[/api/ask] create_task: no usable date. Fallback to tomorrow 09:00."
    );
    const d = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    d.setHours(9, 0, 0, 0);
    scheduledDate = d;
  }

  const taskType = followup_type || "general";
  const taskTitle = note
    ? note.length > 100
      ? note.substring(0, 100) + "..."
      : note
    : `${taskType.charAt(0).toUpperCase() + taskType.slice(1)} task`;

  const insertPayload = {
    customer_id: Number(customerId),
    lead_id: resolved.leadId,
    type: taskType,
    title: taskTitle,
    description: note || null,
    due_at: scheduledDate.toISOString(),
    status: "pending",
    priority: "normal",
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert(insertPayload)
    .select(
      `
      id,
      lead_id,
      type,
      title,
      description,
      due_at,
      status,
      priority,
      created_at
    `
    )
    .single();

  if (error) {
    console.error("[/api/ask] create_task error:", error);
    throw new Error("Failed to create task.");
  }

  const item = {
    id: data.id,
    leadId: data.lead_id,
    taskType: data.type || "general",
    title: data.title,
    description: data.description,
    dueAt: data.due_at,
    status: data.status,
    priority: data.priority,
    createdAt: data.created_at,
  };

  const localScheduled = new Date(item.dueAt).toLocaleString("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const chosenReason =
    resolved.matchReason && resolved.matchReason !== "lead_id"
      ? ` (matched by ${resolved.matchReason})`
      : "";

  const aiSummary = `Created ${item.taskType} task for lead #${item.leadId}${chosenReason} due ${localScheduled}.`;

  return {
    intent: "create_task",
    resultType: "task_created",
    title: "Task created",
    items: [item],
    aiSummary,
  };
}

// -----------------------------
// Tool runner: update_task
// -----------------------------
// (UNCHANGED — keep your runUpdateTaskTool)
// -----------------------------
async function runUpdateTaskTool(supabase, customerId, args) {
  const {
    task_id,
    lead_id,
    lead_name,
    followup_type,
    new_status,
    new_scheduled_for_iso,
    note,
  } = args || {};

  let effectiveLeadId = lead_id || null;
  let resolvedMeta = null;

  if (!task_id && !effectiveLeadId && lead_name) {
    resolvedMeta = await resolveLeadForTask(supabase, customerId, { lead_name });
    effectiveLeadId = resolvedMeta.leadId || null;
  }

  if (!task_id && !effectiveLeadId) {
    throw new Error(
      "To update a task, I need either the task id or the lead id / lead name."
    );
  }

  let q = supabase
    .from("tasks")
    .select(
      `
      id,
      lead_id,
      type,
      title,
      description,
      due_at,
      status,
      priority,
      created_at
    `
    )
    .eq("customer_id", customerId)
    .limit(1);

  if (task_id) {
    q = q.eq("id", task_id);
  } else if (effectiveLeadId) {
    q = q.eq("lead_id", effectiveLeadId);
    if (followup_type) q = q.eq("type", followup_type);
    q = q.order("due_at", { ascending: false });
  }

  const { data: rows, error: fetchError } = await q;

  if (fetchError) {
    console.error("[/api/ask] update_task fetch error:", fetchError);
    throw new Error("Failed to locate task to update.");
  }

  if (!rows || rows.length === 0) {
    throw new Error("No matching task found to update.");
  }

  const existing = rows[0];

  const updates = {};
  const now = new Date();
  let scheduledDate = null;

  if (new_scheduled_for_iso) {
    const d = new Date(new_scheduled_for_iso);
    if (!Number.isNaN(d.getTime())) scheduledDate = d;

    if (scheduledDate) {
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      if (scheduledDate.getTime() < now.getTime() - THIRTY_DAYS_MS) {
        const fixed = new Date(now);
        fixed.setHours(
          scheduledDate.getHours(),
          scheduledDate.getMinutes(),
          0,
          0
        );
        if (fixed.getTime() <= now.getTime()) fixed.setDate(fixed.getDate() + 1);

        console.warn(
          "[/api/ask] update_task: AI returned stale date, remapped to",
          fixed.toISOString()
        );
        scheduledDate = fixed;
      }
    }

    if (scheduledDate) updates.due_at = scheduledDate.toISOString();
  }

  if (new_status) {
    // Map old status values to new ones
    if (new_status === "open") {
      updates.status = "pending";
    } else if (new_status === "completed") {
      updates.status = "completed";
      updates.completed_at = new Date().toISOString();
    } else {
      updates.status = new_status;
    }
  }

  if (note) {
    updates.description = note;
  }

  if (Object.keys(updates).length === 0) {
    throw new Error(
      "Nothing to update on this task. Provide a new status or a new date."
    );
  }

  const { data, error: updateError } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", existing.id)
    .eq("customer_id", customerId)
    .select(
      `
      id,
      lead_id,
      type,
      title,
      description,
      due_at,
      status,
      priority,
      created_at
    `
    )
    .single();

  if (updateError) {
    console.error("[/api/ask] update_task update error:", updateError);
    throw new Error("Failed to update task.");
  }

  const item = {
    id: data.id,
    leadId: data.lead_id,
    taskType: data.type || "general",
    title: data.title,
    description: data.description,
    dueAt: data.due_at,
    status: data.status,
    priority: data.priority,
    createdAt: data.created_at,
  };

  const localScheduled = item.dueAt
    ? new Date(item.dueAt).toLocaleString("en-CA", {
        timeZone: "America/Toronto",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  let summaryParts = [`Task #${item.id} for lead #${item.leadId}`];

  if (resolvedMeta?.matchReason) summaryParts.push(`(matched by ${resolvedMeta.matchReason})`);
  if (new_status) summaryParts.push(`status set to "${item.status}"`);
  if (localScheduled) summaryParts.push(`due ${localScheduled}`);

  return {
    intent: "update_task",
    resultType: "task_updated",
    title: "Task updated",
    items: [item],
    aiSummary: summaryParts.join(" · "),
  };
}

// -----------------------------
// Tool runner: summarize_conversation
// -----------------------------
// (UNCHANGED — keep your runSummarizeConversationTool implementation)
// -----------------------------
async function runSummarizeConversationTool(supabase, customerId, args) {
  // your existing implementation (as pasted)...
  // (kept exactly)
  const { lead_id, lead_name, email, phone, days_back, limit_messages, focus } =
    args || {};

  const resolved = await resolveLeadForTask(supabase, customerId, {
    lead_id,
    lead_name,
    email,
    phone,
  });

  if (!resolved.leadId) {
    throw new Error(
      "Could not resolve which lead to summarize. Please mention the lead's name, email, or phone."
    );
  }

  const maxMsgs = Math.min(Math.max(Number(limit_messages) || 60, 10), 200);
  const backDays = Math.min(Math.max(Number(days_back) || 30, 1), 365);

  const sinceIso = new Date(
    Date.now() - backDays * 24 * 60 * 60 * 1000
  ).toISOString();

  async function loadMessagesWithFallback() {
    const selectVariants = [
      `
        id,
        customer_id,
        lead_id,
        channel,
        direction,
        subject,
        body,
        content,
        text,
        email_body,
        created_at
      `,
      `
        id,
        customer_id,
        lead_id,
        channel,
        direction,
        subject,
        body,
        text,
        email_body,
        created_at
      `,
      `
        id,
        customer_id,
        lead_id,
        channel,
        direction,
        body,
        created_at
      `,
      `
        id,
        customer_id,
        lead_id,
        body,
        created_at
      `,
      `
        id,
        customer_id,
        lead_id,
        created_at
      `,
    ];

    let lastError = null;

    for (const sel of selectVariants) {
      const { data, error } = await supabase
        .from("messages")
        .select(sel)
        .eq("customer_id", customerId)
        .eq("lead_id", resolved.leadId)
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: true })
        .limit(maxMsgs);

      if (!error) return { rows: data || [], usedSelect: sel };

      lastError = error;

      const isMissingColumn =
        error.code === "42703" ||
        (typeof error.message === "string" &&
          error.message.toLowerCase().includes("does not exist"));

      if (!isMissingColumn) break;
    }

    return { rows: null, error: lastError };
  }

  const loaded = await loadMessagesWithFallback();
  if (loaded.error) {
    console.error(
      "[/api/ask] summarize_conversation messages error:",
      loaded.error
    );
    throw new Error("Failed to load messages for this lead.");
  }

  const rows = loaded.rows || [];

  const messages = rows.map((m) => {
    const t = m.body || m.content || m.text || m.email_body || "";
    return {
      id: m.id,
      at: m.created_at,
      channel: m.channel || null,
      direction: m.direction || null,
      subject: m.subject || null,
      text: typeof t === "string" ? t : JSON.stringify(t),
    };
  });

  if (messages.length === 0) {
    const human = `No messages found for lead #${resolved.leadId} in the last ${backDays} day(s).`;
    return {
      intent: "summarize_conversation",
      resultType: "conversation_summary",
      title: "Conversation summary",
      items: [
        {
          leadId: resolved.leadId,
          matchReason: resolved.matchReason,
          daysBack: backDays,
          messageCount: 0,
          summary: "No messages found in the selected time range.",
          leadIntent: "unknown",
          keyDetails: [],
          sentiment: "neutral",
          objections: [],
          nextSteps: [],
          openQuestions: [],
          recommendedFollowUpType: "none",
          urgency: "low",
        },
      ],
      aiSummary: human,
    };
  }

  const transcriptLines = [];
  for (const m of messages) {
    const who =
      (m.direction || "").toLowerCase() === "outbound"
        ? "You"
        : (m.direction || "").toLowerCase() === "inbound"
        ? "Lead"
        : "Unknown";

    const when = m.at ? new Date(m.at).toISOString() : "";
    const ch = m.channel ? String(m.channel).toUpperCase() : "MSG";
    const subj = m.subject ? ` | Subject: ${m.subject}` : "";
    const clean = (m.text || "").toString().replace(/\s+/g, " ").trim();
    const clipped = clean.length > 600 ? clean.slice(0, 600) + "…" : clean;

    transcriptLines.push(`[${when}] (${ch}) ${who}${subj}: ${clipped}`);
  }

  const transcript = transcriptLines.join("\n");

  const focusText =
    typeof focus === "string" && focus.trim()
      ? focus.trim()
      : "Summarize for a trades CRM: intent, scope, constraints, urgency, and what to do next.";

  const summarySystem =
    "You are a CRM copilot. Produce a concise, actionable summary for a trades/service business.\n" +
    "Output STRICT JSON with keys:\n" +
    "{ summary, leadIntent, keyDetails, sentiment, objections, nextSteps, openQuestions, recommendedFollowUpType, urgency }\n" +
    "- summary: 2-5 sentences (plain text)\n" +
    "- leadIntent: short string\n" +
    "- keyDetails: array of bullets (strings)\n" +
    "- sentiment: one of [positive, neutral, negative, mixed]\n" +
    "- objections: array of strings\n" +
    "- nextSteps: array of strings\n" +
    "- openQuestions: array of strings\n" +
    "- recommendedFollowUpType: one of [call, sms, email, none]\n" +
    "- urgency: one of [low, medium, high]\n" +
    "Return ONLY the JSON object. No markdown. No backticks.";

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: summarySystem },
      {
        role: "user",
        content: `FOCUS:\n${focusText}\n\nTRANSCRIPT:\n${transcript}`,
      },
    ],
    temperature: 0.2,
  });

  const raw = completion.choices[0]?.message?.content || "{}";

  function stripCodeFences(s) {
    if (!s || typeof s !== "string") return "";
    let out = s.trim();
    if (out.startsWith("```")) {
      out = out.replace(/^```[a-zA-Z]*\s*/m, "");
      out = out.replace(/```$/m, "");
      out = out.trim();
    }
    out = out.replace(/^json\s*/i, "").trim();
    return out;
  }

  function extractFirstJsonObject(s) {
    if (!s || typeof s !== "string") return null;
    const start = s.indexOf("{");
    if (start < 0) return null;

    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = start; i < s.length; i++) {
      const ch = s[i];

      if (inString) {
        if (escape) escape = false;
        else if (ch === "\\") escape = true;
        else if (ch === '"') inString = false;
        continue;
      }

      if (ch === '"') {
        inString = true;
        continue;
      }

      if (ch === "{") depth++;
      if (ch === "}") {
        depth--;
        if (depth === 0) return s.slice(start, i + 1);
      }
    }
    return null;
  }

  let parsed = null;
  try {
    const cleaned = stripCodeFences(raw);
    const candidate = extractFirstJsonObject(cleaned) || cleaned;
    parsed = JSON.parse(candidate);
  } catch (e) {
    console.warn(
      "[/api/ask] summarize_conversation: JSON parse failed, using plain-text fallback."
    );
    const cleaned = stripCodeFences(raw);
    parsed = {
      summary: cleaned && cleaned !== "{}" ? cleaned : "Summary unavailable.",
      leadIntent: "unknown",
      keyDetails: [],
      sentiment: "neutral",
      objections: [],
      nextSteps: [],
      openQuestions: [],
      recommendedFollowUpType: "none",
      urgency: "low",
    };
  }

  if (!parsed || typeof parsed !== "object") parsed = {};
  if (typeof parsed.summary !== "string" || !parsed.summary.trim()) {
    parsed.summary = "Summary unavailable.";
  }

  const chosenReason =
    resolved.matchReason && resolved.matchReason !== "lead_id"
      ? ` (matched by ${resolved.matchReason})`
      : "";

  const humanSummary = parsed.summary.trim();

  return {
    intent: "summarize_conversation",
    resultType: "conversation_summary",
    title: "Conversation summary",
    items: [
      {
        leadId: resolved.leadId,
        matchReason: resolved.matchReason,
        daysBack: backDays,
        messageCount: messages.length,
        ...parsed,
      },
    ],
    aiSummary: humanSummary + chosenReason,
  };
}

// -----------------------------
// Tool runner: draft_reply
// -----------------------------
// (UNCHANGED — keep your runDraftReplyTool implementation)
// -----------------------------
async function runDraftReplyTool(supabase, customerId, args) {
  // your existing implementation (as pasted)...
  // (kept exactly)
  const {
    lead_id,
    lead_name,
    email,
    phone,
    channel,
    purpose,
    tone,
    language,
    extra_context,
    variants,
  } = args || {};

  const resolved = await resolveLeadForTask(supabase, customerId, {
    lead_id,
    lead_name,
    email,
    phone,
  });

  if (!resolved.leadId) {
    throw new Error(
      "Could not resolve which lead to draft a reply for. Please mention the lead's name, email, or phone (or set Active lead)."
    );
  }

  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select(
      "id, customer_id, name, email, phone, status, source, language, created_at"
    )
    .eq("customer_id", customerId)
    .eq("id", resolved.leadId)
    .maybeSingle();

  if (leadErr || !lead) {
    console.error("[/api/ask] draft_reply lead load error:", leadErr);
    throw new Error(`Failed to load lead #${resolved.leadId}.`);
  }

  const sendChannel =
    channel === "email"
      ? "email"
      : channel === "sms"
      ? "sms"
      : lead.email
      ? "email"
      : "sms";

  const { data: fuRows, error: fuErr } = await supabase
    .from("tasks")
    .select("id, type, due_at, status, title, description, created_at")
    .eq("customer_id", customerId)
    .eq("lead_id", resolved.leadId)
    .eq("status", "pending")
    .order("due_at", { ascending: true })
    .limit(1);

  if (fuErr) {
    console.warn("[/api/ask] draft_reply tasks load warning:", fuErr);
  }

  const followup = (fuRows || [])[0] || null;

  async function loadLastMessage() {
    const selectVariants = [
      "id, customer_id, lead_id, channel, direction, body, content, text, email_body, created_at",
      "id, customer_id, lead_id, channel, direction, body, text, email_body, created_at",
      "id, customer_id, lead_id, channel, direction, body, created_at",
      "id, customer_id, lead_id, body, created_at",
    ];

    let lastError = null;

    for (const sel of selectVariants) {
      const { data, error } = await supabase
        .from("messages")
        .select(sel)
        .eq("customer_id", customerId)
        .eq("lead_id", resolved.leadId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!error) return (data || [])[0] || null;

      lastError = error;

      const isMissingColumn =
        error.code === "42703" ||
        (typeof error.message === "string" &&
          error.message.toLowerCase().includes("does not exist"));

      if (!isMissingColumn) break;
    }

    if (lastError) {
      console.warn("[/api/ask] draft_reply messages fallback error:", lastError);
    }
    return null;
  }

  const lastMsg = await loadLastMessage();

  const lastMsgText = (
    lastMsg?.body ||
    lastMsg?.content ||
    lastMsg?.text ||
    lastMsg?.email_body ||
    ""
  )
    .toString()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 700);

  const desiredPurpose = purpose || "confirm_followup";
  const desiredTone = tone || "friendly_pro";

  const leadLang =
    language ||
    (lead.language && typeof lead.language === "string"
      ? lead.language.toLowerCase()
      : null) ||
    "en";

  const followupLocalLabel = followup?.scheduled_for
    ? new Date(followup.scheduled_for).toLocaleString("en-CA", {
        timeZone: "America/Toronto",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const sendTo = sendChannel === "sms" ? lead.phone || null : lead.email || null;

  const purposeHint =
    desiredPurpose === "confirm_followup"
      ? "Confirm the follow-up time and ask for a quick confirmation."
      : desiredPurpose === "reschedule"
      ? "Ask to reschedule and propose two time options."
      : desiredPurpose === "ask_more_info"
      ? "Ask 2–3 specific questions needed to proceed."
      : "Reply helpfully and move the conversation forward.";

  const langLine = leadLang.startsWith("fr") ? "French" : "English";
  const leadName = lead.name || null;

  const contextBlock = [
    `Lead: #${lead.id}`,
    leadName ? `Name: ${leadName}` : "",
    lead.phone ? `Phone: ${lead.phone}` : "",
    lead.email ? `Email: ${lead.email}` : "",
    followup
      ? `Open follow-up: type=${followup.followup_type || "general"} scheduled_for=${followup.scheduled_for}`
      : "Open follow-up: none",
    lastMsgText
      ? `Last message snippet: "${lastMsgText}"`
      : "Last message snippet: none",
    extra_context ? `User request: ${extra_context}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  function stripCodeFences(s) {
    if (!s || typeof s !== "string") return "";
    let out = s.trim();
    if (out.startsWith("```")) {
      out = out.replace(/^```[a-zA-Z]*\s*/m, "");
      out = out.replace(/```$/m, "");
      out = out.trim();
    }
    out = out.replace(/^json\s*/i, "").trim();
    return out;
  }

  function extractFirstJsonObject(s) {
    if (!s || typeof s !== "string") return null;
    const start = s.indexOf("{");
    if (start < 0) return null;

    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = start; i < s.length; i++) {
      const ch = s[i];

      if (inString) {
        if (escape) escape = false;
        else if (ch === "\\") escape = true;
        else if (ch === '"') inString = false;
        continue;
      }

      if (ch === '"') {
        inString = true;
        continue;
      }

      if (ch === "{") depth++;
      if (ch === "}") {
        depth--;
        if (depth === 0) return s.slice(start, i + 1);
      }
    }
    return null;
  }

  const v = Math.min(Math.max(Number(variants) || 2, 1), 3);

  const structuredSystem =
    sendChannel === "sms"
      ? 'Output STRICT JSON only: { "body": "..." }. No markdown, no backticks. Body max 320 characters. No emojis.'
      : `
Output STRICT JSON only:
{
  "subject": "...",
  "body": "..."
}

Rules for EMAIL:
- Subject is REQUIRED and must be non-empty
- Subject must be sales-oriented and specific (no generic subjects)
- Body must expand on the subject
- No markdown, no backticks
`.trim();

  const userPrompt = `
${structuredSystem}
Language: ${langLine}.
Tone: ${desiredTone.replace(/_/g, " ")}.
Goal: ${purposeHint}

Sales framework:
- Open with relevance (why this is about them)
- One clear value/outcome of the meeting
- One brief authority/credibility cue (no fake claims)
- One clear CTA (confirm time or propose alternative)

Rules:
- If a follow-up time exists, include it clearly.
- If no follow-up time exists, ask what time works.
- If you don't know their name, use a neutral greeting.
- Do not invent facts.

Context:
${contextBlock}

Now output the JSON:
`.trim();

  const variantsOut = [];
  const legacyBodies = [];

  for (let i = 0; i < v; i++) {
    const variantStyle =
      i === 0
        ? "Direct and confident"
        : i === 1
        ? "Warm and consultative"
        : "Concise and time-respectful";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: i === 0 ? 0.35 : 0.55,
      messages: [
        {
          role: "system",
          content:
            "You draft client-facing messages for a trades CRM. " +
            "Be persuasive but honest. Be precise and do not invent facts. " +
            `Variant style: ${variantStyle}.`,
        },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() || "";
    let parsed = null;

    try {
      const cleaned = stripCodeFences(raw);
      const candidate = extractFirstJsonObject(cleaned) || cleaned;
      parsed = JSON.parse(candidate);
    } catch (e) {
      parsed =
        sendChannel === "email"
          ? { subject: "", body: raw || "" }
          : { body: raw || "" };
    }

    const body = typeof parsed?.body === "string" ? parsed.body.trim() : "";
    const subject =
      sendChannel === "email" && typeof parsed?.subject === "string"
        ? parsed.subject.trim()
        : null;

    const safeSubject =
      sendChannel === "email"
        ? subject && subject.length > 0
          ? subject
          : `Quick check-in for ${leadName || "your project"}`
        : null;

    const finalBody =
      sendChannel === "sms" && body.length > 320 ? body.slice(0, 320) : body;

    variantsOut.push({
      id: `v${i + 1}`,
      subject: sendChannel === "email" ? safeSubject : null,
      body: finalBody || "",
    });

    legacyBodies.push(finalBody || "");
  }

  const item = {
    leadId: lead.id,
    leadName: lead.name || null,
    matchReason: resolved.matchReason,
    channel: sendChannel,
    purpose: desiredPurpose,
    tone: desiredTone,
    language: leadLang,
    suggestedSuggestedSendTo: sendTo,
    suggestedSendTo: sendTo,
    followupId: followup?.id || null,
    followupType: followup?.followup_type || null,
    scheduledFor: followup?.scheduled_for || null,
    scheduledForLocal: followupLocalLabel,
    lastMessageAt: lastMsg?.created_at || null,

    subject: sendChannel === "email" ? variantsOut[0]?.subject || "" : null,
    body: variantsOut[0]?.body || "",
    variants: variantsOut,
    meta: {
      to: {
        email: lead.email || null,
        phone: lead.phone || null,
      },
      followup_id: followup?.id || null,
      followup_scheduled_for: followup?.scheduled_for || null,
      grounding: {
        last_message_id: lastMsg?.id || null,
        used_followup: !!followup,
      },
    },

    draft: legacyBodies[0] || "",
    draftAlt: legacyBodies[1] || "",
    draftAlt2: legacyBodies[2] || "",
  };

  const chosenReason =
    resolved.matchReason && resolved.matchReason !== "lead_id"
      ? ` (matched by ${resolved.matchReason})`
      : "";

  const aiSummary = `Draft ready for lead #${lead.id}${chosenReason}.`;

  return {
    intent: "draft_reply",
    resultType: "draft_reply",
    title: "Draft reply",
    items: [item],
    aiSummary,
  };
}

// -----------------------------
// Tool runner: send_message (NEW)
// -----------------------------
async function runSendMessageTool(supabase, customerId, args) {
  const { lead_id, channel, to, subject, body, meta } = args || {};

  if (!lead_id || typeof lead_id !== "number") {
    throw new Error("lead_id must be a number.");
  }
  if (channel !== "sms" && channel !== "email") {
    throw new Error("channel must be sms or email.");
  }
  if (!isNonEmptyString(to)) {
    throw new Error("to is required.");
  }
  if (!isNonEmptyString(body)) {
    throw new Error("body is required.");
  }
  if (channel === "email" && !isNonEmptyString(subject)) {
    throw new Error("subject is required for email.");
  }
  if (channel === "sms" && body.trim().length > SMS_MAX_LEN) {
    throw new Error(`SMS body too long (max ${SMS_MAX_LEN} chars).`);
  }

  // Verify lead belongs to tenant + get profile_id
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("id, customer_id, profile_id, email, phone")
    .eq("id", lead_id)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (leadErr) {
    console.error("[/api/ask] send_message lead lookup error:", leadErr);
    throw new Error("Failed to verify lead ownership.");
  }
  if (!lead) {
    throw new Error("Lead not found (or not owned by this tenant).");
  }

  // Resolve provider + from
  let provider = null;
  let fromAddress = null;

  if (channel === "sms") {
    provider = "telnyx";

    const { data: customerRow, error: custErr } = await supabase
      .from("customers")
      .select("id, telnyx_sms_number")
      .eq("id", customerId)
      .maybeSingle();

    if (custErr) throw new Error(custErr.message);
    if (!customerRow?.telnyx_sms_number) {
      throw new Error("Missing customers.telnyx_sms_number for this tenant.");
    }

    fromAddress = customerRow.telnyx_sms_number;
  } else {
    provider = "mailgun";
    fromAddress =
      process.env.MAILGUN_FROM ||
      `BlueWise AI <sales@${process.env.MAILGUN_DOMAIN}>`;
  }

  // Best-effort send_logs insert
  const requestPayload = {
    lead_id,
    channel,
    to,
    subject: channel === "email" ? subject : null,
    body,
    meta: meta && typeof meta === "object" ? meta : null,
  };

  const { data: logRow, error: logErr } = await supabase
    .from("send_logs")
    .insert([
      {
        customer_id: customerId,
        lead_id,
        channel,
        provider,
        request_payload: requestPayload,
        success: false,
      },
    ])
    .select("id")
    .single();

  const sendLogId = logErr ? null : logRow?.id ?? null;

  // Send provider call
  let sendResult = null;
  if (channel === "sms") {
    sendResult = await sendSmsTelnyx({
      to,
      from: fromAddress,
      body,
    });
  } else {
    sendResult = await sendEmailMailgun({
      to,
      from: fromAddress,
      subject,
      body,
    });
  }

  const success = !!sendResult?.success;
  const providerMessageId = sendResult?.provider_message_id || null;
  const errorMsg = sendResult?.error || null;

  // Persist outbound message (canonical messages table)
  const messageInsert = {
    customer_id: customerId,
    lead_id,
    profile_id: lead?.profile_id || null,
    direction: "outbound",
    channel, // sms | email
    message_type: channel, // keep your pattern
    subject: channel === "email" ? subject : null,
    body,
    provider,
    provider_message_id: providerMessageId,
    status: success ? "sent" : "failed",
    error: success ? null : errorMsg,
    to_address: to,
    from_address: fromAddress,
    meta: safeJson(meta),
    raw_payload: safeJson(sendResult?.raw),
  };

  const { data: msgRow, error: msgErr } = await supabase
    .from("messages")
    .insert([messageInsert])
    .select("id, created_at")
    .single();

  // Update send_logs (best-effort)
  if (sendLogId) {
    await supabase
      .from("send_logs")
      .update({
        success,
        error: success ? null : errorMsg,
        response_payload: safeJson(sendResult?.raw),
      })
      .eq("id", sendLogId);
  }

  if (msgErr) {
    console.error("[/api/ask] send_message persist error:", msgErr);
    throw new Error("Send completed but failed to persist outbound message.");
  }

  return {
    intent: "send_message",
    resultType: "send_result",
    title: "Message sent",
    items: [
      {
        leadId: lead_id,
        channel,
        to,
        from: fromAddress,
        provider,
        provider_message_id: providerMessageId,
        message_id: msgRow.id,
        created_at: msgRow.created_at,
        status: success ? "sent" : "failed",
        error: success ? null : errorMsg,
      },
    ],
    aiSummary: success
      ? `Sent ${channel.toUpperCase()} to lead #${lead_id}.`
      : `Failed to send ${channel.toUpperCase()} to lead #${lead_id}: ${
          errorMsg || "unknown error"
        }`,
  };
}

// -----------------------------
// Main handler
// -----------------------------
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  const { question, lastSummary } = body;

  const activeLeadId =
    body.activeLeadId ??
    body.context?.active_lead_id ??
    body.context?.activeLeadId ??
    null;

  const activeLeadName =
    body.activeLeadName ??
    body.context?.active_lead_name ??
    body.context?.activeLeadName ??
    null;

  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Missing question" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "Ask BlueWise is not configured.",
      details: "Missing OPENAI_API_KEY on the server.",
    });
  }

  // ✅ Auth + tenant resolution (cookie-aware)
  const { supabase, customerId, user } = await getAuthContext(req, res);

  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (!customerId) {
    return res.status(403).json({ error: "No customer mapping for this user" });
  }

  const now = new Date();
  const nowIso = now.toISOString();

  const isSummaryDraftMode =
    looksLikeDraftRequest(question) &&
    looksLikeSummaryReference(question) &&
    (!!activeLeadId || !!lastSummary?.leadId);

  const normalized = question.toLowerCase();

  const wantsUpdate =
    normalized.includes("cancel") ||
    normalized.includes("annule") ||
    normalized.includes("completed") ||
    normalized.includes("complété") ||
    normalized.includes("complete it") ||
    normalized.includes("mark it done") ||
    normalized.includes("mark as done") ||
    (normalized.includes("update") && normalized.includes("follow")) ||
    (normalized.includes("update") && normalized.includes("tâche")) ||
    normalized.includes("resched") ||
    (normalized.includes("move") && normalized.includes("follow")) ||
    (normalized.includes("déplace") && normalized.includes("rappel"));

  const wantsSend = looksLikeSendRequest(question);

  const systemContent =
    "You are BlueWise Brain, an assistant for a trades CRM. " +
    "When the user asks about leads, conversations, follow-ups, drafting replies, or sending messages, " +
    "you MUST use tools to query or update the database instead of guessing. " +
    "The primary CRM entity is 'leads'; 'inbox_leads' are conversation threads linked to those leads. " +
    "SMS and email messages live in the 'messages' table linked by lead_id. " +
    "You can also manage follow-up tasks via tools (create, list, update/complete/cancel/reschedule). " +
    "You can draft client replies (SMS/email) grounded in the lead + latest context via draft_reply. " +
    "You can send messages via send_message (SMS or email) and it MUST persist an outbound row in messages. " +
    "LEAD RESOLUTION RULE: If you are not 100% sure which lead the user means, call find_lead first. " +
    "Prefer exact identifiers: email (exact) > phone (exact) > phone last-7 > name fuzzy match. " +
    "CHAINING RULE: If the user asked to SEND and you need a draft, call draft_reply first then send_message in the same flow. " +
    "If multiple leads match a name, proceed with the top match returned by find_lead and mention which lead_id you chose. " +
    `CURRENT DATETIME: Right now it is ${nowIso} in the business's local time. ` +
    "Interpret 'today/tonight/tomorrow/demain' relative to CURRENT DATETIME. " +
    "DATE RULES: When creating or rescheduling tasks, ALWAYS output scheduled_for_iso/new_scheduled_for_iso as valid ISO 8601.";

  // Tool specs
  const listLeadsTool = {
    type: "function",
    function: {
      name: "list_leads",
      description:
        "Get CRM leads from the 'leads' table, enriched with stats from 'inbox_leads'.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["open", "new", "active", "quoted", "won", "lost", "all"] },
          no_reply_hours: { type: "number" },
          missed_calls_only: { type: "boolean" },
          source: { type: "string" },
        },
        additionalProperties: false,
      },
    },
  };

  const findLeadTool = {
    type: "function",
    function: {
      name: "find_lead",
      description:
        "Search and resolve a lead by identifier. Returns ranked matches (most recent activity first).",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          name: { type: "string" },
          limit: { type: "number" },
        },
        additionalProperties: false,
      },
    },
  };

  const summarizeConversationTool = {
    type: "function",
    function: {
      name: "summarize_conversation",
      description:
        "Summarize the lead's SMS/email conversation from the `messages` table.",
      parameters: {
        type: "object",
        properties: {
          lead_id: { type: "integer" },
          lead_name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          days_back: { type: "number" },
          limit_messages: { type: "number" },
          focus: { type: "string" },
        },
        additionalProperties: false,
      },
    },
  };

  const draftReplyTool = {
    type: "function",
    function: {
      name: "draft_reply",
      description:
        "Draft a client-facing reply (SMS or email) grounded in the selected lead and latest context.",
      parameters: {
        type: "object",
        properties: {
          lead_id: { type: "integer" },
          lead_name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          channel: { type: "string", enum: ["sms", "email"] },
          purpose: {
            type: "string",
            enum: ["confirm_followup", "generic_reply", "reschedule", "ask_more_info"],
          },
          tone: { type: "string", enum: ["friendly_pro", "direct", "warm"] },
          language: { type: "string" },
          extra_context: { type: "string" },
          variants: { type: "number" },
        },
        additionalProperties: false,
      },
    },
  };

  const getTasksTool = {
    type: "function",
    function: {
      name: "get_tasks",
      description:
        "ONLY for listing follow-up tasks. Do NOT use for cancel/complete/reschedule.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["open", "completed", "canceled", "all"] },
          lead_id: { type: "integer" },
        },
        additionalProperties: false,
      },
    },
  };

  const createTaskTool = {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a new task for a lead in the 'tasks' table.",
      parameters: {
        type: "object",
        properties: {
          lead_id: { type: "integer" },
          lead_name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          followup_type: { type: "string" },
          scheduled_for_iso: { type: "string" },
          note: { type: "string" },
        },
        required: ["scheduled_for_iso"],
        additionalProperties: false,
      },
    },
  };

  const updateTaskTool = {
    type: "function",
    function: {
      name: "update_task",
      description: "Update an existing task in the 'tasks' table.",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "integer" },
          lead_id: { type: "integer" },
          lead_name: { type: "string" },
          followup_type: { type: "string" },
          new_status: { type: "string", enum: ["open", "completed", "canceled"] },
          new_scheduled_for_iso: { type: "string" },
          note: { type: "string" },
        },
        additionalProperties: false,
      },
    },
  };

  // NEW: send_message tool
  const sendMessageTool = {
    type: "function",
    function: {
      name: "send_message",
      description:
        "Send a message to a lead via sms/email and persist it to messages. Use AFTER draft_reply when user wants to send.",
      parameters: {
        type: "object",
        properties: {
          lead_id: { type: "integer" },
          channel: { type: "string", enum: ["sms", "email"] },
          to: { type: "string" },
          subject: { type: "string" },
          body: { type: "string" },
          meta: { type: "object" },
        },
        required: ["lead_id", "channel", "to", "body"],
        additionalProperties: false,
      },
    },
  };

  const tools = [
    listLeadsTool,
    findLeadTool,
    summarizeConversationTool,
    draftReplyTool,
    createTaskTool,
    updateTaskTool,
    sendMessageTool,
  ];
  if (!wantsUpdate) tools.push(getTasksTool);

  try {
    const messages = [{ role: "system", content: systemContent }];

    if (activeLeadId) {
      const lid = Number(activeLeadId);
      messages.push({
        role: "system",
        content: `CONTEXT: The UI has an Active lead set: lead_id=${lid}${
          activeLeadName ? ` name="${String(activeLeadName)}"` : ""
        }.`,
      });
    }

    if (lastSummary?.leadId) {
      messages.push({
        role: "system",
        content: `CONTEXT: The most recent Conversation Summary (if referenced) is for lead_id=${Number(
          lastSummary.leadId
        )}.`,
      });
    }

    messages.push({ role: "user", content: question });

    let finalResult = null;
    const MAX_TURNS = 4;

    // Force draft only when draft intent AND not a send intent.
    const forceDraft = looksLikeDraftRequest(question) && !wantsUpdate && !wantsSend;

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        tools,
        tool_choice: forceDraft
          ? { type: "function", function: { name: "draft_reply" } }
          : "auto",
      });

      const message = completion.choices[0]?.message;

      console.log(
        "[/api/ask] tool_calls:",
        JSON.stringify(message?.tool_calls || [], null, 2)
      );

      if (!message?.tool_calls || message.tool_calls.length === 0) break;

      messages.push({
        role: "assistant",
        content: message.content || "",
        tool_calls: message.tool_calls,
      });

      for (const toolCall of message.tool_calls) {
        const { name, arguments: argsJson } = toolCall.function || {};
        let args = {};

        try {
          args = argsJson ? JSON.parse(argsJson) : {};
        } catch (err) {
          console.error("[/api/ask] Failed to parse tool args:", err, argsJson);
        }

        // Summary-aware draft bridging
        if (name === "draft_reply") {
          const hasAnyLeadSelector =
            !!args.lead_id || !!args.lead_name || !!args.email || !!args.phone;

          if (!hasAnyLeadSelector && isSummaryDraftMode) {
            const bridgedLeadId =
              Number(lastSummary?.leadId || activeLeadId || 0) || null;

            if (bridgedLeadId) {
              args.lead_id = bridgedLeadId;

              const summaryText =
                typeof lastSummary?.summary === "string"
                  ? lastSummary.summary.trim()
                  : "";

              const bridgeContext = [
                "NOTE: User asked to draft based on the most recent conversation summary.",
                summaryText ? `Conversation summary:\n${summaryText}` : "",
              ]
                .filter(Boolean)
                .join("\n\n");

              args.extra_context = args.extra_context
                ? `${args.extra_context}\n\n${bridgeContext}`
                : bridgeContext;

              console.log(
                "[/api/ask] draft_reply bridge:",
                `lead_id=${args.lead_id}`,
                summaryText ? "summary_injected=1" : "summary_injected=0"
              );
            }
          }
        }

        let result = null;

        if (name === "list_leads") {
          result = await runListLeadsTool(supabase, customerId, args);
          finalResult = {
            ...result,
            aiSummary: buildLeadListSummary(question, args, result.items),
          };
        } else if (name === "find_lead") {
          result = await runFindLeadTool(supabase, customerId, args);
          finalResult = result;
        } else if (name === "summarize_conversation") {
          result = await runSummarizeConversationTool(supabase, customerId, args);
          finalResult = result;
        } else if (name === "draft_reply") {
          result = await runDraftReplyTool(supabase, customerId, args);
          finalResult = result;
        } else if (name === "get_tasks") {
          result = await runGetTasksTool(supabase, customerId, args);
          finalResult = {
            ...result,
            aiSummary:
              result.items.length === 0
                ? "No follow-up tasks match this query."
                : `Found ${result.items.length} follow-up task(s) matching your query.`,
          };
        } else if (name === "create_task") {
          result = await runCreateTaskTool(supabase, customerId, args);
          finalResult = result;
        } else if (name === "update_task") {
          result = await runUpdateTaskTool(supabase, customerId, args);
          finalResult = result;
        } else if (name === "send_message") {
          result = await runSendMessageTool(supabase, customerId, args);
          finalResult = result;
        } else {
          result = { error: `Unsupported tool: ${name}` };
        }

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name,
          content: JSON.stringify(result),
        });
      }

      if (finalResult?.intent && finalResult.intent !== "find_lead") break;
    }

    if (!finalResult) {
      return res.status(200).json({
        question,
        intent: "echo",
        message:
          "Ask BlueWise is wired to OpenAI, but this question didn't trigger any tool yet.",
      });
    }

    return res.status(200).json({
      question,
      intent: finalResult.intent,
      resultType: finalResult.resultType,
      title: finalResult.title,
      aiSummary: finalResult.aiSummary,
      items: finalResult.items,
    });
  } catch (err) {
    console.error("[/api/ask] Unexpected error:", err);
    return res.status(500).json({
      error: "Failed to answer Ask BlueWise query.",
      details: err.message || String(err),
    });
  }
}

// Simple helper to generate a short summary for the UI
function buildLeadListSummary(question, args, items) {
  const count = items.length;
  const parts = [];

  if (typeof args.no_reply_hours === "number") parts.push(`no reply for at least ${args.no_reply_hours}h`);
  if (args.missed_calls_only) parts.push("with missed calls");
  if (args.status && args.status !== "all") parts.push(`status: ${args.status}`);
  if (args.source) parts.push(`source: ${args.source}`);

  const filters = parts.length ? ` (${parts.join(", ")})` : "";
  return `Found ${count} lead(s) for: "${question}"${filters}.`;
}
