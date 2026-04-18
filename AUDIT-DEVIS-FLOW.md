# AUDIT — Devis Flow (PÜR Fenestration)
**Date:** 2026-04-17 — Session deep audit before UI upgrade
**Author:** JARVIS (Claude Sonnet 4.6)
**Scope:** pricing.js, matcher.js, apply-supplier-pricing, apply-return, quote template, DevisEditor, job detail page

---

## 1. EXECUTIVE SUMMARY

The pricing formula is **mostly correct** but four significant gaps exist:

1. `apply-supplier-pricing` computes subtotal from item totals ONLY — misses `+$200 overhead + $100 gaz` (and `+$175 container` if toggled). Quote ends up ~$300 lower than it should be.
2. `apply-supplier-pricing` flips status to `'ready'` **unconditionally** even if some items remained unmatched (`unit_price = null`). The `apply-return` (BC flow) handles this correctly — `apply-supplier-pricing` needs the same `allPriced` guard.
3. `apply-supplier-pricing` inserts **zero expense rows** after match. Only `apply-return` inserts expense rows — per-job upload path has no accounting trail.
4. Matcher has **no family-aware fallback** for wide dimensions. Bow/Arc windows share no family guard with standard types — a BOW-48×60 will never match a Bow item if the archived model code differs.
5. `DevisEditor.computeTotals()` uses `unit_price × qty` per item, not `item.total` — correct for editor entry, but does NOT factor overhead/gaz/container into the displayed running total. The breakdown section does not exist yet.
6. Public template (`pur.js`) has no container row — no conditional `<tr>` for `meta.container_option`.
7. Lead matching dedup: `apply-supplier-pricing` does NOT deduplicate leads by phone at all — it only loads the existing quote. Dedup is handled by the commande-intake tool (separate flow), so this is acceptable but worth noting.
8. Multi-tenant safety: all three endpoints (`apply-supplier-pricing`, `apply-return`, `/api/universal/devis/index`) apply `.eq('customer_id', customerId)` on all writes and reads. **No leak found.**
9. `meta.price_display_mode` toggle: handled correctly in DevisEditor + public template. Not broken.
10. Accessibility audit of DevisEditor: `aria-label` missing on BC toggle button (text only, no icon label issue — already has `aria-label` set). SVG preview has `aria-hidden="true"`. Focus rings use `focus-visible:ring`. Minor: the Ctrl+S shortcut has no `aria-keyshortcuts` attribute on the button.

---

## 2. FINDINGS BY SEVERITY

### CRITICAL

#### C1 — apply-supplier-pricing: overhead + gaz NOT added to subtotal/total_ttc
**File:** `pages/api/jobs/[id]/apply-supplier-pricing.js` lines 203–207
```js
// CURRENT (wrong)
const subtotal = updatedLineItems.reduce((s, li) => s + (li.total || 0), 0);
const tax_gst = subtotal * 0.05;
const tax_qst = subtotal * 0.09975;
const total_ttc = subtotal + tax_gst + tax_qst;
```
Items total alone misses the mandatory $200 overhead + $100 gaz project fees. Container toggle is not read from quote.meta.
**Fix:** Use `computeProjectTotals(pricedItems, DEFAULT_PRICING, { container: quote.meta?.container_option })` and persist back all returned fields.

#### C2 — apply-supplier-pricing: status always flips to 'ready' even with unmatched items
**File:** `pages/api/jobs/[id]/apply-supplier-pricing.js` line 219
```js
status: 'ready',  // always, even if unmatched > 0
```
This marks a quote as ready for client delivery when some items still have `unit_price: null`. Those items would render as `—` on the PDF. The `apply-return.js` endpoint (BC flow) correctly checks `allPriced` — this endpoint must do the same.
**Fix:** Only set `status: 'ready'` if `unmatched === 0` after processing.

#### C3 — apply-supplier-pricing: zero expense rows inserted
**File:** `pages/api/jobs/[id]/apply-supplier-pricing.js` — no expense insert
Unlike `apply-return.js` which inserts `materiel_fournisseur` rows, the per-job upload route inserts nothing. Finances tab will show $0 expenses after upload via job detail.
**Fix:** Insert expense rows (materiel_fournisseur per item + overhead + gaz_carburant) after pricing is applied.

---

### HIGH

#### H1 — pricingParams missing urethane/moulure/calking in both upload endpoints
**Files:** `apply-supplier-pricing.js` line 160, `apply-return.js` line 140
```js
// CURRENT (both files)
const pricingParams = { escomptePct, markupPct: 20, perLinearInch: 3, minPerWindow: 400 };
```
`computeClientPrice` reads `urethanePer150 ?? 6.75` etc. from `pricing` param — the fallback defaults handle it correctly. However if a quote_config specifies custom urethane/calking rates they would be ignored since the params are hardcoded. For PÜR (cid=9) with no custom overrides this is currently not a bug but it is fragile.
**Fix:** Spread `DEFAULT_PRICING` as base and override with customer's quote_config pricing fields.

