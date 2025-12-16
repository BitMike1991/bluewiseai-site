// lib/providers/mailgun.js

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN; // mg.bluewiseai.com
const MAILGUN_FROM = process.env.MAILGUN_FROM || `BlueWise AI <sales@${MAILGUN_DOMAIN}>`;
const MAILGUN_REGION = (process.env.MAILGUN_REGION || "us").toLowerCase();

function mailgunBaseUrl() {
  // US: https://api.mailgun.net, EU: https://api.eu.mailgun.net
  return MAILGUN_REGION === "eu" ? "https://api.eu.mailgun.net" : "https://api.mailgun.net";
}

export async function sendEmailMailgun({ to, subject, body, from, replyTo, html }) {
  try {
    if (!MAILGUN_API_KEY) {
      return { success: false, provider_message_id: null, error: "Missing MAILGUN_API_KEY" };
    }
    if (!MAILGUN_DOMAIN) {
      return { success: false, provider_message_id: null, error: "Missing MAILGUN_DOMAIN" };
    }
    if (!to || !subject || !body) {
      return { success: false, provider_message_id: null, error: "Missing to/subject/body" };
    }

    const url = `${mailgunBaseUrl()}/v3/${MAILGUN_DOMAIN}/messages`;

    const form = new URLSearchParams();
    form.set("from", from || MAILGUN_FROM);
    form.set("to", to);
    form.set("subject", subject);

    if (html) form.set("html", html);
    form.set("text", body);

    if (replyTo) form.set("h:Reply-To", replyTo);

    const auth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString("base64");

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const rawText = await resp.text();
    let raw;
    try {
      raw = JSON.parse(rawText);
    } catch {
      raw = { rawText };
    }

    if (!resp.ok) {
      const msg = raw?.message || `Mailgun error (${resp.status})`;
      return { success: false, provider_message_id: null, error: msg, raw };
    }

    // Mailgun typically returns { id: "<...>", message: "Queued. Thank you." }
    const provider_message_id = raw?.id || null;
    return { success: true, provider_message_id, error: null, raw };
  } catch (e) {
    return { success: false, provider_message_id: null, error: e?.message || "Mailgun send failed" };
  }
}
