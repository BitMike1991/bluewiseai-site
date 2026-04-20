// pages/api/settings/outlook-auth.js
// GET → returns Microsoft OAuth URL for Outlook authorization
// DELETE → revokes and removes OAuth tokens
import { getAuthContext, getSupabaseServerClient } from "../../../lib/supabaseServer";
import { createSignedState } from "../../../lib/oauthState";
import { decryptToken } from "../../../lib/tokenEncryption";

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

      // F-005 — previously the DB row was nulled without calling Microsoft's
      // revoke endpoint, so the refresh_token (≤90d lifetime on work accounts)
      // stayed valid. Decrypt-then-revoke at Microsoft before nulling the row.
      const { data: oauth } = await admin
        .from("customer_email_oauth")
        .select("access_token, refresh_token")
        .eq("customer_id", customerId)
        .eq("provider", "outlook")
        .maybeSingle();

      const refreshPlain = oauth?.refresh_token ? decryptToken(oauth.refresh_token) : null;
      if (refreshPlain) {
        try {
          const r = await fetch(
            "https://login.microsoftonline.com/common/oauth2/v2.0/logout",
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: process.env.MICROSOFT_CLIENT_ID || "",
                refresh_token: refreshPlain,
              }),
            }
          );
          if (r.status !== 200 && r.status !== 204) {
            console.warn("[outlook-revoke] non-2xx status:", r.status);
          }
        } catch (e) {
          console.warn("[outlook-revoke] error:", e?.message);
        }
      }

      const { error } = await admin
        .from("customer_email_oauth")
        .update({ status: "revoked", access_token: null, refresh_token: null, updated_at: new Date().toISOString() })
        .eq("customer_id", customerId)
        .eq("provider", "outlook");

      if (error) {
        return res.status(500).json({ error: "Failed to disconnect", details: "See server logs" });
      }

      return res.status(200).json({ success: true });
    }

    res.setHeader("Allow", ["GET", "DELETE"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[outlook-auth] Unhandled error:", err);
    return res.status(500).json({ error: "Internal error", details: "See server logs" });
  }
}
