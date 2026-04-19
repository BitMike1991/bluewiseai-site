// pages/api/expenses/extract.js
// OCR + structured extraction on a receipt photo or PDF. Returns the fields
// an AddExpenseModal pre-fills. User still reviews before saving — we NEVER
// auto-insert based on OCR.
//
// POST body: { image_url }  — URL of a previously-uploaded receipt in the
// `receipts` bucket (from /api/media/upload).
//
// Response: {
//   vendor, total, subtotal, tps, tvq, invoice_number, paid_at (ISO),
//   category_guess, description_guess, confidence (0–1)
// }
//
// Model: gpt-4o-mini vision (cheapest multimodal with solid extraction).
// Cost: ~$0.0001–0.0003 per receipt image at 512×768 low-detail. Free tier
// rate-limited per-customer via in-memory window.

import { getAuthContext } from '../../../lib/supabaseServer';
import { checkRateLimit } from '../../../lib/security';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini';
const SYSTEM_PROMPT = `You are an expert at extracting structured data from Quebec construction-industry receipts and invoices (French and English).

Return ONLY a JSON object with these exact keys:
{
  "vendor":           string | null,     // e.g. "Royalty Fenestration", "Home Depot", "Shell"
  "total":            number | null,     // TTC amount (taxes included)
  "subtotal":         number | null,     // HT amount (before taxes), null if not shown
  "tps":              number | null,     // 5% TPS/GST line
  "tvq":              number | null,     // 9.975% TVQ/QST line
  "invoice_number":   string | null,     // printed ref / facture #
  "paid_at":          string | null,     // ISO date YYYY-MM-DD if a date is visible
  "category_guess":   string | null,     // one of: materiel_fournisseur, gaz_carburant, outillage,
                                         //          sous_traitance, repas, telecom, logiciel,
                                         //          bureau, assurance, essence, overhead, autre
  "description_guess": string | null,    // 1-line description suitable for the ledger
  "confidence":       number             // 0 to 1, your estimate of overall extraction accuracy
}

Rules:
- If a field is not clearly visible on the receipt, return null. Never guess numeric amounts.
- Quebec receipts almost always list TPS and TVQ separately — extract both.
- Normalize vendor name (strip stock#, address, phone).
- If confidence < 0.5, still return what you found; the user will verify.
- Output pure JSON, no markdown fence, no commentary.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customerId, user } = await getAuthContext(req, res);
  if (!user)       return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });

  // Rate limit: 30/hr per customer — a receipt flood is suspicious + expensive.
  if (checkRateLimit(req, res, `expense-extract:${customerId}`, 30)) return;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });

  const { image_url } = req.body || {};
  if (!image_url || typeof image_url !== 'string') {
    return res.status(400).json({ error: 'image_url required' });
  }

  // Tenant safety — only accept URLs from our own storage buckets.
  const allowedHost = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/^https?:\/\//, '');
  try {
    const u = new URL(image_url);
    if (!u.hostname.endsWith(allowedHost)) {
      return res.status(400).json({ error: 'image_url must point to an approved storage bucket' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid image_url' });
  }

  // PDFs can't be sent directly to gpt-4o-mini vision. If the URL ends in .pdf,
  // return a friendly error — Jérémy should upload a photo instead (or we wire
  // pdf2pic server-side in a follow-up).
  if (/\.pdf(\?.*)?$/i.test(image_url)) {
    return res.status(415).json({
      error: 'Les fichiers PDF ne sont pas encore supportés pour l\'extraction automatique. Téléverse une photo du reçu pour l\'instant.',
    });
  }

  try {
    const resp = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extrais les champs du reçu ci-dessous. Retourne le JSON seulement.' },
              { type: 'image_url', image_url: { url: image_url, detail: 'low' } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 500,
        temperature: 0,
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      console.error('[expenses/extract] OpenAI error', resp.status, txt.slice(0, 200));
      return res.status(502).json({ error: `OpenAI vision failed (${resp.status})` });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || '{}';

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error('[expenses/extract] JSON parse fail', content.slice(0, 200));
      return res.status(502).json({ error: 'Extraction retournée au format invalide' });
    }

    // Shape-validate — anything unexpected becomes null rather than crashing
    // downstream.
    const out = {
      vendor:           typeof parsed.vendor === 'string' ? parsed.vendor.trim() : null,
      total:            Number.isFinite(Number(parsed.total))    ? Number(parsed.total)    : null,
      subtotal:         Number.isFinite(Number(parsed.subtotal)) ? Number(parsed.subtotal) : null,
      tps:              Number.isFinite(Number(parsed.tps))      ? Number(parsed.tps)      : null,
      tvq:              Number.isFinite(Number(parsed.tvq))      ? Number(parsed.tvq)      : null,
      invoice_number:   typeof parsed.invoice_number === 'string' ? parsed.invoice_number.trim() : null,
      paid_at:          typeof parsed.paid_at === 'string' && /^\d{4}-\d{2}-\d{2}/.test(parsed.paid_at)
                          ? parsed.paid_at.slice(0, 10) : null,
      category_guess:   typeof parsed.category_guess === 'string' ? parsed.category_guess : null,
      description_guess:typeof parsed.description_guess === 'string' ? parsed.description_guess : null,
      confidence:       Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
    };

    return res.status(200).json(out);
  } catch (err) {
    console.error('[expenses/extract] exception', err);
    return res.status(500).json({ error: 'Extraction impossible' });
  }
}
