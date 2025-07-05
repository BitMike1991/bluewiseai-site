// src/pages/api/contact.js

import Mailgun from 'mailgun.js';
import FormData from 'form-data';

const mailgun = new Mailgun(FormData);
const mgClient = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
  url: process.env.MAILGUN_API_URL || 'https://api.mailgun.net',
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Please fill out all fields.' });
  }

  try {
    const domain = process.env.MAILGUN_DOMAIN;

    // Send notification to yourself
    const internalMail = {
      from: `BlueWise AI Contact <postmaster@${domain}>`,
      to: process.env.MAILGUN_TO,
      subject: `New message from ${name}`,
      text: message,
      'h:Reply-To': email,
    };

    await mgClient.messages.create(domain, internalMail);

    const isFrench = /[\u00C0-\u017F]|(?:\bbonjour\b|\bmerci\b|\bsujet\b|\bmessage\b)/i.test(message);

    const subject = isFrench
      ? 'Merci pour votre message !'
      : 'Thank you for your message!';

    const plainText = isFrench
      ? `Bonjour ${name},\n\nMerci d'avoir contacté Blue Wise AI. Nous avons bien reçu votre message et nous vous répondrons sous peu.\n\nVotre message :\n"${message}"\n\nÀ bientôt,\nMikaël Larivée Levesque\nFondateur / Consultant IA`
      : `Hi ${name},\n\nThank you for contacting Blue Wise AI. We've received your message and will get back to you shortly.\n\nYour message:\n"${message}"\n\nTalk soon,\nMikaël Larivée Levesque\nFounder / AI Consultant`;

    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://www.bluewiseai.com/_next/image?url=%2Fowl.png&w=96&q=75" alt="Blue Wise AI" style="max-height: 60px;" />
            </div>
            <p>${isFrench ? `Bonjour ${name},` : `Hi ${name},`}</p>

            <p>
              ${isFrench
                ? `Merci d'avoir contacté <strong>Blue Wise AI</strong>! Nous avons bien reçu votre message :`
                : `Thank you for contacting <strong>Blue Wise AI</strong>! We've received your message:`}
            </p>

            <blockquote style="background-color: #f9f9f9; padding: 12px 16px; border-left: 4px solid #3b82f6; margin: 20px 0;">
              "${message}"
            </blockquote>

            <p>
              ${isFrench
                ? 'Nous vous répondrons sous peu. À bientôt !'
                : 'We’ll get back to you shortly. Talk soon!'}
            </p>

            <br />

            <p style="font-size: 0.9em; color: #666;">
              ${isFrench ? 'Bien cordialement' : 'Best regards'},<br />
              <strong>Mikaël Larivée Levesque</strong><br />
              Founder / AI Consultant
            </p>
          </div>
        </body>
      </html>
    `;

    const confirmationMail = {
      from: `BlueWise AI <hello@${domain}>`,
      to: email,
      subject,
      text: plainText,
      html,
    };

    await mgClient.messages.create(domain, confirmationMail);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Mailgun Error:', error);
    return res.status(500).json({ error: 'Error sending message.' });
  }
}
