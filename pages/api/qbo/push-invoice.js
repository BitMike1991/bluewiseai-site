// pages/api/qbo/push-invoice.js
// POST { quote_id } — pushes a BW quote to QBO as an Invoice.
// Stores QBO Invoice.Id back on quotes.qbo_invoice_id + qbo_synced_at.
// Tenant-scoped; owner/admin only.

import { getAuthContext, getSupabaseServerClient } from "../../../lib/supabaseServer";
import { getQboClient } from "../../../lib/qbo/client";
import { mapQuoteToQboInvoice, QuoteMappingError } from "../../../lib/qbo/invoiceMapper";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { user, customerId, role } = await getAuthContext(req, res);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    if (!customerId) return res.status(403).json({ error: "No customer mapping" });
    if (!["owner", "admin"].includes(role || "owner")) {
      return res.status(403).json({ error: "Owner/admin only" });
    }

    const { quote_id, customer_ref_value } = req.body || {};
    if (!quote_id) return res.status(400).json({ error: "quote_id required" });

    const admin = getSupabaseServerClient();

    // Fetch the quote with tenant guard (service role bypasses RLS — we filter manually).
    const { data: quote, error: qErr } = await admin
      .from("quotes")
      .select("id, customer_id, quote_number, subtotal, tax_gst, tax_qst, total_ttc, line_items, qbo_invoice_id, status")
      .eq("id", quote_id)
      .maybeSingle();

    if (qErr) return res.status(500).json({ error: "Quote lookup failed", details: qErr.message });
    if (!quote) return res.status(404).json({ error: "Quote not found" });
    if (quote.customer_id !== customerId) {
      return res.status(403).json({ error: "Quote belongs to another tenant" });
    }
    if (quote.qbo_invoice_id) {
      return res.status(409).json({
        error: "Quote already synced to QBO",
        qbo_invoice_id: quote.qbo_invoice_id,
      });
    }

    // Build the QBO client (may refresh tokens).
    let qbo;
    try {
      qbo = await getQboClient(customerId);
    } catch (e) {
      return res.status(412).json({ error: "QBO not ready", details: e.message });
    }

    // Map quote → QBO invoice payload. Risk-1 guard lives inside the mapper.
    let mapped;
    try {
      mapped = mapQuoteToQboInvoice(quote, {
        customerRefValue: customer_ref_value || "1", // P02 will resolve from qbo_customers cache
      });
    } catch (e) {
      if (e instanceof QuoteMappingError) {
        return res.status(422).json({ error: "Quote mapping failed", code: e.code, details: e.message });
      }
      throw e;
    }

    let qboResp;
    try {
      qboResp = await qbo.post(`/company/${qbo.realmId}/invoice?minorversion=70`, mapped.payload);
    } catch (e) {
      // Log the error on the row + row-level status so the UI can surface "retry".
      await admin
        .from("quotes")
        .update({ qbo_last_error: String(e.message).slice(0, 500), updated_at: new Date().toISOString() })
        .eq("id", quote.id);
      return res.status(502).json({ error: "QBO push failed", details: e.message, qbo_body: e.body });
    }

    const qboInvoice = qboResp?.Invoice;
    if (!qboInvoice?.Id) {
      return res.status(502).json({ error: "QBO returned no Invoice.Id", raw: qboResp });
    }

    // Verify cent-level parity (safety net for P01 before P02 real tax-code mapping lands).
    const totalOk = Math.abs(Number(qboInvoice.TotalAmt || 0) - mapped.checksum.total) < 0.02;

    await admin
      .from("quotes")
      .update({
        qbo_invoice_id: String(qboInvoice.Id),
        qbo_synced_at: new Date().toISOString(),
        qbo_last_error: totalOk ? null : `Checksum mismatch: QBO=${qboInvoice.TotalAmt} BW=${mapped.checksum.total}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quote.id);

    return res.status(200).json({
      success: true,
      qbo_invoice_id: String(qboInvoice.Id),
      qbo_doc_number: qboInvoice.DocNumber || null,
      qbo_total: qboInvoice.TotalAmt,
      bw_total: mapped.checksum.total,
      checksum_match: totalOk,
    });
  } catch (err) {
    console.error("[qbo-push-invoice] Unhandled error:", err);
    return res.status(500).json({ error: "Internal error", details: "See server logs" });
  }
}
