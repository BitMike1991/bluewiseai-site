// pages/api/settings/gcal-token.js
// Returns a fresh Google Calendar access token for a given customer_id.
// Called by n8n tools handler to get per-customer calendar access.
// Secured by service role key in Authorization header.
import { getSupabaseServerClient } from "../../../lib/supabaseServer";
import { decryptToken } from "../../../lib/tokenEncryption";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify service role key (n8n calls this with the Supabase service key)
  const auth = req.headers.authorization || "";
  const expectedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!auth.includes(expectedKey)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { customer_id } = req.body || {};
  if (!customer_id) {
    return res.status(400).json({ error: "Missing customer_id" });
  }

  const admin = getSupabaseServerClient();
  const { data: oauth, error: dbErr } = await admin
    .from("customer_email_oauth")
    .select("refresh_token, access_token, token_expiry, status")
    .eq("customer_id", customer_id)
    .eq("provider", "gmail")
    .single();

  if (dbErr || !oauth || oauth.status !== "active") {
    return res.status(404).json({ error: "No active Google OAuth for this customer" });
  }

  const refreshToken = decryptToken(oauth.refresh_token);
  if (!refreshToken) {
    return res.status(500).json({ error: "Failed to decrypt refresh token" });
  }

  // Check if current access token is still valid (with 5 min buffer)
  if (oauth.access_token && oauth.token_expiry) {
    const expiry = new Date(oauth.token_expiry);
    if (expiry > new Date(Date.now() + 5 * 60 * 1000)) {
      const accessToken = decryptToken(oauth.access_token);
      if (accessToken) {
        return res.status(200).json({ access_token: accessToken });
      }
    }
  }

  // Refresh the token
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      return res.status(500).json({ error: "Token refresh failed", details: tokenData.error });
    }

    // Update stored access token + expiry
    const { encryptToken } = await import("../../../lib/tokenEncryption");
    const newExpiry = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    await admin
      .from("customer_email_oauth")
      .update({
        access_token: encryptToken(tokenData.access_token),
        token_expiry: newExpiry,
        updated_at: new Date().toISOString(),
      })
      .eq("customer_id", customer_id)
      .eq("provider", "gmail");

    return res.status(200).json({ access_token: tokenData.access_token });
  } catch (e) {
    return res.status(500).json({ error: "Token refresh request failed" });
  }
}
