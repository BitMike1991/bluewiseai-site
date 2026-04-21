// pages/api/qbo/push-invoice.js
// POST { quote_id } — pushes a BW quote to QBO as an Invoice.
// Stores QBO Invoice.Id back on quotes.qbo_invoice_id + qbo_synced_at.
// Tenant-scoped; owner/admin only.

import { getAuthContext, getSupabaseServerClient } from "../../../lib/supabaseServer";
import { getQboClient } from "../../../lib/qbo/client";
import { mapQuoteToQboInvoice, QuoteMappingError } from "../../../lib/qbo/invoiceMapper";
import { getTaxMappings } from "../../../lib/qbo/taxMappings";

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

    // Resolve a real CustomerRef. Until P02/P03 wire the qbo_customers cache,
    // we auto-pick the first customer in the realm so P01 round-trip works
    // against any sandbox without manual seeding.
    let resolvedCustomerRef = customer_ref_value;
    if (!resolvedCustomerRef) {
      try {
        const q = await qbo.get(
          `/company/${qbo.realmId}/query?minorversion=70&query=` +
          encodeURIComponent("select Id, DisplayName from Customer maxresults 1")
        );
        resolvedCustomerRef = q?.QueryResponse?.Customer?.[0]?.Id;
      } catch (e) {
        return res.status(502).json({ error: "QBO Customer lookup failed", details: e.message });
      }
      if (!resolvedCustomerRef) {
        return res.status(412).json({
          error: "No QBO Customer in this realm — create one in QBO first or pass customer_ref_value",
        });
      }
    }

    // P02 — resolve tenant tax mappings and require `both` (TPS+TVQ combined)
    // when the quote carries any tax. NEVER push a taxable invoice without a
    // mapping — block early so the books stay clean.
    const taxMappings = await getTaxMappings(customerId);
    const hasTax = Number(quote.tax_gst || 0) + Number(quote.tax_qst || 0) > 0;
    if (hasTax && !taxMappings.both?.id) {
      return res.status(412).json({
        error: "QBO tax mapping missing",
        details: "POST /api/qbo/taxes/auto-seed first, or set the 'both' (TPS+TVQ) mapping at /api/settings/qbo/taxes",
        bw_tax_gst: Number(quote.tax_gst),
        bw_tax_qst: Number(quote.tax_qst),
      });
    }

    // Map quote → QBO invoice payload. Risk-1 guard lives inside the mapper.
    let mapped;
    try {
      mapped = mapQuoteToQboInvoice(quote, {
        customerRefValue: resolvedCustomerRef,
        combinedTaxCodeId: taxMappings.both?.id || null,
        exemptTaxCodeId:   taxMappings.exempt?.id || null,
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

    // Verify cent-level parity. When taxes are omitted (P01 scope), compare
    // against `subtotal` (BW pre-tax); once P02 wires TxnTaxDetail, compare
    // against `total` (BW with taxes). QBO's TotalAmt = sum(Line.Amount) + TxnTax.
    const hasTxnTax = Boolean(mapped.payload.TxnTaxDetail);
    const target = hasTxnTax ? mapped.checksum.total : mapped.checksum.subtotal;
    const totalOk = Math.abs(Number(qboInvoice.TotalAmt || 0) - target) < 0.02;

    await admin
      .from("quotes")
      .update({
        qbo_invoice_id: String(qboInvoice.Id),
        qbo_synced_at: new Date().toISOString(),
        qbo_last_error: totalOk ? null : `Checksum mismatch: QBO=${qboInvoice.TotalAmt} BW_target=${target} (taxes ${hasTxnTax ? "included" : "omitted — P01 scope"})`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quote.id);

    return res.status(200).json({
      success: true,
      qbo_invoice_id: String(qboInvoice.Id),
      qbo_doc_number: qboInvoice.DocNumber || null,
      qbo_total: qboInvoice.TotalAmt,
      bw_subtotal: mapped.checksum.subtotal,
      bw_total: mapped.checksum.total,
      compared_against: hasTxnTax ? "total_ttc" : "subtotal",
      checksum_match: totalOk,
    });
  } catch (err) {
    console.error("[qbo-push-invoice] Unhandled error:", err);
    return res.status(500).json({ error: "Internal error", details: "See server logs" });
  }
}
