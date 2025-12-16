// lib/providers/telnyx.js

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;

export async function sendSmsTelnyx({ to, body, from }) {
  try {
    if (!TELNYX_API_KEY) {
      return { success: false, provider_message_id: null, error: "Missing TELNYX_API_KEY" };
    }
    if (!to || !body || !from) {
      return { success: false, provider_message_id: null, error: "Missing to/body/from" };
    }

    const resp = await fetch("https://api.telnyx.com/v2/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TELNYX_API_KEY}`,
      },
      body: JSON.stringify({
        to,
        from,
        text: body,
      }),
    });

    const raw = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      const msg =
        raw?.errors?.[0]?.detail ||
        raw?.errors?.[0]?.title ||
        raw?.message ||
        `Telnyx error (${resp.status})`;
      return { success: false, provider_message_id: null, error: msg, raw };
    }

    const provider_message_id = raw?.data?.id || null;
    return { success: true, provider_message_id, error: null, raw };
  } catch (e) {
    return { success: false, provider_message_id: null, error: e?.message || "Telnyx send failed" };
  }
}
