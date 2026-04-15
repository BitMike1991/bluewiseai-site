// lib/providers/gmail.js
// Send email via Gmail API using stored OAuth tokens

import { decryptToken } from "../tokenEncryption";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_SEND_URL = "https://www.googleapis.com/gmail/v1/users/me/messages/send";

/**
 * Refresh an expired access token using the refresh token.
 */
async function refreshAccessToken(refreshTokenEncrypted) {
  const refreshToken = decryptToken(refreshTokenEncrypted);
  if (!refreshToken) return null;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token || null;
}

/**
 * Build a MIME message and base64url-encode it for Gmail API.
 */
function buildMimeMessage({ from, to, subject, body, html, replyTo }) {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  let mime = "";
  mime += `From: ${from}\r\n`;
  mime += `To: ${to}\r\n`;
  mime += `Subject: ${subject}\r\n`;
  if (replyTo) mime += `Reply-To: ${replyTo}\r\n`;
  mime += `MIME-Version: 1.0\r\n`;

  if (html) {
    mime += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;
    mime += `--${boundary}\r\n`;
    mime += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
    mime += `${body}\r\n\r\n`;
    mime += `--${boundary}\r\n`;
    mime += `Content-Type: text/html; charset="UTF-8"\r\n\r\n`;
    mime += `${html}\r\n\r\n`;
    mime += `--${boundary}--`;
  } else {
    mime += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
    mime += body;
  }

  // Base64url encode
  return Buffer.from(mime)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Send an email via Gmail API.
 * @param {object} params - { to, from, subject, body, html, replyTo }
 * @param {object} oauthRow - Row from customer_email_oauth with encrypted tokens
 * @param {function} updateTokens - async fn(newAccessToken, newExpiry) to persist refreshed token
 * @returns {{ success, provider_message_id, error, raw }}
 */
export async function sendEmailGmail({ to, from, subject, body, html, replyTo }, oauthRow, updateTokens) {
  if (!to || !subject || !body) {
    return { success: false, provider_message_id: null, error: "Missing to/subject/body" };
  }

  // Decrypt access token
  let accessToken = decryptToken(oauthRow.access_token);

  // Check if token is expired and refresh if needed
  const isExpired = oauthRow.token_expiry && new Date(oauthRow.token_expiry) < new Date();
  if (!accessToken || isExpired) {
    accessToken = await refreshAccessToken(oauthRow.refresh_token);
    if (!accessToken) {
      return { success: false, provider_message_id: null, error: "Failed to refresh Gmail token — reconnect Gmail in settings" };
    }
    // Persist the new access token
    if (updateTokens) {
      const newExpiry = new Date(Date.now() + 3500 * 1000).toISOString();
      await updateTokens(accessToken, newExpiry);
    }
  }

  const fromAddress = from || oauthRow.email_address;
  const raw = buildMimeMessage({ from: fromAddress, to, subject, body, html, replyTo });

  try {
    const res = await fetch(GMAIL_SEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = data?.error?.message || `Gmail API error (${res.status})`;
      return { success: false, provider_message_id: null, error: errMsg, raw: data };
    }

    return {
      success: true,
      provider_message_id: data.id || null,
      error: null,
      raw: data,
    };
  } catch (err) {
    return {
      success: false,
      provider_message_id: null,
      error: err?.message || "Gmail send failed",
    };
  }
}
