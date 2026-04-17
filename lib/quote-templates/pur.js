/**
 * PÜR Construction — Quote HTML Template (BlueWise universal shape)
 * Ported from pur-construction-site/lib/devis/generator.js for use via
 * the BW universal devis API when config.branding.html_template === 'pur'.
 *
 * NEVER show: supplier names (Royalty, Touchette), discount %, supplier cost.
 * Payment terms: driven by config.payment_schedule (seeded: 35% / 65%).
 * Prices: Quebec format — 1 234,56 $
 *
 * Input shapes:
 *   data = {
 *     quote_number, date, valid_days,
 *     client_name, client_phone, client_email, client_address, client_city,
 *     project_description,
 *     line_items: [{ description, qty, unit_price, total, model?, ouvrant?, dimensions?, type?, specs? }],
 *     subtotal, tax_gst, tax_qst, total_ttc,
 *     notes, acceptance_url
 *   }
 *   config = {
 *     branding: { business_name, phone, email, address, rbq_number, logo_url },
 *     quote: { warranties, exclusions, valid_days, notes_template },
 *     payment_schedule: [{ label, description, percentage }, ...]
 *   }
 *
 * The INSTALL_DESCRIPTION sentinel marks the installation line_item —
 * it renders as a separate row below the fenêtres subtotal, matching
 * the original PÜR visual layout.
 */

const NAVY = '#2A2C35';
const INSTALL_DESCRIPTION = 'Installation, finition et moulures extérieures';

// ─── Currency formatting ─────────────────────────────────────────────────────

