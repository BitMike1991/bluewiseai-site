// pages/api/expenses/index.js
// Create an expense row. Scoped to the caller's tenant + optionally linked
// to a job. TPS/TVQ auto-computed if omitted (reverse-calc from total at
// 14.975% combined rate, the default for standard Quebec construction).
//
// POST body: {
//   total,           // required — TTC amount paid
//   vendor?,
//   category?,       // 'materiel_fournisseur' | 'main_oeuvre' | 'sous_traitance' | 'gaz_carburant' | 'overhead' | 'autre'
//   description?,
//   paid_at?,        // ISO date or YYYY-MM-DD (defaults to now)
//   invoice_number?,
//   receipt_url?,
//   job_id?,         // optional — expense linked to a specific job
//   payment_method?, // 'interac' | 'cash' | 'cheque' | 'wire' | 'card' | 'other'
//   subtotal?,       // optional override
//   tps?,            // optional override
//   tvq?             // optional override
// }

import { getAuthContext } from "../../../lib/supabaseServer";

const ALLOWED_CATEGORIES = new Set([
  'materiel_fournisseur', 'main_oeuvre', 'sous_traitance',
  'gaz_carburant', 'overhead', 'autre',
  'bureau', 'ai_tools', 'logiciel', 'telecom', 'essence',
  'repas', 'outillage', 'assurance', 'formation', 'autre_frais',
]);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user)       return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });

  const {
    total,
    vendor,
    category,
    description,
    paid_at,
    invoice_number,
    receipt_url,
    job_id,
    payment_method,
    subtotal,
    tps,
    tvq,
  } = req.body || {};

  const totalNum = Number(total);
  if (!Number.isFinite(totalNum) || totalNum <= 0) {
    return res.status(400).json({ error: 'total must be a positive number' });
  }

  const categoryNorm = String(category || 'autre').toLowerCase();
  if (!ALLOWED_CATEGORIES.has(categoryNorm)) {
    return res.status(400).json({ error: `category must be one of: ${[...ALLOWED_CATEGORIES].join(', ')}` });
  }

  // Tenant guard on job_id if supplied
  if (job_id != null) {
    const { data: job } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', job_id)
      .eq('customer_id', customerId)
      .maybeSingle();
    if (!job) return res.status(404).json({ error: 'Job not found for this tenant' });
  }

  // Auto-compute subtotal/tps/tvq if not provided (assumes fully taxable).
  // ht = total / 1.14975 ; tps = ht × 0.05 ; tvq = ht × 0.09975
  const htBase = totalNum / 1.14975;
  const subtotalVal = subtotal != null ? Number(subtotal) : Math.round(htBase * 100) / 100;
  const tpsVal      = tps      != null ? Number(tps)      : Math.round(htBase * 0.05 * 100) / 100;
  const tvqVal      = tvq      != null ? Number(tvq)      : Math.round(htBase * 0.09975 * 100) / 100;

  const paidAtNorm = paid_at ? new Date(paid_at).toISOString() : new Date().toISOString();
  const nowIso = new Date().toISOString();

  const row = {
    customer_id: customerId,
    job_id: job_id || null,
    total: Math.round(totalNum * 100) / 100,
    subtotal: subtotalVal,
    tps: tpsVal,
    tvq: tvqVal,
    vendor: vendor || null,
    category: categoryNorm,
    description: description || null,
    paid_at: paidAtNorm,
    invoice_number: invoice_number || null,
    receipt_url: receipt_url || null,
    payment_method: payment_method || null,
    source: 'manual',
    source_ref: user.email || user.id || null,
    created_at: nowIso,
    updated_at: nowIso,
  };

  const { data: expense, error } = await supabase
    .from('expenses')
    .insert(row)
    .select('id, total, tps, tvq, category, paid_at, vendor, description, receipt_url')
    .single();

  if (error) {
    console.error('[api/expenses] insert error', error);
    return res.status(500).json({ error: 'Failed to record expense', details: error.message });
  }

  return res.status(201).json({ success: true, expense });
}
