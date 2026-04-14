// lib/brain/runners/leads.js
// Extracted from /api/ask.js — DO NOT modify internal logic

function normalizeEmail(email) {
  if (!email || typeof email !== "string") return null;
  return email.trim().toLowerCase();
}

function normalizePhone(phone) {
  if (!phone || typeof phone !== "string") return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return digits;
}

function phoneLast7FromDigits(digits) {
  if (!digits || digits.length < 7) return digits || null;
  return digits.slice(-7);
}

function safeLeadDescriptor(row) {
  return `lead_id=${row?.id || "?"}`;
}

export async function fetchInboxActivityByLeadIds(supabase, customerId, leadIds) {
  if (!leadIds || leadIds.length === 0) return {};

  const { data, error } = await supabase
    .from("inbox_leads")
    .select("lead_id,last_contact_at,last_missed_call_at,missed_call_count")
    .eq("customer_id", customerId)
    .in("lead_id", leadIds);

  if (error) {
    console.error("[brain/leads] inbox activity fetch error:", error);
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

export async function resolveLeadForTask(supabase, customerId, args) {
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
      console.warn("[brain/leads] resolveLead: normalized_email failed, fallback to email");
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
      console.error("[brain/leads] resolveLead email error:", error);
    } else if (data && data.length > 0) {
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
        console.error("[brain/leads] resolveLead phone_last7 error:", error);
      } else if (data && data.length > 0) {
        const ids = data.map((x) => x.id).filter(Boolean);
        const activityByLead = await fetchInboxActivityByLeadIds(supabase, customerId, ids);

        const ranked = [...data].sort((a, b) => {
          const aTs = activityByLead[a.id]?.lastContactAt || a.created_at || 0;
          const bTs = activityByLead[b.id]?.lastContactAt || b.created_at || 0;
          return new Date(bTs) - new Date(aTs);
        });

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
      console.error("[brain/leads] resolveLead name error:", error);
    } else if (data && data.length > 0) {
      const ids = data.map((x) => x.id).filter(Boolean);
      const activityByLead = await fetchInboxActivityByLeadIds(supabase, customerId, ids);

      const ranked = [...data].sort((a, b) => {
        const aTs = activityByLead[a.id]?.lastContactAt || a.created_at || 0;
        const bTs = activityByLead[b.id]?.lastContactAt || b.created_at || 0;
        return new Date(bTs) - new Date(aTs);
      });

      return {
        leadId: ranked[0].id,
        matchReason: "name_ilike",
        candidates: ranked,
      };
    }

    // Fuzzy fallback: try each word separately
    const words = lead_name.trim().split(/\s+/).filter((w) => w.length >= 2);
    for (const word of words) {
      const { data: wordData, error: wordErr } = await supabase
        .from("leads")
        .select("id, created_at")
        .eq("customer_id", customerId)
        .ilike("name", `%${word}%`)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!wordErr && wordData && wordData.length > 0) {
        const ids = wordData.map((x) => x.id).filter(Boolean);
        const activityByLead = await fetchInboxActivityByLeadIds(supabase, customerId, ids);
        const ranked = [...wordData].sort((a, b) => {
          const aTs = activityByLead[a.id]?.lastContactAt || a.created_at || 0;
          const bTs = activityByLead[b.id]?.lastContactAt || b.created_at || 0;
          return new Date(bTs) - new Date(aTs);
        });
        return { leadId: ranked[0].id, matchReason: "name_word_fuzzy", candidates: ranked };
      }
    }
  }

  return { leadId: null, matchReason: "not_found", candidates: [] };
}

// Ensure a datetime string is proper UTC ISO 8601.
// If the model sends a bare datetime (no Z, no offset) assume Montreal time.
function toUtcIso(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  const trimmed = dateStr.trim();
  // Already has timezone info (Z or +/- offset)
  if (/Z$|[+-]\d{2}:\d{2}$|[+-]\d{4}$/.test(trimmed)) {
    return new Date(trimmed).toISOString();
  }
  // No timezone — assume Montreal (ET). EDT = UTC-4, EST = UTC-5.
  // Use Intl to figure out the current offset for Montreal.
  const asDate = new Date(trimmed);
  if (isNaN(asDate.getTime())) return null;
  // Get Montreal offset by comparing formatted times
  const utcStr = asDate.toLocaleString("en-US", { timeZone: "UTC" });
  const mtlStr = asDate.toLocaleString("en-US", { timeZone: "America/Montreal" });
  const utcMs = new Date(utcStr).getTime();
  const mtlMs = new Date(mtlStr).getTime();
  const offsetMs = utcMs - mtlMs; // positive = Montreal is behind UTC
  return new Date(asDate.getTime() + offsetMs).toISOString();
}