function fmtPrice(amount) {
  return Number(amount).toLocaleString('fr-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + '\u00a0$';
}

// ─── Date formatting ─────────────────────────────────────────────────────────

function fmtDate(dateStr) {
  const months = [
    'janvier','février','mars','avril','mai','juin',
    'juillet','août','septembre','octobre','novembre','décembre'
  ];
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}

// ─── HTML escaping ────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── SVG sketches ────────────────────────────────────────────────────────────

function panelSvg(type, x, y, w, h) {
  let svg = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${NAVY}" stroke-width="1.5"/>`;
  const pad = 3;
  svg += `<rect x="${x+pad}" y="${y+pad}" width="${w-pad*2}" height="${h-pad*2}" fill="none" stroke="${NAVY}" stroke-width="0.6" opacity="0.4"/>`;
  if (type === 'OG') {
    svg += `<polyline points="${x+w-pad},${y+pad} ${x+pad},${y+h/2} ${x+w-pad},${y+h-pad}" fill="none" stroke="${NAVY}" stroke-width="0.8" opacity="0.75"/>`;
  } else if (type === 'OD') {
    svg += `<polyline points="${x+pad},${y+pad} ${x+w-pad},${y+h/2} ${x+pad},${y+h-pad}" fill="none" stroke="${NAVY}" stroke-width="0.8" opacity="0.75"/>`;
  } else if (type === 'A') {
    svg += `<polyline points="${x+pad},${y+h-pad} ${x+w/2},${y+pad} ${x+w-pad},${y+h-pad}" fill="none" stroke="${NAVY}" stroke-width="0.8" opacity="0.75"/>`;
  }
  return svg;
}

function ouvrantToPanels(ouvrant) {
  if (!ouvrant) return ['F'];
  const o = String(ouvrant).trim().toUpperCase();
  if (o === 'GFD' || o === 'OGF OD' || o === 'GF D') return ['OG','F','OD'];
  if (o === 'GF')  return ['OG','F'];
  if (o === 'FD')  return ['F','OD'];
  if (o === 'GFG') return ['OG','F','OG'];
  if (o === 'DFD') return ['OD','F','OD'];
  if (o === 'XO')  return ['X','O'];
  if (o === 'OX')  return ['O','X'];
  if (o === 'XX')  return ['X','X'];
  if (o === 'G' || o === 'OG') return ['OG'];
  if (o === 'D' || o === 'OD') return ['OD'];
  if (o === 'A')   return ['A'];
  if (o === 'F')   return ['F'];
  return ['F'];
}

function windowSketchSvg(panels, widthStr, heightStr) {
  function parseFrac(s) {
    if (!s) return 36;
    const m = String(s).match(/^(\d+)(?:\s+(\d+)\/(\d+))?$/);
    if (!m) return parseFloat(s) || 36;
    return parseInt(m[1]) + (m[2] ? parseInt(m[2])/parseInt(m[3]) : 0);
  }
  const wNum = parseFrac(widthStr);
  const hNum = parseFrac(heightStr);
  const ratio = wNum / hNum;
  const totalW = 100;
  const totalH = Math.round(totalW / Math.max(0.5, Math.min(2.6, ratio)));
  const panelW = totalW / panels.length;
  const ox = 5, oy = 5;
  const vbW = totalW + 10;
  const vbH = totalH + 10;
  let inner = '';
  panels.forEach((p, i) => { inner += panelSvg(p, ox + i * panelW, oy, panelW, totalH); });
  return `<svg width="100" height="${Math.round(100 * vbH / vbW)}" viewBox="0 0 ${vbW} ${vbH}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

function itemSketchSvg(item) {
  const panels = ouvrantToPanels(item.ouvrant);
  const type = (item.type || '').toLowerCase();
  if (type.includes('patio') || type.includes('coulissant')) {
    const totalW = 110, totalH = 85;
    const pw = 110 / panels.length;
    let inner = `<rect x="5" y="5" width="110" height="85" fill="none" stroke="${NAVY}" stroke-width="1.5"/>`;
    panels.forEach((p, i) => {
      const x = 5 + i * pw;
      inner += `<rect x="${x+2}" y="7" width="${pw-4}" height="81" fill="none" stroke="${NAVY}" stroke-width="0.6" opacity="0.5"/>`;
      if (p === 'X') {
        inner += `<line x1="${x+8}" y1="48" x2="${x+pw-8}" y2="48" stroke="${NAVY}" stroke-width="1" opacity="0.7"/>`;
        inner += `<polyline points="${x+pw-14},42 ${x+pw-8},48 ${x+pw-14},54" fill="none" stroke="${NAVY}" stroke-width="1" opacity="0.7"/>`;
      }
    });
    return `<svg width="110" height="85" viewBox="0 0 120 95" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  }
  if (type.includes('porte') && !type.includes('patio') && !type.includes('coulissant')) {
    return `<svg width="70" height="110" viewBox="0 0 70 110" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="64" height="95" fill="none" stroke="${NAVY}" stroke-width="1.5"/>
      <rect x="10" y="12" width="50" height="38" fill="none" stroke="${NAVY}" stroke-width="1" opacity="0.6"/>
      <line x1="13" y1="15" x2="57" y2="47" stroke="${NAVY}" stroke-width="0.5" opacity="0.35"/>
      <line x1="13" y1="47" x2="57" y2="15" stroke="${NAVY}" stroke-width="0.5" opacity="0.35"/>
      <rect x="10" y="56" width="50" height="36" fill="none" stroke="${NAVY}" stroke-width="1" opacity="0.6"/>
      <circle cx="56" cy="74" r="1" fill="${NAVY}"/>
      <polygon points="3,100 67,100 60,108 10,108" fill="none" stroke="${NAVY}" stroke-width="1"/>
    </svg>`;
  }
  const w = item.dimensions?.width || '36';
  const h = item.dimensions?.height || '36';
  return windowSketchSvg(panels, w, h);
}

// ─── Warranty grid from config ────────────────────────────────────────────────

