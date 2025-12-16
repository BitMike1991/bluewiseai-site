// lib/providers/mailgun.js

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN; // e.g. mg.bluewiseai.com
const MAILGUN_FROM = process.env.MAILGUN_FROM || (MAILGUN_DOMAIN ? `BlueWise AI <sales@${MAILGUN_DOMAIN}>` : "");
const MAILGUN_REGION = (process.env.MAILGUN_REGION || "us").toLowerCase();
const MAILGUN_TIMEOUT_MS = Number(process.env.MAILGUN_TIMEOUT_MS || 12000);

function mailgunBaseUrl() {
  // US: https://api.mailgun.net, EU: https://api.eu.mailgun.net
  return MAILGUN_REGION === "eu" ? "https://api.eu.mailgun.net" : "https://api.mailgun.net";
}

function normalizeEmailAddress(v) {
  const s = (v || "").toString().trim();
  return s || null;
}

async function safeReadText(resp) {
  try {
    return await resp.text();
  } catch {
    return "";
  }
}

function tryParseJson(rawText) {
  try {
    return JSON.parse(rawText);
  } catch {
    return null;
  }
}

export async function sendEmailMailgun({ to, subject, body, from, replyTo, html }) {
  const toNorm = normalizeEmailAddress(to);
  const subjectNorm = (subject || "").toString().trim();
  const bodyNorm = (body || "").toString();

  if (!MAILGUN_API_KEY) {
    return { success: false, provider_message_id: null, error: "Missing MAILGUN_API_KEY" };
  }
  if (!MAILGUN_DOMAIN) {
    return { success: false, provider_message_id: null, error: "Missing MAILGUN_DOMAIN" };
  }
  if (!toNorm || !subjectNorm || !bodyNorm) {
    return { success: false, provider_message_id: null, error: "Missing to/subject/body" };
  }

  const url = `${mailgunBaseUrl()}/v3/${MAILGUN_DOMAIN}/messages`;

  const form = new URLSearchParams();
  form.set("from", (from || MAILGUN_FROM || "").toString().trim());
  form.set("to", toNorm);
  form.set("subject", subjectNorm);

  // Mailgun accepts both text and html; keep text always for deliverability
  form.set("text", bodyNorm);
  if (html) form.set("html", html.toString());

  if (replyTo) form.set("h:Reply-To", replyTo.toString().trim());

  const auth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString("base64");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MAILGUN_TIMEOUT_MS);

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
      signal: controller.signal,
    });

    const rawText = await safeReadText(resp);
    const parsed = tryParseJson(rawText);
    const raw = parsed ?? { rawText };

    if (!resp.ok) {
      const msg =
        raw?.message ||
        raw?.error ||
        raw?.details ||
        `Mailgun error (${resp.status})`;
      return { success: false, provider_message_id: null, error: msg, raw };
    }

    // Mailgun typically returns { id: "<...>", message: "Queued. Thank you." }
    const provider_message_id = raw?.id || null;

    return { success: true, provider_message_id, error: null, raw };
  } catch (e) {
    const aborted = e?.name === "AbortError";
    return {
      success: false,
      provider_message_id: null,
      error: aborted ? `Mailgun timeout after ${MAILGUN_TIMEOUT_MS}ms` : e?.message || "Mailgun send failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}
