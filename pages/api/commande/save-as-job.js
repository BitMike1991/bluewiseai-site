/**
 * POST /api/commande/save-as-job
 *
 * Creates or updates a jobs + quotes row from a commande draft state.
 * P-A: also creates a lead and links jobs.lead_id + commande_drafts.lead_id.
 *      Duplicate prevention: if draft already has a lead_id, reuse it.
 * P-B: phone-based lead matching before creating new lead.
 *      Also accepts prefilled lead_id from CRM via commande_state.prefill_lead_id.
 * Auth: pur_hub_auth cookie (HMAC validation).
 * customer_id hardcoded 9 — this route is PUR-only.
 *
 * Body: { draft_id?: string (UUID), commande_state: { project, items, supplier, prefill_lead_id? } }
 * Returns: { success, job_id, job_id_human, quote_number, url, lead_id?, lead_matched? }
 */

import crypto from 'crypto';
import { sbInsert, sbSelect, sbUpdate, sbRpc } from '@/lib/supabase-server';
import { getAuthContext, getSupabaseServerClient } from '../../../lib/supabaseServer';
import { resolveDivisionId } from '../../../lib/divisions';

// PUR Construction. This endpoint is gated to session users whose customer_id
// matches — enforcement happens in the handler. The constant keeps legacy
// helper signatures unchanged.
const CUSTOMER_ID = 9;
const BW_CRM_BASE = 'https://www.bluewiseai.com/platform/jobs';

// CSPRNG quote token — keeps a date prefix for human readability but uses
// 8 hex chars of crypto entropy instead of a 4-digit random (keyspace was
// only 10K/day → trivial to enumerate).
function generateQuoteNumber() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(4).toString('hex');
  return `PUR-${today}-${rand}`;
}

/**
 * Normalize a phone number to E.164 Canada format (+1XXXXXXXXXX).
 * Returns null if not a valid 10-digit number.
 */
function normalizePhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  // Take last 10 digits (handles leading country code)
  const last10 = digits.slice(-10);
  if (last10.length !== 10) return null;
  return `+1${last10}`;
}

/**
 * Extract last 10 digits from a raw phone string.
 * Returns null if fewer than 10 digits available.
 */
function extractLast10Digits(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  const last10 = digits.slice(-10);
  return last10.length === 10 ? last10 : null;
}

/**
 * P-B: Find existing lead by phone or create a new one.
 * - If prefill_lead_id is provided, reuse that lead directly (skip matching).
 * - Else, attempt phone match against all leads for customer_id 9.
 * - Non-destructive update: only fills NULL fields (preserves existing name/email).
 * - Returns { leadId, matched, leadName }.
 */
async function findOrCreateLead(projectInfo, existingLeadId, newLeadDivisionId = null) {
  const today = new Date().toISOString().slice(0, 10);

  // If prefill_lead_id supplied (from CRM deep-link), reuse without matching
  if (existingLeadId) {
    return { leadId: existingLeadId, matched: true, leadName: null };
  }

  const phoneLast10 = extractLast10Digits(projectInfo.contact);

  if (phoneLast10) {
    // Fetch candidate leads (filter server-side — small set per tenant, fast)
    const candidates = await sbSelect('leads', {
      match: { customer_id: CUSTOMER_ID },
      columns: 'id,name,phone,email',
    }).catch(() => null);

    const match = (candidates || []).find((l) => {
      if (!l.phone) return false;
      const normalized = String(l.phone).replace(/\D/g, '').slice(-10);
      return normalized === phoneLast10;
    });

    if (match) {
      // Non-destructive patch: only fill fields that are currently NULL
      const patch = {};
      if (!match.email && projectInfo.email) patch.email = projectInfo.email;
      if (!match.name && projectInfo.client) patch.name = String(projectInfo.client).trim();
      if (Object.keys(patch).length > 0) {
        await sbUpdate('leads', { id: match.id, customer_id: CUSTOMER_ID }, patch).catch((err) => {
          console.error('[save-as-job] lead non-destructive patch failed', err.message);
        });
      }
      // Append a note about the new devis
      const noteAppend = `Nouveau devis créé via outil commande (${projectInfo.ref || 'sans ref'}) le ${today}`;
      const updatedName = patch.name || match.name || null;
      await sbUpdate(
        'leads',
        { id: match.id, customer_id: CUSTOMER_ID },
        { notes: noteAppend, updated_at: new Date().toISOString() }
      ).catch(() => {});
      return { leadId: match.id, matched: true, leadName: updatedName || match.name };
    }
  }

  // No match — create new lead (P-A logic)
  const normalizedPhone = normalizePhone(projectInfo.contact);
  const leadBody = {
    customer_id: CUSTOMER_ID,
    division_id: newLeadDivisionId,
    name: String(projectInfo.client).trim(),
    phone: normalizedPhone,
    email: projectInfo.email || null,
    status: 'quoted',
    address: projectInfo.address || null,
    source: 'commande_tool',
    notes: `Lead auto-créé depuis outil devis. Projet ${projectInfo.ref || 'sans réf'}.`,
  };
  const newLead = await sbInsert('leads', leadBody);
  return { leadId: newLead?.id || null, matched: false, leadName: String(projectInfo.client).trim() };
}

