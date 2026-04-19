# CoVe Audit — Sessions 156-157 (bluewiseai-site @ main)

**Date:** 2026-04-19
**Scope:** 58 commits between `7de8be2` and `98b8e79` — 290 files touched.
**Methodology:** 3 parallel independent verification agents (security, math, routing) + self-conducted DB schema check. Each agent reasoned from source, no sharing of findings until consolidation.

---

## Executive summary

| Category | Count | Status |
|---|---|---|
| **P0 ship-blockers** | 0 (one initially-flagged bug downgraded after verification) | ✅ Clean |
| **P1 fix this week** | 8 → 5 remaining (3 fixed in this pass) | 🟡 Open |
| **P2 nice-to-have** | 9 | Backlog |
| **DB schema ↔ code alignment** | 100% | ✅ Verified |
| **Routes & imports** | 100% reachable | ✅ Verified |

**Fixed in this audit pass** (commits pending push):
- Agent-1 P1-1 — POST `/api/employees` no longer accepts `sin_encrypted` from client; raw ciphertext path closed, must send `sin_plain` → server-side `encryptSin()` with Luhn
- Agent-1 P1-5 — `/api/universal/devis/accept.js` job update now has defense-in-depth `.eq('customer_id', customerId)`
- Agent-2 P0-3 — `reverseCalcIfMissing` in taxes/report.js now derives subtotal as `TTC − TPS − TVQ`, eliminating $0.02-0.03 per-transaction drift
- Bonus — `/api/payments/index.js` now auto-splits tps/tvq at write time (was null-filled, forcing reverse-calc on every read)
- Orphan `pages/api/chat.js.bak` deleted

---

## 🔐 Security & multi-tenancy

### P0 — Ship-blockers
None. Cross-tenant data leaks, plaintext SIN exposure, unauthenticated writes: all verified clean.

### P1 — Fix this week
1. ~~**`POST /api/employees` accepts raw `sin_encrypted`**~~ ✅ **FIXED** — server now rejects `sin_encrypted` from body, requires `sin_plain` → `encryptSin()`.
2. **`/api/universal/contrat/create.js` dead auth branch** (lines 898-901, 922) — invalid `api_key` + missing `customer_id` returns 400 instead of 401. Low severity, leaks request-structure info. Consolidate auth before body validation.
3. **`/api/universal/leads/[id].js` master-key bypass** (lines 63-75) — master `UNIVERSAL_API_KEY` + no `Origin` header = `tenantFilter = null` (queries any tenant by ID). Intended for n8n S2S, but if master key ever leaks, full lead enumeration. **Add explicit `?customer_id=` requirement for master-key path, or rotate to per-tenant keys.**
4. **In-memory rate limits serverless-unsafe** — `lib/security.js` windows Map + `signAttempts` Map in `contrat/sign.js`. Each Lambda cold start = fresh Map. Attacker varying UA/region bypasses the 5-attempts/hour phone-gate. Cosmetic until migrated to Vercel KV / Upstash Redis. **Real concern**: the phone-gate brute-force protection is advertised as security, but isn't.
5. ~~**`/api/universal/devis/accept.js` job update lacks tenant filter** (line 163-166)~~ ✅ **FIXED** — added `.eq('customer_id', customerId)` defense-in-depth.
6. **`localhost` in prod CORS allowlist** (`lib/universal-api-auth.js:16-17`) — strip for prod; guard with `NODE_ENV === 'development'`.

### ✅ Verified clean (spot-checked, OK)
- `/api/employees/[id].js` — auth + tenant guards + `encryptSin` path + no SIN in response select
- `/api/time-entries/index.js` + `[id].js` — tenant-scoped queries, employee_id + job_id both tenant-guarded before insert
- `/api/pay-runs/commit.js` — DAS recomputed server-side; writes tenant-scoped; `crypto.randomUUID()` for pay_run_id
- `/api/payments/index.js` — job ownership verified pre-insert; deposit status flip tenant-scoped
- `/api/media/upload.js` — MIME whitelist, 10 MB cap, CSPRNG path components, no traversal
- `/api/universal/contrat/sign.js` — phone gate hard-enforced for contracts ≥ 2026-04-19; storage path scoped `{customer_id}/{contract_number}/`
- `lib/payroll/sin-crypto.js` — AES-256-GCM per-encrypt IV, Luhn, `maskSin()` for display
- `/api/bons-de-commande/generate.js` — quote tenant guard, BC# sequential per tenant
- `/api/hub/lead-prefill.js` — session auth + tenant filter (replaces prior master-key proxy)

