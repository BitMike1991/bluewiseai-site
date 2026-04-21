# BlueWise Command-Center Chain
*Author: JARVIS (prompt-architect) · 2026-04-21 · owner: Mikaël*

## Vision

Transform the BW CRM from "devis + jobs tracker" into the **full command center**: lead → quote → signed contract → paid → bookkeeping closed to the penny, with zero manual accounting entry. Benchmark = ServiceTitan × JobNimbus × Jobber, with one unfair advantage: **Québec-native + AI-native**.

## Scope (what this chain delivers)

- **Wave 1 (P0 — ship ≤30 days)** — QBO Canada sync, tax code mapping, bill push, Flinks bank feed + auto-match, chart-of-accounts mapping, client portal, offline mobile, GPS photos, auto review request
- **Wave 2 (P1 — 60-90 days)** — Nethris payroll, WIP live, change orders, T5018, aerial measurement, dispatch board
- **Wave 3 (Moat)** — TPS/TVQ return builder, 10% holdback, CNESST auto, RBQ/APCHQ on docs, AI photo report

## Non-goals

- No re-architecture of the existing `/q/[token]` pipeline — extend, don't replace.
- No new tenants onboarded via this chain — PUR + BW are the test beds.
- No accounting rules invented — always map to **existing QBO Canada / Revenu Québec / CRA** schemas.
- No "maybe we'll need it" tables — every column justifies itself against a P0/P1/P2 item.

## SOPs loaded (all prompts inherit)

- `sops/prompt-architect.md` (this SOP)
- `sops/credentials.md` (tokens + keys)
- `sops/hub-catalog-source-of-truth.md`
- `sops/multi-tenant-isolation.md`
- `sops/audit-master.md` (Phase 0.5 walkthrough)
- Project memory: `memory/project_pur_divisions_architecture.md`, `memory/project_bluewise_vision_2026.md`

Every executor prompt below opens with: *"Read these SOPs before touching code."*

## Baseline-locked facts (from P00 — DO NOT re-derive)

Read `WAVE1-BASELINE.md` before any prompt. Three facts every downstream prompt must obey:

- **TAX COLUMN NAMES DIVERGE.** `quotes.tax_gst` + `quotes.tax_qst` (money totals) vs. `expenses.tps` + `expenses.tvq` + `payments.tps` + `payments.tvq`. A developer referencing `row.tps` on a `quotes` row gets `undefined` → silent $0-tax invoice push. Every Wave-1 QBO mapper MUST name the source table in code + use the right column per table. Add a unit-test fixture for a $1000 PUR quote that asserts `quote.tax_gst + quote.tax_qst == qbo.TxnTaxDetail.TotalTax`.
- **`payments` TABLE IS EMPTY IN BOTH TENANTS.** P04 Flinks matching cannot smoke-test against history. P04 verification path is forward-only (seed one synthetic payment + match the next live Interac), OR run the 6-rescue payments backfill explicitly before P04 starts. Decide in P04 prompt, do not silently fail the verify step.
- **`customers.quote_config` IS NULL-CAPABLE.** P00 seeded a scaffold for cid=1 (`quote`/`branding`/`contract`/`promotions`/`review_request`/`payment_schedule` keys all present but empty). Every `quote_config.*` consumer MUST optional-chain (`?.`) and have a safe default. Never assume nested keys exist.

## CoVe Tier 1.5 — Pre-merge checklist for every Wave-1 prompt

- [ ] Read `WAVE1-BASELINE.md` and confirm the 3 facts above still hold.
- [ ] Every new table has RLS ENABLE + at least one CREATE POLICY in the **same migration** (feedback_rls_enabled_zero_policies_traps).
- [ ] Every `PLPGSQL` function has `SET search_path = public`.
- [ ] Every new `customer_id`-bearing table has a partial index on `customer_id`.
- [ ] `mcp__supabase__get_advisors` is run after migration; new warnings get resolved in the same PR.
- [ ] Every new `/api/*` route goes through `getAuthContext` and filters by `customerId`.

---

## P00 — Bootstrap + vision lock

<context>Before any QBO or portal work, confirm the platform's current accounting shape, the divisions wiring, and PUR's pending live data. One wrong assumption here cascades across 19 commits.</context>

