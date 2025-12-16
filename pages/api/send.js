// pages/api/send.js
import { createSupabaseServerClient } from "../../lib/supabaseServer";
import { sendSmsTelnyx } from "../../lib/providers/telnyx";
import { sendEmailMailgun } from "../../lib/providers/mailgun";

// TEMP: until auth is wired, we hardcode customer_id but keep the pattern
function getCustomerIdFromRequest(req) {
  return "1";
}

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

// Conservative SMS guardrail (Telnyx supports concatenation; we enforce a deterministic cap)
const SMS_MAX_LEN = 1200;

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const supabase = createSupabaseServerClient(req, res);
  const customerId = getCustomerIdFromRequest(req);

  // ---- Parse payload ----
  const { lead_id, channel, to, subject, body, meta } = req.body || {};

  if (!lead_id || typeof lead_id !== "number") {
    return res.status(400).json({ error: "lead_id must be a number" });
  }
  if (channel !== "sms" && channel !== "email") {
    return res.status(400).json({ error: "channel must be sms or email" });
  }
  if (!isNonEmptyString(to)) {
    return res.status(400).json({ error: "to is required" });
  }
  if (!isNonEmptyString(body)) {
    return res.status(400).json({ error: "body is required" });
  }

  if (channel === "email") {
    if (!isNonEmptyString(subject)) {
      return res.status(400).json({ error: "subject is required for email" });
    }
  } else if (channel === "sms") {
    if (body.trim().length > SMS_MAX_LEN) {
      return res
        .status(400)
        .json({ error: `SMS body too long (max ${SMS_MAX_LEN} chars)` });
    }
  }

  // ---- Verify lead belongs to customer (multi-tenant safety) ----
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("id, customer_id, profile_id, email, phone, phone_last7") // ✅ include profile_id
    .eq("id", lead_id)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (leadErr) return res.status(500).json({ error: leadErr.message });
  if (!lead) return res.status(404).json({ error: "Lead not found" });

  // ---- Resolve provider + from address ----
  let provider = null;
  let fromAddress = null;

  if (channel === "sms") {
    provider = "telnyx";

    const { data: customerRow, error: custErr } = await supabase
      .from("customers")
      .select("id, telnyx_sms_number")
      .eq("id", customerId)
      .maybeSingle();

    if (custErr) return res.status(500).json({ error: custErr.message });
    if (!customerRow?.telnyx_sms_number) {
      return res
        .status(400)
        .json({ error: "Missing customers.telnyx_sms_number for this tenant" });
    }

    fromAddress = customerRow.telnyx_sms_number;
  }

  if (channel === "email") {
    provider = "mailgun";
    // Deterministic sender controlled server-side (do not trust UI for From)
    fromAddress =
      process.env.MAILGUN_FROM ||
      `BlueWise AI <sales@${process.env.MAILGUN_DOMAIN}>`;
  }

  // ---- Observability: create send_logs row first (optional table but we assume it exists) ----
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

  // If send_logs table doesn’t exist yet, we don’t want to block sending.
  // We’ll continue, and just skip logging updates.
  const sendLogId = logErr ? null : logRow?.id ?? null;

  // ---- Send via provider ----
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
      // replyTo: optional future enhancement
    });
  }

  const success = !!sendResult?.success;
  const providerMessageId = sendResult?.provider_message_id || null;
  const errorMsg = sendResult?.error || null;

  // ---- Persist outbound message to canonical messages table ----
  // Keep legacy fields intact; we only add send metadata.
  const messageInsert = {
    customer_id: customerId,
    lead_id,
    profile_id: lead?.profile_id || null, // ✅ populate profile_id
    direction: "outbound",
    channel, // sms | email
    message_type: channel, // aligns with your existing patterns
    subject: channel === "email" ? subject : null,
    body,
    provider,
    provider_message_id: providerMessageId,
    status: success ? "sent" : "failed",
    error: success ? null : errorMsg,
    to_address: to,
    from_address: fromAddress,
    meta: safeJson(meta),
    raw_payload: safeJson(sendResult?.raw), // provider response, if any
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
    // We may have successfully sent but failed to persist; surface clearly.
    return res.status(500).json({
      error: "Send completed but failed to persist message",
      provider,
      provider_message_id: providerMessageId,
      persist_error: msgErr.message,
    });
  }

  // ---- Response ----
  return res.status(200).json({
    success,
    status: success ? "sent" : "failed",
    provider,
    provider_message_id: providerMessageId,
    message_id: msgRow.id,
    created_at: msgRow.created_at,
    error: success ? null : errorMsg,
  });
}