function renderWarrantyGrid(warranties) {
  if (!warranties || warranties.length === 0) {
    return '<p style="font-size:12px;opacity:0.6;">Garantie conforme aux normes de l\'industrie.</p>';
  }
  // Group by category
  const groups = {};
  for (const w of warranties) {
    const cat = w.category || 'Garanties';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(w);
  }
  const cards = Object.entries(groups).map(([cat, items]) => `
    <div class="warranty-card">
      <h4>${escHtml(cat)}</h4>
      <ul>
        ${items.map(w => `<li><span class="w-item">${escHtml(w.item)}</span><span class="w-duration">${escHtml(w.duration)}</span></li>`).join('')}
      </ul>
    </div>`).join('');
  return `<div class="warranty-grid">${cards}</div>`;
}

// ─── Item row (from universal line_item shape) ────────────────────────────────

function renderItemRow(item, index) {
  // PÜR-specific fields are optional on the universal shape
  const type = item.type || item.description || 'Item';
  const model = item.model || null;
  const ouvrant = item.ouvrant || null;
  const dims = item.dimensions || null;
  const specs = item.specs || null;

  const sketchSvg = itemSketchSvg(item);
  const w = dims?.width || '—';
  const h = dims?.height || '—';

  return `
    <tr class="item-row">
      <td class="td-num">${index}</td>
      <td class="td-type">
        <div class="item-type">${escHtml(type)}${model ? ` <span class="item-model">${escHtml(model)}</span>` : ''}${ouvrant ? ` <span class="item-ouvrant">${escHtml(ouvrant)}</span>` : ''}</div>
        ${specs ? `<div class="item-specs">${escHtml(specs)}</div>` : ''}
      </td>
      <td class="td-sketch">${sketchSvg}</td>
      <td class="td-dims"><span class="dims-val">${escHtml(String(w))}<span class="dim-sep"> × </span>${escHtml(String(h))}</span></td>
      <td class="td-qty">${item.qty || 1}</td>
      <td class="td-price">${fmtPrice(item.unit_price || 0)}</td>
      <td class="td-total">${fmtPrice(item.total || 0)}</td>
    </tr>`;
}

// ─── Main generator ──────────────────────────────────────────────────────────

/**
 * generatePurQuoteHtml(data, config) → complete HTML string
 *
 * Produces the PÜR navy/sage branded quote.
 * Reads warranties, exclusions, notes_template, payment_schedule from config.
 * Renders acceptance_url as a simple read-only link (P3/P5 will wire the accept flow).
 */