<task>
(1) Read `/root/bluewiseai-site/CLAUDE.md` + the 3 most recent sessions in `/root/claude-activity-logs/STATE.md` (S163-S165).
(2) Query live Supabase: count rows in `jobs`, `quotes`, `expenses`, `payments`, `bons_de_commande` for customer_id=9 and customer_id=1; list distinct `expenses.category` values; dump `customers.quote_config` structure.
(3) Verify the 3 division rows + division_id columns still hold as of this branch.
(4) Write `WAVE1-BASELINE.md` at repo root with: row counts, missing columns vs. Wave 1 plan, and 3 risks you flag before P01 starts.
</task>

<constraints>
- NEVER mutate data in this prompt — read-only.
- NEVER guess tenant-specific fields; query live.
- NEVER write into a table that doesn't exist yet (those are for P01+).
</constraints>

<thinking_required>Before writing WAVE1-BASELINE.md, list the 5 assumptions you're about to make and mark each as "verified live" or "assumption pending".</thinking_required>

<output_format>
<report>
  <row_counts>{ table → cid=1, cid=9 }</row_counts>
  <existing_columns>list columns on jobs/quotes/expenses already usable by QBO sync</existing_columns>
  <risks>3 items, ranked</risks>
  <ready_for_p01>true|false + why</ready_for_p01>
</report>
</output_format>

<verification>Re-run the 4 counts; they must not differ between your opening and closing of the prompt. If diff → log it in `risks`.</verification>

---

## Wave 1 — P0 Survival (10 prompts)

### P01 — QBO Canada OAuth + invoice push infra

<context>85% of QC accountants work in QuickBooks Online Canada. Without 2-way sync BW cannot close Enterprise. QBO uses OAuth2 PKCE with refresh tokens; we already have OAuth patterns for Gmail and GA4 — mirror them.</context>

<task>
(1) Create migration: `accounting_connections` table (customer_id, provider='qbo', realm_id, access_token_encrypted, refresh_token_encrypted, expires_at, scopes, connected_at, disconnected_at). Reuse `lib/tokenEncryption.js`.
(2) Add `qbo_invoice_id`, `qbo_synced_at` columns to `quotes` table (nullable).
(3) Build `/api/qbo/auth/start` + `/api/qbo/auth/callback` — OAuth2 dance, store tokens.
(4) Build `lib/qbo/client.js` with `getQboClient(customerId)` that auto-refreshes expired tokens.
(5) Build `/api/qbo/push-invoice` endpoint: POST { quote_id } → maps BW quote → QBO Invoice, stores `qbo_invoice_id` back.
(6) No UI this prompt — just the plumbing + a curl smoke-test script.
</task>

<constraints>
- NEVER store QBO tokens in plaintext — encrypt via `lib/tokenEncryption.js` like Gmail tokens.
- NEVER call QBO without refresh check — tokens expire every hour.
- NEVER push an invoice whose `customer_id` doesn't match the logged-in user's session tenant.
- NEVER ship the push-invoice mapper without referencing the exact source column names — `quotes.subtotal`, `quotes.tax_gst`, `quotes.tax_qst`, `quotes.total_ttc`, `quotes.line_items` (jsonb). Use a typed adapter; never a generic `row.tps` style lookup.
- NEVER run OAuth unless `QBO_CLIENT_ID`, `QBO_CLIENT_SECRET`, `QBO_REDIRECT_URI`, `QBO_ENVIRONMENT` env vars are present on Vercel + local `.env.local`. If any is missing, `/api/qbo/auth/start` must return a structured 500 with the missing var names (never silent).
</constraints>

<thinking_required>Before coding, trace the token refresh path on one diagram. If refresh fails, does `getQboClient` throw or retry silently? Decide + document.</thinking_required>

<output_format>
<delivery>
  <migration>file path</migration>
  <endpoints>list paths</endpoints>
  <smoke>curl command + expected response</smoke>
  <followups>what P02 needs from this</followups>
</delivery>
</output_format>

<verification>Run OAuth end-to-end against QBO sandbox using the Intuit dev account. Confirm `accounting_connections` row exists + tokens round-trip via decrypt.</verification>

---

### P02 — Tax code mapping (TPS/TVQ → QBO Canada)

<context>QBO Canada rejects invoices without valid TaxCodeRef. TPS=5%, TVQ=9.975% are separate line codes. A single mis-mapped code = rejected sync + silent drift from the books.</context>

