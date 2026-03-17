// pages/api/auth/outlook-callback.js
// Microsoft OAuth callback — exchanges code for tokens, stores in customer_email_oauth
import { getSupabaseServerClient } from "../../../lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, state, error: oauthError } = req.query;

  if (oauthError) {
    return res.redirect("/platform/settings?outlook=error&reason=" + encodeURIComponent(oauthError));
  }

  if (!code || !state) {
    return res.redirect("/platform/settings?outlook=error&reason=missing_params");
  }

  // Decode state
  let stateData;
  try {
    const padded = state.replace(/-/g, "+").replace(/_/g, "/");
    stateData = JSON.parse(Buffer.from(padded, "base64").toString());
  } catch (e) {
    return res.redirect("/platform/settings?outlook=error&reason=invalid_state");
  }

  const { customerId, userId } = stateData;
  if (!customerId || !userId) {
    return res.redirect("/platform/settings?outlook=error&reason=invalid_state");
  }

  // Exchange code for tokens
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI;

  let tokenData;
  try {
    const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error("[outlook-callback] Token exchange error:", tokenData);
      return res.redirect("/platform/settings?outlook=error&reason=token_exchange");
    }
  } catch (e) {
    console.error("[outlook-callback] Token exchange failed:", e);
    return res.redirect("/platform/settings?outlook=error&reason=token_exchange");
  }

  // Get the authorized email address from Microsoft Graph
  let emailAddress = "";
  try {
    const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();
    emailAddress = profile.mail || profile.userPrincipalName || "";
  } catch (e) {
    console.error("[outlook-callback] Profile fetch failed:", e);
  }

  // Store tokens in DB (upsert — one row per customer+provider)
  const admin = getSupabaseServerClient();
  const tokenExpiry = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null;

  const { error: dbError } = await admin
    .from("customer_email_oauth")
    .upsert(
      {
        customer_id: customerId,
        provider: "outlook",
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expiry: tokenExpiry,
        email_address: emailAddress,
        scopes: tokenData.scope ? tokenData.scope.split(" ") : [],
        status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "customer_id,provider" }
    );

  if (dbError) {
    console.error("[outlook-callback] DB upsert error:", dbError);
    return res.redirect("/platform/settings?outlook=error&reason=db_error");
  }

  return res.redirect("/platform/settings?outlook=success&email=" + encodeURIComponent(emailAddress));
}
