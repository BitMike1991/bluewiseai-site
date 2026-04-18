/**
 * POST /api/bons-de-commande/[id]/apply-return
 *
 * Upload a supplier PDF (Royalty soumission) for a BC.
 * Parses it, matches items across ALL projects in the BC,
 * distributes prices, updates quotes/jobs, inserts expense rows.
 *
 * Auth: platform session (getAuthContext). Multi-tenant strict.
 * Max: 10 MB PDF only.
 * Idempotent: items already priced (_price_applied_at set) are skipped on re-upload.
 *
 * Returns: { matched, unmatched, quotes_affected, jobs_affected,
 *            total_expenses_recorded, breakdown }
 */

import formidable from 'formidable';
import fs from 'fs';
import os from 'os';
import path from 'path';
import pdfParse from 'pdf-parse';
import { getAuthContext } from '../../../../lib/supabaseServer';
import { parseDocuments } from '../../../../lib/devis/parser';
import { matchPrices } from '../../../../lib/devis/matcher';
import { computeClientPrice } from '../../../../lib/devis/pricing';

export const config = { api: { bodyParser: false } };

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user)       return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });

  const { id: bcId } = req.query;
  if (!bcId) return res.status(400).json({ error: 'Missing BC id' });

  // ── 1. Load BC ────────────────────────────────────────────────────────────
  const { data: bc, error: bcError } = await supabase
    .from('bons_de_commande')
    .select('*')
    .eq('id', bcId)
    .eq('customer_id', customerId)
    .maybeSingle();

  if (bcError || !bc) {
    return res.status(404).json({ error: 'Bon de commande introuvable.' });
  }

  if (bc.status !== 'sent') {
    return res.status(400).json({
      error: `Le BC doit être en statut "envoyé" avant d'appliquer un retour fournisseur. Statut actuel : ${bc.status}.`,
    });
  }

  const itemRefs = Array.isArray(bc.item_refs) ? bc.item_refs : [];
  if (itemRefs.length === 0) {
    return res.status(400).json({ error: 'Ce BC ne contient aucun article (item_refs vide).' });
  }

  // ── 2. Parse PDF upload ───────────────────────────────────────────────────
  const tmpDir = path.join(os.tmpdir(), 'bw-supplier-return');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const uploadedFiles = [];
  let soumission = null;

  try {
    const form = formidable({
      maxFiles: 1,
      maxFileSize: MAX_FILE_SIZE,
      uploadDir: tmpDir,
      keepExtensions: true,
      filter: ({ mimetype }) => !mimetype || mimetype === 'application/pdf',
    });

    let fileList = [];
    await new Promise((resolve, reject) => {
      form.parse(req, (err, _fields, files) => {
        if (err) return reject(err);
        fileList = Object.values(files).flat();
        resolve();
      });
    });

    if (fileList.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier PDF reçu.' });
    }

    const file = fileList[0];
    uploadedFiles.push(file.filepath);

    const originalName = file.originalFilename || '';
    if (file.mimetype && file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Seuls les fichiers PDF sont acceptés.' });
    }
    if (!originalName.toLowerCase().endsWith('.pdf') && file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Seuls les fichiers PDF sont acceptés.' });
    }

    const buffer = fs.readFileSync(file.filepath);
    const pdfResult = await pdfParse(buffer);
    const rawText = pdfResult.text || '';

    if (!rawText.trim()) {
      return res.status(422).json({ error: 'PDF vide ou non lisible. Vérifiez le fichier.' });
    }

    const { soumission: parsedSoumission } = await parseDocuments([
      { filename: originalName, type: 'soumission', text: rawText.slice(0, 20000) },
    ]);

    if (!parsedSoumission || !parsedSoumission.items || parsedSoumission.items.length === 0) {
      return res.status(422).json({
        error: "Aucun article trouvé dans la soumission. Vérifiez que c'est bien une soumission Royalty.",
      });
    }

    soumission = parsedSoumission;
  } finally {
    for (const fp of uploadedFiles) {
      try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch {}
    }
  }

  // ── 3. Load customer pricing config ──────────────────────────────────────
  const { data: customer } = await supabase
    .from('customers')
    .select('quote_config')
    .eq('id', customerId)
    .single();
  const hardcodedConfig = customer?.quote_config?.hardcoded_pricing || null;

  const escomptePct = soumission.escomptePct || 0;
  const pricingParams = { escomptePct, markupPct: 20, perLinearInch: 3, minPerWindow: 400 };

  // ── 4. Collect unique quote_ids from item_refs ────────────────────────────
  const quoteIdSet = new Set(itemRefs.map((r) => r.quote_id).filter(Boolean));
  if (quoteIdSet.size === 0) {
    return res.status(400).json({ error: 'Aucun quote_id trouvé dans les item_refs du BC.' });
  }

  const { data: quotes, error: quotesError } = await supabase
    .from('quotes')
    .select('id, quote_number, job_id, version, status, line_items, subtotal, meta')
    .in('id', Array.from(quoteIdSet))
    .eq('customer_id', customerId);

  if (quotesError || !quotes || quotes.length === 0) {
    return res.status(404).json({ error: 'Aucun devis trouvé pour ce BC.' });
  }

  // Build a map quoteId → quote for O(1) lookup
  const quoteMap = Object.fromEntries(quotes.map((q) => [q.id, q]));

  // ── 5. Build per-quote synthetic orders for batch matching ────────────────
  //
  // Group item_refs by quote_id so we can build one synthetic "order" per quote
  // and run matchPrices once across all orders.
  //
  const refsByQuote = {};
  for (const ref of itemRefs) {
    if (!ref.quote_id) continue;
    if (!refsByQuote[ref.quote_id]) refsByQuote[ref.quote_id] = [];
    refsByQuote[ref.quote_id].push(ref);
  }

  // Build synthetic orders
  const syntheticOrders = [];
  for (const [quoteId, refs] of Object.entries(refsByQuote)) {
    const quote = quoteMap[quoteId];
    if (!quote) continue;
    const lineItems = Array.isArray(quote.line_items) ? quote.line_items : [];
    syntheticOrders.push({
      _quoteId: quoteId,
      projectId: `q-${quoteId}`,
      items: refs.map((ref) => {
        const li = lineItems[ref.item_index];
        if (!li) return null;
        return {
          _quoteId: quoteId,
          _refIndex: ref.item_index,
          _jobId: ref.job_id,
          index: ref.item_index + 1,
          type: li.type || li.category || '',
          model: li.model || li.config_code || '',
          dimensions: li.dimensions || null,
          qty: li.qty || 1,
          ouvrant: li.ouvrant || null,
          specs: li.specs || '',
          description: li.description || '',
          sides: li.sides || 0,
          _already_priced: !!(li._price_applied_at), // idempotency guard
        };
      }).filter(Boolean),
    });
  }

  // ── 6. Run batch matcher ──────────────────────────────────────────────────
  const enrichedOrders = matchPrices(syntheticOrders, soumission);

  // ── 7. Process results per quote ─────────────────────────────────────────
  let totalMatched = 0;
  let totalUnmatched = 0;
  const quotesAffected = [];
  const jobsAffected = new Set();
  const unmatchedItems = [];
  const expenseRows = [];
  const breakdown = [];
  const nowIso = new Date().toISOString();

  for (const enrichedOrder of enrichedOrders) {
    const quoteId = enrichedOrder._quoteId;
    const quote = quoteMap[quoteId];
    if (!quote) continue;

    const lineItems = Array.isArray(quote.line_items) ? quote.line_items : [];
    const updatedLineItems = lineItems.map((li) => ({ ...li })); // shallow clone
    let quoteMatched = 0;
    let quoteUnmatched = 0;

    for (const enriched of (enrichedOrder.items || [])) {
      const idx = enriched._refIndex;
      const li = updatedLineItems[idx];
      if (!li) continue;

      // Idempotency: if already priced, skip
      if (enriched._already_priced) {
        quoteMatched++;
        continue;
      }

      if (!enriched.matched || enriched.unitPrice == null) {
        quoteUnmatched++;
        totalUnmatched++;
        updatedLineItems[idx] = {
          ...li,
          _match_confidence: 'unmatched',
        };
        unmatchedItems.push({
          quote_number: quote.quote_number,
          item_index: idx,
          description: li.description || `${li.type || ''} ${li.model || ''}`.trim(),
        });
        continue;
      }

      // Compute client price
      let clientUnit, clientTotal, cost;
      try {
        const priceResult = computeClientPrice(
          {
            unitPrice: enriched.unitPrice,
            dimensions: enriched.dimensions || li.dimensions,
            qty: li.qty || 1,
            type: li.type || '',
            model: li.model || '',
            description: li.description || '',
            specs: li.specs || '',
            sides: li.sides || 0,
          },
          pricingParams,
          hardcodedConfig
        );
        clientUnit = priceResult.clientUnit;
        clientTotal = priceResult.clientTotal;
        cost = priceResult.cost;
      } catch (pricingErr) {
        // Fall back to standard formula without hardcoded config
        console.warn('[apply-return] computeClientPrice threw, falling back:', pricingErr.message);
        try {
          const fallback = computeClientPrice(
            {
              unitPrice: enriched.unitPrice,
              dimensions: enriched.dimensions || li.dimensions,
              qty: li.qty || 1,
              type: li.type || '',
              model: li.model || '',
            },
            pricingParams,
            null // no hardcoded
          );
          clientUnit = fallback.clientUnit;
          clientTotal = fallback.clientTotal;
          cost = fallback.cost;
        } catch {
          quoteUnmatched++;
          totalUnmatched++;
          updatedLineItems[idx] = { ...li, _match_confidence: 'unmatched' };
          continue;
        }
      }

      const isPartial = enriched.soumissionItemNumber == null;
      const qty = li.qty || 1;

      updatedLineItems[idx] = {
        ...li,
        unit_price: clientUnit,
        total: clientTotal,
        _supplier_cost: cost,
        _supplier_list_price: enriched.unitPrice,
        _match_confidence: isPartial ? 'partial' : 'exact',
        _price_applied_at: nowIso,
      };

      quoteMatched++;
      totalMatched++;

      // Expense row for this item (only if cost > 0)
      if (cost > 0 && enriched._jobId) {
        const amount = Math.round(cost * qty * 100) / 100;
        expenseRows.push({
          customer_id: customerId,
          job_id: enriched._jobId,
          category: 'materiel_fournisseur',
          description: `[${li.type || 'Article'}] ${li.model || ''} ${qty}x`.replace(/\s+/g, ' ').trim(),
          total: amount,
          subtotal: amount,
          source: 'bon_de_commande',
          source_ref: bc.bc_number,
          vendor: soumission.fournisseur || 'Royalty',
          paid_at: nowIso.slice(0, 10),
        });
        jobsAffected.add(enriched._jobId);
      }
    }

    totalMatched += 0; // already incremented per item above
    totalUnmatched += 0;

    // Recompute quote totals
    const subtotal = updatedLineItems.reduce((s, li) => s + (Number(li.total) || 0), 0);
    const tax_gst = subtotal * 0.05;
    const tax_qst = subtotal * 0.09975;
    const total_ttc = subtotal + tax_gst + tax_qst;

    // Determine if all items now have unit_price (no nulls left)
    const allPriced = updatedLineItems.every(
      (li) => li.unit_price != null && li.unit_price > 0
    );

    const newQuoteStatus = allPriced ? 'ready' : quote.status;

    // Update quote
    const { error: quoteUpdateErr } = await supabase
      .from('quotes')
      .update({
        line_items: updatedLineItems,
        subtotal:   Math.round(subtotal * 100) / 100,
        tax_gst:    Math.round(tax_gst * 100) / 100,
        tax_qst:    Math.round(tax_qst * 100) / 100,
        total_ttc:  Math.round(total_ttc * 100) / 100,
        status:     newQuoteStatus,
        updated_at: nowIso,
        meta: {
          ...(quote.meta || {}),
          soumission_number: soumission.soumissionNumber,
          soumission_date:   soumission.date,
          escompte_pct:      escomptePct,
          bc_return_applied_at: nowIso,
          bc_id: bc.id,
          bc_number: bc.bc_number,
        },
      })
      .eq('id', quoteId)
      .eq('customer_id', customerId);

    if (quoteUpdateErr) {
      console.error('[apply-return] quote update error', quoteUpdateErr);
    }

    // Flip job status if quote is now ready
    if (allPriced && quote.job_id) {
      await supabase
        .from('jobs')
        .update({ status: 'awaiting_client_approval', updated_at: nowIso })
        .eq('id', quote.job_id)
        .eq('customer_id', customerId);
      jobsAffected.add(quote.job_id);
    }

    quotesAffected.push(quote.quote_number || `q-${quoteId}`);
    breakdown.push({
      quote_id:              quoteId,
      quote_number:          quote.quote_number || `q-${quoteId}`,
      job_id:                quote.job_id,
      matched:               quoteMatched,
      unmatched:             quoteUnmatched,
      all_priced:            allPriced,
      new_quote_status:      newQuoteStatus,
      new_subtotal:          Math.round(subtotal * 100) / 100,
      new_total_ttc:         Math.round(total_ttc * 100) / 100,
    });
  }

  // ── 8. Insert expense rows ────────────────────────────────────────────────
  let totalExpensesRecorded = 0;
  if (expenseRows.length > 0) {
    const { error: expErr } = await supabase
      .from('expenses')
      .insert(expenseRows);
    if (expErr) {
      console.error('[apply-return] expense insert error', expErr);
      // Non-fatal — prices were applied, expenses just failed
    } else {
      totalExpensesRecorded = expenseRows.reduce((s, e) => s + Number(e.total || 0), 0);
    }
  }

  // ── 9. Update BC status → received ───────────────────────────────────────
  await supabase
    .from('bons_de_commande')
    .update({
      status:      'received',
      received_at: nowIso,
      updated_at:  nowIso,
    })
    .eq('id', bcId)
    .eq('customer_id', customerId);

  // ── 10. Return summary ────────────────────────────────────────────────────
  return res.status(200).json({
    success: true,
    matched:                   totalMatched,
    unmatched:                 totalUnmatched,
    unmatched_items:           unmatchedItems,
    quotes_affected:           quotesAffected,
    jobs_affected:             Array.from(jobsAffected),
    total_expenses_recorded:   Math.round(totalExpensesRecorded * 100) / 100,
    expense_rows_inserted:     expenseRows.length,
    escompte_pct:              escomptePct,
    soumission_number:         soumission.soumissionNumber,
    breakdown,
  });
}