<task>
(1) Create `qbo_tax_mappings` table (customer_id, bw_tax_type `tps|tvq|both|exempt`, qbo_tax_code_id, qbo_tax_code_name).
(2) Seed defaults for PUR (cid=9): TPS→QBO code "TPS", TVQ→QBO code "TVQ", both→"TPS/TVQ" (the combined QBO code).
(3) In `/api/qbo/push-invoice`, for each line item compute: qty, unit amount, tax_code_ref from mapping; set QBO Invoice `TxnTaxDetail.TaxLine[]` so net + taxes match BW exactly to the cent.
(4) Add a `/api/settings/qbo/taxes` endpoint to list the tenant's QBO tax codes (for admin UI in a later prompt).
</task>

<constraints>
- NEVER round totals; pass numbers at 2 decimals only when QBO requires, else keep precision.
- NEVER hardcode tax codes — always go through `qbo_tax_mappings`.
- NEVER sync an invoice whose mapping is missing — block with a clear error.
- NEVER reference `quote.tps` / `quote.tvq` — those columns DO NOT EXIST on `quotes`. Use `quote.tax_gst` + `quote.tax_qst`. Referencing `.tps` returns `undefined` and silently ships a $0-tax invoice. (Risk 1 from WAVE1-BASELINE.md.)
- NEVER combine `quotes` and `expenses` in a single mapper without an adapter — their tax column names diverge (`tax_gst`/`tax_qst` vs `tps`/`tvq`).
- NEVER ship P02 without closing the **PUR overhead gap** found during P01 verify: `quote.subtotal` bakes in $200 overhead + $100 gas (`pricing_config.overhead_pct` + gas flat), but `quote.line_items` does NOT. Sum(line.Amount) = 7771, subtotal = 8071. QBO's TotalAmt = sum of lines. P02 mapper MUST synthesize a "Frais généraux" line equal to `subtotal - sum(line_items)` when the gap is > $0.01, or checksum will fail forever. Verified live on quote id=64 → QBO Invoice 145 (2026-04-21).
- NEVER assume "Custom Transaction Numbers" is enabled — **verified accepted** on PUR sandbox realm 9341456918724825 (DocNumber "PUR-365422" landed). P02 should still check `Preferences` once before trusting; fall back to omitting `DocNumber` if preference returns false.
</constraints>

<thinking_required>Step through one PUR invoice ($1000 HT + 5% TPS + 9.975% TVQ) end-to-end. Write the exact QBO payload. Verify BW total_ttc == QBO TotalAmt to the cent. Then do the same for a PUR expense ($1000 HT + tps + tvq) and confirm the mapper reads `expenses.tps` — not `expenses.tax_gst`.</thinking_required>

<output_format><delivery><mapping_proof>QBO payload for the $1000 example</mapping_proof></delivery></output_format>

<verification>Push one real PUR quote to QBO sandbox; query the invoice back; confirm TxnTaxDetail.TotalTax = BW tps + tvq.</verification>

---

### P03 — Expenses → QBO Bills + vendor auto-match

<context>Expenses must land in QBO as Bills (paid or unpaid), not plain "Cash Expenditure" — otherwise bank reconciliation breaks. Vendor must exist in QBO before the bill.</context>

<task>
(1) Add `qbo_vendor_id` on `expenses` + a `qbo_vendors_cache` table (customer_id, vendor_name_normalized, qbo_vendor_id).
(2) `/api/qbo/push-expense` endpoint: find-or-create QBO Vendor (fuzzy on name), then POST QBO Bill with line items, TaxCodeRef, AccountRef (GL), DueDate, PaymentDate.
(3) If `expenses.paid_at` is set → also create `BillPayment` row in QBO.
(4) Tie attachment: `receipt_url` → QBO Attachable (multipart/form-data POST).
(5) Call it automatically in `/api/expenses/smart-create` after insert (non-blocking, log failures to `job_events`).
</task>

<constraints>
- NEVER duplicate a vendor — always check cache first; fuzzy match strips punctuation + lowercases.
- NEVER push a Bill without an AccountRef — block with "chart-of-accounts mapping missing" (P05 unlocks this).
- NEVER fail the user-facing expense create if QBO push errors — queue retry instead.
</constraints>

<thinking_required>How do you distinguish "Home Depot 7012" from "Home Depot Sherbrooke" — same vendor or two? Decide the normalization rule and document.</thinking_required>

<output_format><delivery><vendor_match_rule>1 paragraph</vendor_match_rule><retry_queue>how failures are retried</retry_queue></delivery></output_format>

<verification>Smart-create an expense; verify QBO Bill appears + receipt photo visible on QBO Attachable.</verification>

---

