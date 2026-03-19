// pages/api/subscription/status.js
import { getAuthContext } from "../../../lib/supabaseServer";
import { getSubscription, isAccessAllowed } from "../../../lib/subscriptionGate";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { user, customerId } = await getAuthContext(req, res);
    if (!user) return res.status(401).json({ error: "Not authenticated" });

    // No customerId = internal user, always active
    if (!customerId) {
      return res.status(200).json({ status: "active", allowed: true });
    }

    const sub = await getSubscription(customerId);

    // No subscription row = internal user, always active
    if (!sub) {
      return res.status(200).json({ status: "active", allowed: true });
    }

    const allowed = isAccessAllowed(sub);
    const status = sub.status;

    // Set cookie for middleware fast-path (5-min TTL, HttpOnly + Secure + signed)
    const crypto = await import("crypto");
    const cookieSecret = process.env.HMAC_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const cookieVal = allowed ? "active" : "suspended";
    const sig = crypto.createHmac("sha256", cookieSecret).update(cookieVal).digest("base64url");
    res.setHeader(
      "Set-Cookie",
      `__sub_status=${cookieVal}.${sig}; Path=/; Max-Age=300; SameSite=Lax; HttpOnly; Secure`
    );

    return res.status(200).json({
      status,
      allowed,
      suspended_at: sub.suspended_at || null,
      current_period_end: sub.current_period_end || null,
    });
  } catch (err) {
    // Fail-closed: on error, deny access (safe default for billing)
    console.error("Subscription status check failed:", err.message);
    return res.status(503).json({ status: "unknown", allowed: false, error: "check_failed" });
  }
}
