// pages/api/admin/test-email.js
// Owner/admin-only diagnostic endpoint. Sends a test email via the SAME
// Gmail → Mailgun fallback path used in production (devis/accept, contrat/sign
// etc.) and returns the exact provider outcome. Useful when Mikael asks
// "pourquoi mailgun fail / envoie-moi un email pour tester".
//
// Usage: GET /api/admin/test-email?to=someone@example.com&customer_id=9
// Without ?customer_id, uses the authenticated user's customer.

import { getAuthContext } from "../../../lib/supabaseServer";
import { sendEmailGmail } from "../../../lib/providers/gmail";
import { sendEmailMailgun } from "../../../lib/providers/mailgun";
import { encryptToken } from "../../../lib/tokenEncryption";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId: sessionCustomerId, user, role } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (!["owner", "admin"].includes(role || "owner")) {
    return res.status(403).json({ error: "Owner/admin only" });
  }

  const to = String(req.query.to || req.body?.to || user.email || "").trim();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return res.status(400).json({ error: "Invalid or missing `to` address" });
  }

  const cidRaw = req.query.customer_id ?? req.body?.customer_id ?? sessionCustomerId;
  const customerId = Number(cidRaw);
  if (!Number.isFinite(customerId)) {
    return res.status(400).json({ error: "customer_id required" });
  }

  // Pull tenant branding + Gmail OAuth row
  const [custRes, oauthRes] = await Promise.all([
    supabase.from("customers").select("business_name, quote_config").eq("id", customerId).maybeSingle(),
    supabase
      .from("customer_email_oauth")
      .select("id, provider, access_token, refresh_token, token_expiry, email_address, status")
      .eq("customer_id", customerId)
      .eq("status", "active")
      .eq("provider", "gmail")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const branding = custRes.data?.quote_config?.branding || {
    business_name: custRes.data?.business_name || "BlueWise",
  };
  const oauthRow = oauthRes.data || null;

  const subject = `Test email (cid=${customerId}) — ${new Date().toLocaleString("fr-CA")}`;
  const text = [
    "Ceci est un test de diagnostic envoyé via /api/admin/test-email.",
    "",
    `Tenant : ${branding.business_name || `customer ${customerId}`}`,
    `Destinataire : ${to}`,
    `Demandé par : ${user.email || user.id}`,
    `Date : ${new Date().toISOString()}`,
    "",
    "Si tu reçois ceci, Gmail OAuth fonctionne. Si non, regarde la réponse",
    "JSON de l'endpoint — elle contient les erreurs de chaque provider.",
  ].join("\n");
  const html = `<pre style="font:13px/1.5 ui-monospace,Menlo,monospace;color:#2A2C35;">${text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")}</pre>`;

  const diagnostics = {
    to,
    customer_id: customerId,
    gmail: { attempted: false, success: false, error: null, message_id: null, token_expired_before_send: null, token_refreshed: false },
    mailgun: { attempted: false, success: false, error: null, message_id: null, configured: false },
    final_provider: null,
  };

  // Gmail attempt
  let sent = null;
  if (oauthRow?.email_address) {
    diagnostics.gmail.attempted = true;
    diagnostics.gmail.token_expired_before_send = oauthRow.token_expiry
      ? new Date(oauthRow.token_expiry) < new Date()
      : null;
    try {
      sent = await sendEmailGmail(
        {
          to,
          from: `${branding.business_name || "BlueWise"} <${oauthRow.email_address}>`,
          subject,
          body: text,
          html,
        },
        oauthRow,
        async (newAccessToken, newExpiry) => {
          diagnostics.gmail.token_refreshed = true;
          try {
            await supabase
              .from("customer_email_oauth")
              .update({
                access_token: encryptToken(newAccessToken),
                token_expiry: newExpiry,
                updated_at: new Date().toISOString(),
              })
              .eq("id", oauthRow.id);
          } catch (e) {
            console.warn("[admin/test-email] oauth token update failed", e?.message);
          }
        }
      );
      diagnostics.gmail.success = !!sent?.success;
      diagnostics.gmail.error = sent?.error || null;
      diagnostics.gmail.message_id = sent?.provider_message_id || null;
    } catch (e) {
      diagnostics.gmail.error = e?.message || "Gmail send threw";
    }
  } else {
    diagnostics.gmail.error = "No active Gmail OAuth row for this customer";
  }

  // Mailgun fallback
  if (!sent || !sent.success) {
    const mgFrom = process.env.MAILGUN_FROM
      || (process.env.MAILGUN_DOMAIN ? `${branding.business_name || "BlueWise"} <noreply@${process.env.MAILGUN_DOMAIN}>` : "");
    diagnostics.mailgun.configured = !!mgFrom;
    if (mgFrom) {
      diagnostics.mailgun.attempted = true;
      try {
        const mgSent = await sendEmailMailgun({ to, from: mgFrom, subject, body: text, html });
        diagnostics.mailgun.success = !!mgSent?.success;
        diagnostics.mailgun.error = mgSent?.error || null;
        diagnostics.mailgun.message_id = mgSent?.provider_message_id || null;
        if (mgSent?.success) sent = mgSent;
      } catch (e) {
        diagnostics.mailgun.error = e?.message || "Mailgun send threw";
      }
    }
  }

  diagnostics.final_provider = diagnostics.gmail.success
    ? "gmail"
    : diagnostics.mailgun.success
      ? "mailgun"
      : null;

  // Log to messages for audit parity with the real flows.
  try {
    await supabase.from("messages").insert({
      customer_id: customerId,
      lead_id: null,
      direction: "outbound",
      channel: "email",
      message_type: "email",
      subject,
      body: text,
      provider: diagnostics.final_provider,
      provider_message_id:
        diagnostics.gmail.message_id || diagnostics.mailgun.message_id || null,
      status: diagnostics.final_provider ? "sent" : "failed",
      error: diagnostics.final_provider
        ? null
        : `gmail:${diagnostics.gmail.error || "not attempted"} | mailgun:${diagnostics.mailgun.error || "not attempted"}`,
      to_address: to,
      from_address:
        diagnostics.final_provider === "gmail"
          ? oauthRow?.email_address
          : process.env.MAILGUN_FROM || null,
      meta: {
        admin_test_email: true,
        triggered_by: user.email || user.id,
        diagnostics,
      },
    });
  } catch (e) {
    console.warn("[admin/test-email] messages log failed", e?.message);
  }

  return res.status(200).json({
    success: !!diagnostics.final_provider,
    ...diagnostics,
  });
}