### P04 — Flinks bank feed + Interac auto-match

<context>Payments arrive as bank transactions (Interac, cheques, cards). Without automated match, Jérémy reconciles by hand. Flinks is the Canadian open-banking aggregator with deep Desjardins coverage — critical for QC contractors.</context>

<task>
(1) Create `bank_connections` (customer_id, provider='flinks', flinks_login_id, institution, account_masked, connected_at, last_synced_at, disconnected_at).
(2) Create `bank_transactions` (customer_id, bank_connection_id, amount, date, description, raw_payload jsonb, matched_payment_id, matched_at).
(3) `/api/flinks/link` — returns Flinks widget URL; `/api/flinks/callback` stores login_id.
(4) `/api/flinks/sync/[connectionId]` — pulls last 30 days, upserts transactions, runs match: fuzzy on `amount ± 2 days window` vs. `payments` table; confidence ≥ 0.9 → auto-link, else flag for manual.
(5) Surface matched/unmatched list at `/platform/finances/bank-match` (owner/admin only).
</task>

<constraints>
- NEVER expose Flinks tokens to the client.
- NEVER auto-match below 0.9 confidence — human review for edge cases.
- NEVER match across divisions without owner/admin role.
- NEVER run the smoke-test verification against an empty `payments` table (Risk 2 from WAVE1-BASELINE.md). As of P00, `payments` had 0 rows for cid=1 and cid=9. Decide BEFORE coding: (a) backfill the 6 PUR rescue payments (see `scripts/rescue-jeremy-6-quotes.mjs`) first, OR (b) seed one synthetic payment row and scope the verify step to that synthetic id. Document the decision at the top of `/api/flinks/sync`.
- NEVER delete or re-key historical `payments` rows once backfilled — QBO reconciliation chains break.
</constraints>

<thinking_required>List the 4 reconciliation edge cases (double deposit, split transfer, reversed Interac, fee deduction). Decide matching behavior for each. Also: state in writing which payments-backfill path you chose (a) or (b), and why.</thinking_required>

<output_format><delivery><matched_example>1 real PUR pattern</matched_example><edge_cases>4 items resolved</edge_cases></delivery></output_format>

<verification>Connect PUR sandbox bank; pull transactions; verify one Interac receipt auto-matches to the last PUR contract payment.</verification>

---

### P05 — Chart-of-accounts mapping per tenant

<context>Expenses need a QBO GL account to land correctly. Today `expenses.category` is freeform-ish — map each category to a QBO AccountRef per tenant.</context>

<task>
(1) Add `qbo_gl_mappings` (customer_id, bw_category, qbo_account_id, qbo_account_name, active).
(2) Seed PUR defaults: materiel_fournisseur → 5010, sous_traitance → 5020, gaz_carburant → 5200, etc. Pull actual PUR QBO chart after OAuth.
(3) Build a settings page `/platform/settings/qbo` — lists categories, dropdown of QBO accounts, save mappings.
(4) P03's "chart-of-accounts missing" error goes away when mapping exists.
</task>

<constraints>
- NEVER assume a shared chart across tenants — strict per customer_id.
- NEVER let a scoped user edit mappings — owner/admin only.
- NEVER delete a mapping that has past expenses pointing to it — deactivate instead.
</constraints>

<output_format><delivery><defaults>PUR seed CSV</defaults><ui_path>/platform/settings/qbo</ui_path></delivery></output_format>

<verification>Open the settings page as PUR owner; change one mapping; push a new expense; confirm QBO Bill uses the new account.</verification>

---

### P06 — Client self-serve portal (extend `/q/[token]`)

<context>Today `/q/[token]` is single-quote read-only. Pros (Jobber Client Hub, ServiceTitan) expose a full client dashboard: all their quotes, contracts, invoices, payments, docs, in one URL. We extend, we don't rebuild.</context>

<task>
(1) Add `client_portal_sessions` (token, customer_id, lead_id, profile_id, scope='single_quote|full_hub', created_at, expires_at, last_seen_at).
(2) New route `/c/[token]` — full client hub: all their quotes, contracts (signed + pending), invoices, payment history, doc downloads, one contact button.
(3) Token gate: last-4 of phone (same pattern as `/d/[token]`).
(4) When we send a contract-signed email, include a "Mon espace client" link to `/c/[token]` alongside the quote link.
(5) Log every client interaction (view, download, pay click) into `client_portal_events`.
</task>