/**
 * Build line_items array with all PUR fields + tracking metadata.
 * spec string is assembled from the item's stored fields (not calling buildItemSpecs
 * client-side lib — we reconstruct a compact server-side version).
 */
function buildLineItems(items, globalSupplier) {
  return (items || []).map((it, i) => {
    // Determine item-level supplier
    const itemSupplier = it.supplier || globalSupplier || 'royalty';

    // Build a human-readable specs string from stored item fields
    const specParts = [];
    if (it.collection || it.collection_info?.name) {
      specParts.push(`Collection ${it.collection_info?.name || it.collection}`);
    }
    if (it.color_name || it.color) {
      specParts.push(`Couleur ${it.color_name || it.color}`);
    }
    if (it.thermos) {
      const thermosLabels = {
        double: 'Thermos 7/8" Low-E Argon',
        triple: 'Thermos 1 1/4" triple Low-E Argon',
        lamine: 'Thermos laminé',
        givre: 'Thermos givré',
        gluechip: 'Thermos gluechip',
      };
      specParts.push(thermosLabels[it.thermos] || it.thermos);
    }
    if (it.glass_type) {
      specParts.push(`Verre ${it.glass_type === 'triple' ? 'Triple Low-E' : 'Double Low-E Argon'}`);
    }
    if (it.frame) specParts.push(`Cadre ${it.frame}`);
    if (it.color_ext && it.color_int) {
      specParts.push(`Couleurs ext. ${it.color_ext} / int. ${it.color_int}`);
    }
    if (it.door_model) specParts.push(`Modèle ${it.door_model}`);
    if (it.moustiquaire) specParts.push('Moustiquaire incluse');
    if (it.note) specParts.push(`Note: ${it.note}`);

    // Merge with pre-built specs string if item already has one
    const specsStr = it.specs
      ? it.specs
      : specParts.length > 0
      ? specParts.join(', ')
      : null;

    // Dimensions object — prefer explicit dimensions field, fallback to width/height
    let dimensions = it.dimensions || null;
    if (!dimensions && (it.width || it.height)) {
      dimensions = {
        width: it.width ? String(it.width) : null,
        height: it.height ? String(it.height) : null,
      };
    }

    // Short description for line item header
    const description = [
      it.window_type || it.entry_door_style || it.patio_collection || it.category,
      it.config_code || it.model || '',
      it.ouvrant || '',
    ]
      .filter(Boolean)
      .join(' ')
      .trim() || `Article ${i + 1}`;

    return {
      description,
      qty: it.qty || 1,
      unit_price: null,   // filled by supplier return (P-D)
      total: null,
      // PUR-specific identity fields
      type: it.window_type || it.entry_door_style || it.patio_collection || it.category || null,
      model: it.config_code || it.model || null,
      ouvrant: it.ouvrant || null,
      dimensions,
      specs: specsStr,
      category: it.category || null,
      collection: it.collection_info?.name || it.collection || null,
      // Factory-relevant fields surfaced for the BDC (Mikael 2026-04-22:
      // Jeremy's format needs frame_thickness, egress, thermos, moustiquaire,
      // config_code directly on the line_item so the BDC renderer doesn't
      // fall back to generic catalog defaults).
      config_code: it.config_code || null,
      color_ext: it.color_ext || it.color_name || null,
      color_int: it.color_int || it.color_name || null,
      material: it.collection === 'hybride' ? 'hybride' : (it.collection === 'pvc' ? 'upvc' : undefined),
      thermos: it.thermos || null,
      moustiquaire: it.moustiquaire ?? false,
      egress: it.egress || null,
      frame: it.frame || null,
      frame_thickness: it.frame_thickness || null,
      frame_depth: it.frame_depth || null,
      door_model: it.door_model || null,
      slab_w: it.slab_w || null,
      swing: it.swing || null,
      glass: it.glass || null,
      glass_type: it.glass_type || null,
      style_info: it.style_info || null,
      // Tracking fields
      _source: 'commande',
      _item_index: i,
      _supplier: itemSupplier,
      // SVG rendering metadata — same shape as the hub commande tool uses
      // so DevisEditor + /q/[token] can render identical sketches.
      // Without this, itemSketchSvg falls back to generic rectangles on 50%+
      // of items (panels/max/widthRatios unknown).
      _category: it.category || null,
      _window_type: it.window_type || null,
      _entry_door_style: it.entry_door_style || null,
      _patio_collection: it.patio_collection || null,
      _config: it.config || null,
    };
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth via Supabase SSR. This endpoint is PUR-specific (customer_id=9).
  const { customerId, user, role, divisionId } = await getAuthContext(req, res);
  if (!user)       return res.status(401).json({ error: 'Non autorisé' });
  if (customerId !== CUSTOMER_ID) {
    return res.status(403).json({ error: 'Ce hub est réservé à PÜR Construction' });
  }

  const { draft_id, commande_state } = req.body || {};
  const { project, items, supplier: globalSupplier, prefill_lead_id } = commande_state || {};

  // Server-side validation (mirrors client-side)
  if (!project?.client || !String(project.client).trim()) {
    return res.status(400).json({ error: 'Le nom du client est requis' });
  }
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Ajoute au moins 1 article avant d\'enregistrer' });
  }

  try {
    // ── Load existing draft state (for lead_id + job_id reuse) ──
    let existingJobId = null;
    let existingJobHumanId = null;
    let existingQuoteId = null;
    let existingQuoteNumber = null;
    let existingLeadId = null;   // P-A: reuse lead if draft already has one

    if (draft_id) {
      const drafts = await sbSelect('commande_drafts', {
        match: { id: draft_id, customer_id: CUSTOMER_ID },
        columns: 'id,job_id,lead_id',
        limit: 1,
      });
      const draft = drafts?.[0];

      if (draft?.lead_id) {
        existingLeadId = draft.lead_id;
      }

      if (draft?.job_id) {
        // Draft already linked to a job — load it
        const existingJobs = await sbSelect('jobs', {
          match: { id: draft.job_id, customer_id: CUSTOMER_ID },
          columns: 'id,job_id,lead_id',
          limit: 1,
        });
        const existingJob = existingJobs?.[0];
        if (existingJob) {
          existingJobId = existingJob.id;
          existingJobHumanId = existingJob.job_id;
          if (existingJob.lead_id) existingLeadId = existingJob.lead_id;
        }

        // Load existing quote
        const existingQuotes = await sbSelect('quotes', {
          match: { job_id: draft.job_id, customer_id: CUSTOMER_ID },
          columns: 'id,quote_number',
          limit: 1,
        });
        const existingQuote = existingQuotes?.[0];
        if (existingQuote) {
          existingQuoteId = existingQuote.id;
          existingQuoteNumber = existingQuote.quote_number;
        }
      }
    }

    const lineItems = buildLineItems(items, globalSupplier);
    const jobHumanId = project.ref || `PUR-${Date.now()}`;
    const clientAddress = project.address ? { street: project.address } : null;
    const normalizedPhone = normalizePhone(project.contact);

    // Resolve division_id for any new rows this flow creates.
    // commande tool = fenêtres/portes flow, so a scoped fenêtres user stamps
    // their own division; owner/admin gets the tenant's default (fenetres_portes).
    const admin = getSupabaseServerClient();
    const saveAsJobDivisionId = await resolveDivisionId(admin, {
      customer_id: CUSTOMER_ID,
      role,
      user_division_id: divisionId,
      lead_id: prefill_lead_id || null,
    });

    // ── P-B: Find or create lead (phone match before new insert) ──
    let leadId = existingLeadId;
    let leadMatched = false;
    let leadName = null;
    if (!leadId) {
      try {
        const result = await findOrCreateLead({ ...project }, prefill_lead_id || null, saveAsJobDivisionId);
        leadId = result.leadId;
        leadMatched = result.matched;
        leadName = result.leadName;
      } catch (err) {
        // Non-fatal — job still created without lead_id
        console.error('[save-as-job] findOrCreateLead failed', err.message || err);
        leadId = null;
      }
    } else {
      // existingLeadId from draft — mark as matched (reuse)
      leadMatched = true;
      leadName = String(project.client).trim();
    }

    if (existingJobId) {
      // ── UPDATE existing job + quote ──
      await sbUpdate(
        'jobs',
        { id: existingJobId, customer_id: CUSTOMER_ID },
        {
          client_name: String(project.client).trim(),
          client_phone: normalizedPhone || project.contact || null,
          address: project.address || null,
          client_address: clientAddress,
          lead_id: leadId,   // always sync in case it was null before
          updated_at: new Date().toISOString(),
        }
      );

      if (existingQuoteId) {
        await sbUpdate(
          'quotes',
          { id: existingQuoteId, customer_id: CUSTOMER_ID },
          {
            line_items: lineItems,
            updated_at: new Date().toISOString(),
          }
        );
      }

      // Sync lead_id back to draft
      if (draft_id && leadId) {
        await sbUpdate(
          'commande_drafts',
          { id: draft_id, customer_id: CUSTOMER_ID },
          { lead_id: leadId, updated_at: new Date().toISOString() }
        ).catch((err) => console.error('[save-as-job] draft lead_id sync failed', err.message));
      }

      return res.status(200).json({
        success: true,
        job_id: existingJobId,
        job_id_human: existingJobHumanId,
        quote_number: existingQuoteNumber,
        url: `${BW_CRM_BASE}/${existingJobId}`,
        lead_id: leadId,
        lead_matched: leadMatched,
        lead_name: leadName || String(project.client).trim(),
        updated: true,
      });
    }

    // ── CREATE new job ──
    const newJob = await sbInsert('jobs', {
      customer_id: CUSTOMER_ID,
      division_id: saveAsJobDivisionId,
      job_id: jobHumanId,
      client_name: String(project.client).trim(),
      client_phone: normalizedPhone || project.contact || null,
      client_email: (project.email && String(project.email).trim()) || null,
      address: project.address || null,
      client_address: clientAddress,
      lead_id: leadId,
      status: 'measuring',
      project_type: 'residential',
      project_description: 'Fourniture et installation de portes et fenêtres',
      intake_source: 'commande_hub',
    });

    if (!newJob?.id) {
      throw new Error('Job insert returned no id');
    }

    const newJobDbId = newJob.id;
    const quoteNumber = generateQuoteNumber();

    // Atomic claim of the next sequential project_ref for this tenant.
    // Fallback to null if the RPC fails — devis still functions without it,
    // the column is nullable and project_ref can be backfilled later.
    let projectRef = null;
    try {
      projectRef = await sbRpc('claim_next_project_ref', {
        p_customer_id: CUSTOMER_ID,
        p_prefix: 'PUR',
      });
    } catch (err) {
      console.warn('[save-as-job] claim_next_project_ref failed:', err.message);
    }

    // ── CREATE quote with null prices (awaiting_supplier) ──
    await sbInsert('quotes', {
      customer_id: CUSTOMER_ID,
      division_id: saveAsJobDivisionId,
      job_id: newJobDbId,
      quote_number: quoteNumber,
      project_ref: projectRef,
      created_by_user_id: user.id,
      version: 1,
      status: 'awaiting_supplier',
      line_items: lineItems,
      subtotal: 0,
      tax_gst: 0,
      tax_qst: 0,
      total_ttc: 0,
      valid_until: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    });

    // ── INSERT job_event ──
    await sbInsert('job_events', {
      job_id: newJobDbId,
      customer_id: CUSTOMER_ID,
      event_type: 'job_created',
      payload: {
        source: 'commande_hub',
        draft_id: draft_id || null,
        lead_id: leadId,
        items_count: items.length,
      },
    });

    // ── Link commande_drafts.job_id + lead_id if draft_id provided ──
    if (draft_id) {
      await sbUpdate(
        'commande_drafts',
        { id: draft_id, customer_id: CUSTOMER_ID },
        {
          job_id: newJobDbId,
          lead_id: leadId,
          updated_at: new Date().toISOString(),
        }
      ).catch((err) => console.error('[save-as-job] draft link failed', err.message));
    }

    return res.status(201).json({
      success: true,
      job_id: newJobDbId,
      job_id_human: jobHumanId,
      quote_number: quoteNumber,
      url: `${BW_CRM_BASE}/${newJobDbId}`,
      lead_id: leadId,
      lead_matched: leadMatched,
      lead_name: leadName || String(project.client).trim(),
      updated: false,
    });
  } catch (err) {
    console.error('[commande/save-as-job]', err);
    return res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
}
