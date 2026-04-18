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
import { computeClientPrice } from '../../../../lib/devis/pricing';

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

    const pricingParams = { escomptePct, markupPct: 20, perLinearInch: 3, minPerWindow: 400 };

    let matched = 0;
    let unmatched = 0;
    const partialMatches = [];

    const updatedLineItems = existingLineItems.map((li, i) => {
      const enriched = enrichedItems.find((e) => e._li_index === i);
      if (!enriched || !enriched.matched || enriched.unitPrice == null) {
        unmatched++;
        return { ...li, unit_price: null, total: null, _match_status: 'unmatched' };
      }

      const { clientUnit, clientTotal } = computeClientPrice(
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

      // Flag partial/dims-only matches for UI warning
      const isPartial = enriched.soumissionItemNumber == null;
      if (isPartial) partialMatches.push(i);

      matched++;
      return {
        ...li,
        unit_price: clientUnit,
        total: clientTotal,
        _list_price: enriched.unitPrice,
        _soumission_item: enriched.soumissionItemNumber,
        _match_status: isPartial ? 'partial' : 'matched',
      };
    });

    // Compute totals
    const subtotal = updatedLineItems.reduce((s, li) => s + (li.total || 0), 0);
    const tax_gst = subtotal * 0.05;
    const tax_qst = subtotal * 0.09975;
    const total_ttc = subtotal + tax_gst + tax_qst;

    // Update quote
    const { error: quoteUpdateError } = await supabase
      .from('quotes')
      .update({
        line_items: updatedLineItems,
        subtotal: Math.round(subtotal * 100) / 100,
        tax_gst: Math.round(tax_gst * 100) / 100,
        tax_qst: Math.round(tax_qst * 100) / 100,
        total_ttc: Math.round(total_ttc * 100) / 100,
        status: 'ready',
        updated_at: new Date().toISOString(),
        meta: {
          soumission_number: soumission.soumissionNumber,
          soumission_date: soumission.date,
          escompte_pct: escomptePct,
          applied_at: new Date().toISOString(),
        },
      })
      .eq('id', quote.id)
      .eq('customer_id', customerId);

    if (quoteUpdateError) {
      console.error('[apply-supplier-pricing] quote update error', quoteUpdateError);
      return res.status(500).json({ error: 'Erreur mise à jour du devis' });
    }

    // Update job status + quote_amount
    await supabase
      .from('jobs')
      .update({
        status: 'awaiting_client_approval',
        quote_amount: Math.round(subtotal * 100) / 100,
        updated_at: new Date().toISOString(),
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
          subtotal: Math.round(subtotal * 100) / 100,
          total_ttc: Math.round(total_ttc * 100) / 100,
        },
      });

    return res.status(200).json({
      success: true,
      matched,
      unmatched,
      partial_matches: partialMatches.length,
      subtotal: Math.round(subtotal * 100) / 100,
      tax_gst: Math.round(tax_gst * 100) / 100,
      tax_qst: Math.round(tax_qst * 100) / 100,
      total_ttc: Math.round(total_ttc * 100) / 100,
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