<constraints>
- NEVER expose internal cost/margin/supplier data on `/c/[token]`.
- NEVER show other leads' data (scope strictly to `profile_id` or `lead_id`).
- NEVER skip rate limiting on `/c/[token]` (5 req/s per token).
</constraints>

<thinking_required>Draw the data access matrix: what a profile_id sees vs. what a lead_id sees vs. what a one-off quote token sees. Lock the 3 scopes before writing any RLS.</thinking_required>

<output_format><delivery><scopes>3 access levels + what each sees</scopes><rls>SQL policy sketch</rls></delivery></output_format>

<verification>Send a PUR contract to yourself; open the client portal link; confirm you see only that lead's docs + nothing else.</verification>

---

### P07 — Offline mobile mode (crew in basements)

<context>Jérémy and Charles work in rural QC + basements. Jobber, ServiceTitan, AccuLynx all shipped offline mode in 2025. Without it the field crew can't update status or upload photos.</context>

<task>
(1) Register a service worker (scope `/platform/jobs`, `/platform/expenses`, `/hub`) with `workbox-window` — runtime-cached shell + API stale-while-revalidate for read routes.
(2) Outbox pattern: any POST that fails network-side is queued in IndexedDB; background-sync replays on reconnect.
(3) Photo queue: captured photos are stored in IndexedDB with a local UUID + retry-upload loop.
(4) Status bar: always-visible indicator (green/amber/red) for connectivity + queued items.
(5) Compatible with existing `QuickExpenseCapture` + `MediaPicker` — those become offline-aware.
</task>

<constraints>
- NEVER cache `/api/auth/*`, `/api/qbo/*`, or any mutation route's response.
- NEVER replay a queued POST older than 24 h without user confirmation.
- NEVER expose queued PII past a logout.
</constraints>

<thinking_required>Which 3 routes MUST work offline (no negotiation), which 5 can break gracefully, which 10 are online-only? List by tier.</thinking_required>

<output_format><delivery><tiers>3/5/10 routes classified</tiers><iOS_safari_quirks>safari-specific blockers</iOS_safari_quirks></delivery></output_format>

<verification>Airplane mode on iPhone → snap 3 expense photos → reconnect → confirm all 3 land in QBO with receipt attached.</verification>

---

### P08 — GPS EXIF on photos + job map view

<context>Every crew photo has GPS in EXIF; we just don't surface it. CompanyCam built a $100M business on this alone. Quick win.</context>

<task>
(1) Client-side: read EXIF lat/lng via `exifr` before upload, attach as form fields in `/api/media/upload`.
(2) Server-side: store `gps_lat`, `gps_lng`, `captured_at` on the upload record + copy to expenses/job_photos.
(3) Job detail page: add a small map (Leaflet + OpenStreetMap tiles, no paid key) showing every photo pin clustered by day.
(4) Fallback gracefully: if EXIF missing (library crop, screenshot), just skip — no GPS is fine.
</task>

<constraints>
- NEVER upload GPS to the client portal (`/c/[token]`) unless explicitly opted in.
- NEVER use Google Maps (billing bait) — Leaflet + OSM stays free.
- NEVER store GPS on the receipts bucket photos (privacy) — only job/client photos.
</constraints>

<output_format><delivery><lib>exifr config</lib><schema_delta>columns added</schema_delta></delivery></output_format>

<verification>Upload a phone photo from a known address; confirm lat/lng within 50 m + pin appears on the job map.</verification>

---

### P09 — Auto review request (post-job)

<context>Post-job Google review requests are the #1 trust signal for QC trades SMBs. Trivial to build, shows up in every competitor.</context>

<task>
(1) When a job's status flips to `completed` or `paid_in_full`: schedule (via existing n8n or `/api/jobs/[id]/events` cron) a delay of 24 h, then send bilingual SMS + email with a Google review link.
(2) Template stored in `customers.quote_config.review_request` (bilingual).
(3) Tenant settings page: edit template, toggle on/off, set delay (default 24 h).
(4) Track `review_sent_at`, `review_clicked_at` in `job_events`.
</task>