#### H2 — DevisEditor computeTotals does not include overhead/gaz/container
**File:** `src/components/jobs/DevisEditor.js` lines 43–53
The left-pane running total shown to Jérémy is `Σ(qty × unit_price) + installCost`. Overhead ($200), gaz ($100), and container ($175) are invisible here. The client template does include them through `computeProjectTotals` called server-side during render, so the preview iframe shows the correct total — but the left pane shows a **different number than the iframe**. This is confusing and will cause Jérémy to question totals.
**Fix:** Add project fees section (overhead, gaz, container toggle) to DevisEditor left pane. Use `computeProjectTotals` formula to recompute displayed total.

#### H3 — Matcher: no model-family fallback for Bow/Arc types
**File:** `lib/devis/matcher.js`
The three existing fallback branches use dims-only or dims+qty matching with 1" tolerance. If a Bow window (`BOW-42×48`) appears in the soumission but the bon-de-commande has it coded differently (e.g. `ARC-42×48`), there is zero chance of a match since model normalization maps them to different strings. Additionally, tolerance of 1" is too tight for items where Royalty sometimes quotes in slightly different nom. sizes.
**Fix:** Add Branch 4 — model-family classification (`modelFamily()`) + 5" tolerance + `match_confidence: 'partial_wide'` flag.

#### H4 — Public template: no container row
**File:** `lib/quote-templates/pur.js`
The forfait section shows subtotal, TPS, TVQ but never a container line even when `meta.container_option === true`. The subtotal passed into the template IS the correct post-overhead+gaz subtotal (computed server-side), but the container is not shown as a line item.
**Fix:** Add conditional `<tr class="extra-row">Container ($175)</tr>` before the subtotal row, controlled by `data.meta?.container_option`.

#### H5 — DevisEditor save: meta saves price_display_mode but ignores container/sous_traitance/employees
**File:** `src/components/jobs/DevisEditor.js` line 575
```js
meta: { price_display_mode: priceDisplayMode },
```
New meta fields needed: `container_option`, `sous_traitance_option`, `employees`. Not saving them means they don't persist across page loads.
**Fix:** Expand meta object in handleSave to include all new fields.

---

### MEDIUM

#### M1 — DevisEditor: no per-item fees breakdown visible to Jérémy
Items show only `unit_price` (final computed value after supplier upload). Jérémy cannot see how the price was computed (cost, markup, linear, urethane, calking). This makes it hard to spot errors or explain to clients.
**Fix:** Per-item collapsible "Détail du calcul" section using `_list_price`, `_urethane`, `_moulure`, `_calking` metadata already stored in line_items after upload.

#### M2 — DevisEditor: no upload dropzone UI when status = awaiting_supplier
Currently the upload dropzone exists in TabCommande (the "Commande" tab), not in the "Devis" tab. The natural workflow is: upload soumission → see prices → edit. The two tabs are separate, causing unnecessary tab-switching.
The task explicitly requests: upload in the Commande tab remains, but add a prominent upload card at the TOP of the Devis tab when status=awaiting_supplier.
**Fix:** Add `SupplierUploadCard` component at top of DevisEditor when `quote.status === 'awaiting_supplier'`.

#### M3 — apply-return: pricingParams missing supply fees (same as H1)
Same issue as H1 but in apply-return.js. The default fallback values in `computeClientPrice` handle this at runtime, but explicit params are better practice.

#### M4 — universal/devis/index.js: acceptance_url hardcoded to pur-construction-site.vercel.app
**File:** `pages/api/universal/devis/index.js` line 525
```js
const acceptance_url = customer.id === 9
  ? `https://pur-construction-site.vercel.app/q/${quote_number}`
  : `https://${customer.domain || 'bluewiseai.com'}/q/${quote_number}`;
