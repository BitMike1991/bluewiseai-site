// lib/qbo/client.js
// QBO Canada client with AES-256-GCM token storage + auto-refresh.
//
// Mirrors lib/providers/gmail.js — we intentionally keep the same shape so
// reviewers don't need to learn two OAuth dialects.
//
// Env vars (fail loudly if missing): QBO_CLIENT_ID, QBO_CLIENT_SECRET,
// QBO_REDIRECT_URI, QBO_ENVIRONMENT ('sandbox' | 'production').

import { decryptToken, encryptToken } from "../tokenEncryption";
import { getSupabaseServerClient } from "../supabaseServer";

const QBO_AUTH_URL  = "https://appcenter.intuit.com/connect/oauth2";
const QBO_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const QBO_REVOKE_URL = "https://developer.api.intuit.com/v2/oauth2/tokens/revoke";

// QBO scope — accounting only for Wave 1. Payments/Payroll require separate scopes.
export const QBO_SCOPES = ["com.intuit.quickbooks.accounting"];

export function qboEnvConfig() {
  const missing = [];
  const clientId     = process.env.QBO_CLIENT_ID;
  const clientSecret = process.env.QBO_CLIENT_SECRET;
  const redirectUri  = process.env.QBO_REDIRECT_URI;
  const environment  = process.env.QBO_ENVIRONMENT || "sandbox";
  if (!clientId)     missing.push("QBO_CLIENT_ID");
  if (!clientSecret) missing.push("QBO_CLIENT_SECRET");
  if (!redirectUri)  missing.push("QBO_REDIRECT_URI");
  if (!["sandbox", "production"].includes(environment)) {
    missing.push("QBO_ENVIRONMENT (must be 'sandbox' or 'production')");
  }
  return {
    clientId,
    clientSecret,
    redirectUri,
    environment,
    missing,
    apiBase:
      environment === "production"
        ? "https://quickbooks.api.intuit.com/v3"
        : "https://sandbox-quickbooks.api.intuit.com/v3",
  };
}

export function buildAuthUrl(state) {
  const { clientId, redirectUri } = qboEnvConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: QBO_SCOPES.join(" "),
    redirect_uri: redirectUri,
    state,
  });
  return `${QBO_AUTH_URL}?${params.toString()}`;
}

// Exchange an authorization code for tokens (used in /api/qbo/auth/callback).
export async function exchangeCodeForTokens(code) {
  const { clientId, clientSecret, redirectUri } = qboEnvConfig();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(QBO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`QBO token exchange failed (${res.status}): ${JSON.stringify(body)}`);
  }
  return body; // { access_token, refresh_token, expires_in, x_refresh_token_expires_in, token_type }
}

async function refreshTokens(refreshPlain) {
  const { clientId, clientSecret } = qboEnvConfig();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(QBO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshPlain,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`QBO refresh failed (${res.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

export async function revokeTokens(tokenPlain) {
  const { clientId, clientSecret } = qboEnvConfig();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  await fetch(QBO_REVOKE_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ token: tokenPlain }),
  }).catch(() => null);
}

// Persist fresh tokens back to accounting_connections (service-role write).
async function persistRefreshedTokens(customerId, refreshedBody) {
  const admin = getSupabaseServerClient();
  const expiresAt = refreshedBody.expires_in
    ? new Date(Date.now() + refreshedBody.expires_in * 1000).toISOString()
    : null;
  const patch = {
    access_token_encrypted: encryptToken(refreshedBody.access_token),
    expires_at: expiresAt,
    status: "active",
    last_error: null,
    updated_at: new Date().toISOString(),
  };
  // Intuit returns a new refresh_token every ~100 days — update if present.
  if (refreshedBody.refresh_token) {
    patch.refresh_token_encrypted = encryptToken(refreshedBody.refresh_token);
  }
  await admin
    .from("accounting_connections")
    .update(patch)
    .eq("customer_id", customerId)
    .eq("provider", "qbo");
}

/**
 * Returns a QBO client for the given tenant. Throws if not connected or if
 * refresh fails. Caller must catch — we never silently retry.
 *
 * Usage:
 *   const qbo = await getQboClient(customerId);
 *   const resp = await qbo.post('/company/{realmId}/invoice', body);
 */
export async function getQboClient(customerId) {
  if (!customerId) throw new Error("getQboClient: customerId required");
  const cfg = qboEnvConfig();
  if (cfg.missing.length) {
    throw new Error(`QBO not configured — missing env: ${cfg.missing.join(", ")}`);
  }

  const admin = getSupabaseServerClient();
  const { data: conn, error } = await admin
    .from("accounting_connections")
    .select("*")
    .eq("customer_id", customerId)
    .eq("provider", "qbo")
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error(`QBO connection lookup failed: ${error.message}`);
  if (!conn) throw new Error(`QBO not connected for customer ${customerId}`);

  let accessPlain = decryptToken(conn.access_token_encrypted);
  const refreshPlain = decryptToken(conn.refresh_token_encrypted);
  if (!refreshPlain) {
    throw new Error(`QBO refresh token decrypt failed for customer ${customerId} — reconnect required`);
  }

  // Refresh if expired or < 60 s away from expiry. Intuit access tokens live 1h.
  const isExpired = !conn.expires_at || new Date(conn.expires_at).getTime() - Date.now() < 60_000;
  if (isExpired || !accessPlain) {
    const refreshed = await refreshTokens(refreshPlain);
    accessPlain = refreshed.access_token;
    await persistRefreshedTokens(customerId, refreshed);
  }

  const realmId = conn.realm_id;
  if (!realmId) throw new Error(`QBO realm_id missing for customer ${customerId}`);

  async function request(method, path, body) {
    const url = `${cfg.apiBase}${path.startsWith("/") ? path : `/${path}`}`;
    const init = {
      method,
      headers: {
        Authorization: `Bearer ${accessPlain}`,
        Accept: "application/json",
      },
    };
    if (body !== undefined) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }
    const res = await fetch(url, init);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = json?.Fault?.Error?.[0]?.Message || json?.error_description || `QBO ${method} ${path} failed (${res.status})`;
      const err = new Error(errMsg);
      err.status = res.status;
      err.body = json;
      throw err;
    }
    return json;
  }

  return {
    realmId,
    environment: cfg.environment,
    apiBase: cfg.apiBase,
    companyName: conn.company_name,
    get:  (path)       => request("GET",  path),
    post: (path, body) => request("POST", path, body),
  };
}
