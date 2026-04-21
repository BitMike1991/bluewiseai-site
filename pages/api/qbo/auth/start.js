// pages/api/qbo/auth/start.js
// GET → returns Intuit OAuth2 URL for this tenant.
// DELETE → revokes at Intuit + marks connection as revoked.

import { getAuthContext, getSupabaseServerClient } from "../../../../lib/supabaseServer";
import { createSignedState } from "../../../../lib/oauthState";
import { buildAuthUrl, qboEnvConfig, revokeTokens } from "../../../../lib/qbo/client";
import { decryptToken } from "../../../../lib/tokenEncryption";

export default async function handler(req, res) {
  try {
    const { user, customerId, role } = await getAuthContext(req, res);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    if (!customerId) return res.status(403).json({ error: "No customer mapping" });
    if (!["owner", "admin"].includes(role || "owner")) {
      return res.status(403).json({ error: "Owner/admin only" });
    }

    const cfg = qboEnvConfig();
    if (cfg.missing.length) {
      return res.status(500).json({
        error: "QBO OAuth not configured",
        missing: cfg.missing,
      });
    }

    if (req.method === "GET") {
      const state = createSignedState({ customerId, userId: user.id, purpose: "qbo" });
      return res.status(200).json({ authUrl: buildAuthUrl(state), environment: cfg.environment });
    }

    if (req.method === "DELETE") {
      const admin = getSupabaseServerClient();
      const { data: conn } = await admin
        .from("accounting_connections")
        .select("access_token_encrypted, refresh_token_encrypted")
        .eq("customer_id", customerId)
        .eq("provider", "qbo")
        .maybeSingle();

      const refreshPlain = conn?.refresh_token_encrypted ? decryptToken(conn.refresh_token_encrypted) : null;
      if (refreshPlain) {
        await revokeTokens(refreshPlain);
      }

      await admin
        .from("accounting_connections")
        .update({
          status: "revoked",
          access_token_encrypted: null,
          refresh_token_encrypted: null,
          disconnected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("customer_id", customerId)
        .eq("provider", "qbo");

      return res.status(200).json({ success: true });
    }

    res.setHeader("Allow", ["GET", "DELETE"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[qbo-auth-start] Unhandled error:", err);
    return res.status(500).json({ error: "Internal error", details: "See server logs" });
  }
}
