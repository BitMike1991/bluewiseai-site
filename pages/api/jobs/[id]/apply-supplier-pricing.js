/**
 * POST /api/jobs/[id]/apply-supplier-pricing
 *
 * Accepts a Royalty soumission PDF upload, parses it, matches items to
 * the job's existing quote, distributes unit prices, and flips statuses.
 *
 * Auth: BW platform session (getAuthContext).
 * Max: 10MB, application/pdf only.
 * Returns: { success, matched, unmatched, subtotal, total_ttc, items_preview }
 */

import formidable from 'formidable';
import fs from 'fs';
import os from 'os';
import path from 'path';
import pdfParse from 'pdf-parse';
import { getAuthContext } from '../../../../lib/supabaseServer';
import { parseDocuments } from '../../../../lib/devis/parser';
import { matchPrices } from '../../../../lib/devis/matcher';
import { computeClientPrice, computeProjectTotals, DEFAULT_PRICING } from '../../../../lib/devis/pricing';

export const config = { api: { bodyParser: false } };

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });

  const { id: jobId } = req.query;
  if (!jobId) return res.status(400).json({ error: 'Missing job id' });

  // Verify job belongs to this customer
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, job_id, status, quote_amount')
    .eq('id', jobId)
    .eq('customer_id', customerId)
    .single();

  if (jobError || !job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Load latest quote for this job
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('id, quote_number, version, status, line_items')
    .eq('job_id', jobId)
    .eq('customer_id', customerId)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (quoteError || !quote) {
    return res.status(404).json({ error: 'No quote found for this job. Create a quote first.' });
  }

  const tmpDir = path.join(os.tmpdir(), 'bw-supplier');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const uploadedFiles = [];
  try {
    const form = formidable({
      maxFiles: 1,
      maxFileSize: MAX_FILE_SIZE,
      uploadDir: tmpDir,
      keepExtensions: true,
      filter: ({ mimetype }) => {
        return !mimetype || mimetype === 'application/pdf';
      },
    });

    let fileList = [];
    await new Promise((resolve, reject) => {
      form.parse(req, (err, _fields, files) => {
        if (err) return reject(err);
        const allFiles = Object.values(files).flat();
        fileList = allFiles;
        resolve();
      });
    });

    if (fileList.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier PDF reçu.' });
    }

    const file = fileList[0];
    uploadedFiles.push(file.filepath);

    // MIME guard — belt and suspenders
    const originalName = file.originalFilename || '';
    if (file.mimetype && file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Seuls les fichiers PDF sont acceptés.' });
    }
    if (!originalName.toLowerCase().endsWith('.pdf') && file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Seuls les fichiers PDF sont acceptés.' });
    }

    // Extract text from PDF
    const buffer = fs.readFileSync(file.filepath);
    const pdfResult = await pdfParse(buffer);
    const rawText = pdfResult.text || '';

    if (!rawText.trim()) {
      return res.status(422).json({ error: 'PDF vide ou non lisible. Vérifiez le fichier.' });
    }

    // Parse soumission
    const { orders: _orders, soumission } = await parseDocuments([
      {
        filename: originalName,
        type: 'soumission',
        text: rawText.slice(0, 20000),
      },
    ]);

    if (!soumission || !soumission.items || soumission.items.length === 0) {
      return res.status(422).json({
        error: 'Aucun article trouvé dans la soumission. Vérifiez que c\'est bien une soumission Royalty.',
      });
    }

    // Build a synthetic "order" from existing quote line_items so matcher can use it
    const existingLineItems = Array.isArray(quote.line_items) ? quote.line_items : [];
    const syntheticOrder = {
      projectId: job.job_id,
      items: existingLineItems.map((li, i) => ({
        index: i + 1,
        type: li.type || li.category || '',
        model: li.model || li.config_code || '',
        dimensions: li.dimensions || null,
        qty: li.qty || 1,
        ouvrant: li.ouvrant || null,
        specs: li.specs || '',
        _li_index: i,
      })),
    };

    // Run matcher
    const escomptePct = soumission.escomptePct || 0;
    const enrichedOrders = matchPrices([syntheticOrder], soumission);
    const enrichedItems = enrichedOrders[0]?.items || [];

    // Apply pricing formula to matched items
    // Load hardcoded pricing config for this customer (cid-specific, no cross-tenant risk)
    const { data: customer } = await supabase
      .from('customers')
      .select('quote_config')
      .eq('id', customerId)
      .single();
    const hardcodedConfig = customer?.quote_config?.hardcoded_pricing || null;
    const customerPricing = customer?.quote_config?.pricing || {};

    // Spread DEFAULT_PRICING so supply fees (urethane/moulure/calking) are always included.
    // Customer-specific overrides win if present.
    const pricingParams = { ...DEFAULT_PRICING, ...customerPricing, escomptePct };

    let matched = 0;
    let unmatched = 0;
    const partialMatches = [];

    const updatedLineItems = existingLineItems.map((li, i) => {
      const enriched = enrichedItems.find((e) => e._li_index === i);
      if (!enriched || !enriched.matched || enriched.unitPrice == null) {
        unmatched++;
        return { ...li, unit_price: null, total: null, _match_status: 'unmatched' };
      }

      const cost_detail = computeClientPrice(
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
      const { clientUnit, clientTotal, cost } = cost_detail;

      // Flag partial/dims-only/wide matches for UI warning
      const matchStatus = enriched.match_confidence === 'partial_wide'
        ? 'partial_wide'
        : enriched.soumissionItemNumber == null
          ? 'partial'
          : 'matched';
      if (matchStatus !== 'matched') partialMatches.push(i);

      matched++;
      return {
        ...li,
        unit_price: clientUnit,
        total: clientTotal,
        _list_price: enriched.unitPrice,
        _soumission_item: enriched.soumissionItemNumber,
        _match_status: matchStatus,
        _cost: cost,
        _perimeter: cost_detail?._perimeter,
        _urethane: cost_detail?._urethane,
        _moulure: cost_detail?._moulure,
        _calking: cost_detail?._calking,
      };
    });

    // Determine if all items are priced
    const allPriced = updatedLineItems.every(
      (li) => li.unit_price != null && li.unit_price > 0
    );

    // Compute project-level totals (overhead + gaz + optional container)
    const containerOn = !!(quote.meta?.container_option);
    const projectTotals = computeProjectTotals(
      updatedLineItems.map(li => ({ total: li.total || 0 })),
      pricingParams,
      { container: containerOn }
    );

    const nowIso = new Date().toISOString();

    // Update quote
    const { error: quoteUpdateError } = await supabase
      .from('quotes')
      .update({
        line_items: updatedLineItems,
        subtotal: projectTotals.subtotal,
        tax_gst: projectTotals.tax_gst,
        tax_qst: projectTotals.tax_qst,
        total_ttc: projectTotals.total_ttc,
        status: allPriced ? 'ready' : quote.status,
        updated_at: nowIso,
        meta: {
          ...(quote.meta || {}),
          soumission_number: soumission.soumissionNumber,
          soumission_date: soumission.date,
          escompte_pct: escomptePct,
          applied_at: nowIso,
          overhead: projectTotals.overhead,
          gaz: projectTotals.gaz,
          container: projectTotals.container,
        },
      })
      .eq('id', quote.id)
      .eq('customer_id', customerId);

    if (quoteUpdateError) {
      console.error('[apply-supplier-pricing] quote update error', quoteUpdateError);
      return res.status(500).json({ error: 'Erreur mise à jour du devis' });
    }

    // Build expense rows per matched item + project fees
    const expenseRows = [];
    updatedLineItems.forEach((li) => {
      if (li._cost > 0 && li._match_status !== 'unmatched') {
        const qty = li.qty || 1;
        expenseRows.push({
          customer_id: customerId,
          job_id: parseInt(jobId, 10),
          category: 'materiel_fournisseur',
          description: `[${li.type || 'Article'}] ${li.model || ''} ${qty}x`.replace(/\s+/g, ' ').trim(),
          total: Math.round(li._cost * qty * 100) / 100,
          subtotal: Math.round(li._cost * qty * 100) / 100,
          source: 'soumission_fournisseur',
          source_ref: soumission.soumissionNumber || null,
          vendor: soumission.fournisseur || 'Royalty',
          paid_at: nowIso.slice(0, 10),
        });
      }
    });

    // Fixed project expenses
    expenseRows.push({
      customer_id: customerId,
      job_id: parseInt(jobId, 10),
      category: 'overhead',
      description: 'Frais généraux projet',
      total: projectTotals.overhead,
      subtotal: projectTotals.overhead,
      source: 'soumission_fournisseur',
      paid_at: nowIso.slice(0, 10),
    });
    expenseRows.push({
      customer_id: customerId,
      job_id: parseInt(jobId, 10),
      category: 'gaz_carburant',
      description: 'Gaz / carburant visite',
      total: projectTotals.gaz,
      subtotal: projectTotals.gaz,
      source: 'soumission_fournisseur',
      paid_at: nowIso.slice(0, 10),
    });

    if (expenseRows.length > 0) {
      const { error: expErr } = await supabase.from('expenses').insert(expenseRows);
      if (expErr) {
        // Non-fatal — prices applied, accounting rows failed
        console.error('[apply-supplier-pricing] expense insert error', expErr);
      }
    }

    // Update job status + quote_amount (only flip to awaiting_client_approval if all priced)
    await supabase
      .from('jobs')
      .update({
        status: allPriced ? 'awaiting_client_approval' : job.status,
        quote_amount: projectTotals.subtotal,
        updated_at: nowIso,
      })
      .eq('id', jobId)
      .eq('customer_id', customerId);

    // Log job_event
    await supabase
      .from('job_events')
      .insert({
        job_id: parseInt(jobId, 10),
        customer_id: customerId,
        event_type: 'supplier_pricing_applied',
        payload: {
          matched,
          unmatched,
          partial_matches: partialMatches.length,
          escompte_pct: escomptePct,
          soumission_number: soumission.soumissionNumber,
          subtotal: projectTotals.subtotal,
          total_ttc: projectTotals.total_ttc,
          overhead: projectTotals.overhead,
          gaz: projectTotals.gaz,
          container: projectTotals.container,
          all_priced: allPriced,
        },
      });

    return res.status(200).json({
      success: true,
      matched,
      unmatched,
      partial_matches: partialMatches.length,
      all_priced: allPriced,
      subtotal: projectTotals.subtotal,
      tax_gst: projectTotals.tax_gst,
      tax_qst: projectTotals.tax_qst,
      total_ttc: projectTotals.total_ttc,
      overhead: projectTotals.overhead,
      gaz: projectTotals.gaz,
      container: projectTotals.container,
      escompte_pct: escomptePct,
      items_preview: updatedLineItems.slice(0, 5),
    });
  } catch (err) {
    console.error('[apply-supplier-pricing]', err);
    return res.status(500).json({ error: err.message || 'Erreur serveur' });
  } finally {
    for (const fp of uploadedFiles) {
      try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch {}
    }
  }
}
