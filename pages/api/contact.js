// src/pages/api/contact.js

import Mailgun from 'mailgun.js';
import FormData from 'form-data';

// Initialize Mailgun client
const mailgun = new Mailgun(FormData);
const mgClient = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
  url: process.env.MAILGUN_API_URL || 'https://api.mailgun.net',
});

export default async function handler(req, res) {
  // --- CORS headers ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end(); // Preflight
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

    // Send internal notification to you
    const mailData = {
      from: `BlueWise AI Contact <postmaster@${domain}>`,
      to: process.env.MAILGUN_TO,
      subject: `New message from ${name}`,
      text: message,
      'h:Reply-To': email,
    };

    await mgClient.messages.create(domain, mailData);

    // Detect if message is in French (very simple heuristic)
    const isFrench = /[\u00C0-\u017F]|(?:\bbonjour\b|\bmerci\b|\bsujet\b|\bmessage\b)/i.test(message);

    // Send confirmation to the client
    const confirmation = {
      from: `BlueWise AI <hello@${domain}>`,
      to: email,
      subject: isFrench
        ? 'Merci pour votre message !'
        : 'Thank you for your message!',
      text: isFrench
        ? `Bonjour ${name},\n\nMerci d&apos;avoir contact&eacute; Blue Wise AI. Nous avons bien re&ccedil;u votre message et nous vous r&eacute;pondrons sous peu.\n\nVotre message :\n&quot;${message}&quot;\n\n&agrave; bient&ocirc;t,\nL&apos;&eacute;quipe Blue Wise AI`
        : `Hi ${name},\n\nThank you for contacting Blue Wise AI. We&apos;ve received your message and will get back to you shortly.\n\nYour message:\n&quot;${message}&quot;\n\nTalk soon,\nThe Blue Wise AI Team`,
    };

    await mgClient.messages.create(domain, confirmation);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Mailgun Error:', error);
    return res.status(500).json({ error: 'Error sending message.' });
  }
}
