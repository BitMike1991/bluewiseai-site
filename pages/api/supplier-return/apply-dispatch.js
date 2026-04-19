/**
 * POST /api/supplier-return/apply-dispatch
 *
 * Apply confirmed matches + manual assignments from parse-global review UI.
 *
 * Body:
 *   matches:           [{ quote_id, item_idx, parsed_idx }]  — auto-matches user confirmed
 *   manual_assignments:[{ quote_id, item_idx, parsed_idx }]  — user-picked from dropdown
 *   ignore:            [{ quote_id, item_idx }]              — user marked no-match
 *   parsed_payload:    the full result from parse-global (to avoid re-parsing)
 *
 * For each match/assignment:
 *   - Apply pricing formula
 *   - Update quote.line_items[item_idx]
 *   - Recompute quote totals via computeProjectTotals
 *   - If ALL items now have unit_price → status='ready', job→'awaiting_client_approval'
 *   - Insert expense rows: materiel_fournisseur per item, overhead+gaz once per job
 *
 * Returns: { applied_count, quotes_flipped_to_ready, total_expenses_recorded }
 *
 * Auth: session customer_id. Multi-tenant strict.
 * Idempotent: items with _price_applied_at are skipped.
 */

import { getAuthContext } from '../../../lib/supabaseServer';
import { computeClientPrice, computeHardcodedPrice, detectHardcodedType, computeProjectTotals, DEFAULT_PRICING } from '../../../lib/devis/pricing';
import { qualifiesForPromo, computePromoDoorRebate } from '../../../lib/devis/promo';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user)       return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });

  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Corps JSON requis.' });
  }

  const allMatches    = [...(body.matches || []), ...(body.manual_assignments || [])];
  const ignoreSet     = new Set((body.ignore || []).map(x => `${x.quote_id}:${x.item_idx}`));
  const parsedPayload = body.parsed_payload;

  if (!parsedPayload || !Array.isArray(parsedPayload._parsed_items)) {
    return res.status(400).json({ error: 'parsed_payload._parsed_items manquant.' });
  }

  if (allMatches.length === 0) {
    return res.status(200).json({
      applied_count: 0,
      quotes_flipped_to_ready: 0,
      total_expenses_recorded: 0,
      message: 'Aucun match à appliquer.',
    });
  }

  // ── 1. Load customer pricing config ──────────────────────────────────────
  const { data: customer } = await supabase
    .from('customers')
    .select('quote_config')
    .eq('id', customerId)
    .single();

  const hardcodedConfig = customer?.quote_config?.hardcoded_pricing || null;
  const escomptePct = parsedPayload.escompte_pct || 0;
  const customerPricing = customer?.quote_config?.pricing || {};
  const pricingParams = { ...DEFAULT_PRICING, ...customerPricing, escomptePct };

  // ── 2. Resolve unique quote IDs ───────────────────────────────────────────
  const quoteIdSet = new Set(allMatches.map(m => m.quote_id).filter(Boolean));

  const { data: quotes, error: quotesError } = await supabase
    .from('quotes')
    .select('id, quote_number, job_id, status, line_items, meta')
    .in('id', Array.from(quoteIdSet))
    .eq('customer_id', customerId); // strict multi-tenant guard

  if (quotesError || !quotes) {
    return res.status(500).json({ error: 'Erreur chargement devis.' });
  }

  const quoteMap = Object.fromEntries(quotes.map(q => [q.id, q]));

  // ── 3. Apply prices per quote ─────────────────────────────────────────────
  const nowIso      = new Date().toISOString();
  const nowDate     = nowIso.slice(0, 10);
  const fournisseur = parsedPayload.fournisseur || 'Royalty';

  // Group matches by quote_id
  const matchesByQuote = {};
  for (const m of allMatches) {
    if (!m.quote_id) continue;
    if (ignoreSet.has(`${m.quote_id}:${m.item_idx}`)) continue;
    if (!matchesByQuote[m.quote_id]) matchesByQuote[m.quote_id] = [];
    matchesByQuote[m.quote_id].push(m);
  }

  let appliedCount       = 0;
  let quotesFlipped      = 0;
  const quoteResults     = [];

  for (const [quoteId, qMatches] of Object.entries(matchesByQuote)) {
    const quote = quoteMap[quoteId];
    if (!quote) continue;

    const lineItems      = Array.isArray(quote.line_items) ? [...quote.line_items.map(li => ({ ...li }))] : [];
    let   quoteApplied   = 0;

    for (const m of qMatches) {
      const idx = m.item_idx;
      const li  = lineItems[idx];
      if (!li) continue;

      // Idempotency guard
      if (li._price_applied_at) continue;

      // Hardcoded path: parse-global emits parsed_idx=null for hardcoded items
      const isHardcoded = m.match_confidence === 'hardcoded' || m.parsed_idx == null;
      let priceResult;

      if (isHardcoded) {
        // Re-detect hardcoded type and compute price directly
        const hc = hardcodedConfig ? detectHardcodedType(li, hardcodedConfig) : null;
        if (!hc) continue; // safety: no hardcoded match found — skip
        priceResult = computeHardcodedPrice(
          {
            dimensions: li.dimensions,
            qty: li.qty || 1,
            sides: li.sides || 0,
          },
          hc,
          pricingParams
        );
      } else {
        const parsedItem = parsedPayload._parsed_items[m.parsed_idx];
        if (!parsedItem || parsedItem.unitPrice == null) continue;

        // Compute price
        try {
          priceResult = computeClientPrice(
            {
              unitPrice:   parsedItem.unitPrice,
              dimensions:  li.dimensions || parsedItem.dimensions,
              qty:         li.qty || 1,
              type:        li.type || '',
              model:       li.model || li.config_code || '',
              description: li.description || '',
              specs:       li.specs || '',
              sides:       li.sides || 0,
            },
            pricingParams,
            hardcodedConfig
          );
        } catch {
          priceResult = computeClientPrice(
            { unitPrice: parsedItem.unitPrice, dimensions: li.dimensions || parsedItem.dimensions, qty: li.qty || 1 },
            pricingParams,
            null
          );
        }
      }

      // Determine confidence
      let confidence;
      if (isHardcoded) {
        confidence = 'hardcoded';
      } else {
        const isManual = (body.manual_assignments || []).some(
          ma => ma.quote_id == quoteId && ma.item_idx === idx
        );
        confidence = isManual ? 'manual' : (
          (parsedPayload.matches || []).find(
            au => au.quote_id == quoteId && au.item_idx === idx
          )?.match_confidence || 'exact'
        );
      }

      // Supplier list price for display (null for hardcoded — no soumission item)
      const supplierListPrice = isHardcoded
        ? null
        : (parsedPayload._parsed_items[m.parsed_idx]?.unitPrice ?? null);

      // Update line item
      lineItems[idx] = {
        ...li,
        unit_price:           priceResult.clientUnit,
        total:                priceResult.clientTotal,
        _supplier_cost:       priceResult.cost,
        _supplier_list_price: supplierListPrice,
        _match_confidence:    confidence,
        _price_applied_at:    nowIso,
        ...(isHardcoded ? { _hardcoded_type: m.hardcoded_type } : {}),
      };

      quoteApplied++;
      appliedCount++;

      // NOTE: supplier material cost is NOT auto-inserted into expenses. It's stored on
      // line_items._cost and surfaced as estimatedMaterialCost in the finances API.
      // Jérémy logs the actual supplier invoice manually when he pays Royalty.
    }

    if (quoteApplied === 0) continue;

    // Promo "porte simple offerte" — auto-apply when the updated quote now qualifies,
    // unless Jérémy previously opted out via meta.promo_enabled === false.
    const existingPromoFlag = quote.meta?.promo_enabled;
    const promoEligible     = qualifiesForPromo(lineItems);
    const promoActive       = promoEligible && existingPromoFlag !== false;
    const promoRebate       = promoActive ? computePromoDoorRebate(pricingParams) : 0;

    // Preserve the "petits frais" opt-out Jérémy may have set in the editor
    // (default true = charge client). When false, overhead + gaz + cannettes
    // are absorbed.
    const petitsFrais = quote.meta?.petits_frais_on !== false;

    // Recompute totals (with rebate if promo is active)
    const totals = computeProjectTotals(lineItems, pricingParams, {
      container:   !!(quote.meta?.container_option),
      petitsFrais,
      promoRebate,
    });

    // Preserve client discount the editor may have set. Apply on top of
    // recomputed subtotal the same way DevisEditor does, then re-recompute
    // taxes so the stored total_ttc stays correct after dispatcher re-runs.
    const storedDiscMode   = quote.meta?.discount_mode === 'percent' ? 'percent' : 'amount';
    const storedDiscValue  = Number(quote.meta?.discount_value || 0);
    let clientDiscount = 0;
    if (storedDiscValue > 0) {
      clientDiscount = storedDiscMode === 'percent'
        ? Math.min(totals.subtotal, totals.subtotal * (storedDiscValue / 100))
        : Math.min(totals.subtotal, storedDiscValue);
      const adjSubtotal  = Math.max(0, totals.subtotal - clientDiscount);
      totals.subtotal    = Math.round(adjSubtotal * 100) / 100;
      totals.tax_gst     = +(adjSubtotal * 0.05).toFixed(2);
      totals.tax_qst     = +(adjSubtotal * 0.09975).toFixed(2);
      totals.total_ttc   = +(adjSubtotal + totals.tax_gst + totals.tax_qst).toFixed(2);
    }

    // All items priced?
    const allPriced = lineItems.every(li => li.unit_price != null && li.unit_price > 0);
    const newStatus = allPriced ? 'ready' : quote.status;

    // Update quote
    const { error: updateErr } = await supabase
      .from('quotes')
      .update({
        line_items:  lineItems,
        subtotal:    totals.subtotal,
        tax_gst:     totals.tax_gst,
        tax_qst:     totals.tax_qst,
        total_ttc:   totals.total_ttc,
        status:      newStatus,
        updated_at:  nowIso,
        meta: {
          ...(quote.meta || {}),
          soumission_number:         parsedPayload.soumission_number,
          escompte_pct:              escomptePct,
          supplier_return_applied_at: nowIso,
          promo_enabled:             promoActive,
          promo_rebate:              promoRebate,
          petits_frais_on:           petitsFrais,
          discount_mode:             storedDiscMode,
          discount_value:            storedDiscValue,
          discount_amount:           Math.round(clientDiscount * 100) / 100,
        },
      })
      .eq('id', quoteId)
      .eq('customer_id', customerId);

    if (updateErr) {
      console.error('[apply-dispatch] quote update error', updateErr);
      continue;
    }

    // Sync the denormalized jobs.quote_amount so the /platform/jobs list view
    // and /api/jobs/[id]/finances don't drift until the next DevisEditor save.
    // Mirrors apply-supplier-pricing.js:318 pattern.
    if (quote.job_id) {
      const { error: jobSyncErr } = await supabase
        .from('jobs')
        .update({ quote_amount: totals.subtotal, updated_at: nowIso })
        .eq('id', quote.job_id)
        .eq('customer_id', customerId);
      if (jobSyncErr) {
        console.warn('[apply-dispatch] jobs.quote_amount sync failed (non-fatal)', jobSyncErr);
      }
    }

    // DO NOT auto-flip job.status. "awaiting_client_approval" means client received
    // the devis — which is a separate action from pricing being applied.
    // Jérémy clicks "Envoyer au client" later to actually send + flip status.
    if (allPriced && quote.job_id) {
      quotesFlipped++;  // tracking for summary — quote.status='ready' means "ready to send"
    }

    // NOTE: overhead (200$) and gaz (100$) are CLIENT CHARGES on the quote total,
    // NOT real expenses Jérémy pays out. They were previously auto-inserted here as
    // expense rows — that double-counted them against his margin. Removed.
    // Jérémy logs his real gas + overhead manually when the receipts actually hit.

    quoteResults.push({
      quote_id:       quoteId,
      quote_number:   quote.quote_number || `q-${quoteId}`,
      items_applied:  quoteApplied,
      all_priced:     allPriced,
      new_status:     newStatus,
      new_total_ttc:  totals.total_ttc,
    });
  }

  // ── 4. Return summary ─────────────────────────────────────────────────────
  // NOTE: no expense rows are auto-inserted anymore — see comments above. Jérémy logs
  // real supplier invoices + overhead + gaz manually as they hit. The projected cost
  // is surfaced via line_items._cost + /api/jobs/[id]/finances estimatedMaterialCost.
  return res.status(200).json({
    success:                  true,
    applied_count:            appliedCount,
    quotes_flipped_to_ready:  quotesFlipped,
    breakdown:                quoteResults,
  });
}
