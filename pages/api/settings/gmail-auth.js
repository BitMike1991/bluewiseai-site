// pages/api/settings/gmail-auth.js
// GET → returns Google OAuth URL for Gmail authorization
// DELETE → revokes and removes OAuth tokens
import { getAuthContext, getSupabaseServerClient } from "../../../lib/supabaseServer";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
].join(" ");

export default async function handler(req, res) {
  const { user, customerId } = await getAuthContext(req, res);

  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (!customerId) return res.status(403).json({ error: "No customer mapping" });

  if (req.method === "GET") {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return res.status(500).json({ error: "Google OAuth not configured" });
    }

    // State encodes customer_id + user_id for security verification on callback
    const state = Buffer.from(
      JSON.stringify({ customerId, userId: user.id })
    ).toString("base64url");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: "consent",
      state,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return res.status(200).json({ authUrl });
  }

  if (req.method === "DELETE") {
    const admin = getSupabaseServerClient();

    // Fetch existing token to revoke at Google
    const { data: oauth } = await admin
      .from("customer_email_oauth")
      .select("access_token, refresh_token")
      .eq("customer_id", customerId)
      .single();

    if (oauth?.access_token) {
      try {
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${oauth.access_token}`,
          { method: "POST" }
        );
      } catch (e) {
        // Best effort revoke
      }
    }

    const { error } = await admin
      .from("customer_email_oauth")
      .update({ status: "revoked", access_token: null, refresh_token: null, updated_at: new Date().toISOString() })
      .eq("customer_id", customerId);

    if (error) {
      return res.status(500).json({ error: "Failed to disconnect", details: error.message });
    }

    return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", ["GET", "DELETE"]);
  return res.status(405).json({ error: "Method not allowed" });
}
