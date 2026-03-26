// Universal Quote Acceptance API — Multi-tenant
// Client clicks "J'accepte" → marks quote accepted → fires n8n webhook for auto contract
// customer_id is resolved FROM the quote record, never hardcoded
import { getSupabaseServerClient } from '../../../../lib/supabaseServer';

const supabase = getSupabaseServerClient();

export default async function handler(req, res) {
  // CORS headers on ALL responses (not just OPTIONS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { quote_number } = req.body;

    if (!quote_number) {
      return res.status(400).json({ error: 'quote_number requis' });
    }

    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
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

    // Fetch customer for phone/email in error messages
    const { data: customer } = await supabase
      .from('customers')
      .select('business_name, quote_config')
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

    // 2. Already accepted
    if (quote.status === 'accepted') {
      return res.status(200).json({
        success: true,
        message: 'Ce devis a déjà été accepté. Votre contrat est en cours de préparation.',
        already_accepted: true
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

    // 5. Mark quote as accepted
    await supabase
      .from('quotes')
      .update({
        status: 'accepted',
        responded_at: acceptedAt,
        meta: { accepted_ip: ip, accepted_ua: userAgent },
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

    try {
      fetch('https://automation.bluewiseai.com/webhook/sp-quote-accepted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      }).catch(err => console.error('n8n webhook error (non-blocking):', err));
    } catch (e) {
      // non-blocking
    }

    return res.status(200).json({
      success: true,
      message: 'Devis accepté! Votre contrat sera envoyé sous peu.',
      quote_number: quote.quote_number || quote_number,
      accepted_at: acceptedAt
    });

  } catch (error) {
    console.error('Universal quote accept error:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'acceptation du devis' });
  }
}
