import { getSupabaseServerClient } from '../../lib/supabaseServer';
import Mailgun from 'mailgun.js';
import FormData from 'form-data';

// Use service role key for admin operations (insert into customers table)
// This is an unauthenticated endpoint - new clients filling out onboarding form
const supabase = getSupabaseServerClient();

const mailgun = new Mailgun(FormData);
const mgClient = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
  url: process.env.MAILGUN_API_URL || 'https://api.mailgun.net',
});

/**
 * POST /api/onboarding
 *
 * Accepts comprehensive onboarding intake form submission.
 * Stores data as JSONB in customers.onboarding_intake column.
 *
 * Expected payload:
 * {
 *   onboarding_intake: {
 *     version: '2.0',
 *     submitted_at: ISO timestamp,
 *     ...all form fields
 *   }
 * }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { onboarding_intake } = req.body;

    // Server-side validation
    const errors = validateIntake(onboarding_intake);
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    // Extract key fields for customers table columns
    const {
      businessName,
      businessPhone,
      timezone,
      primaryLanguage,
      businessType,
      tone,
      inboxEmail,
      bookingLink,
      signatureText,
    } = onboarding_intake;

    // Create customer record with onboarding data
    const { data: customer, error: insertError } = await supabase
      .from('customers')
      .insert({
        business_name: businessName,
        telnyx_number: businessPhone, // Will be replaced with actual Telnyx number during provisioning
        timezone: timezone || 'America/Toronto',
        industry: businessType,
        tone_profile: tone,
        inbox_email: inboxEmail,
        booking_link: bookingLink || null,
        signature: signatureText || null,
        onboarding_intake: onboarding_intake, // Full intake data as JSONB
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return res.status(500).json({
        error: 'Failed to save onboarding data',
        details: insertError.message
      });
    }

    // Send confirmation email to owner
    try {
      const domain = process.env.MAILGUN_DOMAIN;
      const ownerEmail = onboarding_intake.ownerEmail;
      const ownerName = onboarding_intake.ownerName;
      const businessName = onboarding_intake.businessName;
      const isFrench = onboarding_intake.primaryLanguage === 'french';

      // Internal notification to Mikael
      const internalMail = {
        from: `BlueWise AI Onboarding <postmaster@${domain}>`,
        to: process.env.MAILGUN_TO,
        subject: `🎯 New Onboarding: ${businessName}`,
        html: `
          <h2>New Lead Rescue Onboarding</h2>
          <p><strong>Business:</strong> ${businessName}</p>
          <p><strong>Owner:</strong> ${ownerName}</p>
          <p><strong>Email:</strong> ${ownerEmail}</p>
          <p><strong>Phone:</strong> ${onboarding_intake.businessPhone}</p>
          <p><strong>Industry:</strong> ${onboarding_intake.businessType}</p>
          <p><strong>Customer ID:</strong> ${customer.id}</p>
          <br/>
          <p><strong>Call Forwarding Ready:</strong> ${onboarding_intake.canEnableCallForwarding === 'yes' ? '✅ Yes' : '⚠️ Needs setup'}</p>
          <p><strong>Booking Link:</strong> ${onboarding_intake.bookingLink || 'Not provided'}</p>
          <br/>
          <p><a href="https://www.bluewiseai.com/platform/customers/${customer.id}">View Customer</a></p>
        `,
      };
      await mgClient.messages.create(domain, internalMail);

      // Confirmation to client
      const subject = isFrench
        ? '✅ Votre inscription Lead Rescue est confirmée'
        : '✅ Your Lead Rescue signup is confirmed';

      const html = `
        <html>
          <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://www.bluewiseai.com/_next/image?url=%2Fowl.png&w=96&q=75" alt="BlueWise AI" style="max-height: 60px;" />
              </div>

              <h2 style="color: #3b82f6;">${isFrench ? 'Merci pour votre confiance !' : 'Thank you for your trust!'}</h2>

              <p>${isFrench ? `Bonjour ${ownerName},` : `Hi ${ownerName},`}</p>

              <p>
                ${isFrench
                  ? `Nous avons bien reçu votre formulaire d'inscription pour <strong>${businessName}</strong>.`
                  : `We've received your onboarding form for <strong>${businessName}</strong>.`}
              </p>

              <div style="background-color: #f0f9ff; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #3b82f6;">${isFrench ? 'Prochaines étapes :' : 'Next Steps:'}</h3>
                <ol style="margin: 0; padding-left: 20px;">
                  <li>${isFrench ? 'Notre équipe analyse vos informations (24h)' : 'Our team reviews your information (24h)'}</li>
                  <li>${isFrench ? 'Configuration de votre système Lead Rescue' : 'Lead Rescue system setup'}</li>
                  <li>${isFrench ? 'Session de formation Zoom (1h)' : 'Zoom training session (1h)'}</li>
                  <li>${isFrench ? 'Activation de votre IA 24/7' : 'Your 24/7 AI goes live'}</li>
                </ol>
              </div>

              <p>
                ${isFrench
                  ? 'Vous recevrez un courriel de ma part dans les prochaines 24 heures avec votre lien de réservation pour la formation.'
                  : "You'll receive an email from me within 24 hours with your booking link for training."}
              </p>

              <p style="font-size: 0.9em; color: #666; margin-top: 30px;">
                ${isFrench ? 'Bien cordialement' : 'Best regards'},<br />
                <strong>Mikaël Larivée Levesque</strong><br />
                ${isFrench ? 'Fondateur' : 'Founder'}, BlueWise AI<br/>
                <a href="mailto:mikael@bluewiseai.com">mikael@bluewiseai.com</a>
              </p>
            </div>
          </body>
        </html>
      `;

      const confirmationMail = {
        from: `Mikaël @ BlueWise AI <hello@${domain}>`,
        to: ownerEmail,
        subject,
        html,
      };
      await mgClient.messages.create(domain, confirmationMail);

    } catch (emailError) {
      console.error('Email send error (non-blocking):', emailError);
      // Don't fail the request if email fails - data is already saved
    }

    // TODO: Trigger provisioning workflow (Telnyx number, VAPI agent, n8n workflow)
    // TODO: Create Notion task for 8-phase onboarding checklist

    return res.status(200).json({
      success: true,
      customer_id: customer.id,
      message: 'Onboarding intake saved successfully. You will receive an email within 24 hours with next steps.',
    });

  } catch (error) {
    console.error('Onboarding API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

/**
 * Server-side validation for onboarding intake
 */
