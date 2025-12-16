// lib/providers/telnyx.js

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const TELNYX_TIMEOUT_MS = Number(process.env.TELNYX_TIMEOUT_MS || 12000);

// Conservative: most carriers segment long SMS. You can still send longer,
// but your UX should be aware this can turn into multi-part + higher cost.
const SMS_SOFT_LIMIT = Number(process.env.SMS_SOFT_LIMIT || 480);

function normalizePhone(v) {
  const s = (v || "").toString().trim();
  return s || null;
}

export async function sendSmsTelnyx({ to, body, from }) {
  const toNorm = normalizePhone(to);
  const fromNorm = normalizePhone(from);
  const bodyNorm = (body || "").toString();

  if (!TELNYX_API_KEY) {
    return { success: false, provider_message_id: null, error: "Missing TELNYX_API_KEY" };
  }
  if (!toNorm || !bodyNorm || !fromNorm) {
    return { success: false, provider_message_id: null, error: "Missing to/body/from" };
  }

  // Soft guardrail (still allow, but callers may want to handle this upstream)
  if (bodyNorm.length > SMS_SOFT_LIMIT) {
    return {
      success: false,
      provider_message_id: null,
      error: `SMS too long (${bodyNorm.length} chars). Please shorten below ${SMS_SOFT_LIMIT}.`,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TELNYX_TIMEOUT_MS);

  try {
    const resp = await fetch("https://api.telnyx.com/v2/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TELNYX_API_KEY}`,
      },
      body: JSON.stringify({
        to: toNorm,
        from: fromNorm,
        text: bodyNorm,
      }),
      signal: controller.signal,
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
    const aborted = e?.name === "AbortError";
    return {
      success: false,
      provider_message_id: null,
      error: aborted ? `Telnyx timeout after ${TELNYX_TIMEOUT_MS}ms` : e?.message || "Telnyx send failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}