---

## 🧮 Business-logic math

### P0 — Ship-blockers
~~**P0-3 Tax reverse-calc drift**: `reverseCalcIfMissing` rounded subtotal separately, so (subtotal + tps + tvq) ≠ TTC by up to $0.03/txn, accumulating in the quarterly report.~~ ✅ **FIXED** — subtotal now derived from `TTC − TPS − TVQ`.

Initially agent flagged:
- **P0-1 Complexity double-applied in subtotal box**: `sousTotalFenetres = sum(it.total) × complexityMul` while cards show `qty × unit_price × complexityMul`. Hand-verification: when `it.total === unit_price × qty` (which the server enforces at save time), the two reduce algebraically to `complexityMul × sum(unit_price × qty)`. **Downgrade: P2** — potential penny-drift only if `it.total` was rounded differently than `unit_price × qty`, which the current save path does not do.
- **P0-2 Promo rebate math**: agent retracted during verification. No bug.

### P1 — Fix this week
1. **Pay-run rounding absorption: last entry absorbs into `qc_tax` only** (`pay-runs/commit.js:127-133`). Grand-total deductions are correct, but per-deduction-type (rrq/ei/rqap) sums on individual entries don't sum to the employee's aggregate per-type. Only matters if downstream reports sum per-entry-per-type; current Revenu Québec summaries use pay-run-level aggregates, so **fine for now**. Note for future payroll-detail export.
2. **Portes don't receive complexity multiplier on per-card display** (`pur.js:440` — `renderItemCard` called without `complexityMul` prop for porte items, defaults to 1). Stored subtotal is correct (complexity baked in at save); but the porte card renders un-inflated unit price next to complexity-inflated fenêtre cards. **Visual inconsistency on the devis.**
3. **`finances.js` uses `total_ttc` as revenue base for margin** — over-states gross margin by including HST. Use `subtotal` instead. (Internal dashboard only, not customer-facing.)

