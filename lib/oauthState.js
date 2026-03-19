// lib/oauthState.js
// HMAC-signed OAuth state parameter to prevent CSRF + account takeover
import crypto from "crypto";

const SECRET = process.env.OAUTH_STATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Create a signed OAuth state token
 * @param {object} data - { customerId, userId }
 * @returns {string} base64url-encoded signed state
 */
export function createSignedState(data) {
  const payload = JSON.stringify({ ...data, ts: Date.now() });
  const payloadB64 = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

/**
 * Verify and decode a signed OAuth state token
 * @param {string} state - signed state string
 * @param {number} maxAgeMs - max age in ms (default 10 minutes)
 * @returns {object|null} decoded data or null if invalid
 */
export function verifySignedState(state, maxAgeMs = 600000) {
  if (!state || !state.includes(".")) return null;

  const [payloadB64, sig] = state.split(".");
  const expectedSig = crypto.createHmac("sha256", SECRET).update(payloadB64).digest("base64url");

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (Date.now() - data.ts > maxAgeMs) return null;
    return data;
  } catch {
    return null;
  }
}
