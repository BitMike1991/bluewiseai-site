import { getSupabaseServerClient } from '../../lib/supabaseServer';

const supabase = getSupabaseServerClient();

const BW_SLACK_TOKEN = process.env.BW_SLACK_BOT_TOKEN;
const BW_ALERTS_CHANNEL = 'C0AKJT1FMDJ';

/**
 * POST /api/onboarding
 *
 * v3 — Accepts onboarding wizard submission.
 * Saves to customers.onboarding_intake, sends Slack checklist to Mikael.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { checkRateLimit } = await import("../../lib/security");
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress || "unknown";
  if (checkRateLimit(req, res, `onboard:${ip}`, 3)) return;

  try {
    const { onboarding_intake } = req.body;

    if (!onboarding_intake) {
      return res.status(400).json({ error: 'Missing onboarding_intake data' });
    }

    // v3 validation
    const errors = [];
    if (!onboarding_intake.business_name) errors.push('Business name is required');
    if (!onboarding_intake.owner_name) errors.push('Owner name is required');
    if (!onboarding_intake.owner_phone) errors.push('Owner phone is required');
    if (!onboarding_intake.owner_email) errors.push('Owner email is required');
    if (!onboarding_intake.city) errors.push('City is required');
    if (!onboarding_intake.services || onboarding_intake.services.length === 0) errors.push('At least one service is required');

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const bizName = onboarding_intake.business_name;
    const ownerName = onboarding_intake.owner_name;
    const ownerEmail = onboarding_intake.owner_email;
    const ownerPhone = onboarding_intake.owner_phone;
    const industry = onboarding_intake.industry || 'other';
    const city = onboarding_intake.city || '';
    const language = onboarding_intake.language || 'fr';
    const tone = onboarding_intake.tone || 'professionnel';

    // Insert customer row
    const { data: customer, error: insertError } = await supabase
      .from('customers')
      .insert({
        business_name: bizName,
        telnyx_number: 'PENDING',
        telnyx_sms_number: 'PENDING',
        timezone: 'America/Toronto',
        industry,
        tone_profile: tone,
        inbox_email: ownerEmail,
        booking_link: onboarding_intake.booking_link || null,
        customer_phone: ownerPhone,
        sms_enabled: true,
        onboarding_intake,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return res.status(500).json({ error: 'Failed to save', details: insertError.message });
    }

    const customerId = customer.id;

    // Insert subscription row
    await supabase.from('subscriptions').insert({
      customer_id: customerId,
      status: 'onboarding',
      base_fee: 0,
      revenue_share_rate: 0,
      grace_days: 30,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Build Slack checklist for Mikael
    const services = (onboarding_intake.services || []).join(', ');
    const questions = (onboarding_intake.qualifying_questions || []).join(' | ');
    const payments = (onboarding_intake.payment_methods || []).join(', ');

    // Build upload summary
    const uploads = onboarding_intake.uploads || {};
    const uploadLines = Object.entries(uploads)
      .filter(([, files]) => Array.isArray(files) && files.length > 0)
      .map(([key, files]) => `${key}: ${files.length}`)
      .join(', ');

    const slackMsg = [
      `:rocket: *NOUVEAU CLIENT — ${bizName}* (ID: ${customerId})`,
      ``,
      `*Proprietaire:* ${ownerName}`,
      `*Tel:* ${ownerPhone} | *Email:* ${ownerEmail}`,
      `*Ville:* ${city} | *Industrie:* ${industry}`,
      `*Langue:* ${language === 'fr' ? 'Francais' : language === 'en' ? 'English' : 'Bilingue'}`,
      `*Ton:* ${tone}`,
      `*Services:* ${services}`,
      `*Questions de qualification:* ${questions || 'Defaut'}`,
      `*Paiements:* ${payments || 'interac'}`,
      `*Documents:* ${uploadLines || 'Aucun — a envoyer plus tard'}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `:robot_face: *JARVIS VA FAIRE (auto):*`,
      `\`/customer-onboarding ${bizName}\` dans Claude Code`,
      `> :white_check_mark: Acheter numero Telnyx Montreal`,
      `> :white_check_mark: Creer SIP Groundwire + VAPI`,
      `> :white_check_mark: Configurer agent vocal IA`,
      `> :white_check_mark: Connecter SMS universal`,
      `> :white_check_mark: DB completee (subscription, auth user)`,
      ``,
      `:hand: *MIKAEL DOIT FAIRE (manuel):*`,
      `> :black_square_button: Creer workspace Slack \`${bizName.toLowerCase().replace(/\s+/g, '-')}.slack.com\``,
      `> :black_square_button: Creer 9 canaux (#leads, #quotes, #finances, #payments, #expenses, #transfers, #morning, #alerts, #notifications)`,
      `> :black_square_button: Installer app BlueWise sur le workspace`,
      `> :black_square_button: Donner team_id + bot_token a JARVIS`,
      `> :black_square_button: Envoyer instructions Groundwire au client`,
      `> :black_square_button: Appel de verification 15 min avec ${ownerName.split(' ')[0]}`,
      ``,
      `:alarm_clock: *Quand le Slack est pret, dis a JARVIS:*`,
      `\`Slack pret pour ${bizName}: team_id=TXXXX bot_token=xoxb-XXXX\``,
      `JARVIS finit le reste automatiquement.`,
    ].join('\n');

    // Send to Slack #bw-alerts
    try {
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${BW_SLACK_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: BW_ALERTS_CHANNEL,
          text: slackMsg,
          unfurl_links: false,
        }),
      });
    } catch (slackErr) {
      console.error('Slack notification error (non-blocking):', slackErr);
    }

    // Send confirmation email to customer via Mailgun
    try {
      const Mailgun = (await import('mailgun.js')).default;
      const FormData = (await import('form-data')).default;
      const mg = new Mailgun(FormData);
      const mgClient = mg.client({
        username: 'api',
        key: process.env.MAILGUN_API_KEY,
        url: process.env.MAILGUN_API_URL || 'https://api.mailgun.net',
      });
      const domain = process.env.MAILGUN_DOMAIN;
      const isFr = language === 'fr' || language === 'both';

      await mgClient.messages.create(domain, {
        from: `BlueWise AI <hello@${domain}>`,
        to: ownerEmail,
        subject: isFr
          ? `${bizName} — Votre systeme IA est en cours de configuration`
          : `${bizName} — Your AI system is being set up`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#333;">
            <h2 style="color:#6c63ff;">${isFr ? 'Merci pour votre confiance!' : 'Thank you for your trust!'}</h2>
            <p>${isFr ? `Bonjour ${ownerName.split(' ')[0]},` : `Hi ${ownerName.split(' ')[0]},`}</p>
            <p>${isFr
              ? `Nous avons bien recu vos informations pour <strong>${bizName}</strong>. Notre equipe configure votre systeme en ce moment.`
              : `We received your information for <strong>${bizName}</strong>. Our team is setting up your system right now.`}</p>
            <div style="background:#f0f4ff;padding:16px;border-radius:8px;margin:20px 0;">
              <h3 style="margin-top:0;color:#6c63ff;">${isFr ? 'Prochaines etapes:' : 'Next steps:'}</h3>
              <ol style="margin:0;padding-left:20px;">
                <li>${isFr ? 'Configuration de votre numero de telephone (automatique)' : 'Phone number setup (automatic)'}</li>
                <li>${isFr ? 'Creation de votre agent vocal IA (automatique)' : 'AI voice agent creation (automatic)'}</li>
                <li>${isFr ? 'Installation de Groundwire sur votre telephone (on vous guide)' : 'Groundwire app setup (we guide you)'}</li>
                <li>${isFr ? 'Appel de verification ensemble — 15 minutes' : 'Verification call together — 15 minutes'}</li>
              </ol>
            </div>
            <p>${isFr
              ? 'On vous contacte dans les prochaines 24 heures pour tout finaliser.'
              : "We'll contact you within 24 hours to finalize everything."}</p>
            <p style="color:#666;font-size:0.9em;margin-top:30px;">
              ${isFr ? 'A bientot' : 'Talk soon'},<br/>
              <strong>Mikael Larivee Levesque</strong><br/>
              BlueWise AI<br/>
              <a href="mailto:mikael@bluewiseai.com" style="color:#6c63ff;">mikael@bluewiseai.com</a>
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Email error (non-blocking):', emailErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Onboarding saved. You will be contacted within 24 hours.',
    });

  } catch (error) {
    console.error('Onboarding API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
