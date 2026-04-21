/**
 * POST /api/toiture/save-as-job
 *
 * Toiture calculator → full CRM parity with the fenêtres commande flow.
 * Creates:
 *   - lead (phone-match with existing PUR leads, or new, stamped division=toiture)
 *   - job (status=measuring, division=toiture)
 *   - quote (status=awaiting_supplier, client-facing line items only — no margin)
 *   - roof_quotes row populated with job_id + project_ref
 *
 * Reuses the fenêtres /q/[token] acceptance → contract → sign → payment chain
 * unchanged. Client never sees internal cost, margin, or supplier breakdown.
 *
 * Body: { client, measures, shingle_type, result, payload? }
 *   client:    { name, phone, email?, address?, city?, postal? }
 *   measures:  { pitch_category, ... }
 *   result:    toitureCalc output (revenue_ht, total_client_ttc, surface_sqft,
 *              net_profit, net_margin_pct, ...)
 *   payload:   full state_json for roof_quotes.payload (internal record)
 */

import crypto from 'crypto';
import { getAuthContext, getSupabaseServerClient } from '../../../lib/supabaseServer';
import { resolveDivisionId } from '../../../lib/divisions';

const CUSTOMER_ID = 9;         // PUR Construction
const TOITURE_SLUG = 'toiture';
const BW_CRM_BASE = 'https://www.bluewiseai.com/platform/jobs';

function generateQuoteNumber() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(4).toString('hex');
  return `PUR-${today}-${rand}`;
}

function generateRoofToken(len = 12) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz';
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

function normalizePhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  const last10 = digits.slice(-10);
  return last10.length === 10 ? `+1${last10}` : null;
}

function phoneLast10(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  const last10 = digits.slice(-10);
  return last10.length === 10 ? last10 : null;
}

/**
 * Client-facing line items for a toiture quote.
 * One consolidated line — no margin / supplier breakdown exposed.
 */
