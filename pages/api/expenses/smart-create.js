// pages/api/expenses/smart-create.js
//
// One-shot "quick expense capture" flow: user uploads a receipt photo via the
// existing /api/media/upload endpoint (bucket=receipts), then calls this with
// { image_url, description } where `description` is a natural-language note
// like "frais matériaux job Melissa" or "gaz job Mathieu".
//
// The server:
//   1. Runs OCR+structured extraction on the photo (same prompt as extract.js
//      but enriched with candidate client list so the LLM can match the job).
//   2. Creates the expense row with everything linked (customer_id,
//      division_id, job_id if matched, receipt_url, description, amounts).
//
// All extraction + job-match happens in ONE OpenAI call (gpt-4o-mini vision).
// User never has to fill fields manually for the quick path — they can always
// edit after the fact via the normal AddExpenseModal.

import { getAuthContext, getSupabaseServerClient } from '../../../lib/supabaseServer';
import { resolveDivisionId } from '../../../lib/divisions';
import { checkRateLimit } from '../../../lib/security';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini';

const CATEGORY_KEYS = [
  'materiel_fournisseur','main_oeuvre','sous_traitance','gaz_carburant','essence',
  'overhead','outillage','bureau','ai_tools','logiciel','telecom','repas',
  'assurance','formation','autre',
];

