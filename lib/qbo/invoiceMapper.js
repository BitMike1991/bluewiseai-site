// lib/qbo/invoiceMapper.js
// Typed adapter: BW `quotes` row → QBO Canada Invoice payload.
//
// CRITICAL: the source columns are `tax_gst` and `tax_qst` (money totals).
// They are NOT `tps` / `tvq` — those names live on `expenses` and `payments`.
// Reading `quote.tps` returns `undefined` and silently ships a $0-tax
// invoice. This adapter only accepts a `quotes` row and explicitly reads
// `tax_gst` + `tax_qst`. See WAVE1-BASELINE.md risk #1.

const QBO_ROUND = (n) => Math.round(Number(n || 0) * 100) / 100;

export class QuoteMappingError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/**
 * @param {object} quote — row from public.quotes (must include line_items, subtotal, tax_gst, tax_qst, total_ttc, customer_id, quote_number)
 * @param {object} opts  — { customerRefValue: string (QBO Customer.Id), taxCodeRef?: string }
 * @returns {{ payload: object, checksum: { subtotal:number, gst:number, qst:number, total:number } }}
 */
export function mapQuoteToQboInvoice(quote, opts = {}) {
  if (!quote) throw new QuoteMappingError("NO_QUOTE", "quote row required");
  if (!opts.customerRefValue) {
    throw new QuoteMappingError("NO_CUSTOMER_REF", "QBO CustomerRef.value required");
  }

  const lineItems = Array.isArray(quote.line_items) ? quote.line_items : [];
  if (lineItems.length === 0) {
    throw new QuoteMappingError("NO_LINES", `quote ${quote.id} has no line_items`);
  }

  const subtotal = Number(quote.subtotal ?? 0);
  const taxGst   = Number(quote.tax_gst  ?? 0);
  const taxQst   = Number(quote.tax_qst  ?? 0);
  const totalTtc = Number(quote.total_ttc ?? (subtotal + taxGst + taxQst));

  // Protect against the risk-1 footgun: if somebody passed an expense row by
  // mistake, tax_gst/tax_qst will be undefined. Refuse to map rather than
  // push a $0-tax invoice.
  if (quote.tax_gst == null || quote.tax_qst == null) {
    throw new QuoteMappingError(
      "WRONG_SOURCE_TABLE",
      `quote row missing tax_gst/tax_qst (columns live on 'quotes', not 'expenses'). Got keys: ${Object.keys(quote).join(",")}`
    );
  }

  // Build raw per-line totals first, then prorata any overhead/gas that's
  // baked into `quote.subtotal` but not broken out in `line_items`. Rule
  // validated live during P01 verify: PUR quote.subtotal = 8071, sum of
  // visible lines = 7771, delta = $300 ($200 overhead + $100 gas). Rather
  // than synthesize a "Frais généraux" line (auditor-friendly but adds a
  // client-visible row), we spread the delta across lines in proportion
  // to each line's raw amount — matches how the BW quote PDF already
  // presents pricing to the client (Mikael 2026-04-21).
  const rawLines = lineItems.map((li) => {
    const qty = Number(li.qty ?? li.quantity ?? 1) || 1;
    const amount = QBO_ROUND(Number(li.total ?? li.line_total ?? (qty * Number(li.unit_price ?? 0))));
    return {
      qty,
      amount,
      unit_price: Number(li.unit_price ?? (amount / qty)),
      description: String(li.description || li.type || "Item").slice(0, 4000),
    };
  });
  const sumRaw = rawLines.reduce((s, l) => s + l.amount, 0);
  const delta  = QBO_ROUND(subtotal - sumRaw);
  const scale  = sumRaw > 0 && Math.abs(delta) > 0.01 ? subtotal / sumRaw : 1;

  // Note: we intentionally OMIT TaxCodeRef when no mapping is supplied — QBO
  // will then use the customer's default tax profile (P02 wires per-line refs).
  const Lines = rawLines.map((l, idx) => {
    const scaledAmount = QBO_ROUND(l.amount * scale);
    const detail = {
      Qty: l.qty,
      UnitPrice: QBO_ROUND(scaledAmount / l.qty),
    };
    if (opts.taxCodeRef) detail.TaxCodeRef = { value: String(opts.taxCodeRef) };
    return {
      Id: String(idx + 1),
      LineNum: idx + 1,
      DetailType: "SalesItemLineDetail",
      Amount: scaledAmount,
      Description: l.description,
      SalesItemLineDetail: detail,
    };
  });
  // Repair last-cent drift from rounding so sum(Lines) === subtotal exactly.
  if (scale !== 1 && Lines.length > 0) {
    const sumScaled = Lines.reduce((s, L) => s + L.Amount, 0);
    const drift = QBO_ROUND(subtotal - sumScaled);
    if (Math.abs(drift) >= 0.01) {
      const last = Lines[Lines.length - 1];
      last.Amount = QBO_ROUND(last.Amount + drift);
      last.SalesItemLineDetail.UnitPrice = QBO_ROUND(last.Amount / last.SalesItemLineDetail.Qty);
    }
  }

  // TxnTaxDetail — only include when the caller passed REAL TaxRateRef ids
  // (i.e. P02 mapping already resolved them). Hardcoded "TPS"/"TVQ" placeholders
  // do NOT exist in any realm by default and trigger "Invalid Number" on push.
  // For P01 round-trip tests, we omit TxnTaxDetail and let QBO compute taxes
  // from the customer's default profile (or zero for non-taxable customers).
  const includeTxnTax = opts.gstRateRef && opts.qstRateRef && (taxGst > 0 || taxQst > 0);
  const TxnTaxDetail = includeTxnTax ? {
    TotalTax: QBO_ROUND(taxGst + taxQst),
    TaxLine: [
      taxGst > 0 && {
        DetailType: "TaxLineDetail",
        Amount: QBO_ROUND(taxGst),
        TaxLineDetail: {
          TaxRateRef: { value: String(opts.gstRateRef) },
          PercentBased: true,
          TaxPercent: 5,
          NetAmountTaxable: QBO_ROUND(subtotal),
        },
      },
      taxQst > 0 && {
        DetailType: "TaxLineDetail",
        Amount: QBO_ROUND(taxQst),
        TaxLineDetail: {
          TaxRateRef: { value: String(opts.qstRateRef) },
          PercentBased: true,
          TaxPercent: 9.975,
          NetAmountTaxable: QBO_ROUND(subtotal),
        },
      },
    ].filter(Boolean),
  } : null;

  const payload = {
    CustomerRef: { value: String(opts.customerRefValue) },
    DocNumber: quote.quote_number ? String(quote.quote_number).slice(0, 21) : undefined,
    PrivateNote: `BW quote id=${quote.id}`,
    Line: Lines,
  };
  if (TxnTaxDetail) payload.TxnTaxDetail = TxnTaxDetail;

  return {
    payload,
    checksum: {
      subtotal: QBO_ROUND(subtotal),
      gst: QBO_ROUND(taxGst),
      qst: QBO_ROUND(taxQst),
      total: QBO_ROUND(totalTtc),
    },
  };
}
