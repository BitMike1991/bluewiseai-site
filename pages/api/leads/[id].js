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
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);

  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (!customerId) return res.status(403).json({ error: "No customer mapping for this user" });

  const { id } = req.query;
  const leadId = Number(id);
  if (!leadId || Number.isNaN(leadId)) {
    return res.status(400).json({ error: "Invalid lead id" });
  }

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
    // 2) Fetch PROFILE
    //
    let profile = null;
    if (lead.profile_id) {
      const { data: profileRow, error: profileError } = await supabase
        .from("lead_profiles")
        .select("*")
        .eq("customer_id", customerId)
        .eq("id", lead.profile_id)
        .maybeSingle();

      if (profileError) console.error("[api/leads/[id]] profileError", profileError);
      if (profileRow) profile = profileRow;
    }

    //
    // 3) Fetch IDENTITIES
    //
    let identities = [];
    if (lead.profile_id) {
      const { data: identityRows, error: identitiesError } = await supabase
        .from("lead_identities")
        .select(
          `
          id,
          customer_id,
          profile_id,
          kind,
          value,
          normalized_value,
          identity_type,
          identity_value,
          phone_last7,
          is_primary,
          created_at
        `
        )
        .eq("customer_id", customerId)
        .eq("profile_id", lead.profile_id)
        .order("is_primary", { ascending: false });

      if (identitiesError) console.error("[api/leads/[id]] identitiesError", identitiesError);
      identities = identityRows || [];
    }

    //
    // 4) Fetch primary INBOX_LEAD thread(s) for this lead
    // NOTE: keep String(customerId) behavior as you already had it here
    //
    const { data: inboxRows, error: inboxError } = await supabase
      .from("inbox_leads")
      .select(
        `
        id,
        customer_id,
        lead_id,
        profile_id,
        source,
        status,
        priority,
        is_emergency,
        service_type,
        subject,
        summary,
        first_seen_at,
        last_contact_at,
        last_missed_call_at,
        missed_call_count,
        next_follow_up_at,
        created_at,
        updated_at
      `
      )
      .eq("customer_id", String(customerId))
      .eq("lead_id", leadId)
      .order("last_contact_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (inboxError) console.error("[api/leads/[id]] inboxError", inboxError);

    const inbox_leads = inboxRows || [];
    const primaryInboxLead = inbox_leads.length > 0 ? inbox_leads[0] : null;

    //
    // 5) Fetch EVENTS for primary inbox_lead
    //
    let events = [];
    if (primaryInboxLead) {
      const { data: eventRows, error: eventsError } = await supabase
        .from("inbox_lead_events")
        .select(
          `
          id,
          customer_id,
          lead_id,
          profile_id,
          event_type,
          payload,
          created_at
        `
        )
        .eq("customer_id", customerId)
        .eq("lead_id", primaryInboxLead.id)
        .order("created_at", { ascending: true });

      if (eventsError) console.error("[api/leads/[id]] eventsError", eventsError);

      events =
        (eventRows || []).map((e) => ({
          id: e.id,
          inbox_lead_id: e.lead_id,
          profile_id: e.profile_id,
          event_type: e.event_type,
          payload: e.payload,
          created_at: e.created_at,
        })) || [];
    }

    //
    // 6) Fetch MESSAGES
    //
    const [
      { data: emailMessageRows, error: emailMessagesError },
      { data: inboxMessageRows, error: inboxMessagesError },
    ] = await Promise.all([
      supabase
        .from("messages")
        .select(
          `
          id,
          lead_id,
          direction,
          message_type,
          subject,
          body,
          created_at
        `
        )
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true }),
      supabase
        .from("inbox_messages")
        .select(
          `
          id,
          lead_id,
          direction,
          message_type,
          body,
          telnyx_message_id,
          created_at
        `
        )
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true }),
    ]);

    if (emailMessagesError) console.error("[api/leads/[id]] emailMessagesError", emailMessagesError);
    if (inboxMessagesError) console.error("[api/leads/[id]] inboxMessagesError", inboxMessagesError);

    const emailMessages =
      (emailMessageRows || []).map((m) => ({
        id: m.id,
        lead_id: m.lead_id,
        channel: "email",
        direction: m.direction || "outbound",
        message_type: m.message_type || "email",
        subject: m.subject || null,
        body_text: stripHtmlToText(m.body || ""),
        body_html: m.body || null,
        created_at: m.created_at,
      })) || [];

    const smsMessages =
      (inboxMessageRows || []).map((m) => ({
        id: m.id,
        lead_id: m.lead_id,
        channel: "sms",
        direction: m.direction,
        message_type: m.message_type,
        body_text: m.body,
        body_html: null,
        provider_message_id: m.telnyx_message_id || null,
        created_at: m.created_at,
      })) || [];

    const messages = [...emailMessages, ...smsMessages].sort((a, b) => {
      const aMs = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bMs = b.created_at ? new Date(b.created_at).getTime() : 0;
      return aMs - bMs;
    });

    //
    // 7) Fetch FOLLOWUPS
    //
    const { data: followupRows, error: followupsError } = await supabase
      .from("followups")
      .select(
        `
        id,
        customer_id,
        lead_id,
        status,
        followup_type,
        sequence_stage,
        due_at,
        created_at,
        updated_at
      `
      )
      .eq("customer_id", customerId)
      .eq("lead_id", leadId)
      .order("due_at", { ascending: true, nullsFirst: false });

    if (followupsError) console.error("[api/leads/[id]] followupsError", followupsError);

    const followups =
      (followupRows || []).map((f) => ({
        id: f.id,
        customer_id: f.customer_id,
        lead_id: f.lead_id,
        status: f.status || "open",
        followup_type: f.followup_type || null,
        sequence_stage: f.sequence_stage,
        due_at: f.due_at,
        created_at: f.created_at,
        updated_at: f.updated_at,
      })) || [];

    //
    // 8) Unified payload
    //
    return res.status(200).json({
      lead,
      profile,
      identities,
      inbox_lead: primaryInboxLead,
      inbox_leads,
      events,
      messages,
      followups,
    });
  } catch (err) {
    console.error("[api/leads/[id]] unexpected error", err);
    return res.status(500).json({ error: "Failed to load lead detail" });
  }
}
