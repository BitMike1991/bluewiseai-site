// pages/api/qbo/auth/callback.js
// Intuit redirects here with ?code=&state=&realmId=
// We exchange the code, encrypt tokens, upsert accounting_connections.

import { getSupabaseServerClient } from "../../../../lib/supabaseServer";
import { verifySignedState } from "../../../../lib/oauthState";
import { encryptToken } from "../../../../lib/tokenEncryption";
import { exchangeCodeForTokens, qboEnvConfig } from "../../../../lib/qbo/client";

const REDIRECT_BASE = "/platform/settings?qbo=";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, state, realmId, error: oauthError } = req.query;

  if (oauthError) {
    return res.redirect(`${REDIRECT_BASE}error&reason=${encodeURIComponent(oauthError)}`);
  }
  if (!code || !state || !realmId) {
    return res.redirect(`${REDIRECT_BASE}error&reason=missing_params`);
  }

  const stateData = verifySignedState(state);
  if (!stateData || stateData.purpose !== "qbo" || !stateData.customerId || !stateData.userId) {
    return res.redirect(`${REDIRECT_BASE}error&reason=invalid_state`);
  }

  const cfg = qboEnvConfig();
  if (cfg.missing.length) {
    return res.redirect(`${REDIRECT_BASE}error&reason=not_configured`);
  }

  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch (e) {
    console.error("[qbo-callback] token exchange failed:", e);
    return res.redirect(`${REDIRECT_BASE}error&reason=token_exchange`);
  }

  // Try to fetch company info so we can store a human name next to realm_id.
  let companyName = null;
  let legalName = null;
  try {
    const infoRes = await fetch(
      `${cfg.apiBase}/company/${encodeURIComponent(realmId)}/companyinfo/${encodeURIComponent(realmId)}`,
      { headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: "application/json" } }
    );
    if (infoRes.ok) {
      const info = await infoRes.json();
      companyName = info?.CompanyInfo?.CompanyName || null;
      legalName   = info?.CompanyInfo?.LegalName   || null;
    }
  } catch {
    // Non-fatal — company name is cosmetic.
  }

  const admin = getSupabaseServerClient();
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  const { error: dbError } = await admin
    .from("accounting_connections")
    .upsert(
      {
        customer_id: stateData.customerId,
        provider: "qbo",
        realm_id: String(realmId),
        environment: cfg.environment,
        access_token_encrypted: encryptToken(tokens.access_token),
        refresh_token_encrypted: encryptToken(tokens.refresh_token),
        expires_at: expiresAt,
        scopes: (tokens.scope || "com.intuit.quickbooks.accounting").split(" "),
        company_name: companyName,
        legal_name: legalName,
        status: "active",
        connected_at: new Date().toISOString(),
        disconnected_at: null,
        last_error: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "customer_id,provider" }
    );

  if (dbError) {
    console.error("[qbo-callback] DB upsert error:", dbError);
    return res.redirect(`${REDIRECT_BASE}error&reason=db_error`);
  }

  return res.redirect(`${REDIRECT_BASE}success&realm=${encodeURIComponent(realmId)}`);
}
