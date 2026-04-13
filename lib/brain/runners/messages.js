// lib/brain/runners/messages.js
// Extracted from /api/ask.js — DO NOT modify internal logic

import OpenAI from "openai";
import { sendSmsTelnyx } from "../../providers/telnyx";
import { sendEmailMailgun } from "../../providers/mailgun";
import { resolveLeadForTask } from "./leads";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SMS_MAX_LEN = 1200;

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

export async function runSummarizeConversationTool(supabase, customerId, args) {
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
      "id, customer_id, lead_id, channel, direction, subject, body, content, text, email_body, created_at",
      "id, customer_id, lead_id, channel, direction, subject, body, text, email_body, created_at",
      "id, customer_id, lead_id, channel, direction, body, created_at",
      "id, customer_id, lead_id, body, created_at",
      "id, customer_id, lead_id, created_at",
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
    console.error("[brain/messages] summarize_conversation messages error:", loaded.error);
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
    const clipped = clean.length > 600 ? clean.slice(0, 600) + "\u2026" : clean;

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

  let parsed = null;
  try {
    const cleaned = stripCodeFences(raw);
    const candidate = extractFirstJsonObject(cleaned) || cleaned;
    parsed = JSON.parse(candidate);
  } catch (e) {
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

export async function runDraftReplyTool(supabase, customerId, args) {
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
    .select("id, customer_id, name, email, phone, status, source, language, created_at")
    .eq("customer_id", customerId)
    .eq("id", resolved.leadId)
    .maybeSingle();

  if (leadErr || !lead) {
    console.error("[brain/messages] draft_reply lead load error:", leadErr);
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
    console.warn("[brain/messages] draft_reply tasks load warning:", fuErr);
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
      console.warn("[brain/messages] draft_reply messages fallback error:", lastError);
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
      ? "Ask 2\u20133 specific questions needed to proceed."
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

export async function runSendMessageTool(supabase, customerId, args) {
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

  // Verify lead belongs to tenant
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("id, customer_id, profile_id, email, phone")
    .eq("id", lead_id)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (leadErr) {
    console.error("[brain/messages] send_message lead lookup error:", leadErr);
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

  // Send
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

  // Persist outbound message
  const messageInsert = {
    customer_id: customerId,
    lead_id,
    profile_id: lead?.profile_id || null,
    direction: "outbound",
    channel,
    message_type: channel,
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

  // Update send_logs
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
    console.error("[brain/messages] send_message persist error:", msgErr);
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