### ✅ Verified by hand-computation
- **Promo rebate = $1,709.00 exactly**. Math walked: $800 × 1.20 markup + perimeter (237.5") × $3/in linear + urethane + moulure + calking = $960 + $712.50 + $13.50 + $9.50 + $13.50 = **$1,709.00**. `qualifiesForPromo` sums item.qty (not item count). Correct.
- **DAS biweekly, $1,000 gross, no YTD**: RRQ $55.38, EI $13.10, RQAP $4.94, federal $47.49 (post-QC-abatement), QC $42.74. Net ≈ **$836**. Plausible for Quebec taxpayer at this income; code path audited end-to-end.
- **RRQ YTD cap**: when `ytdGross ≥ 73,200`, remaining room = 0 → RRQ = $0. **Correct**.
- **Employer RRQ matches employee**: per QPP rules. **Correct**.
- **`petits_frais` OFF**: cannette credit + overhead + gaz all drop consistently server + client.
- **Payment auto-split** (newly added in this audit): TTC / 1.14975 → TPS @ 5%, TVQ @ 9.975%, subtotal = TTC − TPS − TVQ. Reconstitutes exactly.

### P2 — Backlog
- `pur.js:268` dead `displayTotal` variable
- Portes complexity render inconsistency (noted P1 above)
- `finances.js` revenue base (noted P1 above)

---

## 🗂️ File integrity & routing

### 🔴 Broken
**None.** All 16 platform sidebar hrefs resolve to existing files. All 5 hub tool hrefs resolve. All `fetch('/api/…')` targets in the new UI code have matching handlers.

### 🟡 Warnings
- **Hub `commande` naming confusion**: sidebar `commande` key → `/hub` (devis creator), while `bc` key → `/hub/commande` (BC tool). Correct at runtime (catch-all maps empty slug to devis), but misleading. Rename `commande` → `devis` in `HUB_TOOL_DEFS` in a future pass.
- ~~`pages/api/chat.js.bak` orphan~~ ✅ **DELETED** in this audit pass.

### 🔐 Env vars status
| Var | Referenced | Vercel | Local `.env.local` | Status |
|---|---|---|---|---|
| `PAYROLL_SIN_KEY` | `lib/payroll/sin-crypto.js` | ✅ set (this session) | ❌ | Local dev will 500 on SIN save. Add to `.env.local` if testing locally. |
| `OPENAI_API_KEY` | `pages/api/expenses/extract.js` | ?  | ❌ | OCR will 500 locally. Already set in Vercel from earlier sessions. |
| `OPENAI_VISION_MODEL` | extract.js | optional | ❌ | Falls back to hardcoded default. |
| `TELNYX_API_KEY` | `universal/devis/send.js` | set | ✅ set | OK |

### ✅ Verified
- `pay-runs/preview.js` + `commit.js` imports `../../../lib/supabaseServer` + `../../../lib/payroll/das` — paths resolve.
- `employees/[id].js` + `employees/index.js` import `../../../lib/payroll/sin-crypto` — resolves.
- `universal/devis/accept.js` imports `lib/notifications/jeremy-alert`, `lib/tasks/auto` — both exist.
- `lib/quote-templates/pur.js` imports `./svg-ssr.js`; `lib/contract-templates/pur.js` imports `../quote-templates/svg-ssr.js` — both resolve.
- No `TODO/FIXME/XXX/HACK` in the payroll/taxes/expenses/pay-runs/employees/time-entries directories.

---

## 🗄️ DB schema ↔ code alignment

Queried `information_schema.columns` for every column referenced by code touched in this session. All present with correct types.

### Verified
| Table | Columns referenced by code | Exist? |
|---|---|---|
| `employees` | 16 columns incl. sin_encrypted (text), td1_federal, tp1015_qc, full_name (generated) | ✅ all |
| `time_entries` | 18 columns incl. pay_run_id, paid_at, all DAS fields | ✅ all |
| `customers` | `cnesst_rate` (added this session), `slack_bot_token`, `branding` | ✅ all |
| `expenses` | total, subtotal, tps, tvq, receipt_url, invoice_number, payment_method | ✅ all |
| `payments` | amount, subtotal, tps, tvq, receipt_url, status, meta | ✅ all |
| `quotes` | subtotal, tax_gst, tax_qst, total_ttc (NOT tps/tvq/ttc — code uses correct real names) | ✅ all |
| `jobs` | id (bigint), job_id (text), customer_id, quote_amount, status | ✅ all |
| `contracts` | id, job_id, storage_path, signature_status, signed_at, signer_name, html_content | ✅ all |

### Notes
- `contracts` table has no `contract_number` column — `universal/contrat/sign.js` handles this by pattern-matching `storage_path` (line 93-97). Non-obvious but correct.
- `payments.notes` / `payments.stripe_payment_id` — referenced in some older code paths but not in this session's commits. Out of scope.

### Migrations applied
- `employees_and_time_entries_mvp` (F-P9) — applied ✅
- `customers_cnesst_rate` (F-P10) — applied ✅

---

## 🔁 Actionable open items (post-audit)

**Do this week:**
1. Strip `localhost` from prod CORS allowlist (Security P1-6)
2. Harden `/api/universal/leads/[id].js` master-key path (Security P1-3)
3. Migrate rate limits to Vercel KV (Security P1-4) — **blocks the phone-gate being real**
4. Pass `complexityMul` prop to `renderItemCard` for porte items (Math P1-2)
5. Fix `finances.js` margin revenue base: use `subtotal` not `total_ttc` (Math P1-3)

**Don't block on:**
- Pay-run per-deduction-type sum rounding (acceptable until detail export exists)
- `pur.js:268` dead `displayTotal` (cosmetic)
- Hub `commande` key rename (cosmetic)

---

## Methodology appendix

- **Agent 1** (Explore/sonnet) — 48 tool calls, 94s, focused on every API route touched in session. Read auth guards, tenancy filters, CSPRNG usage, CORS, SIN handling, rate limits, phone gate, file upload hardening.
- **Agent 2** (Explore/sonnet) — 12 tool calls, 81s, hand-computed promo rebate, DAS biweekly scenario, payment auto-split, tax reverse-calc; cross-verified server pricing vs client DevisEditor.
- **Agent 3** (Explore/sonnet) — 28 tool calls, 84s, every sidebar/API/import path in session scope. Env-var inventory against `.env.local` and documentation.
- **Self** — Supabase MCP queries against `information_schema.columns` for every table touched; grep'd code to triangulate phantom columns (turned out to be misnamed queries — no gaps found).

No agent saw another agent's output until consolidation. Overlap in findings (none occurred) would have indicated consensus; divergent findings (several) each verified independently before acceptance.