```
This is hardcoded by customer_id. As the architecture migrates to unified codebase + domain aliases, this must change to use `customer.domain` for all tenants. For now it works but is a ticking clock.
**Severity:** MEDIUM — not broken today, but will break after P11 migration.

#### M5 — DevisEditor: Ctrl+S shortcut not announced to screen readers
The Ctrl+S hint is displayed as text (`Ctrl+S`) next to the button but the button does not have `aria-keyshortcuts="Control+S"`. Minor a11y gap.

#### M6 — Matcher: dimsMatch tolerance is 1" for first two branches and dims-only branch
1" tolerance works for standard PVC windows but Royalty sometimes quotes in nominal sizes that differ by up to 2". For example, a 68"×37 3/4" ordered item might come back as 67 7/8"×37 5/8" in the soumission.
**Fix:** Increase default tolerance from 1" to 1.5" for branch 3 (dims-only). Branch 4 (new) uses 5".

---

### LOW

#### L1 — DevisEditor: Copy link and Open preview use pur-construction-site.vercel.app hardcoded
**File:** `src/components/jobs/DevisEditor.js` lines 695, 704
These hardcoded URLs will break post-P11 migration. Flag for fix during that migration phase.

#### L2 — DevisEditor: install cost description uses generic 'Installation' not INSTALL_DESCRIPTION sentinel
**File:** `src/components/jobs/DevisEditor.js` line 539
The template splits items on `INSTALL_DESCRIPTION = 'Installation, finition et moulures extérieures'` but the editor saves description as `'Installation'`. This means the install item is never split into the separate "Installation" sub-section in the template.
**Fix:** Use exact sentinel string `'Installation, finition et moulures extérieures'` in buildSaveItems.

#### L3 — universal/devis/index.js: quote immediately set to status='ready' on create
**File:** `pages/api/universal/devis/index.js` line 598
A freshly created quote via n8n is immediately marked `ready`. For the PÜR flow where quotes start at `awaiting_supplier`, this creates an inconsistency. However this endpoint is used by the n8n workflow (not the commande tool), so it's out of scope for this PR.

#### L4 — Mobile: Commande tab upload dropzone lacks explicit min-height touch target annotation
The dropzone is responsive but the `flex flex-col items-center justify-center gap-3 p-6` padding ensures ≥44px on most viewports. Low risk.

#### L5 — apply-return: double-increment bug
**File:** `pages/api/bons-de-commande/[id]/apply-return.js` lines 334–336
```js
totalMatched += 0; // already incremented per item above
totalUnmatched += 0;
```
These lines add zero — they're dead code left from a refactor. Not a bug (results are correct), but confusing.

---

## 3. CHANGES IMPLEMENTED (this PR)

| # | File | Change | Severity Fixed |
|---|------|--------|----------------|
| 1 | `apply-supplier-pricing.js` | Use `computeProjectTotals` for overhead+gaz+container | C1 |
| 2 | `apply-supplier-pricing.js` | Status flip only when `allPriced === true` | C2 |
| 3 | `apply-supplier-pricing.js` | Insert expense rows (materiel, overhead, gaz) | C3 |
| 4 | `apply-supplier-pricing.js` | Spread `DEFAULT_PRICING` into pricingParams | H1 |
| 5 | `apply-return.js` | Spread `DEFAULT_PRICING` into pricingParams | M3 / H1 |
| 6 | `matcher.js` | Add `modelFamily()` + Branch 4 (5" wide + family) | H3 |
| 7 | `matcher.js` | Increase Branch 3 tolerance from 1" to 1.5" | M6 |
| 8 | `DevisEditor.js` | Per-item fees breakdown (collapsible) | M1 |
| 9 | `DevisEditor.js` | Project fees section (overhead/gaz/container toggle) | H2 |
| 10 | `DevisEditor.js` | Internal expenses section (sous-traitance/employés) | new feature |
| 11 | `DevisEditor.js` | Supplier upload card when status=awaiting_supplier | M2 |
| 12 | `DevisEditor.js` | Save meta includes container/sous_traitance/employees | H5 |
| 13 | `DevisEditor.js` | Fix install description sentinel | L2 |
| 14 | `DevisEditor.js` | amber badge on `partial_wide` matched items | new feature |
| 15 | `pur.js` template | Conditional container row in forfait section | H4 |

### NOT fixed in this PR (tracked)
- M4 (acceptance_url hardcoded) — deferred to P11 migration
- L1 (copy link hardcoded URL) — deferred to P11 migration
- L3 (quote status on n8n create) — out of scope
- L5 (dead-code += 0) — trivial, leave for cleanup

---

## 4. MULTI-TENANT SAFETY VERIFICATION

All checked endpoints:

| Endpoint | customer_id filter on SELECT | customer_id filter on UPDATE/INSERT | Verdict |
|---|---|---|---|
| `apply-supplier-pricing` | `jobs.eq('customer_id')` + `quotes.eq('customer_id')` + `customers.eq('id')` | `quotes.eq('customer_id')` + `jobs.eq('customer_id')` | PASS |
| `apply-return` | `bons_de_commande.eq('customer_id')` + `quotes.eq('customer_id')` | all writes scoped | PASS |
| `universal/devis/index` | `customers.eq('id', customer_id)` | `jobs.eq('customer_id')` not checked — inserts with `customer_id` field | PASS (insert has customer_id) |
| new expense inserts (this PR) | inherit customerId from session | all rows get `customer_id: customerId` | PASS |

No cross-tenant leak risk found.

---

## 5. TEST INSTRUCTIONS

1. Open `/platform/jobs/100` (Thomas Barkmere) — job status should be `awaiting_supplier`
2. Go to **Commande** tab — upload `PUR37944.pdf`
3. Expect modal: "X items matchés / Y sans correspondance / Nouveau TTC: $..."
4. Switch to **Devis** tab — click "Modifier"
5. Expand any item → see "Détail du calcul" button → verify cost/markup/linear/urethane breakdown
6. Scroll to Project Fees section → verify Overhead $200 + Gaz $100 visible
7. Toggle Container → verify $175 added to running total
8. Enable Sous-traitance → verify expense preview shown
9. Add employee → verify marge brute updates
10. Save → check Finances tab → verify expense rows for materiel + overhead + gaz
11. Open `/q/[quote_number]` → if container was ON, verify container row in forfait section

**Matcher regression test** (if Bow/Arc item in job):
- Add item with type "Fenêtre Bow" model "BOW-48" dims 48×36
- Upload soumission with "ARC-48" 47×35.5
- Expect: matched with `partial_wide` amber badge (dims within 5", same family)