export async function runListLeadsTool(supabase, customerId, args) {
  const { status, no_reply_hours, missed_calls_only, source, created_after, created_before, limit } = args || {};

  let leadsQuery = supabase
    .from("leads")
    .select("id, customer_id, name, email, phone, source, status, language, created_at")
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

  // Convert date filters to UTC — model may send Montreal time without offset
  const utcAfter = toUtcIso(created_after);
  const utcBefore = toUtcIso(created_before);

  if (utcAfter) {
    leadsQuery = leadsQuery.gte("created_at", utcAfter);
  }

  if (utcBefore) {
    leadsQuery = leadsQuery.lte("created_at", utcBefore);
  }

  if (limit && typeof limit === "number" && limit > 0) {
    leadsQuery = leadsQuery.limit(Math.min(limit, 100));
  }

  const { data: leadsRows, error: leadsError } = await leadsQuery;

  if (leadsError) {
    console.error("[brain/leads] list_leads error:", leadsError);
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
      .select("id, lead_id, customer_id, last_contact_at, last_missed_call_at, missed_call_count")
      .eq("customer_id", customerId)
      .in("lead_id", leadIds);

    if (inboxError) {
      console.error("[brain/leads] list_leads inbox_leads error:", inboxError);
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
          if (!existing.lastContactAt || new Date(row.last_contact_at) > new Date(existing.lastContactAt)) {
            existing.lastContactAt = row.last_contact_at;
            primaryInboxByLeadId[lid] = row.id;
          }
        }

        if (row.last_missed_call_at) {
          if (!existing.lastMissedCallAt || new Date(row.last_missed_call_at) > new Date(existing.lastMissedCallAt)) {
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
    cutoffIso = new Date(Date.now() - no_reply_hours * 60 * 60 * 1000).toISOString();
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

export async function runFindLeadTool(supabase, customerId, args) {
  const { query, email, phone, name, limit } = args || {};
  const max = Math.min(Math.max(Number(limit) || 5, 1), 10);

  const normEmail = normalizeEmail(email);
  const phoneDigits = normalizePhone(phone);
  const phoneLast7 = phoneLast7FromDigits(phoneDigits);

  const text = (typeof query === "string" ? query : "") || "";
  const nameQuery = (typeof name === "string" ? name : "") || "";

  const maybeEmail = !normEmail && text.includes("@") ? normalizeEmail(text) : null;
  const maybePhoneDigits = !phoneDigits && /\d/.test(text) ? normalizePhone(text) : null;
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
      .select("id, customer_id, name, email, phone, source, status, language, created_at")
      .eq("customer_id", customerId)
      .eq("normalized_email", effectiveEmail)
      .limit(max);

    if (error) {
      const fallback = await supabase
        .from("leads")
        .select("id, customer_id, name, email, phone, source, status, language, created_at")
        .eq("customer_id", customerId)
        .eq("email", effectiveEmail)
        .limit(max);
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error("[brain/leads] find_lead email error:", error);
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
      .select("id, customer_id, name, email, phone, source, status, language, created_at")
      .eq("customer_id", customerId)
      .limit(max);

    if (effectivePhoneDigits) {
      q = q.eq("normalized_phone", effectivePhoneDigits);
    }

    let { data, error } = await q;

    if (error) {
      let fq = supabase
        .from("leads")
        .select("id, customer_id, name, email, phone, source, status, language, created_at")
        .eq("customer_id", customerId)
        .limit(max);

      if (effectivePhoneDigits) fq = fq.eq("phone", effectivePhoneDigits);
      const fallback = await fq;
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error("[brain/leads] find_lead phone error:", error);
      throw new Error("Failed to search leads by phone.");
    }

    candidates = data || [];

    if ((!candidates || candidates.length === 0) && effectivePhoneLast7) {
      matchReason = "phone_last7";
      const { data: data7, error: err7 } = await supabase
        .from("leads")
        .select("id, customer_id, name, email, phone, source, status, language, created_at")
        .eq("customer_id", customerId)
        .eq("phone_last7", effectivePhoneLast7)
        .limit(max);

      if (err7) {
        console.error("[brain/leads] find_lead phone_last7 error:", err7);
        throw new Error("Failed to search leads by phone_last7.");
      }

      candidates = data7 || [];
    }
  }

  if (!candidates || candidates.length === 0) {
    const effectiveName = nameQuery || text;
    if (effectiveName && typeof effectiveName === "string" && effectiveName.trim().length > 0) {
      matchReason = "name_ilike";
      // Try exact full name first
      const { data, error } = await supabase
        .from("leads")
        .select("id, customer_id, name, email, phone, source, status, language, created_at")
        .eq("customer_id", customerId)
        .ilike("name", `%${effectiveName.trim()}%`)
        .order("created_at", { ascending: false })
        .limit(max);

      if (error) {
        console.error("[brain/leads] find_lead name error:", error);
        throw new Error("Failed to search leads by name.");
      }

      candidates = data || [];

      // If no match on full name, try each word separately (fuzzy fallback)
      if (candidates.length === 0) {
        const words = effectiveName.trim().split(/\s+/).filter((w) => w.length >= 2);
        for (const word of words) {
          matchReason = "name_word_fuzzy";
          const { data: wordData, error: wordErr } = await supabase
            .from("leads")
            .select("id, customer_id, name, email, phone, source, status, language, created_at")
            .eq("customer_id", customerId)
            .ilike("name", `%${word}%`)
            .order("created_at", { ascending: false })
            .limit(max);

          if (!wordErr && wordData && wordData.length > 0) {
            candidates = wordData;
            break;
          }
        }
      }
    } else {
      candidates = [];
    }
  }

  const ids = (candidates || []).map((c) => c.id).filter(Boolean);
  const activityByLead = await fetchInboxActivityByLeadIds(supabase, customerId, ids);

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

export async function runCreateLeadTool(supabase, customerId, args) {
  const { name, phone, email, source, notes, city } = args || {};

  if (!name && !phone && !email) {
    throw new Error("At least one of name, phone, or email is required to create a lead.");
  }

  const normEmail = normalizeEmail(email);
  const phoneDigits = normalizePhone(phone);
  const phoneLast7 = phoneLast7FromDigits(phoneDigits);

  const insertPayload = {
    customer_id: Number(customerId),
    name: name || null,
    phone: phone || null,
    email: email || null,
    source: source || "manual",
    notes: notes || null,
    city: city || null,
    status: "new",
    normalized_email: normEmail || null,
    normalized_phone: phoneDigits || null,
    phone_last7: phoneLast7 || null,
  };

  const { data, error } = await supabase
    .from("leads")
    .insert(insertPayload)
    .select("id, customer_id, name, email, phone, source, status, city, notes, created_at")
    .single();

  if (error) {
    console.error("[brain/leads] create_lead error:", error);
    throw new Error("Failed to create lead.");
  }

  return {
    intent: "create_lead",
    resultType: "lead_created",
    title: "Lead created",
    items: [
      {
        leadId: data.id,
        customerId: data.customer_id,
        name: data.name || data.email || data.phone || "Lead",
        email: data.email || null,
        phone: data.phone || null,
        source: data.source,
        status: data.status,
        city: data.city || null,
        notes: data.notes || null,
        createdAt: data.created_at,
      },
    ],
    aiSummary: `Created lead #${data.id} — ${data.name || data.email || data.phone}.`,
  };
}

export async function runUpdateLeadTool(supabase, customerId, args) {
  const { lead_id, status, notes, city, name, email, phone, source } = args || {};

  if (!lead_id) {
    throw new Error("lead_id is required to update a lead.");
  }

  // Verify lead belongs to tenant
  const { data: existing, error: findErr } = await supabase
    .from("leads")
    .select("id")
    .eq("customer_id", customerId)
    .eq("id", lead_id)
    .maybeSingle();

  if (findErr) {
    console.error("[brain/leads] update_lead find error:", findErr);
    throw new Error("Failed to locate lead.");
  }

  if (!existing) {
    throw new Error(`Lead #${lead_id} not found.`);
  }

  const updates = {};

  if (status) updates.status = status;
  if (notes !== undefined && notes !== null) updates.notes = notes;
  if (city !== undefined && city !== null) updates.city = city;
  if (name !== undefined && name !== null) updates.name = name;
  if (email !== undefined && email !== null) {
    updates.email = email;
    updates.normalized_email = normalizeEmail(email);
  }
  if (phone !== undefined && phone !== null) {
    updates.phone = phone;
    const digits = normalizePhone(phone);
    updates.normalized_phone = digits;
    updates.phone_last7 = phoneLast7FromDigits(digits);
  }
  if (source !== undefined && source !== null) updates.source = source;

  if (Object.keys(updates).length === 0) {
    throw new Error("Nothing to update. Provide at least one field to change.");
  }

  const { data, error } = await supabase
    .from("leads")
    .update(updates)
    .eq("id", lead_id)
    .eq("customer_id", customerId)
    .select("id, customer_id, name, email, phone, source, status, city, notes, created_at")
    .single();

  if (error) {
    console.error("[brain/leads] update_lead error:", error);
    throw new Error("Failed to update lead.");
  }

  const changed = Object.keys(updates).join(", ");

  return {
    intent: "update_lead",
    resultType: "lead_updated",
    title: "Lead updated",
    items: [
      {
        leadId: data.id,
        customerId: data.customer_id,
        name: data.name || data.email || data.phone || "Lead",
        email: data.email || null,
        phone: data.phone || null,
        source: data.source || null,
        status: data.status || null,
        city: data.city || null,
        notes: data.notes || null,
        createdAt: data.created_at,
      },
    ],
    aiSummary: `Updated lead #${data.id} (${data.name || "unnamed"}) — changed: ${changed}.`,
  };
}
