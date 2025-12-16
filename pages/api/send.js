// pages/api/send.js
import { getAuthContext } from "../../lib/supabaseServer";
import { sendSmsTelnyx } from "../../lib/providers/telnyx";
import { sendEmailMailgun } from "../../lib/providers/mailgun";

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

function normStr(v) {
  if (v == null) return "";
  return String(v).trim();
}

// Conservative SMS guardrail (hard cap)
const SMS_MAX_LEN = 1200;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ✅ Cookie-aware auth + tenant resolution (matches /api/ask)
  const { supabase, customerId, user } = await getAuthContext(req, res);

  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (!customerId) return res.status(403).json({ error: "No customer mapping for this user" });

  // ---- Parse payload ----
  const { lead_id, channel, to, subject, body, meta, html } = req.body || {};

  if (typeof lead_id !== "number" || !Number.isFinite(lead_id)) {
    return res.status(400).json({ error: "lead_id must be a number" });
  }

  if (channel !== "sms" && channel !== "email") {
    return res.status(400).json({ error: "channel must be sms or email" });
  }

  const bodyText = normStr(body);
  if (!bodyText) return res.status(400).json({ error: "body is required" });

  const subjectText = normStr(subject);
  const htmlText = isNonEmptyString(html) ? String(html) : null;

  if (channel === "email" && !subjectText) {
    return res.status(400).json({ error: "subject is required for email" });
  }

  if (channel === "sms" && bodyText.length > SMS_MAX_LEN) {
    return res.status(400).json({ error: `SMS body too long (max ${SMS_MAX_LEN} chars)` });
  }

  // ---- Verify lead belongs to customer (multi-tenant safety) ----
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("id, customer_id, profile_id, email, phone, phone_last7")
    .eq("id", lead_id)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (leadErr) return res.status(500).json({ error: leadErr.message });
  if (!lead) return res.status(404).json({ error: "Lead not found" });

  // ---- Resolve provider + from address + safe recipient resolution ----
  let provider = null;
  let fromAddress = null;

  // Prefer lead’s canonical destination unless caller explicitly passed "to"
  // (Still validate that something exists.)
  const leadDefaultTo = channel === "sms" ? normStr(lead.phone) : normStr(lead.email);
  const requestedTo = normStr(to);
  const finalTo = requestedTo || leadDefaultTo;

  if (!finalTo) {
    return res.status(400).json({
      error:
        channel === "sms"
          ? "Missing recipient: lead has no phone and no `to` provided"
          : "Missing recipient: lead has no email and no `to` provided",
    });
  }

  if (channel === "sms") {
    provider = "telnyx";

    const { data: customerRow, error: custErr } = await supabase
      .from("customers")
      .select("id, telnyx_sms_number")
      .eq("id", customerId)
      .maybeSingle();

    if (custErr) return res.status(500).json({ error: custErr.message });

    if (!customerRow?.telnyx_sms_number) {
      return res.status(400).json({ error: "Missing customers.telnyx_sms_number for this tenant" });
    }

    fromAddress = String(customerRow.telnyx_sms_number).trim();
  } else {
    provider = "mailgun";
    fromAddress = process.env.MAILGUN_FROM || `BlueWise AI <sales@${process.env.MAILGUN_DOMAIN}>`;
  }

  // ---- Observability: create send_logs row first (best-effort) ----
  const requestPayload = {
    lead_id,
    channel,
    to: finalTo,
    subject: channel === "email" ? subjectText : null,
    body: bodyText,
    html: channel === "email" ? htmlText : null,
    meta: meta && typeof meta === "object" ? meta : null,
  };

  let sendLogId = null;
  {
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

    // If send_logs table doesn’t exist yet, don’t block sending.
    sendLogId = logErr ? null : logRow?.id ?? null;
  }

  // ---- Send via provider ----
  let sendResult = null;

  if (channel === "sms") {
    sendResult = await sendSmsTelnyx({
      to: finalTo,
      from: fromAddress,
      body: bodyText,
    });
  } else {
    sendResult = await sendEmailMailgun({
      to: finalTo,
      from: fromAddress,
      subject: subjectText,
      body: bodyText,
      html: htmlText || undefined,
      // replyTo: optional future enhancement
    });
  }

  const success = !!sendResult?.success;
  const providerMessageId = sendResult?.provider_message_id || null;
  const errorMsg = sendResult?.error || null;

  // ---- Persist outbound message to canonical messages table ----
  const messageInsert = {
    customer_id: customerId,
    lead_id,
    profile_id: lead?.profile_id || null,
    direction: "outbound",
    channel, // sms | email
    message_type: channel, // keep existing pattern
    subject: channel === "email" ? subjectText : null,
    body: bodyText,
    provider,
    provider_message_id: providerMessageId,
    status: success ? "sent" : "failed",
    error: success ? null : errorMsg,
    to_address: finalTo,
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
    return res.status(500).json({
      error: "Send completed but failed to persist message",
      provider,
      provider_message_id: providerMessageId,
      persist_error: msgErr.message,
    });
  }

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
