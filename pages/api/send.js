// pages/api/send.js
import DOMPurify from "isomorphic-dompurify";
import { getAuthContext } from "../../lib/supabaseServer";
import { sendSmsTelnyx } from "../../lib/providers/telnyx";
import { sendEmailMailgun } from "../../lib/providers/mailgun";
import { sendEmailGmail } from "../../lib/providers/gmail";
import { encryptToken } from "../../lib/tokenEncryption";

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

  // Rate limit: 60 sends per minute per customer
  const { checkRateLimit } = await import("../../lib/security");
  if (checkRateLimit(req, res, `send:${customerId}`, 60)) return;

  // CSRF protection
  const { checkCsrf } = await import("../../lib/csrf");
  if (checkCsrf(req, res)) return;

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
  if (bodyText.length > 50000) return res.status(400).json({ error: "body exceeds maximum length" });

  const subjectText = normStr(subject);
  if (subjectText && subjectText.length > 500) return res.status(400).json({ error: "subject exceeds maximum length" });
  // Sanitize HTML via DOM-based sanitizer (F-013 — regex sanitization is
  // bypassable via SVG events, unquoted handlers, nested tags, data: URIs,
  // Unicode obfuscation). isomorphic-dompurify parses to DOM and removes
  // every dangerous construct.
  let htmlText = null;
  if (isNonEmptyString(html)) {
    htmlText = DOMPurify.sanitize(String(html), {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "button"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "formaction"],
    });
  }

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
    // Check if customer has connected Gmail/Outlook OAuth
    const { data: oauthRow } = await supabase
      .from("customer_email_oauth")
      .select("id, provider, access_token, refresh_token, token_expiry, email_address, status")
      .eq("customer_id", customerId)
      .eq("status", "active")
      .in("provider", ["gmail", "outlook"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (oauthRow && oauthRow.provider === "gmail") {
      provider = "gmail";
      fromAddress = oauthRow.email_address || "Unknown";
    } else {
      provider = "mailgun";
      fromAddress = process.env.MAILGUN_FROM || `BlueWise AI <sales@${process.env.MAILGUN_DOMAIN}>`;
    }
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
  } else if (provider === "gmail") {
    // Retrieve the OAuth row we already fetched above
    const { data: gmailOauth } = await supabase
      .from("customer_email_oauth")
      .select("id, access_token, refresh_token, token_expiry, email_address")
      .eq("customer_id", customerId)
      .eq("provider", "gmail")
      .eq("status", "active")
      .maybeSingle();

    if (!gmailOauth) {
      sendResult = { success: false, error: "Gmail OAuth not found — reconnect in Settings" };
    } else {
      sendResult = await sendEmailGmail(
        { to: finalTo, from: fromAddress, subject: subjectText, body: bodyText, html: htmlText || undefined },
        gmailOauth,
        async (newAccessToken, newExpiry) => {
          await supabase
            .from("customer_email_oauth")
            .update({
              access_token: encryptToken(newAccessToken),
              token_expiry: newExpiry,
              updated_at: new Date().toISOString(),
            })
            .eq("id", gmailOauth.id);
        }
      );
    }
  } else {
    sendResult = await sendEmailMailgun({
      to: finalTo,
      from: fromAddress,
      subject: subjectText,
      body: bodyText,
      html: htmlText || undefined,
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
