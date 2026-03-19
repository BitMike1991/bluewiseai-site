// pages/api/settings/outlook-auth.js
// GET → returns Microsoft OAuth URL for Outlook authorization
// DELETE → revokes and removes OAuth tokens
import { getAuthContext, getSupabaseServerClient } from "../../../lib/supabaseServer";
import { createSignedState } from "../../../lib/oauthState";

const SCOPES = [
  "https://graph.microsoft.com/Mail.ReadWrite",
  "https://graph.microsoft.com/Mail.Send",
  "offline_access",
  "openid",
  "email",
].join(" ");

export default async function handler(req, res) {
  try {
    const { user, customerId } = await getAuthContext(req, res);

    if (!user) return res.status(401).json({ error: "Not authenticated" });
    if (!customerId) return res.status(403).json({ error: "No customer mapping" });

    if (req.method === "GET") {
      const clientId = process.env.MICROSOFT_CLIENT_ID;
      const redirectUri = process.env.MICROSOFT_REDIRECT_URI;

      if (!clientId || !redirectUri) {
        return res.status(500).json({ error: "Microsoft OAuth not configured" });
      }

      // HMAC-signed state to prevent CSRF + account takeover
      const state = createSignedState({ customerId, userId: user.id });

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: SCOPES,
        response_mode: "query",
        prompt: "consent",
        state,
      });

      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;

      return res.status(200).json({ authUrl });
    }

    if (req.method === "DELETE") {
      const admin = getSupabaseServerClient();

      const { error } = await admin
        .from("customer_email_oauth")
        .update({ status: "revoked", access_token: null, refresh_token: null, updated_at: new Date().toISOString() })
        .eq("customer_id", customerId)
        .eq("provider", "outlook");

      if (error) {
        return res.status(500).json({ error: "Failed to disconnect", details: error.message });
      }

      return res.status(200).json({ success: true });
    }

    res.setHeader("Allow", ["GET", "DELETE"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[outlook-auth] Unhandled error:", err);
    return res.status(500).json({ error: "Internal error", details: err.message });
  }
}