function validateIntake(intake) {
  const errors = [];

  if (!intake) {
    errors.push('Missing onboarding_intake data');
    return errors;
  }

  // Required fields
  const requiredFields = [
    { key: 'businessName', label: 'Business name' },
    { key: 'ownerName', label: 'Owner name' },
    { key: 'ownerEmail', label: 'Owner email' },
    { key: 'ownerMobile', label: 'Owner mobile' },
    { key: 'businessPhone', label: 'Business phone' },
    { key: 'inboxEmail', label: 'Inbox email' },
  ];

  for (const field of requiredFields) {
    if (!intake[field.key] || intake[field.key].trim() === '') {
      errors.push(`${field.label} is required`);
    }
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (intake.ownerEmail && !emailRegex.test(intake.ownerEmail)) {
    errors.push('Owner email is invalid');
  }
  if (intake.inboxEmail && !emailRegex.test(intake.inboxEmail)) {
    errors.push('Inbox email is invalid');
  }

  // HARD GATE: Call forwarding
  if (intake.canEnableCallForwarding === '') {
    errors.push('You must indicate if you can enable call forwarding');
  } else if (intake.canEnableCallForwarding === 'no') {
    errors.push('BLOCKING: Call forwarding after X rings is REQUIRED for Lead Rescue system. Please contact your telecom provider and return when enabled.');
  } else if (!intake.callForwardingAck) {
    errors.push('You must confirm that you understand how call forwarding works');
  }

  // Required acknowledgments
  const requiredAcks = [
    { key: 'smsConsentAck', label: 'SMS/MMS consent acknowledgment' },
    { key: 'smsOptOutAck', label: 'SMS opt-out line acknowledgment' },
    { key: 'noPricingAck', label: 'No pricing promise acknowledgment' },
    { key: 'noTimingAck', label: 'No timing guarantee acknowledgment' },
  ];

  for (const ack of requiredAcks) {
    if (!intake[ack.key]) {
      errors.push(`${ack.label} is required`);
    }
  }

  // Conditional required fields
  if ((intake.dailySummaryDelivery === 'email' || intake.dailySummaryDelivery === 'both')
      && !intake.dailySummaryEmail) {
    errors.push('Daily summary email is required for email delivery');
  }

  if ((intake.dailySummaryDelivery === 'sms' || intake.dailySummaryDelivery === 'both')
      && !intake.dailySummarySMS) {
    errors.push('Daily summary SMS number is required for SMS delivery');
  }

  if (intake.nextStepPreference === 'booking' && !intake.bookingLink) {
    errors.push('Booking link is required when using booking method');
  }

  return errors;
}
