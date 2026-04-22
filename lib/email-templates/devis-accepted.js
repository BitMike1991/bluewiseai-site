// lib/email-templates/devis-accepted.js
// Client-facing confirmation after they click "J'accepte" on their devis.
// Includes the sign link so they can proceed immediately to the contract.

import { buildEmailSignatureHtml, PUR_SIGNATURE_DEFAULTS } from './signature.js';

function escHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function fmtMoneyQC(n) {
  const num = Number(n) || 0;
  return num.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' $';
}

function firstName(full) {
  if (!full) return '';
  return String(full).split(/\s+/)[0];
}

/**
 * Build the "Devis accepté — voici votre lien pour signer" email.
 *
 * @param {Object} opts
 * @param {string} opts.clientName
 * @param {string} opts.projectRef      - PUR-0042 (preferred) or quote_number
 * @param {number} opts.totalTtc
 * @param {string} opts.signUrl          - absolute URL to /q/[token]/sign
 * @param {string} opts.businessPhone
 * @param {Object} [opts.branding]       - customers.quote_config.branding
 * @returns {{ subject: string, html: string, text: string }}
 */
export function buildDevisAcceptedEmail(opts) {
  const {
    clientName = '',
    projectRef = '',
    totalTtc = 0,
    signUrl = '',
    businessPhone = '',
    branding = {},
    signature = null,
    signatureDefaults = PUR_SIGNATURE_DEFAULTS,
  } = opts || {};

  const businessName = branding.business_name || 'PÜR Construction';
  const primary      = branding.primary_color || '#2A2C35';
  const accent       = branding.accent_color  || '#E9EFE7';
  const logoUrl      = branding.logo_url      || '';

  const phone = businessPhone || branding.phone || '';
  const name  = firstName(clientName);
  const greet = name ? `Bonjour ${escHtml(name)},` : 'Bonjour,';
  const subject = `Devis accepté — Prochaine étape : signer le contrat (${projectRef})`;

  const signatureHtml = buildEmailSignatureHtml(signature, signatureDefaults);

  const html = `<!doctype html>
<html lang="fr-CA">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr>
          <td style="padding:28px 32px 20px;background:${primary};color:#ffffff;">
            ${logoUrl
              ? `<img src="${escHtml(logoUrl)}" alt="${escHtml(businessName)}" height="42" style="display:block;max-height:42px;"/>`
              : `<h1 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.01em;">${escHtml(businessName)}</h1>`}
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 8px;">
            <div style="display:inline-block;padding:4px 12px;background:#ecfdf5;color:#047857;border:1px solid #10b981;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">
              ✓ Devis accepté
            </div>
            <p style="margin:18px 0 14px;font-size:16px;">${greet}</p>
            <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#374151;">
              Merci d'avoir accepté votre devis <strong>${escHtml(projectRef)}</strong>${totalTtc ? ` au montant de <strong>${fmtMoneyQC(totalTtc)}</strong>` : ''}.
            </p>
            <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:#374151;">
              Dernière étape : <strong>signer votre contrat</strong> pour confirmer les travaux et verrouiller votre place à notre calendrier.
            </p>
          </td>
        </tr>
        ${signUrl ? `
        <tr>
          <td style="padding:0 32px 28px;">
            <a href="${escHtml(signUrl)}" style="display:inline-block;padding:14px 28px;background:${primary};color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">Signer mon contrat &rarr;</a>
            <p style="margin:14px 0 0;font-size:12px;color:#6b7280;word-break:break-all;">
              Ou copier ce lien dans votre navigateur :<br/>
              <span style="color:#374151;">${escHtml(signUrl)}</span>
            </p>
          </td>
        </tr>` : ''}
        <tr>
          <td style="padding:20px 32px 32px;border-top:1px solid ${accent};">
            <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
              Des questions ? ${phone ? `Appelez-nous au <a href="tel:${escHtml(phone.replace(/[^+\d]/g, ''))}" style="color:${primary};text-decoration:none;">${escHtml(phone)}</a>` : 'Répondez à ce courriel'}.
            </p>
            ${signatureHtml}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `${greet}`,
    '',
    `Merci d'avoir accepté votre devis ${projectRef}${totalTtc ? ` au montant de ${fmtMoneyQC(totalTtc).replace(/ /g, ' ')}` : ''}.`,
    '',
    'Dernière étape : signer votre contrat pour confirmer les travaux.',
    signUrl ? `\nSigner le contrat : ${signUrl}` : '',
    '',
    phone ? `Des questions ? Appelez-nous au ${phone}.` : 'Des questions ? Répondez à ce courriel.',
  ].filter(Boolean).join('\n');

  return { subject, html, text };
}