function buildSystemPrompt(jobsList) {
  const jobLines = jobsList.map((j) => `  #${j.id} · ${j.client_name || '(sans nom)'}${j.address ? ` — ${j.address}` : ''}${j.job_id ? ` (${j.job_id})` : ''}`).join('\n');
  return `Tu es un assistant qui extrait les données d'un reçu/facture (construction QC, FR+EN) ET qui associe la dépense au bon projet d'après la description en langage naturel de l'utilisateur.

Projets actifs du client (utilise UNIQUEMENT cette liste pour matcher):
${jobLines || '  (aucun projet actif)'}

Retourne UNIQUEMENT un JSON avec ces clés exactes:
{
  "vendor":           string | null,
  "total":            number | null,      // TTC (taxes incluses)
  "subtotal":         number | null,      // HT
  "tps":              number | null,
  "tvq":              number | null,
  "invoice_number":   string | null,
  "paid_at":          string | null,      // ISO YYYY-MM-DD si visible
  "category":         "${CATEGORY_KEYS.join('"|"')}",
  "description":      string,              // 1 ligne claire pour le registre, réutilise la description utilisateur quand pertinent
  "matched_job_id":   number | null,       // id numérique d'un projet de la liste ci-dessus, ou null si aucun match clair
  "match_reason":     string | null,       // courte justification du match (nom client, adresse, mot-clé)
  "confidence":       number               // 0 à 1 sur l'ensemble de l'extraction
}

Règles strictes:
- JAMAIS inventer de montant. Si pas visible → null.
- Reçus QC: TPS et TVQ séparées. Extraire les deux.
- Normaliser le vendor (enlever adresse/téléphone/numéro de magasin).
- matched_job_id DOIT être soit un id exact de la liste, soit null. Ne jamais inventer.
- Matcher via prénom du client, adresse, ou autre indice textuel. Ambigu → null.
- La description du registre DOIT inclure la phrase utilisateur textuelle en préfixe quand c'est utile.
- Sortie JSON pure, pas de markdown, pas de commentaire.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { supabase, customerId, user, role, divisionId } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });
  if (checkRateLimit(req, res, `expense-smart:${customerId}`, 60)) return;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });

  const { image_url, description: userDescription, job_id: forcedJobId = null, total: forcedTotal = null } = req.body || {};
  if (!image_url && !userDescription) {
    return res.status(400).json({ error: 'image_url ou description requis' });
  }

  // Tenant storage guard
  const allowedHost = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/^https?:\/\//, '');
  if (image_url) {
    try {
      const u = new URL(image_url);
      if (!u.hostname.endsWith(allowedHost)) {
        return res.status(400).json({ error: 'image_url must point to an approved storage bucket' });
      }
    } catch {
      return res.status(400).json({ error: 'Invalid image_url' });
    }
  }

  try {
    // 1. Fetch candidate jobs the user can see (RLS scoped via session client).
    //    Limit to most-recent 60 so the prompt stays compact. This naturally
    //    filters by division for scoped users.
    const { data: jobRows } = await supabase
      .from('jobs')
      .select('id, job_id, client_name, client_address, status, created_at')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(60);

    const jobsList = (jobRows || []).map((j) => ({
      id: j.id,
      job_id: j.job_id,
      client_name: j.client_name || null,
      address: j.client_address?.street || null,
    }));

    // 2. OpenAI call — vision + structured extraction + job match.
    const messages = [
      { role: 'system', content: buildSystemPrompt(jobsList) },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Description de l'utilisateur: ${userDescription || '(aucune)'}\n\nExtrais les champs du reçu ci-dessous et associe la dépense au bon projet si possible. Retourne le JSON seulement.`,
          },
          ...(image_url && !/\.pdf(\?.*)?$/i.test(image_url)
            ? [{ type: 'image_url', image_url: { url: image_url, detail: 'low' } }]
            : []),
        ],
      },
    ];

    const resp = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        response_format: { type: 'json_object' },
        max_tokens: 600,
        temperature: 0,
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      console.error('[expenses/smart-create] OpenAI error', resp.status, txt.slice(0, 200));
      return res.status(502).json({ error: `OpenAI vision failed (${resp.status})` });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || '{}';
    let parsed;
    try { parsed = JSON.parse(content); }
    catch { return res.status(502).json({ error: 'Extraction retournée au format invalide' }); }

    // Sanitize
    const validCat = new Set(CATEGORY_KEYS);
    const category = validCat.has(parsed.category) ? parsed.category : 'autre';
    const total = Number.isFinite(Number(forcedTotal)) && forcedTotal != null
      ? Number(forcedTotal)
      : (Number.isFinite(Number(parsed.total)) ? Number(parsed.total) : null);
    const subtotal = Number.isFinite(Number(parsed.subtotal)) ? Number(parsed.subtotal) : null;
    const tps = Number.isFinite(Number(parsed.tps)) ? Number(parsed.tps) : null;
    const tvq = Number.isFinite(Number(parsed.tvq)) ? Number(parsed.tvq) : null;
    const vendor = typeof parsed.vendor === 'string' ? parsed.vendor.trim() : null;
    const invoiceNumber = typeof parsed.invoice_number === 'string' ? parsed.invoice_number.trim() : null;
    const paidAt = typeof parsed.paid_at === 'string' && /^\d{4}-\d{2}-\d{2}/.test(parsed.paid_at)
      ? parsed.paid_at.slice(0, 10) : null;
    const registryDescription = typeof parsed.description === 'string' && parsed.description.trim()
      ? parsed.description.trim()
      : (userDescription ? String(userDescription).trim() : 'Dépense sans description');
    const matchReason = typeof parsed.match_reason === 'string' ? parsed.match_reason : null;
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0));

    // Validate matched job: forced job_id (from UI preset) wins, else accept LLM
    // match only if it's in the candidate list we sent.
    let matchedJobId = null;
    if (forcedJobId != null) {
      const found = jobsList.find((j) => j.id === Number(forcedJobId));
      if (found) matchedJobId = found.id;
    }
    if (!matchedJobId && parsed.matched_job_id != null) {
      const jid = Number(parsed.matched_job_id);
      const found = jobsList.find((j) => j.id === jid);
      if (found) matchedJobId = found.id;
    }

    // Require at least one of total / userDescription / image to avoid empty rows
    if (!total && !userDescription && !vendor) {
      return res.status(422).json({
        error: 'Extraction incomplète — impossible de créer la dépense. Ré-essaie avec une photo plus claire ou ajoute une description.',
        extracted: { vendor, total, category, description: registryDescription, matched_job_id: matchedJobId, confidence },
      });
    }

    // 3. Division resolution: inherit from matched job if any, else user's scope.
    const admin = getSupabaseServerClient();
    const divId = await resolveDivisionId(admin, {
      customer_id: customerId,
      role,
      user_division_id: divisionId,
      job_id: matchedJobId,
    });

    // 4. Insert expense row
    const insertRow = {
      customer_id: customerId,
      job_id: matchedJobId,
      category,
      vendor,
      invoice_number: invoiceNumber,
      description: registryDescription,
      subtotal,
      tps,
      tvq,
      total: total ?? 0,
      paid_at: paidAt,
      receipt_url: image_url || null,
      source: 'smart_quick',
      source_ref: userDescription || null,
      meta: {
        user_description: userDescription || null,
        match_reason: matchReason,
        confidence,
        captured_by: user.id,
        // division_id will be applied via SET below if column exists (Phase 4)
      },
    };

    const { data: expenseRow, error: insertErr } = await supabase
      .from('expenses')
      .insert(insertRow)
      .select('id, job_id, category, total, description, receipt_url, created_at')
      .single();

    if (insertErr) {
      console.error('[expenses/smart-create] insert error', insertErr);
      return res.status(500).json({ error: 'Enregistrement échoué' });
    }

    // 5. Hydrate matched job info for the UI success card
    let matchedJob = null;
    if (matchedJobId) {
      const found = jobsList.find((j) => j.id === matchedJobId);
      if (found) {
        matchedJob = {
          id: found.id,
          job_id: found.job_id,
          client_name: found.client_name,
          address: found.address,
        };
      }
    }

    return res.status(201).json({
      success: true,
      expense: expenseRow,
      matched_job: matchedJob,
      match_reason: matchReason,
      confidence,
      extracted: { vendor, total, category, description: registryDescription },
    });
  } catch (err) {
    console.error('[expenses/smart-create] exception', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
