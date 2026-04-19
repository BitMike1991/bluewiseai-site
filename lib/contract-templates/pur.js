/**
 * PÜR Construction & Rénovation Inc.
 * Contrat d'entreprise à forfait — Template HTML spécialisé
 *
 * Porte intégralement les clauses du Contrat_forfait_purconstruction (PDF APCHQ)
 * et les enrichit avec : ENERGY STAR, verrouillage de prix 30 jours,
 * résolution de différends (amiable → tribunaux québécois), Interac sécurisé.
 *
 * Visuellement identique au devis PÜR : navy #2A2C35 / sage #E9EFE7 /
 * JetBrains Mono titres / Inter corps / cartes item avec croquis SVG.
 *
 * Routing : /api/universal/contrat/create.js
 *   → config.branding.html_template === 'pur'  →  generatePurContractHtml()
 *   → sinon                                    →  generateContractHtml() (générique)
 *
 * Input shapes:
 *   data = {
 *     contract_number, date, start_date, valid_days,
 *     client_name, client_phone, client_email, client_address, client_city,
 *     project_description,
 *     line_items: [{ description, qty, unit_price, total, type?, model?,
 *                    ouvrant?, dimensions?, specs?, energy?, cert?, note? }],
 *     subtotal, tax_gst, tax_qst, total_ttc,
 *     scope_items, exclusions, client_responsibilities,
 *     warranty_sections_override, gift_items, client_acknowledgments
 *   }
 *   config = {
 *     branding: { business_name, phone, email, address, rbq_number, logo_url },
 *     quote: { warranties, exclusions, valid_days },
 *     contract: { authorized_rep, interac_email, legal_clauses, client_responsibilities },
 *     payment_schedule: [{ label, description, percentage }]
 *   }
 *
 * NEVER expose: prix fournisseur, remise, noms fournisseurs (Royalty, Touchette).
 * ALWAYS: customer_id isolé côté API — ce template ne gère pas l'auth.
 */

