// Universal Quote Acceptance API — Multi-tenant
// Client clicks "J'accepte" → marks quote accepted → auto-creates contract → returns sign URL
// customer_id is resolved FROM the quote record, never hardcoded
// Interac flow only — NO Stripe/CC processing
import { getSupabaseServerClient } from '../../../../lib/supabaseServer';
import { checkRateLimit } from '../../../../lib/security';
import { applyCorsHeaders } from '../../../../lib/universal-api-auth';
import { fetchWithTimeout } from '../../../../lib/fetch-with-timeout';
import { alertJeremy } from '../../../../lib/notifications/jeremy-alert';
import { createAutoTasks } from '../../../../lib/tasks/auto';

const supabase = getSupabaseServerClient();

export default async function handler(req, res) {
  if (applyCorsHeaders(req, res, { methods: ['POST', 'OPTIONS'] })) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit: 5 accept attempts per IP per minute. Protects against
  // enumeration + accidental double-click storms. Legitimate clients only
  // accept once; legit retries happen seconds apart, not 5+ times/minute.
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  if (checkRateLimit(req, res, `devis-accept:${ip}`, 5)) return;

  try {
    const { quote_number, selected_tier } = req.body;

    if (!quote_number) {
      return res.status(400).json({ error: 'quote_number requis' });
    }
    const userAgent = req.headers['user-agent'] || 'unknown';
    const acceptedAt = new Date().toISOString();

    // 1. Find the quote — NO customer_id filter (derived from record)
    const { data: quotes, error: qErr } = await supabase
      .from('quotes')
      .select(`
        id, job_id, customer_id, status, subtotal, tax_gst, tax_qst, total_ttc,
        line_items, payment_terms, notes, version, quote_number
      `)
      .eq('quote_number', quote_number)
      .limit(1);

    if (qErr || !quotes || quotes.length === 0) {
      return res.status(404).json({ error: 'Devis introuvable' });
    }

    let quote = quotes[0];
    const customerId = quote.customer_id;

    // Fetch customer for phone/email in error messages + contract routing
    const { data: customer } = await supabase
      .from('customers')
      .select('business_name, quote_config, domain, interac_email')
      .eq('id', customerId)
      .single();

    const phone = customer?.quote_config?.branding?.phone || '';
    const contactMsg = phone ? ` Veuillez nous contacter au ${phone}.` : ' Veuillez nous contacter.';

    // Fetch job data
    const { data: job } = await supabase
      .from('jobs')
      .select('id, client_name, client_phone, client_email, client_address, project_type, project_description, job_id')
      .eq('id', quote.job_id)
      .single();

    if (!job) {
      return res.status(404).json({ error: 'Dossier introuvable' });
    }

    // 2. Already accepted — look up existing contract to return sign/success URL
    if (quote.status === 'accepted') {
      const { data: existingContract } = await supabase
        .from('contracts')
        .select('signature_request_id, signature_status')
        .eq('job_id', quote.job_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const custDomain = customer?.domain || 'bluewiseai.com';
      let redirectUrl = null;
      if (existingContract?.signature_request_id) {
        if (existingContract.signature_status === 'signed') {
          redirectUrl = `https://${custDomain}/q/${quote.quote_number || quote_number}/success`;
        } else {
          redirectUrl = `https://${custDomain}/q/${quote.quote_number || quote_number}/sign`;
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Ce devis a déjà été accepté. Votre contrat est en cours de préparation.',
        already_accepted: true,
        quote_number: quote.quote_number || quote_number,
        contract_number: existingContract?.signature_request_id || null,
        contract_url: redirectUrl
      });
    }

    // 3. Expired
    if (quote.status === 'expired') {
      return res.status(410).json({
        error: `Ce devis est expiré.${contactMsg.replace('Veuillez', ' Veuillez')} pour un nouveau devis.`
      });
    }

    // 4. Superseded — find latest version and accept that one
    if (quote.status === 'superseded') {
      const { data: latestQuotes } = await supabase
        .from('quotes')
        .select('id, quote_number, status, version, subtotal, tax_gst, tax_qst, total_ttc, line_items, payment_terms, notes')
        .eq('job_id', quote.job_id)
        .eq('customer_id', customerId)
        .order('version', { ascending: false })
        .limit(1);

      if (!latestQuotes || latestQuotes.length === 0) {
        return res.status(404).json({ error: `Devis introuvable.${contactMsg}` });
      }

      const latest = latestQuotes[0];

      if (latest.status === 'accepted') {
        return res.status(200).json({
          success: true,
          message: 'Ce devis a déjà été accepté. Votre contrat est en cours de préparation.',
          already_accepted: true,
          quote_number: latest.quote_number
        });
      }

      if (latest.status !== 'ready') {
        return res.status(410).json({
          error: `Ce devis n'est plus disponible.${contactMsg}`
        });
      }

      // Use latest version from here on
      quote = { ...quote, ...latest };
    }

    // 5. Mark quote as accepted (include selected_tier in meta if provided)
    const quoteMeta = { accepted_ip: ip, accepted_ua: userAgent };
    if (selected_tier) quoteMeta.selected_tier = selected_tier;

    await supabase
      .from('quotes')
      .update({
        status: 'accepted',
        responded_at: acceptedAt,
        meta: quoteMeta,
        updated_at: new Date().toISOString()
      })
      .eq('id', quote.id);

    // 6. Update job status
    await supabase
      .from('jobs')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', quote.job_id);

    // 7. Log event
    await supabase
      .from('job_events')
      .insert({
        job_id: quote.job_id,
        customer_id: customerId,
        event_type: 'quote_accepted',
        details: { quote_number: quote.quote_number || quote_number, ip, user_agent: userAgent }
      });

    // 8. Fire n8n webhook — includes customer_id for downstream routing
    const webhookPayload = {
      event: 'quote_accepted',
      customer_id: customerId,
      quote_number: quote.quote_number || quote_number,
      quote_id: quote.id,
      job_id: quote.job_id,
      job_number: job.job_id,
      version: quote.version,
      client_name: job.client_name,
      client_phone: job.client_phone,
      client_email: job.client_email,
      client_address: job.client_address,
      project_type: job.project_type,
      project_description: job.project_description,
      line_items: quote.line_items,
      subtotal: quote.subtotal,
      tax_gst: quote.tax_gst,
      tax_qst: quote.tax_qst,
      total_ttc: quote.total_ttc,
      payment_terms: quote.payment_terms,
      notes: quote.notes,
      accepted_at: acceptedAt,
      accepted_ip: ip
    };

    // Fire-and-forget n8n webhook with 4s cap. If n8n is slow or down, the
    // client isn't blocked on their "J'accepte" click — we log and move on.
    try {
      await fetchWithTimeout(
        'https://automation.bluewiseai.com/webhook/sp-quote-accepted',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload)
        },
        4000
      );
    } catch (e) {
      console.warn('[devis/accept] n8n webhook skipped', e?.name === 'AbortError' ? 'timeout' : e?.message);
    }

    // 9. Auto-create contract (Interac flow — no payment gateway)
    // Guard: check if a contract already exists for this job_id (n8n may have created one)
    const { data: existingContract } = await supabase
      .from('contracts')
      .select('signature_request_id, signature_status')
      .eq('job_id', quote.job_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let contractResult = null;

    if (existingContract?.signature_request_id) {
      // Reuse existing — no duplicate
      contractResult = { contract_number: existingContract.signature_request_id };
    } else {
      // Create contract via internal S2S call, with 1 retry on transient failure.
      // Idempotency: before retry we re-check contracts table so we don't create
      // a second contract if the first succeeded partially.
      const siteUrl = process.env.SITE_URL || 'https://www.bluewiseai.com';
      const createContract = async () => {
        const r = await fetchWithTimeout(
          `${siteUrl}/api/universal/contrat/create`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quote_id: quote.id,
              customer_id: customerId,
              api_key: (process.env.UNIVERSAL_API_KEY || '').trim()
            })
          },
          8000
        );
        const body = await r.json().catch(() => ({}));
        return { ok: r.ok, body };
      };

      try {
        let attempt = await createContract();
        if (!attempt.ok) {
          console.warn('[devis/accept] contract create failed, retrying in 500ms', attempt.body);
          await new Promise(r => setTimeout(r, 500));
          // Idempotency re-check before retry
          const { data: retryCheck } = await supabase
            .from('contracts')
            .select('signature_request_id')
            .eq('job_id', quote.job_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (retryCheck?.signature_request_id) {
            contractResult = { contract_number: retryCheck.signature_request_id };
          } else {
            attempt = await createContract();
            contractResult = attempt.ok ? attempt.body : null;
          }
        } else {
          contractResult = attempt.body;
        }
      } catch (err) {
        console.error('[devis/accept] contract create exception', err?.message);
        contractResult = null;
      }

      // If both attempts failed, log an ops-visible job_event so Jérémy sees it
      if (!contractResult?.contract_number) {
        await supabase.from('job_events').insert({
          job_id: quote.job_id,
          customer_id: customerId,
          event_type: 'contract_create_failed',
          details: { quote_number: quote.quote_number, ip, user_agent: userAgent },
        });
      }
    }

    // Build sign URL using customer domain (not BW domain for other tenants)
    const custDomain = customer?.domain || 'bluewiseai.com';
    const qNum = quote.quote_number || quote_number;
    const contractUrl = contractResult?.contract_number
      ? `https://${custDomain}/q/${qNum}/sign`
      : null;

    // Alert Jérémy (fire-and-forget — never blocks the client)
    alertJeremy(supabase, {
      customerId,
      eventType: contractUrl ? 'quote_accepted' : 'contract_create_failed',
      payload: {
        job_id_human: job.job_id,
        client_name: job.client_name,
        total_ttc: quote.total_ttc,
        job_url: `https://${custDomain}/platform/jobs/${job.id}`,
      },
    }).catch(() => {});

    // Auto-tasks (fire-and-forget)
    if (contractUrl) {
      createAutoTasks(supabase, {
        customerId,
        jobId: quote.job_id,
        leadId: job.lead_id || null,
        eventType: 'quote_accepted',
      }).catch(() => {});
    }

    // If the contract couldn't be created, tell the client plainly —
    // the quote is still saved as accepted, Jérémy will handle the contract
    // manually. This beats a blank spinner + silent fail.
    if (!contractUrl) {
      return res.status(200).json({
        success: true,
        message: 'Devis accepté! Jérémy va préparer le contrat manuellement et te recontacter.',
        quote_number: qNum,
        accepted_at: acceptedAt,
        contract_number: null,
        contract_url: null,
        contract_pending: true,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Devis accepté! Signez votre contrat pour confirmer.',
      quote_number: qNum,
      accepted_at: acceptedAt,
      contract_number: contractResult?.contract_number || null,
      contract_url: contractUrl
    });

  } catch (error) {
    console.error('Universal quote accept error:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'acceptation du devis' });
  }
}
