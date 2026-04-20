// lib/email-templates/contract-signed.js
// Client-facing notification after contract signature. Includes:
//   - Download link to the signed contract (hosted on /api/contrat/.../download)
//   - Deposit amount + Interac email (no security question — Jérémy sends
//     that separately per PUR workflow 2026-04-20)
//   - Timeline of next steps
//   - PUR-branded HTML signature block (logo + Jérémy + RBQ + contacts)

import { buildEmailSignatureHtml, PUR_SIGNATURE_DEFAULTS } from './signature.js';

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
 * Build the HTML email body for "contrat signé — voici votre copie".
 *
 * @param {Object} opts
 * @param {string} opts.clientName
 * @param {string} opts.contractNumber
 * @param {number} opts.depositAmount   - taxes-included deposit, CAD
 * @param {number} opts.depositPct      - 0-100
 * @param {string} opts.downloadUrl     - absolute URL to the signed contract
 * @param {string} opts.interacEmail
 * @param {string} opts.businessPhone
 * @param {Object} [opts.branding]      - customers.quote_config.branding
 * @returns {{ subject: string, html: string, text: string }}
 */
export function buildContractSignedEmail(opts) {
  const {
    clientName = '',
    contractNumber = '',
    depositAmount = 0,
    depositPct = 35,
    downloadUrl = '',
    interacEmail = '',
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
  const subject = `Contrat signé — ${businessName} (${contractNumber})`;

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

        <!-- Header -->
        <tr>
          <td style="padding:28px 32px 20px;background:${primary};color:#ffffff;">
            ${logoUrl
              ? `<img src="${escHtml(logoUrl)}" alt="${escHtml(businessName)}" height="42" style="display:block;max-height:42px;"/>`
              : `<h1 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.01em;">${escHtml(businessName)}</h1>`}
          </td>
        </tr>

        <!-- Confirmation -->
        <tr>
          <td style="padding:32px 32px 8px;">
            <div style="display:inline-block;padding:4px 12px;background:#ecfdf5;color:#047857;border:1px solid #10b981;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">
              ✓ Contrat signé
            </div>
            <p style="margin:18px 0 14px;font-size:16px;">${greet}</p>
            <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:#374151;">
              Merci ! Votre contrat <strong>${escHtml(contractNumber)}</strong> est officiel. Vous trouverez ci-dessous votre copie signée ainsi que les prochaines étapes.
            </p>
          </td>
        </tr>

        <!-- Download CTA -->
        <tr>
          <td style="padding:8px 32px 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
              <tr><td style="border-radius:8px;background:${primary};text-align:center;">
                <a href="${escHtml(downloadUrl)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
                  Télécharger mon contrat signé
                </a>
              </td></tr>
            </table>
            <p style="margin:10px 0 0;font-size:12px;color:#6b7280;text-align:center;">
              Le fichier contient les deux signatures apposées.
            </p>
          </td>
        </tr>

        <!-- Deposit card -->
        <tr>
          <td style="padding:0 32px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${accent};border-radius:8px;">
              <tr><td style="padding:20px 24px;">
                <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;margin-bottom:6px;">Dépôt requis (${depositPct}%)</div>
                <div style="font-size:26px;font-weight:700;color:${primary};">${escHtml(fmtMoneyQC(depositAmount))}</div>
                <div style="margin-top:12px;font-size:13px;color:#374151;">
                  Virement Interac à&nbsp;:<br/>
                  <strong style="font-family:'JetBrains Mono',monospace;word-break:break-all;">${escHtml(interacEmail)}</strong>
                </div>
                <div style="margin-top:10px;font-size:12px;color:#6b7280;">
                  Aucune question de sécurité requise — transférez simplement le montant.
                </div>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Next steps -->
        <tr>
          <td style="padding:0 32px 24px;">
            <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;margin-bottom:10px;">Prochaines étapes</div>
            <ol style="margin:0;padding-left:18px;font-size:14px;color:#374151;line-height:1.7;">
              <li>Virement Interac du dépôt</li>
              <li>Prise de mesures finales + commande des matériaux</li>
              <li>Planification de l'installation</li>
            </ol>
          </td>
        </tr>

        <!-- Contact + Signature -->
        <tr>
          <td style="padding:0 32px 28px;">
            <p style="margin:0 0 4px;font-size:14px;color:#374151;line-height:1.55;">
              Des questions? ${phone ? `Appelez-moi au <strong>${escHtml(phone)}</strong>.` : 'Répondez à ce courriel.'}
            </p>
            ${buildEmailSignatureHtml({ branding, signature, defaults: signatureDefaults })}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;background:#f9fafb;color:#9ca3af;font-size:11px;text-align:center;border-top:1px solid #e5e7eb;">
            Courriel envoyé automatiquement suite à la signature du contrat ${escHtml(contractNumber)}.
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    greet.replace(/<[^>]+>/g, ''),
    '',
    `Votre contrat ${businessName} (${contractNumber}) est signé.`,
    `Téléchargez votre copie : ${downloadUrl}`,
    '',
    `Dépôt requis (${depositPct}%) : ${fmtMoneyQC(depositAmount)}`,
    `Virement Interac : ${interacEmail}`,
    `(aucune question de sécurité)`,
    '',
    phone ? `Questions? ${phone}` : '',
  ].filter(Boolean).join('\n');

  return { subject, html, text };
}

/**
 * Short SMS body for the post-signature notification.
 * Keeps the URL short so it fits well in a 160-char SMS segment.
 */
export function buildContractSignedSms(opts) {
  const {
    clientName = '',
    businessName = 'PÜR',
    downloadUrl = '',
    depositAmount = 0,
  } = opts || {};
  const name = firstName(clientName);
  const greet = name ? `Merci ${name}! ` : 'Merci! ';
  const dep = depositAmount > 0 ? ` Dépôt: ${fmtMoneyQC(depositAmount)}.` : '';
  return `${greet}Contrat ${businessName} signé. Copie: ${downloadUrl}${dep}`.trim();
}