const NAVY = '#2A2C35';
const NAVY_LIGHT = '#3A3D47';
const SAGE = '#E9EFE7';
const SAGE_DARK = '#D8E0D4';
const SAGE_LIGHT = '#F2F5F0';
const ICE = '#F5F7F4';
const INSTALL_DESCRIPTION = 'Installation, finition et moulures extérieures';

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function fmtPrice(amount) {
  return Number(amount).toLocaleString('fr-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + '\u00a0$';
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('fr-CA', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── SVG croquis (identiques au template devis) ───────────────────────────────

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
  const type = (item.type || item.description || '').toLowerCase();
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

// ─── Carte item (identique au devis, classes .item-card / .item-grid) ─────────

function renderItemCard(item, index) {
  const type = item.type || item.description || 'Item';
  const model = item.model || null;
  const ouvrant = item.ouvrant || null;
  const dims = item.dimensions || null;
  const specs = item.specs || null;
  const qty = item.qty || 1;
  const energy = item.energy || false;
  const cert = item.cert || null;
  const note = item.note || null;

  const sketchSvg = itemSketchSvg(item);
  const w = dims?.width || null;
  const h = dims?.height || null;

  let typeLabel = escHtml(type);
  if (model) typeLabel += ` <span class="item-model">${escHtml(model)}</span>`;
  if (ouvrant) typeLabel += ` <span class="item-ouvrant">${escHtml(ouvrant)}</span>`;

  let specsHtml = '';
  if (specs) {
    const parts = Array.isArray(specs)
      ? specs
      : String(specs).split(',').map(s => s.trim()).filter(Boolean);
    specsHtml = `<ul class="specs">${parts.map(s => `<li>${escHtml(String(s))}</li>`).join('')}</ul>`;
  }

  const energyBadge = energy ? '<span class="energy">★ ENERGY STAR</span>' : '';
  const certHtml = cert ? `<div class="cert">${escHtml(String(cert))}</div>` : '';
  const noteHtml = note ? `<div class="item-note">${escHtml(note)}</div>` : '';
  const dimsHtml = (w && h)
    ? `<div class="dims">${escHtml(String(w))}<span class="x"> × </span>${escHtml(String(h))}</div>`
    : '';

  const priceHtml = (item.unit_price || item.total) ? `
    <div class="item-price-row">
      ${qty > 1 ? `<span class="item-qty-badge">× ${qty}</span>` : ''}
      <span class="item-price-val">${fmtPrice(item.total || item.unit_price || 0)}</span>
      ${qty > 1 ? `<span class="item-unit-price">(${fmtPrice(item.unit_price || 0)} / unité)</span>` : ''}
    </div>` : '';

  return `
  <div class="item-card">
    <div class="item-num">${String(index).padStart(2, '0')}</div>
    ${qty > 1 ? `<div class="item-qty">× ${qty}</div>` : ''}
    <div class="item-sketch">
      ${sketchSvg}
      ${dimsHtml}
    </div>
    <div class="item-info">
      <div class="item-type">${typeLabel}</div>
      ${specsHtml}
      ${energyBadge}
      ${certHtml}
      ${noteHtml}
      ${priceHtml}
    </div>
  </div>`;
}

// ─── Grille de garanties ──────────────────────────────────────────────────────

function renderWarrantyGrid(warranties) {
  if (!warranties || warranties.length === 0) {
    return `
    <div class="warranty-grid">
      <div class="warranty-card">
        <h4>Vitre &amp; étanchéité</h4>
        <ul>
          <li><span class="w-item">Vitrage scellé</span><span class="w-duration">10 ans</span></li>
          <li><span class="w-item">Étanchéité à l'air</span><span class="w-duration">5 ans</span></li>
        </ul>
      </div>
      <div class="warranty-card">
        <h4>Composantes</h4>
        <ul>
          <li><span class="w-item">Cadre &amp; armature</span><span class="w-duration">10 ans</span></li>
          <li><span class="w-item">Quincaillerie</span><span class="w-duration">2 ans</span></li>
        </ul>
      </div>
      <div class="warranty-card">
        <h4>Main-d'œuvre</h4>
        <ul>
          <li><span class="w-item">Installation</span><span class="w-duration">1 an</span></li>
          <li><span class="w-item">Finition ext.</span><span class="w-duration">1 an</span></li>
        </ul>
      </div>
    </div>`;
  }
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

// ─── Générateur principal ─────────────────────────────────────────────────────

/**
 * generatePurContractHtml(data, config) → string HTML complet
 *
 * Produit le contrat PÜR navy/sage.
 * Porte intégralement les clauses du PDF APCHQ + améliorations légales.
 */
export function generatePurContractHtml(data, config) {
  const {
    contract_number,
    date,
    start_date,
    valid_days,
    client_name,
    client_phone,
    client_email,
    client_address,
    client_city,
    project_description,
    line_items = [],
    subtotal,
    tax_gst,
    tax_qst,
    total_ttc,
    scope_items,
    exclusions: dataExclusions,
    client_responsibilities: dataResponsibilities,
    warranty_sections_override,
    gift_items,
    client_acknowledgments,
  } = data;

  const b = config.branding || {};
  const c = config.contract || {};
  const q = config.quote || {};
  const schedule = config.payment_schedule || [];

  // ── Identité PÜR ──────────────────────────────────────────────────────────
  const businessName = b.business_name || 'PÜR Construction & Rénovation Inc.';
  const businessPhone = b.phone || '(514) 926-7669';
  const businessEmail = b.email || 'purconstructionrenovation@gmail.com';
  const businessAddress = b.address || '366 Rue du Lac-Légaré, Saint-Colomban QC J5K 2K4';
  const rbqNum = b.rbq_number || '5827-6668-01';
  const authorizedRep = c.authorized_rep || 'Jérémy Larivée';
  const interacEmail = c.interac_email || businessEmail;
  const validDaysVal = valid_days || q.valid_days || 30;

  const logoSrc = b.logo_url || '/images/pur-logo-rbq-white.png';
  const logoHtml = `<img src="${escHtml(logoSrc)}" alt="${escHtml(businessName)}" height="84" style="height:84px;width:auto;object-fit:contain;display:block;">`;

  // ── Dates ─────────────────────────────────────────────────────────────────
  const dateLabel = fmtDate(date);
  const startLabel = start_date ? fmtDate(start_date) : 'À confirmer';
  const contractNumEsc = escHtml(contract_number);
  const clientNameEsc = escHtml(client_name);
  const clientAddressEsc = escHtml([client_address, client_city].filter(Boolean).join(', '));

  // ── Items : séparer installation des fenêtres/portes ─────────────────────
  const installItem = line_items.find(it =>
    it.description === INSTALL_DESCRIPTION || (it.type || '').toLowerCase().includes('installation')
  );
  const fenItems = line_items.filter(it => it !== installItem);

  const fenetreItems = fenItems.filter(it => {
    const t = (it.type || it.description || '').toLowerCase();
    return !t.includes('porte') || t.includes('porte-fenêtre') || t.includes('porte fenêtre');
  });
  const porteItems = fenItems.filter(it => {
    const t = (it.type || it.description || '').toLowerCase();
    return t.includes('porte') && !t.includes('porte-fenêtre') && !t.includes('porte fenêtre');
  });

  const sousTotalFenetres = fenItems.reduce((s, it) => s + (Number(it.total) || 0), 0);
  const installationCost = installItem ? (Number(installItem.total) || 0) : 0;

  // ── HTML des items ────────────────────────────────────────────────────────
  let itemsHtml = '';
  if (fenetreItems.length > 0) {
    const totalUnits = fenetreItems.reduce((s, it) => s + (Number(it.qty) || 1), 0);
    itemsHtml += `<div class="category-title">Fenêtres <span class="cat-count">${totalUnits} unité${totalUnits > 1 ? 's' : ''}</span></div>`;
    itemsHtml += `<div class="item-grid">${fenetreItems.map((item, i) => renderItemCard(item, i + 1)).join('\n')}</div>`;
  }
  if (porteItems.length > 0) {
    const porteOffset = fenetreItems.length;
    const totalPortes = porteItems.reduce((s, it) => s + (Number(it.qty) || 1), 0);
    itemsHtml += `<div class="category-title">Portes <span class="cat-count">${totalPortes} unité${totalPortes > 1 ? 's' : ''}</span></div>`;
    itemsHtml += `<div class="item-grid">${porteItems.map((item, i) => renderItemCard(item, porteOffset + i + 1)).join('\n')}</div>`;
  }
  if (fenetreItems.length === 0 && porteItems.length === 0 && fenItems.length > 0) {
    itemsHtml += `<div class="item-grid">${fenItems.map((item, i) => renderItemCard(item, i + 1)).join('\n')}</div>`;
  }
  if (installItem) {
    itemsHtml += `<div class="category-title">Installation &amp; finition <span class="cat-count">Incluse</span></div>`;
    itemsHtml += `<div class="info-box contrat-install-box" style="margin-top:8px"><ul><li>${escHtml(installItem.description || 'Installation professionnelle, finition et moulures extérieures')}</li></ul></div>`;
  }

  // ── Paiement ──────────────────────────────────────────────────────────────
  const payRows = (schedule.length > 0 ? schedule : [
    { label: 'Dépôt (35 %)', description: 'À la signature du contrat + commande des matériaux', percentage: 35 },
    { label: 'Solde (65 %)', description: '24 h avant le début des travaux — virement Interac', percentage: 65 },
  ]).map(tranche => {
    const pct = Number(tranche.percentage);
    const amountTtc = Number(total_ttc) * pct / 100;
    return `
      <div class="payment-row">
        <div class="left">
          <div class="pct">${pct}\u00a0%</div>
          <div class="desc">${escHtml(tranche.description || tranche.label || '')}</div>
        </div>
        <div class="right">
          ${fmtPrice(amountTtc)}
          <span class="ttc">Toutes taxes incluses</span>
        </div>
      </div>`;
  }).join('');

  // ── Garanties ─────────────────────────────────────────────────────────────
  const warranties = warranty_sections_override || q.warranties || [];
  const warrantyHtml = renderWarrantyGrid(warranties);

  // ── Exclusions ────────────────────────────────────────────────────────────
  const exclusions = dataExclusions || q.exclusions || [
    'Travaux d\'électricité, de plomberie ou de ventilation non mentionnés au présent contrat',
    'Réparations structurelles non décrites au devis annexé',
    'Permis municipaux (à la charge du client, sauf entente contraire)',
    'Finition intérieure en gypse sauf si mentionnée aux notes par ouverture',
    'Enlèvement d\'amiante, de plomb ou de toute autre matière dangereuse',
    'Peinture intérieure et retouches de plâtre',
    'Tout travail non explicitement décrit au présent contrat ou à l\'Annexe A',
    'Modifications demandées après la commande des matériaux (feront l\'objet d\'un avenant)',
  ];
  const exclusionHtml = exclusions.map(e => `<li>${escHtml(e)}</li>`).join('');

  // ── Responsabilités du client ─────────────────────────────────────────────
  const responsibilities = dataResponsibilities || c.client_responsibilities || [
    'Assurer un accès raisonnable, sécuritaire et dégagé à la zone de travail dès la date convenue.',
    'Sécuriser les animaux domestiques et les enfants en bas âge pendant toute la durée des travaux.',
    'Aviser l\'entrepreneur de toute condition particulière connue (amiante, plomb, problème structurel, cavités, etc.).',
    'Assurer l\'accès à l\'électricité 120 V et à l\'eau courante sur le site.',
    'Effectuer les choix de matériaux, teintes et accessoires dans les délais convenus (art. 4 du PDF — Choix).',
    'Aviser son assureur des travaux effectués par l\'entrepreneur (conformément à l\'art. G7.2 des Clauses générales).',
    'Tout retard causé par le non-respect de ces obligations ne pourra être imputé à l\'entrepreneur.',
    'Permettre la visite de chantier pendant les heures de travail selon les normes de sécurité applicables (art. G19).',
  ];
  const responsibilitiesHtml = responsibilities.map(r => `<li>${escHtml(r)}</li>`).join('');

  // ── Annexe A (scope_items) ────────────────────────────────────────────────
  const scopeHtml = (scope_items || []).map((section, i) => `
    <div class="contrat-annex-item">
      <h3>${i + 1}. ${escHtml(section.title)}</h3>
      <ul>${(section.items || []).map(item => `<li>${escHtml(item)}</li>`).join('')}</ul>
    </div>`).join('');

  // ── Reconnaissances client ────────────────────────────────────────────────
  const acknowledgmentsHtml = (client_acknowledgments && client_acknowledgments.length > 0)
    ? client_acknowledgments.map(a => `<li>${escHtml(a)}</li>`).join('')
    : [
      `Les travaux décrits à l'Annexe A constituent l'intégralité des travaux couverts par le présent contrat. Tout travail supplémentaire fera l'objet d'un avenant signé.`,
      `Le prix forfaitaire est verrouillé pour ${validDaysVal} jours à compter de la date d'émission du présent contrat, sous réserve de l'article 6.3 (révision imprévue des coûts de matériaux).`,
      `L'ensemble des fenêtres, portes et portes patio spécifiées sont homologuées ENERGY STAR, sauf mention contraire par ouverture.`,
    ].map(a => `<li>${escHtml(a)}</li>`).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow, noarchive, nosnippet">
  <title>Contrat PÜR — ${contractNumEsc}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --navy:      ${NAVY};
      --navy-light: ${NAVY_LIGHT};
      --sage:      ${SAGE};
      --sage-dark: ${SAGE_DARK};
      --sage-light: ${SAGE_LIGHT};
      --ice:       ${ICE};
      --mist:      #F0F1F3;
      --pure:      #FFFFFF;
      --text-muted: #6b7280;
      --border:    #e5e7eb;
    }
    .sig-handwritten {
      font-family: 'Dancing Script', cursive;
      font-size: 26px; font-weight: 400; color: var(--navy);
      line-height: 1.2; letter-spacing: -1.2px;
      transform: rotate(-2.5deg) skewX(-3deg);
      display: inline-block; opacity: 0.88;
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

    /* ── HEADER ──────────────────────────────────────────────────── */
    .header { background: var(--navy); color: var(--pure); padding: 48px 56px 40px; display: flex; align-items: center; justify-content: space-between; gap: 32px; }
    .header-brand { display: flex; align-items: center; gap: 20px; }
    .brand-name { font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 700; letter-spacing: 0.02em; line-height: 1.15; }
    .brand-name span { display: block; font-size: 10px; font-weight: 500; letter-spacing: 0.15em; opacity: 0.6; margin-top: 4px; }
    .header-title { text-align: right; }
    .header-title .label { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.55; margin-bottom: 6px; }
    .header-title h1 { font-size: 32px; font-weight: 700; letter-spacing: -0.01em; }
    .header-title .rbq { font-size: 10px; opacity: 0.55; margin-top: 6px; letter-spacing: 0.1em; }

    /* ── META BAR ────────────────────────────────────────────────── */
    .meta-bar { background: var(--sage); padding: 18px 56px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
    .meta-bar .cell .label { font-size: 9px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: var(--navy); opacity: 0.55; margin-bottom: 4px; }
    .meta-bar .cell .value { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; color: var(--navy); }

    /* ── SECTIONS ────────────────────────────────────────────────── */
    .section { padding: 40px 56px; border-bottom: 1px solid var(--border); }
    .section:last-child { border-bottom: none; }
    .section-title { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--navy); opacity: 0.6; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; }
    .section-title::before { content: ''; display: inline-block; width: 24px; height: 2px; background: var(--navy); opacity: 0.6; }

    /* ── COORDONNÉES ─────────────────────────────────────────────── */
    .coord-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .coord-card { background: var(--ice); padding: 24px; border-radius: 4px; border-left: 3px solid var(--navy); }
    .coord-card .card-label { font-size: 9px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--navy); opacity: 0.55; margin-bottom: 12px; }
    .coord-card .name { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
    .coord-card p { font-size: 13px; color: var(--navy); opacity: 0.85; margin-bottom: 3px; }

    /* ── PROJET / IMMEUBLE ───────────────────────────────────────── */
    .projet-box { background: var(--sage-light); border-left: 3px solid var(--navy); padding: 24px; border-radius: 4px; }
    .projet-box p { font-size: 13px; color: var(--navy); opacity: 0.85; margin-bottom: 4px; }

    /* ── CATEGORY TITLES (identiques devis) ──────────────────────── */
    .category-title { font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 700; color: var(--navy); margin: 32px 0 16px; padding-bottom: 10px; border-bottom: 2px solid var(--navy); display: flex; align-items: baseline; justify-content: space-between; }
    .category-title:first-child { margin-top: 0; }
    .cat-count { font-size: 11px; font-weight: 500; opacity: 0.5; letter-spacing: 0.1em; }

    /* ── ITEM CARDS (identiques devis) ───────────────────────────── */
    .item-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .item-card { background: var(--pure); border: 1px solid var(--border); border-radius: 4px; padding: 20px; display: flex; gap: 18px; position: relative; }
    .item-num { position: absolute; top: -10px; left: 16px; background: var(--navy); color: var(--pure); font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 2px; letter-spacing: 0.05em; }
    .item-qty { position: absolute; top: 18px; right: 18px; background: var(--sage); color: var(--navy); font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 2px; }
    .item-sketch { flex-shrink: 0; width: 110px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .item-sketch svg { display: block; background: var(--sage-light); border: 1px solid var(--sage-dark); border-radius: 2px; }
    .item-sketch .dims { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--navy); opacity: 0.7; text-align: center; font-weight: 600; }
    .item-sketch .dims .x { opacity: 0.4; margin: 0 3px; }
    .item-info { flex: 1; min-width: 0; }
    .item-type { font-size: 13px; font-weight: 700; color: var(--navy); margin-bottom: 8px; line-height: 1.3; }
    .item-model { font-family: 'JetBrains Mono', monospace; font-size: 10px; background: var(--sage); color: var(--navy); padding: 1px 6px; border-radius: 2px; margin-left: 6px; font-weight: 700; letter-spacing: 0.05em; }
    .item-ouvrant { font-family: 'JetBrains Mono', monospace; font-size: 10px; background: var(--mist); color: var(--navy); padding: 1px 6px; border-radius: 2px; margin-left: 4px; opacity: 0.75; }
    .specs { list-style: none; padding: 0; margin: 0 0 10px 0; }
    .specs li { font-size: 11px; color: var(--navy); opacity: 0.75; line-height: 1.55; padding-left: 10px; position: relative; }
    .specs li::before { content: ''; position: absolute; left: 0; top: 8px; width: 4px; height: 1px; background: var(--navy); opacity: 0.4; }
    .energy { display: inline-block; background: var(--sage); color: var(--navy); font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 2px; margin-top: 6px; letter-spacing: 0.05em; }
    .cert { margin-top: 8px; padding: 6px 8px; background: var(--sage-light); border-left: 2px solid var(--sage-dark); font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--navy); opacity: 0.7; letter-spacing: 0.01em; word-break: break-word; line-height: 1.5; }
    .item-note { margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border); font-size: 11px; color: var(--navy); opacity: 0.85; font-style: italic; }
    .item-price-row { margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--border); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .item-price-val { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: var(--navy); }
    .item-qty-badge { font-family: 'JetBrains Mono', monospace; font-size: 10px; background: var(--sage); color: var(--navy); padding: 2px 6px; border-radius: 2px; font-weight: 700; }
    .item-unit-price { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--navy); opacity: 0.5; }

    /* ── SOUS-TOTAL ───────────────────────────────────────────────── */
    .subtotal-box { background: var(--sage-light); border: 1px solid var(--sage-dark); border-radius: 4px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
    .subtotal-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--navy); opacity: 0.6; }
    .subtotal-amount { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 700; color: var(--navy); }
    .install-box { background: var(--ice); border-left: 3px solid var(--sage-dark); padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 8px; border-radius: 2px; }
    .install-label { font-size: 13px; color: var(--navy); opacity: 0.85; }
    .install-amount { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; color: var(--navy); }

    /* ── PRIX FORFAITAIRE (navy block) ───────────────────────────── */
    .forfait-section { background: var(--navy); color: var(--pure); padding: 48px 56px; text-align: center; }
    .forfait-section .f-label { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; letter-spacing: 0.25em; text-transform: uppercase; opacity: 0.6; margin-bottom: 12px; }
    .forfait-section h2 { font-size: 14px; font-weight: 600; opacity: 0.85; margin-bottom: 20px; letter-spacing: 0.02em; }
    .forfait-section .amount { font-family: 'JetBrains Mono', monospace; font-size: 52px; font-weight: 700; letter-spacing: -0.02em; line-height: 1; margin-bottom: 6px; }
    .forfait-section .subtitle { font-size: 12px; opacity: 0.6; margin-top: 10px; }
    .forfait-breakdown { display: flex; justify-content: center; gap: 32px; margin-top: 28px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px; opacity: 0.7; }
    .b-cell .v { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; display: block; margin-bottom: 2px; opacity: 1; }
    .b-cell .l { font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; }

    /* ── PAIEMENT ────────────────────────────────────────────────── */
    .payment-list { display: flex; flex-direction: column; gap: 12px; }
    .payment-row { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; background: var(--ice); border-left: 3px solid var(--navy); border-radius: 2px; }
    .payment-row .left .pct { font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 700; color: var(--navy); margin-bottom: 2px; }
    .payment-row .left .desc { font-size: 12px; color: var(--navy); opacity: 0.7; }
    .payment-row .right { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 700; color: var(--navy); text-align: right; }
    .payment-row .right .ttc { font-size: 10px; opacity: 0.55; font-weight: 500; display: block; margin-top: 2px; }
    .interac-note { background: var(--sage-light); border-left: 3px solid var(--navy); padding: 16px 20px; margin-top: 24px; font-size: 12px; color: var(--navy); }
    .interac-note strong { font-weight: 700; }

    /* ── GARANTIES ───────────────────────────────────────────────── */
    .warranty-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
    .warranty-card { background: var(--sage-light); border: 1px solid var(--sage-dark); padding: 22px; border-radius: 4px; }
    .warranty-card h4 { font-size: 13px; color: var(--navy); margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--sage-dark); }
    .warranty-card ul { list-style: none; }
    .warranty-card ul li { display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; color: var(--navy); }
    .w-item { opacity: 0.85; }
    .w-duration { font-family: 'JetBrains Mono', monospace; font-weight: 600; opacity: 0.75; margin-left: 8px; white-space: nowrap; }

    /* ── INFO / EXCLUSIONS ───────────────────────────────────────── */
    .info-box { background: var(--ice); border-left: 3px solid var(--navy-light); padding: 20px 24px; border-radius: 2px; }
    .info-box ul { list-style: none; padding: 0; margin: 0; }
    .info-box ul li { font-size: 12px; color: var(--navy); opacity: 0.85; padding: 4px 0 4px 16px; position: relative; line-height: 1.5; }
    .info-box ul li::before { content: '—'; position: absolute; left: 0; opacity: 0.4; }

    /* ── CLAUSES CONTRAT (.contrat-*) ────────────────────────────── */
    .contrat-clause { background: var(--ice); border-radius: 4px; padding: 24px 28px; margin-bottom: 16px; border-left: 3px solid var(--navy); }
    .contrat-clause h3 { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700; letter-spacing: 0.05em; color: var(--navy); margin-bottom: 10px; }
    .contrat-clause p { font-size: 12px; color: var(--navy); opacity: 0.85; line-height: 1.7; margin-bottom: 8px; }
    .contrat-clause ul { list-style: none; padding: 0; margin: 0 0 8px 0; }
    .contrat-clause ul li { font-size: 12px; color: var(--navy); opacity: 0.85; padding: 4px 0 4px 16px; position: relative; line-height: 1.6; }
    .contrat-clause ul li::before { content: '—'; position: absolute; left: 0; opacity: 0.35; }
    .contrat-clause .sub-title { font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.6; margin: 14px 0 6px; display: block; }
    .contrat-annex-item { background: var(--sage-light); border-left: 3px solid var(--sage-dark); padding: 16px 20px; border-radius: 2px; margin-bottom: 12px; }
    .contrat-annex-item h3 { font-size: 12px; font-weight: 700; margin-bottom: 8px; color: var(--navy); }
    .contrat-annex-item ul { list-style: none; padding: 0; margin: 0; }
    .contrat-annex-item ul li { font-size: 12px; color: var(--navy); opacity: 0.85; padding: 3px 0 3px 14px; position: relative; }
    .contrat-annex-item ul li::before { content: '·'; position: absolute; left: 0; opacity: 0.5; }
    .contrat-exclusion-box { background: var(--ice); border: 1px solid #fca5a5; border-left: 3px solid #ef4444; padding: 20px 24px; border-radius: 2px; }
    .contrat-exclusion-box ul { list-style: none; padding: 0; margin: 0; }
    .contrat-exclusion-box ul li { font-size: 12px; color: var(--navy); opacity: 0.85; padding: 4px 0 4px 16px; position: relative; line-height: 1.5; }
    .contrat-exclusion-box ul li::before { content: '—'; position: absolute; left: 0; opacity: 0.4; }
    .contrat-install-box { margin-top: 8px; }

    /* ── SIGNATURE ───────────────────────────────────────────────── */
    .contrat-accept-box { background: #fefce8; border: 1px solid #f59e0b; padding: 20px 24px; border-radius: 4px; margin-bottom: 24px; }
    .contrat-accept-box strong { font-size: 13px; }
    .contrat-accept-box ul { list-style: none; padding: 0; margin: 8px 0 0; }
    .contrat-accept-box ul li { font-size: 12px; color: var(--navy); opacity: 0.85; padding: 3px 0 3px 14px; position: relative; }
    .contrat-accept-box ul li::before { content: '✓'; position: absolute; left: 0; color: #a16207; font-size: 10px; }
    .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-top: 25px; }
    .sig-block .sig-line { border-bottom: 1px solid var(--navy); height: 45px; margin-bottom: 4px; }
    .sig-block .sig-label { font-size: 11px; color: var(--text-muted); }
    .sig-block p { margin: 3px 0; }

    /* ── SIGNATURE ÉLECTRONIQUE ──────────────────────────────────── */
    .signature-section { max-width: 900px; margin: 0 auto; padding: 40px 56px; background: var(--sage-light); border-top: 3px solid var(--navy); }
    .signature-section h2 { font-family: 'JetBrains Mono', monospace; color: var(--navy); font-size: 18px; font-weight: 700; margin-bottom: 20px; }
    .sig-canvas-wrap { border: 2px dashed var(--sage-dark); border-radius: 8px; background: #fff; margin-bottom: 16px; position: relative; }
    .sig-canvas-wrap canvas { display: block; width: 100%; border-radius: 6px; }
    .sig-canvas-wrap .placeholder { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: var(--text-muted); font-size: 14px; pointer-events: none; }
    .sig-form-row { display: flex; gap: 16px; margin-bottom: 12px; }
    .sig-form-row input { flex: 1; padding: 10px 14px; border: 1px solid var(--border); border-radius: 6px; font-size: 14px; font-family: inherit; }
    .sig-form-row input:focus { outline: none; border-color: var(--navy); box-shadow: 0 0 0 2px rgba(42,44,53,0.15); }
    .sig-checkbox { display: flex; align-items: flex-start; gap: 10px; margin: 16px 0; }
    .sig-checkbox input[type="checkbox"] { margin-top: 3px; width: 18px; height: 18px; accent-color: var(--navy); }
    .sig-checkbox label { font-size: 13px; color: var(--navy); line-height: 1.5; }
    .sig-actions { display: flex; gap: 12px; margin-top: 16px; }
    .sig-actions button { padding: 12px 28px; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-clear { background: var(--sage); color: var(--navy); }
    .btn-clear:hover { background: var(--sage-dark); }
    .btn-sign { background: var(--navy); color: var(--pure); flex: 1; }
    .btn-sign:hover { background: var(--navy-light); }
    .btn-sign:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-download { background: #059669; color: white; flex: 1; display: none; }
    .btn-download:hover { background: #047857; }
    .sig-status { margin-top: 16px; padding: 16px; border-radius: 8px; font-size: 14px; display: none; }
    .sig-status.success { display: block; background: #ecfdf5; border: 1px solid #10b981; color: #047857; }
    .sig-status.error { display: block; background: #fef2f2; border: 1px solid #ef4444; color: #dc2626; }
    .sig-status.loading { display: block; background: #eff6ff; border: 1px solid #3b82f6; color: #1d4ed8; }
    .sig-embedded-img { max-height: 40px; margin-bottom: 4px; }
    .sig-timestamp { font-size: 10px; color: var(--text-muted); font-style: italic; }

    /* ── FOOTER ──────────────────────────────────────────────────── */
    .footer { background: var(--navy); color: var(--pure); padding: 32px 56px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; opacity: 0.9; flex-wrap: wrap; gap: 16px; }
    .footer .left span { display: block; opacity: 0.65; margin-top: 4px; font-size: 10px; }
    .footer .right { text-align: right; font-family: 'JetBrains Mono', monospace; font-size: 10px; opacity: 0.6; }

    /* ── WATERMARK ───────────────────────────────────────────────── */
    .watermark { position: fixed; bottom: 12px; right: 16px; font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--navy); opacity: 0.06; letter-spacing: 0.15em; text-transform: uppercase; pointer-events: none; z-index: 1000; }

    /* ── RESPONSIVE ──────────────────────────────────────────────── */
    @media (max-width: 768px) {
      .header { padding: 32px 24px 28px; flex-direction: column; gap: 20px; align-items: flex-start; }
      .header-title { text-align: left; }
      .header-title h1 { font-size: 24px; }
      .meta-bar { padding: 16px 24px; grid-template-columns: 1fr 1fr; gap: 16px; }
      .section { padding: 28px 24px; }
      .coord-grid { grid-template-columns: 1fr; gap: 14px; }
      .item-grid { grid-template-columns: 1fr; gap: 14px; }
      .item-card { padding: 18px 16px; }
      .item-sketch { width: 90px; }
      .forfait-section { padding: 36px 24px; }
      .forfait-section .amount { font-size: 36px; }
      .forfait-breakdown { flex-direction: column; gap: 14px; }
      .warranty-grid { grid-template-columns: 1fr; }
      .footer { padding: 24px; flex-direction: column; text-align: center; }
      .footer .right { text-align: center; }
      .payment-row { flex-direction: column; align-items: flex-start; gap: 10px; }
      .payment-row .right { text-align: left; }
      .sig-grid { grid-template-columns: 1fr; gap: 24px; }
      .signature-section { padding: 28px 24px; }
      .sig-form-row { flex-direction: column; gap: 8px; }
      .sig-actions { flex-direction: column; }
      .sig-actions button { width: 100%; }
    }
    @media print {
      body { background: white; }
      .page { box-shadow: none; max-width: 100%; }
      .watermark { display: none; }
      .signature-section { display: none !important; }
    }
  </style>
</head>
<body>

<div class="watermark">CONFIDENTIEL — CONTRAT ${contractNumEsc}</div>

<div class="page">

  <!-- ── HEADER ──────────────────────────────────────────────────── -->
  <header class="header">
    <div class="header-brand">
      ${logoHtml}
      <div class="brand-name">
        PÜR
        <span>CONSTRUCTION &amp; RÉNOVATION INC.</span>
      </div>
    </div>
    <div class="header-title">
      <div class="label">Document légal</div>
      <h1>CONTRAT</h1>
      <div class="rbq">RBQ ${escHtml(rbqNum)} · APCHQ</div>
    </div>
  </header>

  <!-- ── META BAR ────────────────────────────────────────────────── -->
  <div class="meta-bar">
    <div class="cell">
      <div class="label">Contrat n°</div>
      <div class="value">${contractNumEsc}</div>
    </div>
    <div class="cell">
      <div class="label">Émis le</div>
      <div class="value">${dateLabel}</div>
    </div>
    <div class="cell">
      <div class="label">Début travaux</div>
      <div class="value">${escHtml(startLabel)}</div>
    </div>
    <div class="cell">
      <div class="label">Validité offre</div>
      <div class="value">${validDaysVal} jours</div>
    </div>
  </div>

  <!-- ─────────────────────────────────────────────────────────────
       SECTION 1 — IDENTIFICATION DES PARTIES (art. 1 du PDF)
  ──────────────────────────────────────────────────────────────── -->
  <section class="section">
    <div class="section-title">1. Identification des parties</div>
    <div class="coord-grid">
      <div class="coord-card">
        <div class="card-label">Entrepreneur</div>
        <div class="name">${escHtml(businessName)}</div>
        ${businessAddress.split(',').map(p => `<p>${escHtml(p.trim())}</p>`).join('')}
        <p>Tél. : ${escHtml(businessPhone)}</p>
        <p>${escHtml(businessEmail)}</p>
        <p style="margin-top:8px;font-size:11px;opacity:0.55;">Licence RBQ ${escHtml(rbqNum)} · Membre APCHQ</p>
        <p style="font-size:11px;opacity:0.55;">Représentant autorisé : ${escHtml(authorizedRep)}</p>
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

  <!-- ─────────────────────────────────────────────────────────────
       SECTION 2 — IMMEUBLE VISÉ (art. 2 du PDF)
  ──────────────────────────────────────────────────────────────── -->
  <section class="section">
    <div class="section-title">2. Immeuble visé par les travaux</div>
    <div class="projet-box">
      <p><strong>Adresse des travaux :</strong> ${clientAddressEsc || '—'}</p>
      ${project_description ? `<p style="margin-top:8px;"><strong>Description :</strong> ${escHtml(project_description)}</p>` : ''}
      <p style="margin-top:12px;font-size:12px;opacity:0.7;">Peut être utilisé pour des travaux de <strong>rénovation</strong> ou de <strong>construction</strong> résidentielle ou commerciale. Si le bâtiment est assujetti au <em>Règlement sur le plan de garantie des bâtiments résidentiels neufs</em>, joindre le contrat de garantie approprié.</p>
    </div>
  </section>

  <!-- ─────────────────────────────────────────────────────────────
       SECTION 3 — OBJET DU CONTRAT (art. 3 du PDF)
  ──────────────────────────────────────────────────────────────── -->
  <section class="section">
    <div class="section-title">3. Objet du contrat</div>

    <div class="contrat-clause">
      <span class="sub-title">3.1 — Prestation de l'entrepreneur</span>
      <p>L'entrepreneur s'engage à exécuter les travaux de remplacement et/ou d'installation de fenêtres, portes et portes patio décrits au présent contrat et à l'Annexe A. L'entrepreneur fournira la main-d'œuvre, les matériaux, l'outillage et l'équipement nécessaires.</p>
      <p>L'entrepreneur supervisera les travaux et maintiendra sur le chantier un représentant compétent agissant comme mandataire, qui liera l'entrepreneur face au client.</p>
    </div>

    <div class="contrat-clause">
      <span class="sub-title">3.2 — Description des travaux</span>
      <p>L'entrepreneur s'engage à exécuter les travaux décrits ci-après. Le cas échéant, tout plan, devis ou cahier de charges annexé au présent contrat fera partie intégrante de la présente description, après avoir été reconnu et signé conjointement par l'entrepreneur et le client.</p>
      <p style="margin-top:8px;">${escHtml(project_description || 'Voir Annexe A — Détail des ouvertures.')}</p>
    </div>

    <div class="contrat-clause">
      <span class="sub-title">3.3 — Exclusions au contrat d'entreprise (art. 3.5 du PDF)</span>
      <p>Les travaux suivants sont spécifiquement exclus des travaux à réaliser en vertu du présent contrat :</p>
      <div class="contrat-exclusion-box" style="margin-top:10px;">
        <ul>${exclusionHtml}</ul>
      </div>
    </div>

    <div class="contrat-clause">
      <span class="sub-title">3.4 — Choix du client (art. 4 du PDF)</span>
      <p>Le client doit effectuer ses choix de matériaux, équipements et accessoires dans les délais convenus. Tout défaut de respecter ces délais pourra entraîner un retard dans l'échéancier des travaux pour lequel l'entrepreneur ne pourra être tenu responsable.</p>
      <p>Les choix qui entraîneront un dépassement des coûts prévus seront à la charge du client et facturés séparément, conformément à l'article sur les modifications (art. 6.2.2 du PDF).</p>
    </div>

    <div class="contrat-clause">
      <span class="sub-title">3.5 — ENERGY STAR (clause ajoutée)</span>
      <p>Toutes les fenêtres, portes-fenêtres et portes patio spécifiées au présent contrat sont homologuées <strong>ENERGY STAR</strong> pour le climat québécois, sauf mention contraire explicite par ouverture à l'Annexe A. L'entrepreneur fournira sur demande les fiches techniques et numéros de certification correspondants.</p>
    </div>
  </section>

  <!-- ─────────────────────────────────────────────────────────────
       SECTION 4 — DÉTAIL DES OUVERTURES (cartes item + SVG)
  ──────────────────────────────────────────────────────────────── -->
  <section class="section">
    <div class="section-title">4. Détail des ouvertures</div>
    <div id="items-container">
      ${itemsHtml || '<p style="font-size:13px;opacity:0.6;">Voir Annexe A pour le détail des ouvertures.</p>'}
    </div>
    <div class="subtotal-box">
      <span class="subtotal-label">Sous-total fenêtres &amp; portes</span>
      <span class="subtotal-amount">${fmtPrice(sousTotalFenetres)}</span>
    </div>
    ${installationCost > 0 ? `
    <div class="install-box">
      <span class="install-label">Installation, finition et moulures extérieures</span>
      <span class="install-amount">${fmtPrice(installationCost)}</span>
    </div>` : ''}
  </section>

  <!-- ─────────────────────────────────────────────────────────────
       SECTION 5 — PRIX DU CONTRAT (art. 5–6 du PDF)
  ──────────────────────────────────────────────────────────────── -->
  <section class="forfait-section">
    <div class="f-label">Prix forfaitaire global</div>
    <h2>Matériaux, installation, finition et moulures extérieures</h2>
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

  <!-- ─────────────────────────────────────────────────────────────
       SECTION 6 — MODIFICATIONS DE PRIX (art. 6.2–6.3 du PDF)
  ──────────────────────────────────────────────────────────────── -->
  <section class="section">
    <div class="section-title">5. Verrouillage du prix &amp; modifications</div>

    <div class="contrat-clause">
      <span class="sub-title">5.1 — Verrouillage du prix (clause ajoutée)</span>
      <p>Le prix forfaitaire ci-dessus est <strong>verrouillé pour ${validDaysVal} jours</strong> à compter de la date d'émission du présent contrat, sous réserve des articles 5.2 et 5.3 ci-dessous. Passé ce délai, l'entrepreneur se réserve le droit de réémettre un devis révisé.</p>
    </div>

    <div class="contrat-clause">
      <span class="sub-title">5.2 — Travaux supplémentaires et modifications demandées par le client (art. 6.2.1)</span>
      <p>Tous les travaux supplémentaires ou non prévus, découlant d'une demande de modification du client, seront facturés en supplément du prix forfaitaire convenu. Le client devra signer un avenant intitulé « Modification au contrat » qui sera annexé au présent contrat.</p>
    </div>

    <div class="contrat-clause">
      <span class="sub-title">5.2 bis — Taux horaire de main-d'œuvre supplémentaire (art. 6.2.5)</span>
      <p>Pour les travaux supplémentaires, modifications et travaux imprévus référés aux articles 5.2, 5.3 et 5.4, la main-d'œuvre additionnelle est facturée au taux horaire de <strong>85&nbsp;$ / heure</strong> (avant taxes), par employé, incluant le déplacement sur le chantier. Les matériaux, l'équipement loué et les sous-traitants sont facturés au coût réel majoré de 20&nbsp;%. Un décompte détaillé sera fourni avec chaque avenant.</p>
    </div>

    <div class="contrat-clause">
      <span class="sub-title">5.3 — Révision imprévue des coûts de matériaux (art. 6.3)</span>
      <p>Dans l'éventualité où des augmentations imprévisibles du prix des matériaux auraient pour effet d'augmenter les coûts de construction avant la date de livraison, l'entrepreneur aura le droit, en justifiant l'augmentation auprès du client, de réviser à la hausse le prix du contrat. Le client s'engage à signer tout document de modification des coûts dans un délai de quinze (15) jours suivant la production des pièces justificatives.</p>
    </div>

    <div class="contrat-clause">
      <span class="sub-title">5.4 — Travaux imprévus (art. 6.2.3)</span>
      <p>L'entrepreneur avisera sans délai le client de toute découverte survenant en cours de chantier (éléments imprévus lors de la démolition ou du dégarnissage). Le client assumera le coût des matériaux, de l'équipement et de la main-d'œuvre additionnels requis et signera le document « Modification au contrat » à cet effet.</p>
    </div>
  </section>

  <!-- ─────────────────────────────────────────────────────────────
       SECTION 7 — MODALITÉS DE PAIEMENT (art. 7 du PDF)
  ──────────────────────────────────────────────────────────────── -->
  <section class="section">
    <div class="section-title">6. Modalités de paiement</div>
    <div class="payment-list">
      ${payRows}
    </div>
    <div class="interac-note">
      <strong>Paiement par virement Interac uniquement</strong> à <strong>${escHtml(interacEmail)}</strong>.<br>
      Une <strong>question de sécurité</strong> personnalisée vous sera transmise par courriel ou SMS au moment du paiement — veuillez ne pas utiliser de question générée automatiquement par votre institution financière.<br>
      La TPS et la TVQ s'appliquent proportionnellement à chaque versement.
    </div>

    <div class="contrat-clause" style="margin-top:20px;">
      <span class="sub-title">6.1 — Acompte et conditions de démarrage (art. 7.1)</span>
      <ul>
        <li><strong>Aucun travail ne débute</strong> avant la réception du contrat signé et du premier versement.</li>
        <li>Le premier versement confirme la date de début des travaux et déclenche la commande des matériaux. Il devient non remboursable dès que les matériaux ont été commandés.</li>
        <li>Le solde est exigible 24 heures avant le début de l'installation.</li>
      </ul>
    </div>

    <div class="contrat-clause">
      <span class="sub-title">6.2 — Intérêts sur les arrérages (art. 7.3)</span>
      <p>Tout arrérage portera intérêt au taux de <strong>2 % par mois</strong>, capitalisé mensuellement (soit 24,24 % par année), à compter de la date d'exigibilité, sans préjudice à tous autres droits et recours de l'entrepreneur.</p>
    </div>

    <div class="contrat-clause">
      <span class="sub-title">6.3 — Droit de suspension (art. G2.1)</span>
      <p>${escHtml(businessName)} se réserve le droit de suspendre les travaux en cas de non-paiement selon l'échéancier convenu, après envoi d'un avis écrit au client. Les pénalités d'intérêt s'appliquent dès la date d'exigibilité du versement impayé.</p>
    </div>
  </section>

  <!-- ─────────────────────────────────────────────────────────────
       SECTION 8 — GARANTIES (art. G15 du PDF)
  ──────────────────────────────────────────────────────────────── -->
  <section class="section">
    <div class="section-title">7. Garanties</div>
    <div class="contrat-clause" style="margin-bottom:20px;">
      <p>Les travaux exécutés par l'entrepreneur dans le cadre du contrat sont garantis conformément aux dispositions du <em>Code civil du Québec</em> (art. G15). L'entrepreneur transmettra au client les garanties des fabricants ou des fournisseurs concernant les matériaux, produits ou les systèmes fournis. L'entrepreneur ne garantit ni la main-d'œuvre ni les matériaux fournis par le client ou les sous-traitants engagés directement par celui-ci.</p>
    </div>
    ${warrantyHtml}
  </section>

  <!-- ─────────────────────────────────────────────────────────────
       SECTION 9 — RESPONSABILITÉS DU CLIENT
  ──────────────────────────────────────────────────────────────── -->
  <section class="section">
    <div class="section-title">8. Responsabilités du client</div>
    <div class="info-box">
      <ul>${responsibilitiesHtml}</ul>
    </div>
  </section>

  <!-- ─────────────────────────────────────────────────────────────
       SECTION 10 — ASSURANCES (art. G7 du PDF)
  ──────────────────────────────────────────────────────────────── -->
  <section class="section">
    <div class="section-title">9. Assurances</div>
    <div class="contrat-clause">
      <span class="sub-title">9.1 — Assurance responsabilité de l'entrepreneur (art. G7.1)</span>
      <p>Avant le début des travaux, l'entrepreneur devra démontrer au client qu'il est muni d'une assurance de responsabilité civile adéquate concernant les travaux exécutés sur l'immeuble. Une copie de sa police d'assurance sera fournie sur demande écrite du client.</p>
    </div>
    <div class="contrat-clause">
      <span class="sub-title">9.2 — Avis à l'assureur du client (art. G7.2)</span>
      <p>Le client s'engage à aviser par écrit son assureur de l'immeuble des travaux effectués par l'entrepreneur. Une copie de l'avis transmis à l'assureur devra être fournie à l'entrepreneur avant le début des travaux.</p>
    </div>
  </section>

  <!-- ─────────────────────────────────────────────────────────────
       SECTION 11 — AVIS ET DÉFAUTS (art. G1 du PDF)
  ──────────────────────────────────────────────────────────────── -->
  <section class="section">
    <div class="section-title">10. Avis et défauts</div>
    <div class="contrat-clause">
      <span class="sub-title">10.1 — Validité de l'avis (art. G1.1)</span>
      <p>Tout avis requis en vertu du présent contrat est suffisant s'il est consigné dans un écrit expédié par un mode de communication qui permet à la partie expéditrice de prouver que l'avis a été effectivement livré à la partie destinataire.</p>
    </div>
    <div class="contrat-clause">
      <span class="sub-title">10.2 — Délai raisonnable (art. G1.2)</span>
      <p>Une partie qui constate le défaut de l'autre de respecter l'une ou l'autre de ses obligations doit mettre la partie défaillante en demeure de remédier à son défaut par avis écrit énonçant la nature du défaut et accordant un délai de sept (7) jours pour y remédier.</p>
    </div>
    <div class="contrat-clause">
      <span class="sub-title">10.3 — Défauts de l'entrepreneur (art. G1.3)</span>
      <ul>
        <li>S'il n'exécute pas les travaux conformément au contrat, à la loi ou aux règles de l'art.</li>
        <li>S'il tarde de façon indue à fournir la main-d'œuvre, l'outillage ou l'équipement requis dans les délais prévus.</li>
        <li>S'il compromet la sécurité du chantier et de son personnel.</li>
      </ul>
    </div>
    <div class="contrat-clause">
      <span class="sub-title">10.4 — Défauts du client (art. G1.4)</span>
      <ul>
        <li>Si la réalisation des travaux est interrompue pour 30 jours ou plus à la suite d'une décision du client sans ordonnance d'un tribunal ou organisme de droit public, et que cette interruption ne résulte pas de la faute ou de la négligence de l'entrepreneur.</li>
        <li>Si le client fait défaut de payer à échéance tout montant dû conformément aux modalités de paiement.</li>
      </ul>
    </div>
  </section>

  <!-- ─────────────────────────────────────────────────────────────
       SECTION 12 — RÉSILIATION (art. G2–G3 du PDF)
  ──────────────────────────────────────────────────────────────── -->
  <section class="section">
    <div class="section-title">11. Résiliation et suspension</div>
    <div class="contrat-clause">
      <span class="sub-title">11.1 — Résiliation par l'entrepreneur pour défaut du client (art. G2.1)</span>
      <p>Si le client néglige de corriger ses défauts dans le délai imparti à l'avis de défaut, l'entrepreneur peut, à son choix, suspendre les travaux jusqu'à ce que le client ait remédié au défaut, ou mettre fin au contrat. Dans l'éventualité où le client serait en défaut de paiement, l'entrepreneur peut suspendre immédiatement les travaux dès l'envoi d'un avis de défaut.</p>
    </div>
    <div class="contrat-clause">
      <span class="sub-title">11.2 — Force majeure ou imprévus (art. G2.2)</span>
      <p>L'entrepreneur se réserve le droit de suspendre ou de demander la résiliation en raison de découvertes imprévues ou d'une cause de force majeure, sans nécessité d'avis préalable. Sont réputées être une cause de force majeure : accident inévitable, guerre, révolution, inondation, feu, pandémie, grève ou autre conflit de travail, défaut de tout fournisseur de matériaux ou de services, absence des services d'utilité publique, retard dans les inspections par une société préteuse ou tout autre règlement ou législation ou ordonnance de tout palier gouvernemental.</p>
    </div>
    <div class="contrat-clause">
      <span class="sub-title">11.3 — Résiliation unilatérale par le client (art. G3.2)</span>
      <p>Le client peut, de façon unilatérale et sans aucun motif, résilier le présent contrat en transmettant un avis écrit de résiliation à l'entrepreneur. Le client devra alors payer : les frais et dépenses actuelles, la valeur des travaux exécutés et la valeur des biens fournis, à la date de la résiliation. De plus, le client devra payer à l'entrepreneur une indemnité additionnelle équivalente à <strong>25 % de la valeur des travaux restant à exécuter</strong>, en sus de tout autre préjudice que l'entrepreneur pourra subir.</p>
    </div>
    <div class="contrat-clause">
      <span class="sub-title">11.4 — Résiliation de plein droit (art. G4)</span>
      <p>Le contrat peut être résilié de plein droit par l'une ou l'autre des parties, sans nécessité d'avis ni mise en demeure préalable, dans l'un ou l'autre des cas suivants : faillite ou insolvabilité, nomination d'un syndic, dissolution ou liquidation volontaire ou forcée de l'une des parties.</p>
    </div>
    <div class="contrat-clause">
      <span class="sub-title">11.5 — Droit au paiement en cas de résiliation (art. G2.4)</span>
      <p>Dans l'éventualité où l'entrepreneur résilie le contrat pour cause de défaut du client, l'entrepreneur aura droit, en plus d'être payé pour la valeur des travaux exécutés, d'être indemnisé pour toutes les pertes subies. L'entrepreneur peut conserver les acomptes et versements déjà perçus du client en compensation du préjudice subi, sans préjudice à ses autres droits etrecours.</p>
    </div>
  </section>

  <!-- ─────────────────────────────────────────────────────────────
       SECTION 13 — LIMITATION DE RESPONSABILITÉ
  ──────────────────────────────────────────────────────────────── -->
  <section class="section">
    <div class="section-title">12. Limitation de responsabilité</div>
    <div class="contrat-clause">
      <ul>
        <li>La responsabilité totale de ${escHtml(businessName)}, toutes causes confondues, est limitée au montant total du présent contrat (${fmtPrice(subtotal)} avant taxes).</li>
        <li>${escHtml(businessName)} n'est pas responsable des dommages indirects, consécutifs ou accessoires, incluant mais sans s'y limiter : perte d'usage, frais d'hébergement, perte de revenus ou inconvénients.</li>
        <li>${escHtml(businessName)} n'est pas responsable des retards causés par : l'humidité ambiante, les délais de livraison des fournisseurs, les conditions météorologiques, ou le manque d'accès au site.</li>
        <li>Aucune responsabilité ne pourra être imputée à l'entrepreneur qui suspend les travaux conformément au contrat (art. G2.3). Toutes pénalités, dépenses, frais ou dommages d'une telle suspension ne pourront lui être imputés.</li>
      </ul>
    </div>
  </section>

  <!-- ─────────────────────────────────────────────────────────────
       SECTION 14 — RETARD DANS L'EXÉCUTION (art. G5 du PDF)
  ──────────────────────────────────────────────────────────────── -->
  <section class="section">
    <div class="section-title">13. Retard dans l'exécution des travaux</div>
    <div class="contrat-clause">
      <p>L'entrepreneur ne sera pas responsable du retard dans l'exécution des travaux si ce retard provient du défaut du client de remplir ses obligations, des présentes clauses générales, d'une force majeure ou encore, de la survenance de toute autre cause indépendante de la volonté de l'entrepreneur, à savoir, mais sans s'y limiter : tout accident inévitable, grève, révolution, inondation, feu, pandémie, conflit de travail, défaut de tout fournisseur de matériaux ou de services, impossibilité d'obtenir des matériaux à des conditions raisonnables, substitution de matériaux prévue aux clauses générales, impossibilité d'obtenir des services d'utilité publique, retard dans les inspections ou tout règlement ou législation ou ordonnance de tout palier gouvernemental.</p>
    </div>
  </section>

  <!-- ─────────────────────────────────────────────────────────────
       SECTION 15 — RÉCEPTION DES TRAVAUX (art. G12–G13 du PDF)
  ──────────────────────────────────────────────────────────────── -->
  <section class="section">
    <div class="section-title">14. Réception des travaux</div>
    <div class="contrat-clause">
      <span class="sub-title">14.1 — Obligation de réception (art. G12)</span>
      <p>Le client est tenu de recevoir l'ouvrage à la fin des travaux. La réception a lieu lorsque l'ouvrage est exécuté et que l'immeuble est en état de servir, conformément à l'usage auquel il est destiné. La livraison de l'immeuble et la réception des travaux seront confirmées dans le document intitulé « Attestation de réception des travaux », lequel devra être signé par l'entrepreneur et le client et être joint au présent contrat à titre d'annexe.</p>
    </div>
    <div class="contrat-clause">
      <span class="sub-title">14.2 — Réserves (art. G13)</span>
      <p>L'entrepreneur accepte de reprendre, de corriger ou de parachever les travaux pour lesquels une réserve écrite apparaît sur l'Attestation de réception des travaux, dans la mesure où ils font l'objet d'une entente écrite entre les parties, qui sera consignée dans l'Entente sur le parachèvement et la correction de travaux.</p>
    </div>
    <div class="contrat-clause">
      <span class="sub-title">14.3 — Sûreté suffisante (art. G14)</span>
      <p>Au regard de l'article 2111 du Code civil du Québec, et à la condition que l'entrepreneur soit dûment accrédité auprès d'un plan de garantie, le client reconnaît et accepte que ce plan de garantie constitue une sûreté suffisante garantissant l'exécution des obligations de l'entrepreneur en ce qui concerne les malfaçons apparentes et le parachèvement des travaux.</p>
    </div>
  </section>

  <!-- ─────────────────────────────────────────────────────────────
       SECTION 16 — SOL ET CONTAMINANTS (art. G11 du PDF)
  ──────────────────────────────────────────────────────────────── -->
  <section class="section">
    <div class="section-title">15. Sol et contaminants</div>
    <div class="contrat-clause">
      <span class="sub-title">15.1 — Responsabilité du client (art. G11.1)</span>
      <p>Le client se déclare et se reconnaît responsable de la présence, sur et dans l'immeuble, de polluants ou de contaminants tels que définis par la Loi sur la qualité de l'environnement. En conséquence, le client assumera tous les frais supplémentaires reliés à l'obligation de décontaminer l'immeuble visé par les travaux.</p>
    </div>
    <div class="contrat-clause">
      <span class="sub-title">15.2 — Qualité du sol (art. G11.2)</span>
      <p>Advenant le cas où, en raison de la nature ou de la qualité du sol, des travaux supplémentaires imprévisibles lors de la signature du contrat s'avèrent nécessaires, le client assumera tous les frais supplémentaires reliés à de tels travaux, lesquels ne sont pas inclus dans le prix du contrat.</p>
    </div>
  </section>

  <!-- ─────────────────────────────────────────────────────────────
       SECTION 17 — RÈGLEMENT DES DIFFÉRENDS (art. G16 du PDF + amélioration)
  ──────────────────────────────────────────────────────────────── -->
  <section class="section">
    <div class="section-title">16. Règlement des différends</div>
    <div class="contrat-clause">
      <span class="sub-title">16.1 — Résolution à l'amiable (art. G16 + clause ajoutée)</span>
      <p>En cas de différend ou de litige résultant de l'interprétation ou de l'application du présent contrat, les parties s'engagent <strong>d'abord à tenter une résolution à l'amiable</strong> dans un délai de quinze (15) jours suivant la réception d'un avis écrit énonçant la nature du différend. Les parties peuvent, d'un commun accord, convenir de soumettre les questions litigieuses à un médiateur qu'ils auront choisi, les frais de médiation étant partagés à parts égales.</p>
    </div>
    <div class="contrat-clause">
      <span class="sub-title">16.2 — Élection de domicile — tribunaux québécois (art. 12 du PDF)</span>
      <p>À défaut de règlement à l'amiable, les parties conviennent, pour toute réclamation ou poursuite judiciaire relative au présent contrat, de choisir le district judiciaire de <strong>Laurentides, province de Québec, Canada</strong>, comme lieu approprié pour l'audition de ces réclamations, à l'exclusion de tout autre district judiciaire. Le présent contrat est régi par les lois de la province de Québec.</p>
    </div>
  </section>

  <!-- ─────────────────────────────────────────────────────────────
       SECTION 18 — DOCUMENTATION PHOTOGRAPHIQUE (art. G20-like)
  ──────────────────────────────────────────────────────────────── -->
  <section class="section">
    <div class="section-title">17. Documentation photographique et marketing</div>
    <div class="contrat-clause">
      <p>Le client autorise ${escHtml(businessName)} à prendre des photographies et vidéos avant, pendant et après les travaux. Ces images pourront être utilisées à des fins de marketing, de portfolio et de réseaux sociaux, sans identification du client ni de l'adresse précise. Le client peut retirer cette autorisation par écrit en tout temps, sans que cela n'affecte les autres dispositions du présent contrat.</p>
      <p style="margin-top:8px;font-size:12px;opacity:0.7;">En vertu de la <em>Loi sur la protection des renseignements personnels dans le secteur privé</em> (L.R.Q., c. P-39.1), le client consent librement à ce que l'entrepreneur recueille auprès de tiers ou communique à des tiers intéressés tout renseignement personnel pertinent requis pour les fins du contrat ou d'une vérification de la satisfaction quant aux travaux.</p>
    </div>
  </section>

  <!-- ─────────────────────────────────────────────────────────────
       SECTION 19 — DISPOSITIONS GÉNÉRALES (art. 8–10 du PDF)
  ──────────────────────────────────────────────────────────────── -->
  <section class="section">
    <div class="section-title">18. Dispositions générales</div>

    <div class="contrat-clause">
      <span class="sub-title">18.1 — Clauses générales, annexes et formulaires (art. 8)</span>
      <p>Le client déclare qu'il a lu, qu'il comprend et qu'il accepte toutes et chacune des clauses apparaissant aux présentes, incluant les clauses générales, les annexes et les formulaires s'y rapportant. S'il y a contradiction ou conflit entre les clauses générales, un document annexé et le présent contrat, les dispositions des annexes ou du présent contrat auront préséance sur les clauses générales.</p>
    </div>

    <div class="contrat-clause">
      <span class="sub-title">18.2 — Autre entente nulle (art. 9)</span>
      <p>Le présent contrat annule toute autre entente écrite ou verbale antérieure entre les parties relativement à l'objet des présentes.</p>
    </div>

    <div class="contrat-clause">
      <span class="sub-title">18.3 — Entrée en vigueur (art. 10)</span>
      <p>Le contrat entre en vigueur à la date de sa signature par les deux parties.</p>
    </div>

    <div class="contrat-clause">
      <span class="sub-title">18.4 — Divisibilité</span>
      <p>Si une clause du présent contrat est jugée invalide ou inapplicable par un tribunal compétent, les autres clauses demeurent pleinement en vigueur.</p>
    </div>

    <div class="contrat-clause">
      <span class="sub-title">18.5 — Modifications au contrat</span>
      <p>Toute modification aux travaux ou aux conditions du présent contrat doit faire l'objet d'un avenant écrit intitulé « Modification au contrat », signé par les deux parties.</p>
    </div>

    <div class="contrat-clause">
      <span class="sub-title">18.6 — Solidarité (art. 13)</span>
      <p>Dans la mesure où plus d'une personne signe le présent contrat à titre de client, chacune se porte solidairement responsable l'une de l'autre de toutes les obligations incombant au client en vertu du présent contrat, des clauses générales, des annexes et des formulaires, et toutes se désignent mandataires les unes des autres.</p>
    </div>

    <div class="contrat-clause">
      <span class="sub-title">18.7 — Substitution de matériaux (art. G9)</span>
      <p>Advenant le cas où certains matériaux devant être utilisés dans l'exécution des travaux ne seraient plus disponibles dans les délais requis, ou à des conditions satisfaisantes, l'entrepreneur pourra y substituer d'autres matériaux de nature et de qualité équivalentes. L'entrepreneur s'engage à aviser le client au moins 48 heures à l'avance. En cas de retard dans la livraison par suite de la non-substitution, le client accepte à l'avance que ce retard ne sera pas attribuable à l'entrepreneur.</p>
    </div>

    <div class="contrat-clause">
      <span class="sub-title">18.8 — Déclaration anti-blanchiment et provenance des fonds (art. 13)</span>
      <p>Le client déclare et garantit que les fonds utilisés pour l'exécution du présent contrat proviennent exclusivement de sources licites et qu'ils ne sont le produit d'aucune activité illicite, notamment au sens de la <em>Loi sur le recyclage des produits de la criminalité et le financement des activités terroristes</em> (L.C. 2000, ch. 17). Le client s'engage à fournir, sur demande raisonnable, toute documentation permettant d'attester la provenance des fonds. Tout paiement reçu dans des circonstances suspectes pourra être refusé ou restitué, et ${escHtml(businessName)} se réserve le droit de signaler toute opération suspecte aux autorités compétentes.</p>
    </div>

    <div class="contrat-clause">
      <span class="sub-title">18.8 — Frais de services publics supplémentaires (art. G10)</span>
      <p>Si par voie de législation, de réglementation ou de décision administrative, une autorité gouvernementale impose à l'entrepreneur de nouvelles taxes, de nouveaux frais ou d'autres coûts analogues liés aux services publics ou d'infrastructures, le client convient de défrayer ces frais ou de rembourser à l'entrepreneur le montant assumé par celui-ci.</p>
    </div>
  </section>

  <!-- ─────────────────────────────────────────────────────────────
       SECTION 20 — ACCEPTATION & SIGNATURE (art. 13 du PDF)
  ──────────────────────────────────────────────────────────────── -->
  <section class="section">
    <div class="section-title">19. Acceptation du contrat</div>

    <div class="contrat-accept-box">
      <strong>En signant le présent contrat, le client confirme :</strong>
      <ul>
        <li>Avoir lu et compris l'ensemble des termes et conditions, incluant l'Annexe A.</li>
        <li>Accepter les conditions de paiement spécifiées à la section 6.</li>
        <li>Accepter les termes et limitations de la garantie à la section 7.</li>
        <li>Autoriser ${escHtml(businessName)} à effectuer les travaux décrits à l'Annexe A.</li>
        <li>Reconnaître que les exclusions à la section 3.3 ont été clairement communiquées.</li>
        ${acknowledgmentsHtml}
      </ul>
    </div>

    <div class="sig-grid">
      <div class="sig-block">
        <p><strong>Le Client :</strong></p>
        <div class="sig-line" id="sig-client-main"></div>
        <p class="sig-label">Signature</p>
        <p style="margin-top:14px;"><strong>${clientNameEsc}</strong></p>
        <p class="sig-label">Nom en lettres moulées</p>
        <div class="sig-line" id="sig-date-main" style="margin-top:14px;"></div>
        <p class="sig-label">Date</p>
      </div>
      <div class="sig-block">
        <p><strong>Pour ${escHtml(businessName)} :</strong></p>
        <div style="border-bottom:1px solid ${NAVY};padding:4px 0 2px;margin-bottom:4px;">
          <span class="sig-handwritten">${escHtml(authorizedRep)}</span>
        </div>
        <p class="sig-label">Signature</p>
        <p style="margin-top:14px;"><strong>${escHtml(authorizedRep)}</strong></p>
        <p class="sig-label">Représentant autorisé</p>
        <div style="border-bottom:1px solid ${NAVY};padding:8px 0 2px;margin-top:14px;margin-bottom:4px;">
          <span class="sig-timestamp">${dateLabel}</span>
        </div>
        <p class="sig-label">Date</p>
      </div>
    </div>
  </section>

  <!-- ─────────────────────────────────────────────────────────────
       ANNEXE A — DÉTAIL DES OUVERTURES (scope_items)
  ──────────────────────────────────────────────────────────────── -->
  <section class="section" style="page-break-before:always;">
    <div style="background:var(--navy);color:var(--pure);padding:28px 32px;border-radius:4px;margin-bottom:24px;">
      <div style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.2em;opacity:0.6;margin-bottom:6px;">Document annexé</div>
      <h2 style="font-size:24px;color:var(--pure);letter-spacing:-0.01em;">ANNEXE A — Étendue des travaux</h2>
      <div style="font-size:11px;opacity:0.55;margin-top:6px;">Contrat n° ${contractNumEsc} · ${clientNameEsc}</div>
    </div>

    <div class="section-title">A.1 — Travaux inclus</div>
    ${scopeHtml || `<div class="contrat-annex-item"><p>Les travaux inclus correspondent aux ouvertures décrites à la section 4 du présent contrat.</p></div>`}

    <div class="section-title" style="margin-top:28px;">A.2 — Travaux exclus</div>
    <div class="contrat-exclusion-box">
      <p style="font-size:12px;font-weight:700;margin-bottom:8px;">Les travaux suivants ne sont <strong>PAS inclus</strong> dans le présent contrat :</p>
      <ul>${exclusionHtml}</ul>
    </div>

    <div class="section-title" style="margin-top:28px;">A.3 — Reconnaissance du client</div>
    <div class="info-box">
      <ul>${acknowledgmentsHtml}</ul>
    </div>

    <div style="margin-top:32px;padding-top:24px;border-top:1px solid var(--border);">
      <p style="font-size:12px;"><strong>La présente Annexe A fait partie intégrante du Contrat n° ${contractNumEsc} et a la même force obligatoire.</strong></p>
      <div class="sig-grid" style="margin-top:28px;">
        <div class="sig-block">
          <p><strong>Le Client :</strong></p>
          <div class="sig-line" id="sig-client-annex"></div>
          <p class="sig-label">Signature — Date</p>
        </div>
        <div class="sig-block">
          <p><strong>Pour ${escHtml(businessName)} :</strong></p>
          <div style="border-bottom:1px solid ${NAVY};padding:4px 0 2px;margin-bottom:4px;">
            <span class="sig-handwritten">${escHtml(authorizedRep)}</span>
            <span style="margin-left:16px;" class="sig-timestamp">${dateLabel}</span>
          </div>
          <p class="sig-label">Signature — Date</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ── FOOTER ────────────────────────────────────────────────── -->
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

<!-- ── SIGNATURE ÉLECTRONIQUE ──────────────────────────────────── -->
<div class="signature-section" id="signatureSection">
  <h2>Signature électronique du contrat</h2>
  <p style="font-size:13px;color:#475569;margin-bottom:20px;">
    Veuillez dessiner votre signature ci-dessous, entrer votre nom complet et accepter les termes du contrat.
  </p>

  <div class="sig-canvas-wrap">
    <canvas id="signatureCanvas" width="700" height="160"></canvas>
    <div class="placeholder" id="canvasPlaceholder">Dessinez votre signature ici</div>
  </div>

  <div class="sig-form-row">
    <input type="text" id="signerName" placeholder="Nom complet *" value="${clientNameEsc}" />
    <input type="email" id="signerEmail" placeholder="Courriel (optionnel)" value="${escHtml(client_email || '')}" />
  </div>
  <div class="sig-form-row">
    <input type="text" id="signerPhoneLast4" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="4 derniers chiffres de votre téléphone *" />
  </div>

  <div class="sig-checkbox">
    <input type="checkbox" id="acceptTerms" />
    <label for="acceptTerms">
      J'ai lu et j'accepte l'ensemble des termes et conditions du contrat n° ${contractNumEsc}, incluant l'Annexe A — Étendue des travaux. Je reconnais que cette signature électronique a la même valeur juridique qu'une signature manuscrite.
    </label>
  </div>

  <div class="sig-actions">
    <button class="btn-clear" onclick="clearSignature()">Effacer</button>
    <button class="btn-sign" id="btnSign" onclick="signContract()" disabled>Signer le contrat</button>
    <button class="btn-download" id="btnDownload" onclick="window.print()">Télécharger (PDF)</button>
  </div>

  <div class="sig-status" id="sigStatus"></div>
</div>

<script src="https://cdn.jsdelivr.net/npm/signature_pad@5.0.4/dist/signature_pad.umd.min.js"></script>
<script>
(function() {
  var CONTRACT_NUMBER = '${contractNumEsc}';
  var canvas = document.getElementById('signatureCanvas');
  var placeholder = document.getElementById('canvasPlaceholder');
  var btnSign = document.getElementById('btnSign');
  var btnDownload = document.getElementById('btnDownload');
  var statusEl = document.getElementById('sigStatus');
  var acceptBox = document.getElementById('acceptTerms');

  function resizeCanvas() {
    var ratio = Math.max(window.devicePixelRatio || 1, 1);
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    canvas.getContext('2d').scale(ratio, ratio);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    signaturePad.clear();
  }

  var signaturePad = new SignaturePad(canvas, {
    backgroundColor: 'rgba(255,255,255,0)',
    penColor: '${NAVY}',
    minWidth: 1.5,
    maxWidth: 3
  });

  signaturePad.addEventListener('beginStroke', function() {
    placeholder.style.display = 'none';
  });

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  acceptBox.addEventListener('change', function() {
    btnSign.disabled = !acceptBox.checked;
  });

  window.clearSignature = function() {
    signaturePad.clear();
    placeholder.style.display = 'block';
  };

  function showStatus(type, msg) {
    statusEl.className = 'sig-status ' + type;
    statusEl.textContent = msg;
  }

  function embedSignature(sigDataUrl, dateStr) {
    var mainSig = document.getElementById('sig-client-main');
    if (mainSig) {
      mainSig.innerHTML = '<img src="' + sigDataUrl + '" class="sig-embedded-img" alt="Signature" />';
      mainSig.style.borderBottom = 'none';
      mainSig.style.height = 'auto';
    }
    var mainDate = document.getElementById('sig-date-main');
    if (mainDate) {
      mainDate.innerHTML = '<span class="sig-timestamp">Signé électroniquement le ' + dateStr + '</span>';
      mainDate.style.borderBottom = 'none';
      mainDate.style.height = 'auto';
    }
    var annexSig = document.getElementById('sig-client-annex');
    if (annexSig) {
      annexSig.innerHTML = '<img src="' + sigDataUrl + '" class="sig-embedded-img" alt="Signature" /><br/><span class="sig-timestamp">Signé le ' + dateStr + '</span>';
      annexSig.style.borderBottom = 'none';
      annexSig.style.height = 'auto';
    }
  }

  window.signContract = async function() {
    var name = document.getElementById('signerName').value.trim();
    var email = document.getElementById('signerEmail').value.trim();
    var phoneLast4El = document.getElementById('signerPhoneLast4');
    var phoneLast4 = phoneLast4El ? phoneLast4El.value.replace(/\D/g, '').slice(-4) : '';

    if (!name) { showStatus('error', 'Veuillez entrer votre nom complet.'); return; }
    if (phoneLast4El && (!phoneLast4 || phoneLast4.length !== 4)) {
      showStatus('error', 'Veuillez entrer les 4 derniers chiffres de votre téléphone.');
      return;
    }
    if (signaturePad.isEmpty()) { showStatus('error', 'Veuillez dessiner votre signature.'); return; }
    if (!acceptBox.checked) { showStatus('error', 'Veuillez accepter les termes du contrat.'); return; }

    showStatus('loading', 'Envoi de la signature en cours...');
    btnSign.disabled = true;

    var sigDataUrl = signaturePad.toDataURL('image/png');
    var now = new Date();
    var dateStr = now.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    embedSignature(sigDataUrl, dateStr);
    var signedHtml = document.documentElement.outerHTML;

    try {
      var resp = await fetch('https://www.bluewiseai.com/api/universal/contrat/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_number: CONTRACT_NUMBER,
          signer_name: name,
          signer_email: email || null,
          signature_image: sigDataUrl,
          signed_html: signedHtml,
          client_phone_last4: phoneLast4
        })
      });

      var data = await resp.json();

      if (resp.ok && data.success) {
        showStatus('success', 'Contrat signé avec succès! Vous pouvez maintenant télécharger votre copie.');
        btnSign.style.display = 'none';
        btnDownload.style.display = 'block';
        document.querySelector('.btn-clear').style.display = 'none';
        document.getElementById('signerName').disabled = true;
        document.getElementById('signerEmail').disabled = true;
        acceptBox.disabled = true;
        signaturePad.off();
      } else {
        showStatus('error', data.error || 'Erreur lors de la signature. Veuillez réessayer.');
        btnSign.disabled = false;
      }
    } catch (err) {
      showStatus('error', 'Erreur de connexion. Veuillez réessayer.');
      btnSign.disabled = false;
    }
  };
})();
</script>

</body>
</html>`;
}
