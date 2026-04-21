# WAVE 1 — Baseline (P00 output)
*Generated: 2026-04-21 · Author: JARVIS · read-only pass on live Supabase `xwhqkgsurssixjadzklb`*

## 5 assumptions I'm locking in (verified live unless marked)

1. **PUR (cid=9) is the real Wave-1 test bed** — verified live (7 jobs / 7 quotes / 3 BC / 2 divisions seeded / full `quote_config`).
2. **BW (cid=1) is the dogfood tenant with expenses only** — verified live (210 expenses, 0 payments, 0 BC, 2 test quotes / 4 test jobs; `quote_config` is NULL).
3. **S164 divisions architecture still holds on this branch** — verified live (`divisions` table + `division_id` FK on leads/jobs/quotes/bons_de_commande/customer_users).
4. **Existing token-encryption helper fits QBO OAuth shape** — verified (`lib/tokenEncryption.js` exists; P01 can mirror Gmail OAuth pattern without new crypto work).
5. **Historical PUR payments exist only as paper/Interac receipts, not rows** — verified (`payments` = 0 for cid=9); P04 Flinks match is forward-only, no backfill expected.

## Row counts (cid=1 / cid=9)

| Table | cid=1 (BW) | cid=9 (PUR) |
|---|---:|---:|
| jobs | 4 | 7 |
| quotes | 2 | 7 |
| expenses | 210 | 0 |
| payments | 0 | 0 |
| bons_de_commande | 0 | 3 |

Closing re-run = identical to opening. **No drift.**

## Distinct `expenses.category` (cid=1 + cid=9)

| Category | Rows |
|---|---:|
| ai_tools | 165 |
| saas_subscription | 13 |
| hosting | 11 |
| telecom | 10 |
| other | 5 |
| advertising | 4 |
| software | 2 |

**Implication:** BW P&L is 99% SaaS — P05 GL mapping for cid=1 only needs ~7 categories. PUR mappings (materiel_fournisseur, sous_traitance, gaz_carburant, etc.) have **zero live rows yet** — P03 smoke test will write the first ones.

## Existing columns already usable by QBO sync (Wave 1 audit)

**quotes** (ready for P01 QBO Invoice mapping):
`id, job_id, customer_id, quote_number, version, line_items (jsonb), subtotal, tax_gst, tax_qst, total_ttc, status, sent_at, project_ref, division_id`
⚠️ tax columns are `tax_gst`/`tax_qst` (NOT `tps`/`tvq` like `expenses`). **P02 must not confuse the two.**
**Missing for P01:** `qbo_invoice_id`, `qbo_synced_at` (P01 adds).

**expenses** (ready for P03 QBO Bill mapping):
`id, customer_id, job_id, category, vendor, vendor_location, invoice_number, subtotal, tps, tvq, total, payment_method, paid_by, paid_at, line_items (jsonb), receipt_url, meta, source, source_ref`
**Missing for P03/P05:** `qbo_vendor_id`, `qbo_bill_id`, GL/`qbo_account_id` mapping table.

**payments** (ready for P04 Flinks match):
`id, job_id, customer_id, payment_type, amount, subtotal, tps, tvq, currency, status, paid_at, stripe_payment_intent_id, stripe_payment_link_url, payment_method, confirmed_by, meta`
**Missing for P04:** `bank_connections`, `bank_transactions`, `matched_payment_id` (P04 creates).

**jobs** (ready for P09 review-trigger + P11 WIP):
`status, quote_amount, deposit_amount, deposit_paid_at, signed_at, completed_at, final_paid_at, review_requested_at, scheduled_start/end, progress_pct, division_id`
**No QBO columns needed directly on `jobs`** — the quote is the invoice source.

**bons_de_commande** (ready to feed P03 vendor extraction):
`supplier (text), item_refs (jsonb), status, sent_at, received_at, division_id`
**Missing:** `qbo_vendor_id`, `qbo_bill_id` (P03 writes back when a BC becomes a Bill).

**customers.quote_config** (PUR populated, BW NULL):
PUR config has full branding, warranties, payment_schedule (35/65), promotions, pricing_guide, hardcoded_pricing, email_signature. **BW is NULL** → P09 review-request template must guard.

## 3 Risks (ranked)

1. **HIGH — `quotes.tax_gst/tax_qst` ≠ `expenses.tps/tvq` naming mismatch.**
   P02 maps quote → QBO `TxnTaxDetail.TaxLine[]`; if the developer writes `row.tps` on a `quotes` row the value is `undefined` and the invoice silently ships with $0 tax. **Mitigation:** P02 prompt must explicitly reference column names and add a unit-test fixture that round-trips a $1000 PUR quote.

2. **HIGH — `payments` table has 0 rows in both tenants.**
   P04 verification asks "confirm one Interac receipt auto-matches to the last PUR contract payment" — there is no last PUR payment in the DB. **Mitigation:** either (a) backfill the 6 PUR rescue-client payments from `scripts/rescue-jeremy-6-quotes.mjs` context before P04 smoke, or (b) re-scope P04 verification to "seed one synthetic payment row + match it forward". Decide before P04 starts.

3. **MED — `customers.quote_config` is NULL for BW (cid=1).**
   P02 fallback tax codes, P09 review-request template, P18 RBQ/APCHQ on docs all read `quote_config`. Every consumer must `?.` chain or we crash for BW. **Mitigation:** in P01 add a migration-adjacent seed giving cid=1 a minimal `quote_config` scaffold (`{ quote: {}, branding: {}, contract: {} }`) so downstream prompts can assume the object exists.

## Ready for P01? **TRUE**

- ✅ `accounting_connections` table doesn't exist yet → no conflict.
- ✅ `quotes` has no `qbo_*` columns yet → nullable add is safe.
- ✅ `lib/tokenEncryption.js` exists → P01 mirrors the pattern.
- ✅ Division architecture stable → P01's `customer_id` scoping slots into the existing tenant_isolation RLS.
- ✅ PUR has 7 real quotes ready for smoke-test push to QBO sandbox once P01+P02 land.
- ⚠️ Resolve the 3 risks above in the **P01 + P02 prompts** before writing code — none block P00 closure.

---

*Next:* await confirmation, then execute P01 (QBO Canada OAuth + invoice push infra).
