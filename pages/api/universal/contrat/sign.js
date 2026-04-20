// Universal Contract Sign API — Multi-tenant (Pages Router)
// Called when client submits signature on the HTML contract page.
// Stores signed contract in Supabase Storage, updates DB, fires n8n webhook.

import { getSupabaseServerClient } from '../../../../lib/supabaseServer';
import { applyCorsHeaders } from '../../../../lib/universal-api-auth';
import { alertJeremy } from '../../../../lib/notifications/jeremy-alert';
import { createAutoTasks } from '../../../../lib/tasks/auto';
import { checkRateLimitDb } from '../../../../lib/security';
import { sendSmsTelnyx } from '../../../../lib/providers/telnyx';
import { sendEmailGmail } from '../../../../lib/providers/gmail';
import { sendEmailMailgun } from '../../../../lib/providers/mailgun';
import { encryptToken } from '../../../../lib/tokenEncryption';
import { buildContractSignedEmail, buildContractSignedSms } from '../../../../lib/email-templates/contract-signed';

const MAX_SIGNATURE_BYTES = 500 * 1024;       // 500 KB — signature PNG
const MAX_SIGNED_HTML_BYTES = 1.5 * 1024 * 1024; // 1.5 MB — rendered contract with embedded image

// Per-contract sign attempt rate-limit. Load-bearing: this is the protection
// against brute-forcing the 4-digit phone gate. Uses the Supabase-backed
// limiter (not the in-memory Map) so cold-start Lambdas share state.
const SIGN_MAX_ATTEMPTS = 5;
const SIGN_WINDOW_MS = 60 * 60 * 1000;

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

    // F-007 — contract_number is interpolated into a PostgREST OR filter
    // below. Strict format check keeps commas / `.eq.` / etc. out so no
    // additional predicates can be appended by a caller.
    if (typeof contract_number !== 'string' || !/^[A-Z]{2,10}-C-[0-9a-fA-F]{8,32}$/i.test(contract_number)) {
      return res.status(400).json({ error: 'contract_number format invalide' });
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

    // Per-contract phone-gate brute-force limit is applied ONLY when a phone
    // check fails (see below) — not on every POST, so legit signers who tap
    // twice don't burn attempts. Supabase-backed so it survives cold starts.

    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const signedAt = new Date().toISOString();

    // ── 2. Look up contract — try storage_path pattern since table has no contract_number column
    //
    // F-007 — previously used `.or(\`storage_path.eq.${storagePath},...\`)` which
    // allowed filter injection when contract_number contained commas or filter
    // ops. `.in(col, [array])` is parameterized — the regex above keeps the
    // shape clean as a second layer of defense.
    const storagePath = contract_number.replace('-C-', '-contrat-') + '.html';
    const { data: contract, error: contractLookupErr } = await supabase
      .from('contracts')
      .select('id, job_id, customer_id, signature_status, storage_path, storage_bucket, created_at')
      .in('storage_path', [storagePath, contract_number])
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

    // ── 4b. Phone gate — hard for post-chain contracts, soft for legacy.
    //
    // Legacy contracts (created before 2026-04-19) don't have the phone input
    // in their embedded form, so we can't require it — backward-compat only.
    // Post-chain contracts MUST provide client_phone_last4; omitting the field
    // would otherwise let an attacker bypass the gate by stripping the field
    // from their POST (CoVe finding 2026-04-19).
    const PHONE_GATE_CUTOFF = '2026-04-19T00:00:00Z';
    const createdAt = contract.created_at ? new Date(contract.created_at) : null;
    const postChain = createdAt && createdAt >= new Date(PHONE_GATE_CUTOFF);
    const phoneSupplied = client_phone_last4 != null && String(client_phone_last4).trim() !== '';

    if (postChain && !phoneSupplied) {
      const rl = await checkRateLimitDb(supabase, `sign-fail:${contract_number}`, SIGN_MAX_ATTEMPTS, SIGN_WINDOW_MS);
      if (!rl.allowed) {
        return res.status(429).json({ error: 'Trop de tentatives. Attendez une heure ou contactez votre entrepreneur.', reset_at: rl.reset_at });
      }
      console.warn('[contrat/sign] phone gate missing on post-chain contract', { contract_number, attempt: rl.current_count, ip });
      return res.status(400).json({
        error: 'Vérification téléphone requise. Entrez les 4 derniers chiffres du numéro fourni lors du devis.',
        attempts_remaining: Math.max(0, SIGN_MAX_ATTEMPTS - rl.current_count),
      });
    }

    if (phoneSupplied) {
      const { data: jobRow } = await supabase
        .from('jobs')
        .select('client_phone')
        .eq('id', jobId)
        .eq('customer_id', customerId)
        .maybeSingle();
      const expected = normalizeLast4(jobRow?.client_phone);
      const supplied = normalizeLast4(client_phone_last4);
      if (expected && expected.length === 4 && supplied !== expected) {
        const rl = await checkRateLimitDb(supabase, `sign-fail:${contract_number}`, SIGN_MAX_ATTEMPTS, SIGN_WINDOW_MS);
        if (!rl.allowed) {
          return res.status(429).json({ error: 'Trop de tentatives. Attendez une heure ou contactez votre entrepreneur.', reset_at: rl.reset_at });
        }
        console.warn('[contrat/sign] phone gate failed', { contract_number, attempt: rl.current_count, ip });
        return res.status(401).json({
          error: 'Vérification téléphone échouée. Entrez les 4 derniers chiffres du numéro fourni lors du devis.',
          attempts_remaining: Math.max(0, SIGN_MAX_ATTEMPTS - rl.current_count),
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

    // ── 10b. Direct client notification — SMS + email with download link ─────
    // First-party side effect so client delivery doesn't depend on the n8n
    // webhook being healthy. Errors are logged but never fail the response
    // (signature has already been persisted, stale notifications are retryable
    // downstream). SP's old flow emitted the same pair via n8n only, which
    // made "did the client get it?" a four-system debug.
    try {
      const [{ data: quoteForLink }, { data: customerRow }] = await Promise.all([
        supabase
          .from('quotes')
          .select('quote_number')
          .eq('job_id', jobId)
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('customers')
          .select('domain, business_name, quote_config, telnyx_sms_number, interac_email')
          .eq('id', customerId)
          .maybeSingle(),
      ]);

      const quoteNumber = quoteForLink?.quote_number || null;
      const domain = customerRow?.domain || 'bluewiseai.com';
      const branding = customerRow?.quote_config?.branding || { business_name: customerRow?.business_name || 'BlueWise' };
      const interacEmail =
        customerRow?.quote_config?.contract?.interac_email
        || customerRow?.interac_email
        || branding.email
        || '';
      const paymentSchedule = customerRow?.quote_config?.payment_schedule || [];
      const schedulePct = Number(paymentSchedule?.[0]?.percentage) || depositPct || 35;

      // Prefer the quote_number token (public /q/[token]/success path) for the
      // download link since it's the canonical surface the client already has.
      // Fall back to the contract storage public URL when no quote_number is
      // available (legacy / direct contract create).
      const downloadUrl = quoteNumber
        ? `https://${domain}/api/contrat/${encodeURIComponent(quoteNumber)}/download`
        : (signatureUrl || '');

      const clientEmailAddr = (jobData?.client_email || signer_email || '').trim();
      const clientPhoneAddr = (jobData?.client_phone || '').trim();

      // ── Email (Gmail OAuth → Mailgun fallback) ─────────────────────────────
      if (clientEmailAddr && downloadUrl) {
        const { subject, html, text } = buildContractSignedEmail({
          clientName: jobData?.client_name || signer_name,
          contractNumber: contract_number,
          depositAmount,
          depositPct: schedulePct,
          downloadUrl,
          interacEmail,
          businessPhone: branding.phone,
          branding,
        });

        const { data: oauthRow } = await supabase
          .from('customer_email_oauth')
          .select('id, provider, access_token, refresh_token, token_expiry, email_address, status')
          .eq('customer_id', customerId)
          .eq('status', 'active')
          .eq('provider', 'gmail')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let sent = null;
        let provider = null;

        if (oauthRow?.email_address) {
          provider = 'gmail';
          const from = `${branding.business_name || 'BlueWise'} <${oauthRow.email_address}>`;
          sent = await sendEmailGmail(
            { to: clientEmailAddr, from, subject, body: text, html },
            oauthRow,
            async (newAccessToken, newExpiry) => {
              try {
                await supabase
                  .from('customer_email_oauth')
                  .update({
                    access_token: encryptToken(newAccessToken),
                    token_expiry: newExpiry,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', oauthRow.id);
              } catch (e) {
                console.warn('[contrat/sign] oauth token update failed', e?.message);
              }
            }
          );
        }

        if (!sent || !sent.success) {
          const mgFrom = process.env.MAILGUN_FROM
            || (process.env.MAILGUN_DOMAIN ? `${branding.business_name || 'BlueWise'} <noreply@${process.env.MAILGUN_DOMAIN}>` : '');
          if (mgFrom) {
            const prevErr = sent?.error;
            provider = 'mailgun';
            sent = await sendEmailMailgun({
              to: clientEmailAddr,
              from: mgFrom,
              subject,
              body: text,
              html,
            });
            if (!sent.success && prevErr) sent.error = `gmail:${prevErr} | mailgun:${sent.error}`;
          }
        }

        try {
          await supabase.from('messages').insert({
            customer_id: customerId,
            lead_id: jobData?.lead_id || null,
            direction: 'outbound',
            channel: 'email',
            message_type: 'email',
            subject,
            body: text,
            provider,
            provider_message_id: sent?.provider_message_id || null,
            status: sent?.success ? 'sent' : 'failed',
            error: sent?.success ? null : (sent?.error || null),
            to_address: clientEmailAddr,
            from_address: provider === 'gmail' ? oauthRow?.email_address : process.env.MAILGUN_FROM,
            meta: {
              contract_signed: true,
              contract_number,
              download_url: downloadUrl,
            },
          });
        } catch (e) {
          console.warn('[contrat/sign] messages log (email) failed', e?.message);
        }
      }

      // ── SMS via Telnyx ─────────────────────────────────────────────────────
      if (clientPhoneAddr && downloadUrl && customerRow?.telnyx_sms_number) {
        const smsBody = buildContractSignedSms({
          clientName: jobData?.client_name || signer_name,
          businessName: branding.business_name,
          downloadUrl,
          depositAmount,
        });

        const r = await sendSmsTelnyx({
          to: clientPhoneAddr,
          from: customerRow.telnyx_sms_number,
          body: smsBody,
        });

        try {
          await supabase.from('messages').insert({
            customer_id: customerId,
            lead_id: jobData?.lead_id || null,
            direction: 'outbound',
            channel: 'sms',
            message_type: 'sms',
            body: smsBody,
            provider: 'telnyx',
            provider_message_id: r.provider_message_id || null,
            status: r.success ? 'sent' : 'failed',
            error: r.success ? null : (r.error || null),
            to_address: clientPhoneAddr,
            from_address: customerRow.telnyx_sms_number,
            meta: {
              contract_signed: true,
              contract_number,
              download_url: downloadUrl,
            },
          });
        } catch (e) {
          console.warn('[contrat/sign] messages log (sms) failed', e?.message);
        }
      }
    } catch (notifyErr) {
      // Never fail the sign request on notification errors — signature row
      // already persisted, client can still download from /q/[token]/success.
      console.error('[contrat/sign] client notification error:', notifyErr);
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

    // Auto-create follow-up task for deposit (fire-and-forget)
    createAutoTasks(supabase, {
      customerId,
      jobId,
      leadId: jobData?.lead_id || null,
      eventType: 'contract_signed',
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
