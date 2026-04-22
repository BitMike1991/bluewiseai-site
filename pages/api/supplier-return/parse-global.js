/**
 * POST /api/supplier-return/parse-global
 *
 * Upload a Royalty soumission PDF. Parse it, then cross-match ALL quotes
 * for this customer that are awaiting_supplier. Returns 3-bucket response:
 *   - matches:                  auto-matched (exact/partial) — ready to apply
 *   - unmatched_quote_items:    quote items with NO soumission match (+ suggestions)
 *   - unmatched_soumission_items: soumission items not dispatched to any quote (+ suggestions)
 *
 * Auth: session customer_id (getAuthContext). Multi-tenant strict.
 * Max: 10 MB PDF only.
 * Idempotent read: never writes anything — apply-dispatch does writes.
 */

import formidable from 'formidable';
import fs from 'fs';
import os from 'os';
import path from 'path';
// Import pdf-parse lib directly to avoid the broken index.js which runs
// readFileSync('./test/data/05-versions-space.pdf') at module load time —
// that path doesn't exist in Vercel's serverless environment and causes
// "The string did not match the expected pattern" crash on every upload.
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { getAuthContext } from '../../../lib/supabaseServer';
import { parseDocuments } from '../../../lib/devis/parser';
import { parseFractionalInch, modelFamily } from '../../../lib/devis/matcher';
import { computeClientPrice, computeHardcodedPrice, detectHardcodedType, DEFAULT_PRICING } from '../../../lib/devis/pricing';

export const config = { api: { bodyParser: false } };

const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ── Matching helpers ──────────────────────────────────────────────────────────

function normalizeModel(model) {
  if (!model) return '';
  const m = String(model).toUpperCase().trim();
  if (/^C2/.test(m)) return 'C2';
  if (/^C3/.test(m)) return 'C3';
  if (/^BS1/.test(m)) return 'BS1';
  if (/^G1/.test(m)) return 'G1';
  return m;
}

function parseDim(dim) {
  if (!dim) return { w: NaN, h: NaN };
  if (typeof dim === 'string') {
    const parts = dim.split(/[xX×]/);
    if (parts.length >= 2) {
      return { w: parseFractionalInch(parts[0].trim()), h: parseFractionalInch(parts[1].trim()) };
    }
    return { w: NaN, h: NaN };
  }
  return { w: parseFractionalInch(dim.width), h: parseFractionalInch(dim.height) };
}

function dimDistance(a, b) {
  const da = parseDim(a);
  const db = parseDim(b);
  if (isNaN(da.w) || isNaN(da.h) || isNaN(db.w) || isNaN(db.h)) return Infinity;
  return Math.max(Math.abs(da.w - db.w), Math.abs(da.h - db.h));
}

function dimsMatch(a, b, tol = 1) {
  return dimDistance(a, b) <= tol;
}

/**
 * Determine match confidence between a quote line item and a soumission item.
 * Returns: 'exact' | 'partial' | 'wide' | 'family_wide' | null
 */
function matchConfidence(quoteItem, souItem) {
  const qModel = normalizeModel(quoteItem.model || quoteItem.config_code || '');
  const sModel = normalizeModel(souItem.model || '');
  const qDims = quoteItem.dimensions;
  const sDims = souItem.dimensions;

  // Branch 1: exact model + dims within 1"
  if (qModel === sModel && dimsMatch(qDims, sDims, 1)) return 'exact';

  // Branch 2: dims within 1" + qty match (model may differ between BC/soumission)
  if (dimsMatch(qDims, sDims, 1) && Number(quoteItem.qty) === Number(souItem.qty)) return 'partial';

  // Branch 3: dims within 1.5" (model ignored)
  if (dimsMatch(qDims, sDims, 1.5)) return 'partial';

  // Branch 4: same model family + dims within 5"
  if (modelFamily(qModel) === modelFamily(sModel) && dimsMatch(qDims, sDims, 5)) return 'wide';

  return null;
}

/**
 * Apply pricing formula to compute new_unit_price + new_total.
 */
