// Universal Contract Sign API — Multi-tenant (Pages Router)
// Called when client submits signature on the HTML contract page.
// Stores signed contract in Supabase Storage, updates DB, fires n8n webhook.

import { getSupabaseServerClient } from '../../../../lib/supabaseServer';
import { applyCorsHeaders } from '../../../../lib/universal-api-auth';
import { alertJeremy } from '../../../../lib/notifications/jeremy-alert';

const MAX_SIGNATURE_BYTES = 500 * 1024;       // 500 KB — signature PNG
const MAX_SIGNED_HTML_BYTES = 1.5 * 1024 * 1024; // 1.5 MB — rendered contract with embedded image

// Per-contract sign attempt tracker (wrong phone gate).
// Keyed by contract_number. 5 attempts per hour max.
const signAttempts = new Map();
const SIGN_MAX_ATTEMPTS = 5;
const SIGN_WINDOW_MS = 60 * 60 * 1000;

function recordSignAttempt(contractNumber) {
  const now = Date.now();
  const list = (signAttempts.get(contractNumber) || []).filter(ts => now - ts < SIGN_WINDOW_MS);
  list.push(now);
  signAttempts.set(contractNumber, list);
  return list.length;
}

function isSignAttemptLimited(contractNumber) {
  const now = Date.now();
  const list = (signAttempts.get(contractNumber) || []).filter(ts => now - ts < SIGN_WINDOW_MS);
  return list.length >= SIGN_MAX_ATTEMPTS;
}

function normalizeLast4(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  return digits.slice(-4);
}

