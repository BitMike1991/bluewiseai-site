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
import { computeClientPrice, computeProjectTotals, DEFAULT_PRICING } from '../../../lib/devis/pricing';

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
  const expenseRows      = [];
  const jobsWithExpenses = new Set(); // track which jobs got overhead/gaz
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

      const parsedItem = parsedPayload._parsed_items[m.parsed_idx];
      if (!parsedItem || parsedItem.unitPrice == null) continue;

      // Compute price
      let priceResult;
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

      // Determine confidence: check if it was in auto-matches or manual
      const isManual = (body.manual_assignments || []).some(
        ma => ma.quote_id == quoteId && ma.item_idx === idx
      );
      const confidence = isManual ? 'manual' : (
        (parsedPayload.matches || []).find(
          au => au.quote_id == quoteId && au.item_idx === idx
        )?.match_confidence || 'exact'
      );

      // Update line item
      lineItems[idx] = {
        ...li,
        unit_price:           priceResult.clientUnit,
        total:                priceResult.clientTotal,
        _supplier_cost:       priceResult.cost,
        _supplier_list_price: parsedItem.unitPrice,
        _match_confidence:    confidence,
        _price_applied_at:    nowIso,
      };

      quoteApplied++;
      appliedCount++;

      // Expense row for this item
      if (priceResult.cost > 0) {
        const qty    = li.qty || 1;
        const amount = Math.round(priceResult.cost * qty * 100) / 100;
        expenseRows.push({
          customer_id: customerId,
          job_id:      quote.job_id,
          category:    'materiel_fournisseur',
          description: `[${li.type || 'Article'}] ${li.model || li.config_code || ''} ×${qty}`.replace(/\s+/g, ' ').trim(),
          total:       amount,
          subtotal:    amount,
          source:      'supplier_return_global',
          source_ref:  parsedPayload.soumission_number || null,
          vendor:      fournisseur,
          paid_at:     nowDate,
        });
      }
    }

    if (quoteApplied === 0) continue;

    // Recompute totals
    const totals = computeProjectTotals(lineItems, pricingParams);

    // All items priced?
    const allPriced = lineItems.every(li => li.unit_price != null && li.unit_price > 0);
    const newStatus = allPriced ? 'ready' : quote.status;

    // Update quote
    const { error: updateErr } = await supabase
      .from('quotes')
      .update({
        line_items:  lineItems,
        subtotal:    totals.itemsTotal,
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
        },
      })
      .eq('id', quoteId)
      .eq('customer_id', customerId);

    if (updateErr) {
      console.error('[apply-dispatch] quote update error', updateErr);
      continue;
    }

    // DO NOT auto-flip job.status. "awaiting_client_approval" means client received
    // the devis — which is a separate action from pricing being applied.
    // Jérémy clicks "Envoyer au client" later to actually send + flip status.
    if (allPriced && quote.job_id) {
      quotesFlipped++;  // tracking for summary — quote.status='ready' means "ready to send"
    }

    // Overhead + gaz once per job
    if (quote.job_id && !jobsWithExpenses.has(quote.job_id)) {
      jobsWithExpenses.add(quote.job_id);
      const overhead = pricingParams.overheadPerJob ?? 200;
      const gaz      = pricingParams.gazPerJob      ?? 100;
      if (overhead > 0) {
        expenseRows.push({
          customer_id: customerId,
          job_id:      quote.job_id,
          category:    'overhead',
          description: 'Frais overhead projet',
          total:       overhead,
          subtotal:    overhead,
          source:      'supplier_return_global',
          source_ref:  parsedPayload.soumission_number || null,
          vendor:      null,
          paid_at:     nowDate,
        });
      }
      if (gaz > 0) {
        expenseRows.push({
          customer_id: customerId,
          job_id:      quote.job_id,
          category:    'gaz',
          description: 'Frais déplacement (gaz)',
          total:       gaz,
          subtotal:    gaz,
          source:      'supplier_return_global',
          source_ref:  parsedPayload.soumission_number || null,
          vendor:      null,
          paid_at:     nowDate,
        });
      }
    }

    quoteResults.push({
      quote_id:       quoteId,
      quote_number:   quote.quote_number || `q-${quoteId}`,
      items_applied:  quoteApplied,
      all_priced:     allPriced,
      new_status:     newStatus,
      new_total_ttc:  totals.total_ttc,
    });
  }

  // ── 4. Insert expense rows ────────────────────────────────────────────────
  let totalExpensesRecorded = 0;
  if (expenseRows.length > 0) {
    const { error: expErr } = await supabase.from('expenses').insert(expenseRows);
    if (expErr) {
      console.error('[apply-dispatch] expense insert error', expErr);
      // Non-fatal
    } else {
      totalExpensesRecorded = expenseRows.reduce((s, e) => s + Number(e.total || 0), 0);
    }
  }

  // ── 5. Return summary ─────────────────────────────────────────────────────
  return res.status(200).json({
    success:                  true,
    applied_count:            appliedCount,
    quotes_flipped_to_ready:  quotesFlipped,
    total_expenses_recorded:  Math.round(totalExpensesRecorded * 100) / 100,
    expense_rows_inserted:    expenseRows.length,
    breakdown:                quoteResults,
  });
}
