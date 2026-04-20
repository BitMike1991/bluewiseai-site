// lib/email-templates/signature.js
// Tenant-aware HTML email signature block. Rendered at the bottom of every
// client-facing email (devis-notify, contract-signed, test sends). Reads
// customers.quote_config.email_signature when present, falls back to sensible
// defaults derived from branding so a tenant with no explicit signature still
// gets a clean PUR-style block.
//
// Email HTML rules apply: table-based layout, inline styles, no CSS classes
// targeting pseudo-selectors. Outlook 2016+ and Gmail both render this fine.

function escHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/**
 * Build a PUR-style HTML signature block. Deterministic, tenant-driven.
 *
 * @param {Object} opts
 * @param {Object} opts.branding         - customers.quote_config.branding
 * @param {Object} [opts.signature]      - customers.quote_config.email_signature (optional)
 * @param {Object} [opts.defaults]       - { name, title } if signature not set
 * @returns {string} HTML
 */
export function buildEmailSignatureHtml({ branding = {}, signature = null, defaults = {} }) {
  const sig = signature || {};

  const businessName = sig.business_name || branding.business_name || 'BlueWise';
  const legalName    = sig.legal_name    || branding.legal_name    || businessName;
  const name         = sig.name          || defaults.name          || '';
  const title        = sig.title         || defaults.title         || '';
  const phone        = sig.phone         || branding.phone         || '';
  const email        = sig.email         || branding.email         || '';
  const address      = sig.address       || branding.address       || '';
  const rbq          = sig.rbq_number    || branding.rbq_number    || '';
  const memberships  = sig.memberships   || branding.memberships   || [];
  const website      = sig.website       || branding.website       || '';
  const logoUrl      = sig.logo_url      || branding.logo_url      || '';
  const photoUrl     = sig.photo_url     || '';
  const primary      = branding.primary_color || '#2A2C35';
  const accent       = branding.accent_color  || '#E9EFE7';

  // Phone link: digits-only for tel:
  const phoneDigits = phone ? phone.replace(/\D/g, '') : '';

  const nameLine = name
    ? `<tr><td style="padding-top:6px;font-size:15px;font-weight:700;color:${primary};letter-spacing:-0.005em;">${escHtml(name)}</td></tr>`
    : '';
  const titleLine = title
    ? `<tr><td style="padding-top:2px;font-size:12px;font-weight:500;color:#6b7280;letter-spacing:0.02em;text-transform:uppercase;">${escHtml(title)}</td></tr>`
    : '';
  const businessLine = `<tr><td style="padding-top:10px;font-size:14px;font-weight:700;color:${primary};">${escHtml(businessName)}</td></tr>`;
  const phoneLine = phone
    ? `<tr><td style="padding-top:4px;font-size:13px;color:#374151;"><a href="tel:${escHtml(phoneDigits)}" style="color:${primary};text-decoration:none;">${escHtml(phone)}</a></td></tr>`
    : '';
  const emailLine = email
    ? `<tr><td style="font-size:13px;color:#374151;"><a href="mailto:${escHtml(email)}" style="color:${primary};text-decoration:none;">${escHtml(email)}</a></td></tr>`
    : '';
  const websiteLine = website
    ? `<tr><td style="font-size:13px;color:#374151;"><a href="${escHtml(website)}" style="color:${primary};text-decoration:none;">${escHtml(website.replace(/^https?:\/\//, ''))}</a></td></tr>`
    : '';
  const addressLine = address
    ? `<tr><td style="padding-top:6px;font-size:12px;color:#6b7280;line-height:1.45;">${escHtml(address)}</td></tr>`
    : '';

  // Credentials row: RBQ + memberships grouped together in a compact line
  const credChunks = [];
  if (rbq) credChunks.push(`<strong style="color:${primary};">RBQ ${escHtml(rbq)}</strong>`);
  (Array.isArray(memberships) ? memberships : []).forEach(m => {
    credChunks.push(escHtml(String(m)));
  });
  const credLine = credChunks.length
    ? `<tr><td style="padding-top:8px;font-size:11px;color:#6b7280;letter-spacing:0.03em;">${credChunks.join(' &nbsp;·&nbsp; ')}</td></tr>`
    : '';

  // Left column: logo OR photo OR monogram fallback
  const leftCol = logoUrl
    ? `<img src="${escHtml(logoUrl)}" alt="${escHtml(businessName)}" width="96" height="96" style="display:block;width:96px;height:96px;object-fit:contain;border:0;background:${primary};border-radius:10px;padding:8px;"/>`
    : photoUrl
      ? `<img src="${escHtml(photoUrl)}" alt="${escHtml(name || businessName)}" width="96" height="96" style="display:block;width:96px;height:96px;object-fit:cover;border:0;border-radius:50%;"/>`
      : `<div style="width:96px;height:96px;background:${primary};color:#ffffff;border-radius:10px;display:inline-block;text-align:center;line-height:96px;font-size:34px;font-weight:800;letter-spacing:-0.02em;">${escHtml(businessName.substring(0, 2).toUpperCase())}</div>`;

  return `
<!-- Signature -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;padding-top:20px;border-top:3px solid ${primary};width:100%;max-width:520px;">
  <tr>
    <td valign="top" style="padding-right:18px;width:96px;">
      ${leftCol}
    </td>
    <td valign="top" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        ${nameLine}
        ${titleLine}
        ${businessLine}
        ${phoneLine}
        ${emailLine}
        ${websiteLine}
        ${addressLine}
        ${credLine}
      </table>
    </td>
  </tr>
</table>
<!-- / Signature -->`;
}

/**
 * PUR-specific defaults (Jérémy Coupal, entrepreneur général) so any PUR email
 * without an explicit email_signature config still ships a recognizable
 * signature. Tenant can override via quote_config.email_signature.
 */
export const PUR_SIGNATURE_DEFAULTS = {
  name: 'Jérémy Coupal',
  title: 'Entrepreneur général',
};
