// lib/email-templates/devis-notify.js
// HTML email template for "your devis is ready" notification. Minimal, PUR-branded,
// responsive, dark-on-light. Pulls colors and logo from customers.quote_config.branding.

function escHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function fmtMoneyQC(n) {
  const num = Number(n) || 0;
  return num.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '\u00a0$';
}

function firstName(full) {
  if (!full) return '';
  return String(full).split(/\s+/)[0];
}

/**
 * Render an HTML email body for the "votre devis est prêt" notification.
 *
 * @param {Object} opts
 * @param {string} opts.clientName
 * @param {string} opts.quoteNumber
 * @param {number} opts.totalTtc
 * @param {string} opts.acceptanceUrl - public /q/[token] URL
 * @param {number} opts.validDays
 * @param {Object} [opts.branding] - customers.quote_config.branding
 * @returns {{ subject: string, html: string, text: string }}
 */
export function buildDevisNotifyEmail(opts) {
  const {
    clientName = '',
    quoteNumber = '',
    totalTtc = 0,
    acceptanceUrl = '',
    validDays = 15,
    branding = {},
  } = opts || {};

  const businessName = branding.business_name || 'PÜR Construction';
  const primary      = branding.primary_color || '#2A2C35';
  const accent       = branding.accent_color  || '#E9EFE7';
  const logoUrl      = branding.logo_url      || '';
  const phone        = branding.phone         || '';
  const email        = branding.email         || '';

  const name         = firstName(clientName) || 'bonjour';
  const greeting     = firstName(clientName) ? `Bonjour ${escHtml(name)},` : 'Bonjour,';
  const subject      = `Votre devis ${businessName} — ${escHtml(quoteNumber)}`;

  const html = `<!doctype html>
<html lang="fr-CA">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="padding:28px 32px 20px;background:${primary};color:#ffffff;">
              ${logoUrl ? `<img src="${escHtml(logoUrl)}" alt="${escHtml(businessName)}" height="42" style="display:block;max-height:42px;"/>` : `<h1 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.01em;">${escHtml(businessName)}</h1>`}
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;">${greeting}</p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#374151;">
                Votre devis <strong>${escHtml(quoteNumber)}</strong> est prêt. Vous pouvez le consulter, l'accepter et signer votre contrat directement en ligne.
              </p>

              <!-- Total card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:${accent};border-radius:8px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;margin-bottom:6px;">Montant total (taxes incluses)</div>
                    <div style="font-size:26px;font-weight:700;color:${primary};">${escHtml(fmtMoneyQC(totalTtc))}</div>
                  </td>
                </tr>
              </table>

              <!-- CTA button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="border-radius:8px;background:${primary};">
                    <a href="${escHtml(acceptanceUrl)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                      Consulter mon devis →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
                Lien direct : <a href="${escHtml(acceptanceUrl)}" style="color:${primary};word-break:break-all;">${escHtml(acceptanceUrl)}</a>
              </p>
              <p style="margin:0 0 20px;font-size:13px;color:#6b7280;">
                Devis valide ${validDays} jours.
              </p>

              <p style="margin:0;font-size:14px;color:#374151;line-height:1.55;">
                Des questions? ${phone ? `Appelez-nous au <strong>${escHtml(phone)}</strong>` : 'Répondez à ce courriel'}${email ? ` ou écrivez à <a href="mailto:${escHtml(email)}" style="color:${primary};">${escHtml(email)}</a>` : ''}.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background:#f9fafb;color:#6b7280;font-size:12px;text-align:center;border-top:1px solid #e5e7eb;">
              ${escHtml(businessName)}${phone ? ` · ${escHtml(phone)}` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    greeting.replace(/<[^>]+>/g, ''),
    '',
    `Votre devis ${businessName} ${quoteNumber} est prêt.`,
    `Total TTC : ${fmtMoneyQC(totalTtc)}`,
    '',
    `Consulter : ${acceptanceUrl}`,
    `Valide ${validDays} jours.`,
    '',
    phone ? `Questions? ${phone}` : '',
  ].filter(Boolean).join('\n');

  return { subject, html, text };
}

/**
 * Short SMS body for the devis notification.
 * Telnyx allows long SMS but short is friendlier + cheaper.
 */
export function buildDevisNotifySms(opts) {
  const { clientName = '', businessName = 'PÜR', acceptanceUrl = '', phone = '' } = opts || {};
  const name = firstName(clientName);
  const greet = name ? `Bonjour ${name}! ` : '';
  const help  = phone ? ` Questions: ${phone}` : '';
  return `${greet}Votre devis ${businessName} est prêt: ${acceptanceUrl}${help}`.trim();
}
