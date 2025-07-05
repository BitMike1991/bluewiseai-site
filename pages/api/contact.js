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
  res.setHeader(
    'Access-Control-Allow-Methods',
    'POST, OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type'
  );
  if (req.method === 'OPTIONS') {
    // preflight
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    return res
      .status(405)
      .json({ error: `Method ${req.method} not allowed` });
  }

  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ error: 'Please fill out all fields.' });
  }

  try {
    const domain = process.env.MAILGUN_DOMAIN;
    const mailData = {
      from: `BlueWise AI Contact <postmaster@${domain}>`,
      to: process.env.MAILGUN_TO,
      subject: `New message from ${name}`,
      text: message,
      'h:Reply-To': email,
    };

    const result = await mgClient.messages.create(domain, mailData);
    console.log('Mailgun result:', result);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Mailgun Error:', error);
    return res
      .status(500)
      .json({ error: 'Error sending message.' });
  }
}