function applyPricing(quoteItem, souItem, pricingParams, hardcodedConfig) {
  const item = {
    unitPrice: souItem.unitPrice,
    dimensions: quoteItem.dimensions || souItem.dimensions,
    qty: quoteItem.qty || 1,
    type: quoteItem.type || '',
    model: quoteItem.model || quoteItem.config_code || '',
    description: quoteItem.description || '',
    specs: quoteItem.specs || '',
    sides: quoteItem.sides || 0,
  };
  try {
    return computeClientPrice(item, pricingParams, hardcodedConfig);
  } catch {
    return computeClientPrice(item, pricingParams, null);
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user)       return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });

  // ── 1. Parse PDF upload ───────────────────────────────────────────────────
  const tmpDir = path.join(os.tmpdir(), 'bw-supplier-global');
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
    const originalName = file.originalFilename || 'soumission.pdf';

    const buffer = fs.readFileSync(file.filepath);
    const pdfResult = await pdfParse(buffer);
    const rawText = pdfResult.text || '';

    if (!rawText.trim()) {
      return res.status(422).json({ error: 'PDF vide ou non lisible.' });
    }

    const { soumission: parsed } = await parseDocuments([
      { filename: originalName, type: 'soumission', text: rawText.slice(0, 25000) },
    ]);

    if (!parsed || !parsed.items || parsed.items.length === 0) {
      return res.status(422).json({
        error: "Aucun article trouvé. Vérifiez que c'est bien une soumission Royalty.",
      });
    }

    soumission = parsed;
  } finally {
    for (const fp of uploadedFiles) {
      try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch {}
    }
  }

  // ── 2. Load customer pricing config ──────────────────────────────────────
  const { data: customer } = await supabase
    .from('customers')
    .select('quote_config')
    .eq('id', customerId)
    .single();

  const hardcodedConfig = customer?.quote_config?.hardcoded_pricing || null;
  const escomptePct = soumission.escomptePct || 0;
  const customerPricing = customer?.quote_config?.pricing || {};
  const pricingParams = { ...DEFAULT_PRICING, ...customerPricing, escomptePct };

  // ── 3. Load ALL quotes in awaiting_supplier status ────────────────────────
  const { data: quotes, error: quotesError } = await supabase
    .from('quotes')
    .select('id, quote_number, project_ref, job_id, line_items, status')
    .eq('customer_id', customerId)
    .eq('status', 'awaiting_supplier')
    .order('id');

  if (quotesError) {
    console.error('[parse-global] quotes fetch error', quotesError);
    return res.status(500).json({ error: 'Erreur chargement des devis.' });
  }

  if (!quotes || quotes.length === 0) {
    return res.status(200).json({
      fournisseur: soumission.fournisseur || 'Royalty',
      escompte_pct: escomptePct,
      parsed_items_count: soumission.items.length,
      quotes_touched: 0,
      matches: [],
      unmatched_quote_items: [],
      unmatched_soumission_items: soumission.items.map((si, idx) => ({
        parsed_idx: idx,
        model: si.model,
        dims: `${si.dimensions?.width} × ${si.dimensions?.height}`,
        listPrice: si.unitPrice,
        possible_targets: [],
      })),
      _parsed_items: soumission.items,
    });
  }

  // Load client_name from jobs
  const jobIds = [...new Set(quotes.map(q => q.job_id).filter(Boolean))];
  let jobMap = {};
  if (jobIds.length > 0) {
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, client_name')
      .in('id', jobIds)
      .eq('customer_id', customerId);
    if (jobs) {
      for (const j of jobs) jobMap[j.id] = j.client_name || '';
    }
  }

  // ── 4. Cross-match: for each soumission item, find best quote item ────────
  //
  // Track usage:
  //   souUsed[idx] = { quote_id, item_idx, confidence } | null
  //   quoteUsed[quoteId:itemIdx] = parsed_idx | null
  //
  const souItems = soumission.items.map((si, idx) => ({
    ...si,
    _idx: idx,
    _used: false,
  }));

  // Declare result buckets early so hardcoded items can push into matches during build
  const matches = [];
  const unmatchedQuoteItems = [];
  const quotesTouched = new Set();

  // Build flat list of all quote items
  const allQuoteItems = [];
  for (const quote of quotes) {
    const lineItems = Array.isArray(quote.line_items) ? quote.line_items : [];
    for (let idx = 0; idx < lineItems.length; idx++) {
      const li = lineItems[idx];
      // Skip items already priced (idempotency guard)
      if (li._price_applied_at) continue;

      // Hardcoded items: auto-price directly — no soumission match needed
      if (hardcodedConfig) {
        const hc = detectHardcodedType(li, hardcodedConfig);
        if (hc) {
          const priced = computeHardcodedPrice(
            {
              dimensions: li.dimensions,
              qty: li.qty || 1,
              sides: li.sides || 0,
            },
            hc,
            pricingParams
          );
          matches.push({
            quote_number:     quote.quote_number || `q-${quote.id}`,
            project_ref:      quote.project_ref || null,
            quote_id:         quote.id,
            job_id:           quote.job_id,
            client_name:      jobMap[quote.job_id] || '',
            item_idx:         idx,
            parsed_idx:       null,
            match_confidence: 'hardcoded',
            parsed_model:     hc.config_key,
            parsed_dims:      null,
            listPrice:        hc.base_cost,
            new_unit_price:   priced.clientUnit,
            new_total:        priced.clientTotal,
            hardcoded_type:   hc.config_key,
          });
          quotesTouched.add(quote.id);
          continue;
        }
      }

      allQuoteItems.push({
        quote_id: quote.id,
        quote_number: quote.quote_number || `q-${quote.id}`,
        project_ref: quote.project_ref || null,
        job_id: quote.job_id,
        client_name: jobMap[quote.job_id] || '',
        item_idx: idx,
        item: li,
        _matched_sou_idx: null,
        _confidence: null,
      });
    }
  }

  // Two-pass matching: exact first (branches 1-3), then wide (branch 4)
  // Pass 1: try exact/partial matches (tolerance ≤ 1.5")
  for (const qi of allQuoteItems) {
    if (qi._matched_sou_idx !== null) continue;
    for (const si of souItems) {
      if (si._used) continue;
      const conf = matchConfidence(qi.item, si);
      if (conf === 'exact' || conf === 'partial') {
        qi._matched_sou_idx = si._idx;
        qi._confidence = conf;
        si._used = true;
        break;
      }
    }
  }

  // Pass 2: wide matches (tolerance ≤ 5", same family) — only if still unmatched
  for (const qi of allQuoteItems) {
    if (qi._matched_sou_idx !== null) continue;
    for (const si of souItems) {
      if (si._used) continue;
      const conf = matchConfidence(qi.item, si);
      if (conf === 'wide') {
        // Wide matches go to unmatched_quote_items, NOT auto-matches
        // We annotate the best wide suggestion but don't auto-assign
        qi._wide_suggestion = si._idx;
        break;
      }
    }
  }

  // ── 5. Build results ──────────────────────────────────────────────────────
  // (matches, unmatchedQuoteItems, quotesTouched already declared above — hardcoded
  //  items were pushed into matches during allQuoteItems build above)

  for (const qi of allQuoteItems) {
    if (qi._matched_sou_idx !== null) {
      // Auto-match — compute pricing
      const si = souItems[qi._matched_sou_idx];
      let priceResult = { clientUnit: 0, clientTotal: 0 };
      try {
        priceResult = applyPricing(qi.item, si, pricingParams, hardcodedConfig);
      } catch {}

      matches.push({
        quote_number:     qi.quote_number,
        project_ref:      qi.project_ref || null,
        quote_id:         qi.quote_id,
        job_id:           qi.job_id,
        client_name:      qi.client_name,
        item_idx:         qi.item_idx,
        parsed_idx:       qi._matched_sou_idx,
        match_confidence: qi._confidence,
        parsed_model:     si.model,
        parsed_dims:      `${si.dimensions?.width} × ${si.dimensions?.height}`,
        listPrice:        si.unitPrice,
        new_unit_price:   priceResult.clientUnit,
        new_total:        priceResult.clientTotal,
      });
      quotesTouched.add(qi.quote_id);
    } else {
      // Unmatched quote item — build possible_matches from soumission
      const qModel = normalizeModel(qi.item.model || qi.item.config_code || '');
      const qFamily = modelFamily(qModel);

      // Find same family soumission items, sorted by dim distance
      const suggestions = souItems
        .map(si => {
          const sModel = normalizeModel(si.model || '');
          if (modelFamily(sModel) !== qFamily) return null;
          const dist = dimDistance(qi.item.dimensions, si.dimensions);
          return { parsed_idx: si._idx, model: si.model, dims: `${si.dimensions?.width} × ${si.dimensions?.height}`, price: si.unitPrice, dim_delta: isFinite(dist) ? Math.round(dist * 4) / 4 : null };
        })
        .filter(Boolean)
        .sort((a, b) => (a.dim_delta ?? 999) - (b.dim_delta ?? 999))
        .slice(0, 5);

      // Also include the wide_suggestion if not already in suggestions
      if (qi._wide_suggestion != null && !suggestions.find(s => s.parsed_idx === qi._wide_suggestion)) {
        const si = souItems[qi._wide_suggestion];
        const dist = dimDistance(qi.item.dimensions, si.dimensions);
        suggestions.unshift({ parsed_idx: si._idx, model: si.model, dims: `${si.dimensions?.width} × ${si.dimensions?.height}`, price: si.unitPrice, dim_delta: isFinite(dist) ? Math.round(dist * 4) / 4 : null });
      }

      unmatchedQuoteItems.push({
        quote_number:       qi.quote_number,
        project_ref:        qi.project_ref || null,
        quote_id:           qi.quote_id,
        job_id:             qi.job_id,
        client_name:        qi.client_name,
        item_idx:           qi.item_idx,
        item_description:   qi.item.description || `${qi.item.type || ''} ${qi.item.model || qi.item.config_code || ''}`.trim(),
        item_type:          qi.item.type || '',
        item_model:         qi.item.model || qi.item.config_code || '',
        item_dims:          qi.item.dimensions ? `${qi.item.dimensions.width} × ${qi.item.dimensions.height}` : '—',
        possible_matches:   suggestions,
      });
    }
  }

  // ── 6. Unmatched soumission items ─────────────────────────────────────────
  const unmatchedSoumissionItems = souItems
    .filter(si => !si._used)
    .map(si => {
      const sModel = normalizeModel(si.model || '');
      const sFamily = modelFamily(sModel);

      // Find same family quote items as potential targets
      const potentialTargets = allQuoteItems
        .filter(qi => {
          const qModel = normalizeModel(qi.item.model || qi.item.config_code || '');
          return modelFamily(qModel) === sFamily;
        })
        .map(qi => {
          const dist = dimDistance(si.dimensions, qi.item.dimensions);
          return {
            quote_number:      qi.quote_number,
            project_ref:       qi.project_ref || null,
            quote_id:          qi.quote_id,
            item_idx:          qi.item_idx,
            item_description:  qi.item.description || `${qi.item.type || ''} ${qi.item.model || ''}`.trim(),
            dims_delta:        isFinite(dist) ? Math.round(dist * 4) / 4 : null,
          };
        })
        .sort((a, b) => (a.dims_delta ?? 999) - (b.dims_delta ?? 999))
        .slice(0, 5);

      return {
        parsed_idx:      si._idx,
        model:           si.model,
        dims:            `${si.dimensions?.width} × ${si.dimensions?.height}`,
        listPrice:       si.unitPrice,
        qty:             si.qty,
        possible_targets: potentialTargets,
      };
    });

  // ── 7. Return ─────────────────────────────────────────────────────────────
  return res.status(200).json({
    fournisseur:               soumission.fournisseur || 'Royalty',
    escompte_pct:              escomptePct,
    soumission_number:         soumission.soumissionNumber,
    parsed_items_count:        soumission.items.length,
    quotes_scanned:            quotes.length,
    quotes_touched:            quotesTouched.size,
    matches,
    unmatched_quote_items:     unmatchedQuoteItems,
    unmatched_soumission_items: unmatchedSoumissionItems,
    // Pass full parsed items back so apply-dispatch can reference them by index
    _parsed_items: soumission.items,
    _pricing_params: pricingParams,
  });
}
