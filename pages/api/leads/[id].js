// pages/api/leads/[id].js
import { getAuthContext } from "../../../lib/supabaseServer";

// --- helpers to clean HTML emails into readable text ---
function decodeHtmlEntities(str) {
  if (!str) return "";

  let out = str;

  out = out
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  out = out.replace(/&#(\d+);/g, (_match, dec) => {
    const code = parseInt(dec, 10);
    if (!Number.isFinite(code)) return _match;
    try {
      return String.fromCharCode(code);
    } catch {
      return _match;
    }
  });

  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) => {
    const code = parseInt(hex, 16);
    if (!Number.isFinite(code)) return _match;
    try {
      return String.fromCharCode(code);
    } catch {
      return _match;
    }
  });

  return out;
}

function stripHtmlToText(html) {
  if (!html) return "";

  let text = html.replace(/<\/(p|div|br|tr|li|h[1-6])>/gi, "\n");
  text = text.replace(/<[^>]+>/g, "");
  text = decodeHtmlEntities(text);

  text = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return text;
}
// ---------------------------------------------------

export default async function handler(req, res) {
  const allowedMethods = ["GET", "PATCH", "DELETE"];
  if (!allowedMethods.includes(req.method)) {
    res.setHeader("Allow", allowedMethods);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);

  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (!customerId)
    return res.status(403).json({ error: "No customer mapping for this user" });

  const { id } = req.query;
  const leadId = Number(id);
  if (!leadId || Number.isNaN(leadId)) {
    return res.status(400).json({ error: "Invalid lead id" });
  }

  // ── DELETE: remove lead ──
  if (req.method === "DELETE") {
    try {
      const { data, error: delError } = await supabase
        .from("leads")
        .delete()
        .eq("id", leadId)
        .eq("customer_id", customerId)
        .select("id")
        .single();

      if (delError) {
        console.error("[api/leads/[id]] deleteError", delError);
        return res.status(500).json({ error: "Failed to delete lead" });
      }

      if (!data) {
        return res.status(404).json({ error: "Lead not found" });
      }

      return res.status(200).json({ success: true, deleted: data.id });
    } catch (err) {
      console.error("[api/leads/[id]] DELETE error", err);
      return res.status(500).json({ error: "Failed to delete lead" });
    }
  }

  // ── PATCH: update lead fields ──
  if (req.method === "PATCH") {
    try {
      const { status, notes, name, phone, email, city, source, language } = req.body;
      const validStatuses = ["new", "active", "in_convo", "quoted", "won", "lost", "dead"];

      const updates = { updated_at: new Date().toISOString() };

      if (status) {
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            error: `Invalid status. Valid: ${validStatuses.join(", ")}`,
          });
        }
        updates.status = status;
      }

      if (notes !== undefined) updates.notes = notes;
      if (name !== undefined) updates.name = name || null;
      if (phone !== undefined) updates.phone = phone || null;
      if (email !== undefined) updates.email = email || null;
      if (city !== undefined) updates.city = city || null;
      if (source !== undefined) updates.source = source || null;
      if (language !== undefined) updates.language = language || null;

      if (Object.keys(updates).length === 1) {
        return res.status(400).json({ error: "Nothing to update" });
      }

      const { data, error: updateError } = await supabase
        .from("leads")
        .update(updates)
        .eq("id", leadId)
        .eq("customer_id", customerId)
        .select()
        .single();

      if (updateError) {
        console.error("[api/leads/[id]] updateError", updateError);
        return res.status(500).json({ error: "Failed to update lead" });
      }

      if (!data) {
        return res.status(404).json({ error: "Lead not found" });
      }

      return res.status(200).json({ success: true, lead: data });
    } catch (err) {
      console.error("[api/leads/[id]] PATCH error", err);
      return res.status(500).json({ error: "Failed to update lead" });
    }
  }

  // ── GET: full lead detail ──
  try {
    //
    // 1) Fetch canonical LEAD
    //
    const { data: leadRow, error: leadError } = await supabase
      .from("leads")
      .select(
        `
        id,
        customer_id,
        profile_id,
        name,
        first_name,
        phone,
        email,
        city,
        notes,
        status,
        source,
        language,
        first_seen_at,
        last_message_at,
        last_missed_call_at,
        missed_call_count,
        next_followup_at,
        do_not_contact,
        created_at,
        updated_at
      `
      )
      .eq("customer_id", customerId)
      .eq("id", leadId)
      .maybeSingle();

    if (leadError) {
      console.error("[api/leads/[id]] leadError", leadError);
      return res.status(500).json({ error: "Failed to load lead" });
    }

    if (!leadRow) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const lead = {
      id: leadRow.id,
      customer_id: leadRow.customer_id,
      profile_id: leadRow.profile_id,
      name:
        leadRow.name ||
        leadRow.first_name ||
        leadRow.email ||
        leadRow.phone ||
        `Lead #${leadRow.id}`,
      first_name: leadRow.first_name,
      phone: leadRow.phone,
      email: leadRow.email,
      city: leadRow.city,
      notes: leadRow.notes,
      status: leadRow.status || "new",
      source: leadRow.source || "unknown",
      language: leadRow.language,
      first_seen_at: leadRow.first_seen_at,
      last_message_at: leadRow.last_message_at,
      last_missed_call_at: leadRow.last_missed_call_at,
      missed_call_count: leadRow.missed_call_count || 0,
      next_followup_at: leadRow.next_followup_at,
      do_not_contact: !!leadRow.do_not_contact,
      created_at: leadRow.created_at,
      updated_at: leadRow.updated_at,
    };

    //
    // 2-4) Fetch PROFILE, IDENTITIES, INBOX_LEADS, TASKS, JOBS, MESSAGES — ALL IN PARALLEL
    //
    const [
      profileResult,
      identitiesResult,
      inboxResult,
      emailMessagesResult,
      taskResult,
      jobResult,
    ] = await Promise.all([
      // 2) Profile
      lead.profile_id
        ? supabase.from("lead_profiles").select("*").eq("customer_id", customerId).eq("id", lead.profile_id).maybeSingle()
        : Promise.resolve({ data: null }),
      // 3) Identities
      lead.profile_id
        ? supabase.from("lead_identities").select("id, customer_id, profile_id, kind, value, normalized_value, identity_type, identity_value, phone_last7, is_primary, created_at").eq("customer_id", customerId).eq("profile_id", lead.profile_id).order("is_primary", { ascending: false })
        : Promise.resolve({ data: [] }),
      // 4) Inbox leads
      supabase.from("inbox_leads").select("id, customer_id, lead_id, profile_id, source, status, priority, is_emergency, service_type, subject, summary, first_seen_at, last_contact_at, last_missed_call_at, missed_call_count, next_follow_up_at, created_at, updated_at").eq("customer_id", String(customerId)).eq("lead_id", leadId).order("last_contact_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }),
      // 6) Messages from canonical table
      supabase.from("messages").select("id, lead_id, direction, channel, message_type, subject, body, created_at").eq("customer_id", customerId).eq("lead_id", leadId).order("created_at", { ascending: true }),
      // 7) Tasks
      supabase.from("tasks").select("id, customer_id, lead_id, status, type, title, description, priority, due_at, completed_at, created_at, updated_at").eq("customer_id", customerId).eq("lead_id", leadId).order("due_at", { ascending: true, nullsFirst: false }),
      // 9) Jobs
      supabase.from("jobs").select("id, job_id, client_name, project_type, quote_amount, status, created_at").eq("customer_id", customerId).eq("lead_id", leadId).order("created_at", { ascending: false }),
    ]);

    const profile = profileResult.data || null;
    const identities = identitiesResult.data || [];
    const inbox_leads = inboxResult.data || [];
    const primaryInboxLead = inbox_leads.length > 0 ? inbox_leads[0] : null;
    const emailMessageRows = emailMessagesResult.data || [];

    // 5) Events + inbox_messages + photos — depend on primaryInboxLead, run in parallel
    const [eventsResult, inboxMessagesResult, photosResult] = await Promise.all([
      primaryInboxLead
        ? supabase.from("inbox_lead_events").select("id, customer_id, lead_id, profile_id, event_type, payload, created_at").eq("customer_id", customerId).eq("lead_id", primaryInboxLead.id).order("created_at", { ascending: true })
        : Promise.resolve({ data: [] }),
      primaryInboxLead
        ? supabase.from("inbox_messages").select("id, lead_id, direction, message_type, body, telnyx_message_id, created_at").eq("lead_id", primaryInboxLead.id).order("created_at", { ascending: true })
        : Promise.resolve({ data: [] }),
      primaryInboxLead
        ? supabase.from("inbox_messages").select("id").eq("lead_id", primaryInboxLead.id)
        : Promise.resolve({ data: [] }),
    ]);

    const events = (eventsResult.data || []).map((e) => ({
      id: e.id,
      inbox_lead_id: e.lead_id,
      profile_id: e.profile_id,
      event_type: e.event_type,
      payload: e.payload,
      created_at: e.created_at,
    }));

    const inboxMessageRows = inboxMessagesResult.data || [];

    // Photos: need 2nd query since inbox_attachments has no lead_id, only message_id
    const photoMsgIds = (photosResult.data || []).map((m) => m.id);
    let photos = [];
    if (photoMsgIds.length > 0) {
      const { data: attachments } = await supabase
        .from("inbox_attachments")
        .select("id, message_id, file_url, content_type, created_at")
        .in("message_id", photoMsgIds)
        .order("created_at", { ascending: false });
      photos = (attachments || []).filter((a) => (a.content_type || "").startsWith("image/"));
    }

    // Dedup SMS messages
    function toEpoch(ts) {
      if (!ts) return 0;
      return new Date(ts).getTime();
    }

    const smsMessages = inboxMessageRows.map((m) => ({
      id: m.id,
      lead_id: m.lead_id,
      channel: "sms",
      direction: m.direction,
      message_type: m.message_type,
      body_text: m.body,
      body_html: null,
      provider_message_id: m.telnyx_message_id || null,
      created_at: m.created_at,
    }));

    const smsEpochs = new Set(smsMessages.map((m) => toEpoch(m.created_at)).filter(Boolean));

    const generalMessages = emailMessageRows.map((m) => {
      const ch = (m.channel || m.message_type || "email").toLowerCase();
      const isSms = ch === "sms" || ch === "mms";
      return {
        id: m.id,
        lead_id: m.lead_id,
        channel: isSms ? "sms" : "email",
        direction: m.direction || "outbound",
        message_type: m.message_type || ch,
        subject: m.subject || null,
        body_text: isSms ? (m.body || "") : stripHtmlToText(m.body || ""),
        body_html: isSms ? null : (m.body || null),
        created_at: m.created_at,
        _isSms: isSms,
      };
    });

    const dedupedGeneral = generalMessages.filter((m) => !m._isSms || !smsEpochs.has(toEpoch(m.created_at)));
    dedupedGeneral.forEach((m) => delete m._isSms);

    const messages = [...dedupedGeneral, ...smsMessages].sort((a, b) => toEpoch(a.created_at) - toEpoch(b.created_at));

    const tasks = (taskResult.data || []).map((t) => ({
      id: t.id,
      customer_id: t.customer_id,
      lead_id: t.lead_id,
      status: t.status || "pending",
      task_type: t.type || null,
      title: t.title || null,
      description: t.description || null,
      priority: t.priority || "normal",
      due_at: t.due_at,
      completed_at: t.completed_at,
      created_at: t.created_at,
      updated_at: t.updated_at,
    }));

    const jobs = jobResult.data || [];

    //
    // 10) Unified payload
    //
    return res.status(200).json({
      lead,
      profile,
      identities,
      inbox_lead: primaryInboxLead,
      inbox_leads,
      events,
      messages,
      tasks,
      photos,
      jobs,
    });
  } catch (err) {
    console.error("[api/leads/[id]] unexpected error", err);
    return res.status(500).json({ error: "Failed to load lead detail" });
  }
}