export function generatePurQuoteHtml(data, config) {
  const {
    quote_number,
    date,
    valid_days,
    client_name,
    client_phone,
    client_email,
    client_address,
    client_city,
    line_items = [],
    subtotal,
    tax_gst,
    tax_qst,
    total_ttc,
    notes,
    acceptance_url,
  } = data;

  const b = config.branding || {};
  const q = config.quote || {};
  const schedule = config.payment_schedule || [];

  // Split items: installation line vs fenêtres/portes
  const installItem = line_items.find(it => it.description === INSTALL_DESCRIPTION);
  const fenItems = line_items.filter(it => it.description !== INSTALL_DESCRIPTION);

  const sousTotalFenetres = fenItems.reduce((s, it) => s + (it.total || 0), 0);
  const installationCost = installItem ? (installItem.total || 0) : 0;

  // Payment rows driven by config
  const depot35 = total_ttc * ((schedule[0]?.percentage || 35) / 100);
  const solde65 = total_ttc * ((schedule[1]?.percentage || 65) / 100);
  const payDesc0 = schedule[0]?.description || 'Dépôt à la signature du devis';
  const payPct0 = schedule[0]?.percentage || 35;
  const payDesc1 = schedule[1]?.description || 'Balance — 24 h avant l\'installation';
  const payPct1 = schedule[1]?.percentage || 65;

  const dateLabel = fmtDate(date);
  const clientNameEsc = escHtml(client_name);
  const clientAddressEsc = escHtml([client_address, client_city].filter(Boolean).join(', '));
  const docNumEsc = escHtml(quote_number);
  const validDays = valid_days || q.valid_days || 15;

  // RBQ from branding config
  const rbqNum = b.rbq_number || '5827-6668-01';
  const businessName = b.business_name || 'PÜR Construction & Rénovation Inc.';
  const businessPhone = b.phone || '(514) 926-7669';
  const businessEmail = b.email || 'purconstructionrenovation@gmail.com';
  const businessAddress = b.address || '366 Rue du Lac-Légaré, Saint-Colomban QC J5K 2K4';

  // Logo
  const logoHtml = b.logo_url
    ? `<img src="${escHtml(b.logo_url)}" alt="${escHtml(businessName)}">`
    : '';

  // Items HTML
  const itemsHtml = fenItems.map((item, i) => renderItemRow(item, i + 1)).join('\n');

  // Warranties from config
  const warrantyHtml = renderWarrantyGrid(q.warranties);

  // Exclusions from config
  const exclusionItems = (q.exclusions || [
    'Travaux d\'électricité, de plomberie ou de ventilation non mentionnés',
    'Réparations structurelles non décrites au présent devis',
    'Permis municipaux (à la charge du client)',
    'Finition intérieure en gypse sauf si mentionnée aux notes par ouverture',
    'Enlèvement d\'amiante ou de matières dangereuses',
    'Peinture intérieure et retouches de plâtre',
    'Tout travail non explicitement décrit dans le présent devis',
  ]).map(e => `<li>${escHtml(e)}</li>`).join('');

  // Notes from config or per-quote
  const notesTemplate = q.notes_template || null;
  const notesItems = (notes || notesTemplate) ? [
    ...(notesTemplate ? [notesTemplate] : []),
    ...(notes && notes !== notesTemplate ? [notes] : []),
  ] : [
    'Tous les items sont représentés en <strong>vue extérieure</strong>',
    'Isolation au polyuréthane et/ou laine minérale, ruban pare-air et prise de mesure incluses',
    'L\'installation comprend la fixation, le calfeutrage, et le ramassage des débris de chantier',
    'Toutes les fenêtres PVC sont homologuées <strong>ENERGY STAR</strong> sauf mention contraire',
    `Ce devis est valide ${validDays} jours à compter de la date d'émission`,
  ];
  const notesItemsHtml = notesItems.map(n => `<li>${n}</li>`).join('');

  // Acceptance section (read-only link — P3/P5 will wire the full accept flow)
  const acceptHtml = acceptance_url
    ? `<section class="accept-placeholder">
        <p class="accept-label">Pour accepter ce devis :</p>
        <a href="${escHtml(acceptance_url + '/accept')}" class="btn-accept">Accepter ce devis →</a>
      </section>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow, noarchive, nosnippet">
  <meta name="googlebot" content="noindex, nofollow">
  <meta name="format-detection" content="telephone=no">
  <title>Devis PÜR — ${clientNameEsc}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --navy: #2A2C35;
      --navy-light: #3A3D47;
      --sage: #E9EFE7;
      --sage-dark: #D8E0D4;
      --sage-light: #F2F5F0;
      --ice: #F5F7F4;
      --mist: #F0F1F3;
      --pure: #FFFFFF;
      --text-muted: #6b7280;
      --text-soft: #9ca3af;
      --border: #e5e7eb;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--ice);
      color: var(--navy);
      font-size: 14px;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    h1, h2, h3, h4 {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .page { max-width: 900px; margin: 0 auto; background: var(--pure); min-height: 100vh; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }

    /* HEADER */
    .header { background: var(--navy); color: var(--pure); padding: 48px 56px 40px; display: flex; align-items: center; justify-content: space-between; gap: 32px; }
    .header-brand { display: flex; align-items: center; gap: 20px; }
    .header-brand img { height: 84px; width: auto; object-fit: contain; display: block; }
    .brand-name { font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 700; letter-spacing: 0.02em; line-height: 1.15; }
    .brand-name span { display: block; font-size: 10px; font-weight: 500; letter-spacing: 0.15em; opacity: 0.6; margin-top: 4px; }
    .header-title { text-align: right; }
    .header-title .label { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.55; margin-bottom: 6px; }
    .header-title h1 { font-size: 32px; font-weight: 700; letter-spacing: -0.01em; }
    .header-title .rbq { font-size: 10px; opacity: 0.55; margin-top: 6px; letter-spacing: 0.1em; }

    /* META BAR */
    .meta-bar { background: var(--sage); padding: 18px 56px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
    .meta-bar .cell .label { font-size: 9px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: var(--navy); opacity: 0.55; margin-bottom: 4px; }
    .meta-bar .cell .value { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; color: var(--navy); }

    /* SECTIONS */
    .section { padding: 40px 56px; border-bottom: 1px solid var(--border); }
    .section:last-child { border-bottom: none; }
    .section-title { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--navy); opacity: 0.6; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; }
    .section-title::before { content: ''; display: inline-block; width: 24px; height: 2px; background: var(--navy); opacity: 0.6; }

    /* COORDS */
    .coord-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .coord-card { background: var(--ice); padding: 24px; border-radius: 4px; border-left: 3px solid var(--navy); }
    .coord-card .card-label { font-size: 9px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--navy); opacity: 0.55; margin-bottom: 12px; }
    .coord-card .name { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
    .coord-card p { font-size: 13px; color: var(--navy); opacity: 0.85; margin-bottom: 3px; }

    /* ITEMS TABLE */
    .items-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .items-table thead tr { background: var(--navy); color: var(--pure); }
    .items-table thead th { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding: 10px 12px; text-align: left; white-space: nowrap; }
    .items-table thead th.th-right { text-align: right; }
    .items-table thead th.th-center { text-align: center; }
    .items-table tbody tr { border-bottom: 1px solid var(--border); }
    .items-table tbody tr:last-child { border-bottom: none; }
    .items-table tbody tr:nth-child(even) { background: var(--ice); }
    .items-table tbody td { padding: 14px 12px; vertical-align: top; }
    .td-num { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; color: var(--navy); opacity: 0.5; width: 32px; text-align: center; vertical-align: middle; }
    .td-type { min-width: 240px; }
    .item-type { font-weight: 600; color: var(--navy); line-height: 1.35; margin-bottom: 4px; }
    .item-model { font-family: 'JetBrains Mono', monospace; font-size: 10px; background: var(--sage); color: var(--navy); padding: 1px 6px; border-radius: 2px; margin-left: 6px; font-weight: 700; letter-spacing: 0.05em; }
    .item-ouvrant { font-family: 'JetBrains Mono', monospace; font-size: 10px; background: var(--mist); color: var(--navy); padding: 1px 6px; border-radius: 2px; margin-left: 4px; opacity: 0.75; }
    .item-specs { font-size: 11px; color: var(--text-muted); margin-top: 4px; line-height: 1.5; }
    .td-sketch { width: 110px; text-align: center; vertical-align: middle; }
    .td-sketch svg { display: block; margin: 0 auto; background: var(--sage-light); border: 1px solid var(--sage-dark); border-radius: 2px; }
    .td-dims { white-space: nowrap; text-align: center; vertical-align: middle; }
    .dims-val { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; }
    .dim-sep { opacity: 0.4; margin: 0 2px; }
    .td-qty { font-family: 'JetBrains Mono', monospace; font-weight: 700; text-align: center; vertical-align: middle; }
    .td-price, .td-total { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; text-align: right; white-space: nowrap; vertical-align: middle; }
    .td-total { font-weight: 700; }
    .subtotal-row td { padding: 10px 12px; font-size: 13px; border-top: 2px solid var(--navy); }
    .subtotal-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--navy); opacity: 0.6; }
    .subtotal-amount { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700; text-align: right; white-space: nowrap; }
    .install-row td { padding: 8px 12px; border-top: 1px solid var(--border); font-size: 13px; }
    .install-label { font-size: 13px; color: var(--navy); opacity: 0.85; }
    .install-amount { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; text-align: right; white-space: nowrap; }

    /* PRIX FORFAITAIRE */
    .forfait-section { background: var(--navy); color: var(--pure); padding: 48px 56px; text-align: center; }
    .forfait-section .label { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; letter-spacing: 0.25em; text-transform: uppercase; opacity: 0.6; margin-bottom: 12px; }
    .forfait-section .amount { font-family: 'JetBrains Mono', monospace; font-size: 52px; font-weight: 700; letter-spacing: -0.02em; line-height: 1; margin-bottom: 6px; }
    .forfait-section .subtitle { font-size: 12px; opacity: 0.6; margin-top: 10px; }
    .forfait-breakdown { display: flex; justify-content: center; gap: 32px; margin-top: 28px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px; opacity: 0.7; }
    .b-cell .v { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; display: block; margin-bottom: 2px; opacity: 1; }
    .b-cell .l { font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; }

    /* PAIEMENT */
    .payment-list { display: flex; flex-direction: column; gap: 12px; }
    .payment-row { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; background: var(--ice); border-left: 3px solid var(--navy); border-radius: 2px; }
    .payment-row .left .pct { font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 700; color: var(--navy); margin-bottom: 2px; }
    .payment-row .left .desc { font-size: 12px; color: var(--navy); opacity: 0.7; }
    .payment-row .right { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 700; color: var(--navy); text-align: right; }
    .payment-row .right .ttc { font-size: 10px; opacity: 0.55; font-weight: 500; display: block; margin-top: 2px; }
    .interac-note { background: var(--sage-light); border-left: 3px solid var(--navy); padding: 16px 20px; margin-top: 24px; font-size: 12px; color: var(--navy); }
    .interac-note strong { font-weight: 700; }

    /* GARANTIES */
    .warranty-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
    .warranty-card { background: var(--sage-light); border: 1px solid var(--sage-dark); padding: 22px; border-radius: 4px; }
    .warranty-card h4 { font-size: 13px; color: var(--navy); margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--sage-dark); }
    .warranty-card ul { list-style: none; }
    .warranty-card ul li { display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; color: var(--navy); }
    .w-item { opacity: 0.85; }
    .w-duration { font-family: 'JetBrains Mono', monospace; font-weight: 600; opacity: 0.75; margin-left: 8px; white-space: nowrap; }

    /* EXCLUSIONS / INFO */
    .info-box { background: var(--ice); border-left: 3px solid var(--navy-light); padding: 20px 24px; border-radius: 2px; }
    .info-box ul { list-style: none; padding: 0; margin: 0; }
    .info-box ul li { font-size: 12px; color: var(--navy); opacity: 0.85; padding: 4px 0 4px 16px; position: relative; line-height: 1.5; }
    .info-box ul li::before { content: '—'; position: absolute; left: 0; opacity: 0.4; }

    /* ACCEPT PLACEHOLDER (P2 — read-only link, P3/P5 wires full accept flow) */
    .accept-placeholder { padding: 40px 56px; text-align: center; background: var(--sage-light); border-top: 1px solid var(--sage-dark); }
    .accept-label { font-size: 13px; color: var(--navy); opacity: 0.7; margin-bottom: 20px; }
    .btn-accept { display: inline-block; padding: 16px 48px; font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700; letter-spacing: 0.05em; color: var(--pure); background: var(--navy); border-radius: 4px; text-decoration: none; transition: opacity 0.15s; }
    .btn-accept:hover { opacity: 0.85; }

    /* FOOTER */
    .footer { background: var(--navy); color: var(--pure); padding: 32px 56px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; opacity: 0.9; flex-wrap: wrap; gap: 16px; }
    .footer .left span { display: block; opacity: 0.65; margin-top: 4px; font-size: 10px; }
    .footer .right { text-align: right; font-family: 'JetBrains Mono', monospace; font-size: 10px; opacity: 0.6; }

    /* WATERMARK */
    .watermark { position: fixed; bottom: 12px; right: 16px; font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--navy); opacity: 0.08; letter-spacing: 0.15em; text-transform: uppercase; pointer-events: none; z-index: 1000; }

    /* RESPONSIVE */
    @media (max-width: 768px) {
      .header { padding: 32px 24px 28px; flex-direction: column; gap: 20px; align-items: flex-start; }
      .header-title { text-align: left; }
      .header-title h1 { font-size: 24px; }
      .meta-bar { padding: 16px 24px; grid-template-columns: 1fr 1fr; gap: 16px; }
      .section { padding: 28px 24px; }
      .coord-grid { grid-template-columns: 1fr; gap: 14px; }
      .forfait-section { padding: 36px 24px; }
      .forfait-section .amount { font-size: 36px; }
      .forfait-breakdown { flex-direction: column; gap: 14px; }
      .warranty-grid { grid-template-columns: 1fr; }
      .footer { padding: 24px; flex-direction: column; text-align: center; }
      .footer .right { text-align: center; }
      .payment-row { flex-direction: column; align-items: flex-start; gap: 10px; }
      .payment-row .right { text-align: left; }
      .items-table thead { display: none; }
      .td-sketch { display: none; }
      .accept-placeholder { padding: 28px 24px; }
    }
    @media print {
      body { background: white; }
      .page { box-shadow: none; max-width: 100%; }
      .watermark { display: none; }
      .accept-placeholder { display: none; }
      .items-table thead { display: table-header-group; }
    }
  </style>
</head>
<body>

<div class="watermark">CONFIDENTIEL — ${clientNameEsc.toUpperCase()}</div>

<div class="page">

  <!-- HEADER -->
  <header class="header">
    <div class="header-brand">
      ${logoHtml}
      <div class="brand-name">
        PÜR
        <span>CONSTRUCTION &amp; RÉNOVATION INC.</span>
      </div>
    </div>
    <div class="header-title">
      <div class="label">Document</div>
      <h1>DEVIS</h1>
      <div class="rbq">RBQ ${escHtml(rbqNum)} · APCHQ</div>
    </div>
  </header>

  <!-- META BAR -->
  <div class="meta-bar">
    <div class="cell">
      <div class="label">Devis n°</div>
      <div class="value">${docNumEsc}</div>
    </div>
    <div class="cell">
      <div class="label">Émis le</div>
      <div class="value">${dateLabel}</div>
    </div>
    <div class="cell">
      <div class="label">Validité</div>
      <div class="value">${validDays} jours</div>
    </div>
    <div class="cell">
      <div class="label">Début travaux</div>
      <div class="value">À confirmer</div>
    </div>
  </div>

  <!-- COORDONNÉES -->
  <section class="section">
    <div class="section-title">Parties au devis</div>
    <div class="coord-grid">
      <div class="coord-card">
        <div class="card-label">Entrepreneur</div>
        <div class="name">${escHtml(businessName)}</div>
        ${businessAddress.split(',').map(p => `<p>${escHtml(p.trim())}</p>`).join('')}
        <p>Tél. : ${escHtml(businessPhone)}</p>
        <p>${escHtml(businessEmail)}</p>
        <p style="margin-top: 8px; font-size: 11px; opacity: 0.55;">RBQ ${escHtml(rbqNum)} · Membre APCHQ</p>
      </div>
      <div class="coord-card">
        <div class="card-label">Client</div>
        <div class="name">${clientNameEsc}</div>
        ${clientAddressEsc ? `<p>${clientAddressEsc}</p>` : ''}
        ${client_phone ? `<p>Tél. : ${escHtml(client_phone)}</p>` : ''}
        ${client_email ? `<p>${escHtml(client_email)}</p>` : ''}
      </div>
    </div>
  </section>

  <!-- ITEMS TABLE -->
  <section class="section">
    <div class="section-title">Détail des ouvertures</div>
    <table class="items-table">
      <thead>
        <tr>
          <th class="th-center">#</th>
          <th>Description</th>
          <th class="th-center">Aperçu</th>
          <th class="th-center">Dimensions</th>
          <th class="th-center">Qté</th>
          <th class="th-right">Prix unitaire</th>
          <th class="th-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        <!-- Sous-total fenêtres -->
        <tr class="subtotal-row">
          <td colspan="6" class="subtotal-label">Sous-total fenêtres &amp; portes</td>
          <td class="subtotal-amount">${fmtPrice(sousTotalFenetres)}</td>
        </tr>
        ${installationCost > 0 ? `
        <!-- Installation -->
        <tr class="install-row">
          <td colspan="6" class="install-label">Installation, finition et moulures extérieures</td>
          <td class="install-amount">${fmtPrice(installationCost)}</td>
        </tr>` : ''}
      </tbody>
    </table>
  </section>

  <!-- PRIX FORFAITAIRE -->
  <section class="forfait-section">
    <div class="label">Prix forfaitaire global</div>
    <div class="amount">${fmtPrice(total_ttc)}</div>
    <div class="subtitle">Toutes taxes incluses (TPS + TVQ)</div>
    <div class="forfait-breakdown">
      <div class="b-cell">
        <span class="v">${fmtPrice(subtotal)}</span>
        <span class="l">Sous-total HT</span>
      </div>
      <div class="b-cell">
        <span class="v">${fmtPrice(tax_gst)}</span>
        <span class="l">TPS 5 %</span>
      </div>
      <div class="b-cell">
        <span class="v">${fmtPrice(tax_qst)}</span>
        <span class="l">TVQ 9,975 %</span>
      </div>
    </div>
  </section>

  <!-- MODALITÉS DE PAIEMENT -->
  <section class="section">
    <div class="section-title">Modalités de paiement</div>
    <div class="payment-list">
      <div class="payment-row">
        <div class="left">
          <div class="pct">${payPct0} %</div>
          <div class="desc">${escHtml(payDesc0)}</div>
        </div>
        <div class="right">
          ${fmtPrice(depot35)}
          <span class="ttc">Toutes taxes incluses</span>
        </div>
      </div>
      <div class="payment-row">
        <div class="left">
          <div class="pct">${payPct1} %</div>
          <div class="desc">${escHtml(payDesc1)}</div>
        </div>
        <div class="right">
          ${fmtPrice(solde65)}
          <span class="ttc">Toutes taxes incluses</span>
        </div>
      </div>
    </div>
    <div class="interac-note">
      <strong>Paiement par virement Interac uniquement</strong> à <strong>${escHtml(businessEmail)}</strong>. Une question de sécurité vous sera fournie sur demande.
    </div>
  </section>

  <!-- GARANTIES -->
  <section class="section">
    <div class="section-title">Garanties PÜR</div>
    ${warrantyHtml}
  </section>

  <!-- EXCLUSIONS -->
  <section class="section">
    <div class="section-title">Exclusions au devis</div>
    <div class="info-box">
      <ul>${exclusionItems}</ul>
    </div>
  </section>

  <!-- NOTES IMPORTANTES -->
  <section class="section">
    <div class="section-title">Notes importantes</div>
    <div class="info-box">
      <ul>${notesItemsHtml}</ul>
    </div>
  </section>

  <!-- ACCEPT PLACEHOLDER (P3 wires full /q/[token]/accept page) -->
  ${acceptHtml}

  <!-- FOOTER -->
  <footer class="footer">
    <div class="left">
      ${escHtml(businessName)}
      <span>${escHtml(businessAddress)} · ${escHtml(businessPhone)} · ${escHtml(businessEmail)}</span>
    </div>
    <div class="right">
      RBQ ${escHtml(rbqNum)}<br>
      Membre APCHQ
    </div>
  </footer>

</div>

</body>
</html>`;
}