<constraints>
- NEVER send review requests on Sundays or outside 9-20h (Mikael's sms_timing rule).
- NEVER resend on the same job (idempotent on `review_sent_at`).
- NEVER send if `leads.do_not_contact = true`.
- NEVER assume `customers.quote_config.review_request` exists without an optional-chain guard — for the BW tenant it may be a minimal scaffold with `enabled:false` (Risk 3 from WAVE1-BASELINE.md). If the object is missing or `enabled:false`, skip silently — do not throw.
- NEVER send a Google review link for the BW tenant unless `quote_config.review_request.google_place_id` is set — BW has no physical location.
</constraints>

<output_format><delivery><template>bilingual SMS body</template><trigger>exact status transition</trigger></delivery></output_format>

<verification>Flip a PUR test job to `paid_in_full`; confirm SMS queued 24 h later; confirm clicking logs `review_clicked_at`.</verification>

---

## Wave 2 — Differentiators (P10 – P14, seeds)

### P10 — Nethris payroll (QC-native, CNESST/RL-1)

Integrate Nethris (https://nethris.com/en/integrations) — push `time_entries` as timesheets, pull payroll runs back as `payroll_events`. Map CNESST rate per employee. Generate RL-1 slips at year-end. **Constraints:** never duplicate a pay period; always store Nethris `run_id`; block Wagepoint fallback for QC (no RL-1 native).

### P11 — Job-costing WIP live

Add materialized view `job_costs` = sum(expenses) + sum(time_entries × rate) + sum(BC bills) vs. quote subtotal. Surface `margin_actual` + `margin_delta` on `/platform/jobs/[id]` header. Red if overrun > 10%.

### P12 — Change order flow

Client-facing `/c/[token]/change-order/[id]` — delta line items, new total, e-sign, triggers new invoice version. Integrates with QBO via credit memo + new invoice pattern.

### P13 — T5018 subcontractor accumulator

Track payments to vendors flagged `is_subcontractor=true` across calendar year; export T5018 XML per CRA schema; surface progress widget in `/platform/finances`.

### P14 — Aerial measurement (EagleView/Hover) for toiture

Integrate EagleView API (or Hover): click address → auto-fill surface/pitch/waste% in toiture calc. Caches measurement per job for re-use.

---

## Wave 3 — QC Moat (P15 – P19, seeds)

### P15 — TPS/TVQ quarterly return builder

Aggregate `invoices.tps + tvq` (collected) − `expenses.tps + tvq` (ITC) per period; export Revenu Québec VD-358 draft + CRA 34-line GST return. No competitor offers this.

### P16 — Holdback 10% (Loi sur le bâtiment)

Add `holdback_pct` on `jobs` + `holdback_released_at`. Reserve 10% of contracts > $20k as liability, release after 45 days. Expose on job P&L.

### P17 — CNESST rate automation

Per-employee rate card + auto-accrual on project P&L. Export ready for Revenu Québec filing.

### P18 — RBQ/APCHQ numbers auto on docs

Pull from `customers.quote_config.licenses`; inject into quote/contract/invoice templates; legal requirement on QC B2C contracts.

### P19 — AI photo report generator

Select N photos from a job → gpt-4o-mini vision → structured inspection/completion report (bilingual); attach to job + email as PDF. CompanyCam-style but built in, no third-party fee.

---

## P20 — Closure: CoVe Tier 2 + smoke + memory

<task>
After each batch (Wave 1, Wave 2, Wave 3):
(1) Run audit-master.md Phase 0.5 live walkthrough on PUR prod.
(2) Write `WAVE<N>-SMOKE.md` with: commits landed, DB deltas, known issues, advisors clean.
(3) Log a `jarvis-session-<id>-command-center-waveN` entry to memory_raw + trigger embeddings.
(4) Update `STATE.md` + `MEMORY.md` index.
</task>

<verification>Advisors clean. Smoke sheet green. State + memory updated. Commit atomic.</verification>

---

## CoVe Tier 1 Checklist (run before executing)

- [ ] Every prompt has min 3 NEVER constraints
- [ ] Every prompt has `<thinking_required>` if non-trivial
- [ ] Every prompt has `<output_format>` XML schema
- [ ] Every prompt has `<verification>` with concrete check
- [ ] Credentials referenced via `sops/credentials.md`
- [ ] SOPs listed at top of chain inherit to every prompt
- [ ] No prompt over 200 words of instruction body
- [ ] Chain is ordered so P_N only depends on P_{<N} outputs (no back-reference)
- [ ] Non-goals explicit — no creep allowed
- [ ] Wave 2/3 are seeds, not full prompts (will be expanded in next session)

## Execution rule

Execute P00 **alone first**. Wait for WAVE1-BASELINE.md confirmation before P01. P01 → P09 can run **sequentially** (P01 before P02-P05; P06 independent; P07-P09 independent after P01). P20 runs after each wave.