function buildToitureLineItems({ result, shingle_type, measures }) {
  const surface = Number(result?.surface_sqft) || 0;
  const revenue = Number(result?.revenue_ht) || 0;
  const shingle = shingle_type || measures?.shingle_type || 'bardeaux d\u2019asphalte';
  const pitch = measures?.pitch_category ? ` · pente ${measures.pitch_category}` : '';

  return [
    {
      description: `Réfection complète de toiture — ${surface} pi²${pitch}`,
      specs: `Matériau: ${shingle}. Fourniture, installation et disposition incluses.`,
      qty: 1,
      unit_price: revenue,
      total: revenue,
    },
  ];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customerId, user, role, divisionId } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: 'Non autorisé' });
  if (customerId !== CUSTOMER_ID) {
    return res.status(403).json({ error: 'Ce hub est réservé à PÜR Construction' });
  }

  const body = req.body || {};
  const client = body.client || {};
  const result = body.result || {};
  const measures = body.measures || {};

  if (!client.name || !String(client.name).trim()) {
    return res.status(400).json({ error: 'Le nom du client est requis' });
  }
  if (!client.phone) {
    return res.status(400).json({ error: 'Le téléphone du client est requis' });
  }
  if (result.total_client_ttc == null || result.surface_sqft == null) {
    return res.status(400).json({ error: 'Calcul incomplet — total_client_ttc et surface_sqft requis' });
  }

  const admin = getSupabaseServerClient();

  // Division resolution. Toiture calc = toiture division by default (slug=toiture).
  // Owner/admin saves also land in toiture (the tool is division-tagged).
  let toitureDivisionId = null;
  {
    const { data: divRow } = await admin
      .from('divisions')
      .select('id')
      .eq('customer_id', CUSTOMER_ID)
      .eq('slug', TOITURE_SLUG)
      .eq('active', true)
      .maybeSingle();
    toitureDivisionId = divRow?.id || null;
  }
  // Fall back to resolver if toiture division seed is missing.
  if (!toitureDivisionId) {
    toitureDivisionId = await resolveDivisionId(admin, {
      customer_id: CUSTOMER_ID,
      role,
      user_division_id: divisionId,
    });
  }

  try {
    // ── 1. Find or create lead (phone match, non-destructive patch) ──
    const last10 = phoneLast10(client.phone);
    const normalizedPhone = normalizePhone(client.phone);
    let leadId = null;
    let leadMatched = false;
    const today = new Date().toISOString().slice(0, 10);

    if (last10) {
      const { data: candidates } = await admin
        .from('leads')
        .select('id, name, phone, email, division_id')
        .eq('customer_id', CUSTOMER_ID);

      const match = (candidates || []).find((l) => {
        if (!l.phone) return false;
        const n = String(l.phone).replace(/\D/g, '').slice(-10);
        return n === last10;
      });

      if (match) {
        leadId = match.id;
        leadMatched = true;
        const patch = {};
        if (!match.email && client.email) patch.email = client.email;
        if (!match.name && client.name) patch.name = String(client.name).trim();
        // Non-destructive division retag: only set if currently NULL. Never overwrite
        // a fenêtres lead's division without explicit owner action.
        if (!match.division_id) patch.division_id = toitureDivisionId;
        patch.updated_at = new Date().toISOString();
        patch.notes = `Nouveau devis toiture (${today})`;
        if (Object.keys(patch).length > 0) {
          await admin
            .from('leads')
            .update(patch)
            .eq('id', match.id)
            .eq('customer_id', CUSTOMER_ID);
        }
      }
    }

    if (!leadId) {
      const { data: newLead, error: leadErr } = await admin
        .from('leads')
        .insert({
          customer_id: CUSTOMER_ID,
          division_id: toitureDivisionId,
          name: String(client.name).trim(),
          phone: normalizedPhone,
          email: client.email || null,
          city: client.city || null,
          status: 'quoted',
          source: 'toiture_calc',
          notes: `Lead auto-créé depuis calculateur toiture (${today}).`,
          first_seen_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (leadErr) throw new Error('Lead insert failed: ' + leadErr.message);
      leadId = newLead.id;
    }

    // ── 2. Create job ──
    const quoteNumber = generateQuoteNumber();
    const clientAddress = client.address
      ? { street: client.address, city: client.city || '', postal_code: client.postal || '' }
      : null;

    const { data: newJob, error: jobErr } = await admin
      .from('jobs')
      .insert({
        customer_id: CUSTOMER_ID,
        division_id: toitureDivisionId,
        job_id: quoteNumber,
        lead_id: leadId,
        client_name: String(client.name).trim(),
        client_phone: normalizedPhone || client.phone,
        client_email: client.email || null,
        client_address: clientAddress,
        address: client.address || null,
        status: 'measuring',
        project_type: 'roofing',
        project_description: `Réfection de toiture — ${result.surface_sqft} pi²`,
        intake_source: 'toiture_calc',
        quote_amount: Number(result.total_client_ttc) || 0,
      })
      .select('id, job_id')
      .single();
    if (jobErr) throw new Error('Job insert failed: ' + jobErr.message);

    // ── 3. Claim project_ref ──
    let projectRef = null;
    try {
      const { data: claimed } = await admin.rpc('claim_next_project_ref', {
        p_customer_id: CUSTOMER_ID,
        p_prefix: 'PUR',
      });
      if (typeof claimed === 'string') projectRef = claimed;
    } catch (err) {
      console.warn('[toiture/save-as-job] claim_next_project_ref failed:', err?.message);
    }

    // ── 4. Create client-facing quote (line items without margin) ──
    const lineItems = buildToitureLineItems({ result, shingle_type: body.shingle_type, measures });
    const subtotal = Number(result.revenue_ht) || 0;
    const taxGst = Number(result.tax_gst_sale) || 0;
    const taxQst = Number(result.tax_qst_sale) || 0;
    const totalTtc = Number(result.total_client_ttc) || 0;

    const { data: newQuote, error: quoteErr } = await admin
      .from('quotes')
      .insert({
        customer_id: CUSTOMER_ID,
        division_id: toitureDivisionId,
        job_id: newJob.id,
        quote_number: quoteNumber,
        project_ref: projectRef,
        created_by_user_id: user.id,
        version: 1,
        status: 'awaiting_supplier',
        line_items: lineItems,
        subtotal,
        tax_gst: taxGst,
        tax_qst: taxQst,
        total_ttc: totalTtc,
        valid_until: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        meta: { source: 'toiture_calc', surface_sqft: result.surface_sqft, pitch: measures.pitch_category || null },
      })
      .select('id')
      .single();
    if (quoteErr) throw new Error('Quote insert failed: ' + quoteErr.message);

    // ── 5. Persist roof_quotes (internal record — margin & costs) ──
    const roofToken = generateRoofToken(12);
    const { data: roofRow, error: roofErr } = await admin
      .from('roof_quotes')
      .insert({
        token: roofToken,
        tenant_slug: 'pur',
        customer_id: CUSTOMER_ID,
        job_id: newJob.id,
        client_name: String(client.name).trim(),
        client_phone: normalizedPhone || client.phone,
        client_email: client.email || null,
        client_address: client.address || null,
        client_city: client.city || null,
        client_postal: client.postal || null,
        surface_sqft: Number(result.surface_sqft) || 0,
        pitch_category: measures.pitch_category || null,
        shingle_type: body.shingle_type || measures.shingle_type || null,
        total_client_ttc: totalTtc,
        net_profit: Number(result.net_profit) || 0,
        net_margin_pct: Number(result.net_margin_pct) || 0,
        payload: body.payload || body,
        status: 'draft',
      })
      .select('id, token')
      .single();
    if (roofErr) {
      console.warn('[toiture/save-as-job] roof_quotes insert failed:', roofErr.message);
    }

    // ── 6. Log job creation event ──
    await admin.from('job_events').insert({
      job_id: newJob.id,
      customer_id: CUSTOMER_ID,
      event_type: 'job_created',
      payload: {
        source: 'toiture_calc',
        lead_id: leadId,
        surface_sqft: result.surface_sqft,
        division_id: toitureDivisionId,
      },
    }).select().single().catch(() => null);

    return res.status(201).json({
      success: true,
      job_id: newJob.id,
      job_id_human: newJob.job_id,
      quote_number: quoteNumber,
      project_ref: projectRef,
      quote_id: newQuote.id,
      roof_quote_id: roofRow?.id || null,
      roof_token: roofRow?.token || null,
      url: `${BW_CRM_BASE}/${newJob.id}`,
      lead_id: leadId,
      lead_matched: leadMatched,
      division_id: toitureDivisionId,
    });
  } catch (err) {
    console.error('[toiture/save-as-job]', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