export default async function handler(req, res) {
  if (applyCorsHeaders(req, res, { methods: ['POST', 'OPTIONS'] })) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getSupabaseServerClient();

  try {
    const {
      contract_number,
      signer_name,
      signer_email,
      signature_image,
      signed_html,
      client_phone_last4,
    } = req.body || {};

    // ── 1. Input validation ──────────────────────────────────────────────────
    if (!contract_number || !signer_name || !signature_image) {
      return res.status(400).json({
        error: 'Champs requis manquants: contract_number, signer_name, signature_image'
      });
    }

    // Validate signature_image is base64 PNG
    const base64Data = signature_image.replace(/^data:image\/png;base64,/, '');
    if (base64Data === signature_image && !signature_image.match(/^[A-Za-z0-9+/]+=*$/)) {
      return res.status(400).json({ error: 'signature_image must be a base64 PNG' });
    }

    const signatureBuffer = Buffer.from(base64Data, 'base64');
    if (signatureBuffer.length > MAX_SIGNATURE_BYTES) {
      return res.status(400).json({ error: 'signature_image exceeds 500KB limit' });
    }

    // Cap signed_html to prevent DoS + stored-XSS payload growth
    if (signed_html && typeof signed_html === 'string' && signed_html.length > MAX_SIGNED_HTML_BYTES) {
      return res.status(413).json({ error: 'signed_html exceeds 1.5MB limit' });
    }

    // Per-contract attempt rate limit (protects phone gate from brute force)
    if (isSignAttemptLimited(contract_number)) {
      return res.status(429).json({
        error: 'Trop de tentatives. Attendez une heure ou contactez votre entrepreneur.'
      });
    }

    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const signedAt = new Date().toISOString();

    // ── 2. Look up contract — try storage_path pattern since table has no contract_number column
    const storagePath = contract_number.replace('-C-', '-contrat-') + '.html';
    const { data: contract, error: contractLookupErr } = await supabase
      .from('contracts')
      .select('id, job_id, customer_id, signature_status, storage_path, storage_bucket')
      .or(`storage_path.eq.${storagePath},storage_path.eq.${contract_number}`)
      .maybeSingle();

    if (contractLookupErr) {
      console.error('Contract lookup error:', contractLookupErr);
      return res.status(500).json({ error: 'Erreur lors de la recherche du contrat' });
    }

    if (!contract) {
      return res.status(404).json({ error: 'Contrat introuvable' });
    }

    const { id: contractId, job_id: jobId, customer_id: customerId } = contract;

    // ── 3. Duplicate-signature guard ─────────────────────────────────────────
    if (contract.signature_status === 'signed') {
      // Build the public URL for the existing signed HTML
      const bucket = contract.storage_bucket || 'contracts';
      const { data: existingUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(contract.storage_path);

      return res.status(200).json({
        success: true,
        already_signed: true,
        contract_number,
        signature_url: existingUrlData?.publicUrl || null,
        signed_at: contract.signed_at || null
      });
    }

    // ── 4. Validate contract status allows signing ────────────────────────────
    const SIGNABLE_STATUSES = ['sent', 'draft', 'pending', 'contract_sent', null, undefined];
    if (!SIGNABLE_STATUSES.includes(contract.signature_status)) {
      return res.status(409).json({
        error: `Le contrat a un statut non signable: ${contract.signature_status}`
      });
    }

    // ── 4b. Phone gate — soft enforcement (backward-compatible).
    // If the client supplies `client_phone_last4`, validate it against the
    // phone we have on file. Reject on mismatch. If the client omits the
    // field, skip the check (legacy contracts sent before this gate existed
    // don't have the input in their embedded form). New contracts include
    // the phone input in the template → the field will be present.
    if (client_phone_last4 != null && String(client_phone_last4).trim() !== '') {
      const { data: jobRow } = await supabase
        .from('jobs')
        .select('client_phone')
        .eq('id', jobId)
        .eq('customer_id', customerId)
        .maybeSingle();
      const expected = normalizeLast4(jobRow?.client_phone);
      const supplied = normalizeLast4(client_phone_last4);
      if (expected && expected.length === 4 && supplied !== expected) {
        const n = recordSignAttempt(contract_number);
        console.warn('[contrat/sign] phone gate failed', { contract_number, attempt: n, ip });
        return res.status(401).json({
          error: 'Vérification téléphone échouée. Entrez les 4 derniers chiffres du numéro fourni lors du devis.',
          attempts_remaining: Math.max(0, SIGN_MAX_ATTEMPTS - n),
        });
      }
    }

    // ── 5. Upload signed HTML to Supabase Storage ─────────────────────────────
    // tenant-isolated path: contracts/{customer_id}/{contract_number}/...
    const htmlPath = `${customerId}/${contract_number}/signed.html`;
    const signaturePath = `${customerId}/${contract_number}/signature.png`;
    const bucket = 'contracts';

    const storageErrors = [];

    // Upload signature PNG
    const { error: sigUploadErr } = await supabase.storage
      .from(bucket)
      .upload(signaturePath, signatureBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (sigUploadErr) {
      console.error('Signature PNG upload error:', sigUploadErr);
      storageErrors.push({ file: 'signature.png', error: sigUploadErr.message });
    }

    // Upload signed HTML
    let signatureUrl = null;
    if (signed_html) {
      const htmlBuffer = Buffer.from(signed_html, 'utf-8');

      const { error: htmlUploadErr } = await supabase.storage
        .from(bucket)
        .upload(htmlPath, htmlBuffer, {
          contentType: 'text/html',
          upsert: true
        });

      if (htmlUploadErr) {
        console.error('Signed HTML upload error:', htmlUploadErr);
        storageErrors.push({ file: 'signed.html', error: htmlUploadErr.message });
      } else {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(htmlPath);
        signatureUrl = urlData?.publicUrl || null;
      }
    }

    // ── 6. Update contract record ─────────────────────────────────────────────
    const { error: contractUpdateErr } = await supabase
      .from('contracts')
      .update({
        signature_status: 'signed',
        signed_at: signedAt,
        signer_name,
        signer_email: signer_email || null,
        signature_provider: 'electronic_canvas',
        storage_path: htmlPath,
        storage_bucket: bucket,
        html_content: signed_html || null,
        meta: { ip_address: ip, user_agent: userAgent },
        updated_at: signedAt
      })
      .eq('id', contractId);

    if (contractUpdateErr) {
      console.error('Contract update error:', contractUpdateErr);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du contrat' });
    }

    // ── 7. Update job status to contract_signed ───────────────────────────────
    const { error: jobUpdateErr } = await supabase
      .from('jobs')
      .update({
        status: 'contract_signed',
        signed_at: signedAt,
        updated_at: signedAt
      })
      .eq('id', jobId)
      .eq('customer_id', customerId); // safety: tenant isolation

    if (jobUpdateErr) {
      // Non-fatal — log but don't fail the response
      console.error('Job status update error:', jobUpdateErr);
    }

    // ── 8. Log event to job_events ────────────────────────────────────────────
    const { error: eventErr } = await supabase
      .from('job_events')
      .insert({
        job_id: jobId,
        customer_id: customerId,
        event_type: 'contract_signed',
        payload: {
          contract_number,
          signer_name,
          signer_email: signer_email || null,
          signed_at: signedAt,
          ip_address: ip,
          signature_url: signatureUrl
        },
        created_at: signedAt
      });

    if (eventErr) {
      console.error('job_events insert error:', eventErr);
      // Non-fatal
    }

    // ── 9. Fetch job data for deposit calculation ─────────────────────────────
    const { data: jobData } = await supabase
      .from('jobs')
      .select('job_id, client_name, client_phone, client_email, quote_amount, payment_terms')
      .eq('id', jobId)
      .single();

    const quoteAmount = jobData?.quote_amount || 0;
    const totalTtc = Math.round(quoteAmount * 1.14975 * 100) / 100;
    const paymentTerms = jobData?.payment_terms || [];
    const firstTranche = Array.isArray(paymentTerms) ? paymentTerms[0] : null;
    const depositPct = firstTranche?.percentage || 10;
    const depositAmount = Math.round(quoteAmount * depositPct / 100 * 1.14975 * 100) / 100;

    // ── 10. Fire n8n webhook — MUST await or Vercel kills it ────────────────
    try {
      await fetch('https://automation.bluewiseai.com/webhook/sp-signature-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'signature_complete',
          job_id: jobData?.job_id || contract_number,
          customer_id: customerId,
          contract_number,
          signer_name,
          signer_email: signer_email || null,
          client_phone: jobData?.client_phone || '',
          client_email: jobData?.client_email || signer_email || '',
          client_name: jobData?.client_name || signer_name,
          total_ttc: totalTtc,
          deposit_pct: depositPct,
          deposit_amount: depositAmount,
          signature_url: signatureUrl,
          signed_at: signedAt,
          ip_address: ip
        })
      });
    } catch (e) {
      console.error('n8n webhook error:', e);
    }

    // Alert Jérémy directly (fire-and-forget)
    alertJeremy(supabase, {
      customerId,
      eventType: 'contract_signed',
      payload: {
        job_id_human: jobData?.job_id,
        client_name: jobData?.client_name || signer_name,
        total_ttc: totalTtc,
        deposit_amount: depositAmount,
        job_url: `https://bluewiseai.com/platform/jobs/${jobId}`,
      },
    }).catch(() => {});

    // ── 10. Return success ────────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      contract_number,
      signature_url: signatureUrl,
      signed_at: signedAt,
      ...(storageErrors.length > 0 ? { storage_warnings: storageErrors } : {})
    });

  } catch (error) {
    console.error('Sign API unhandled error:', error);
    return res.status(500).json({ error: 'Erreur interne lors de la signature du contrat' });
  }
}
