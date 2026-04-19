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
 *     line_items: [{ description, qty, unit_price, total, model?, ouvrant?, dimensions?, type?, specs?, energy?, cert?, note? }],
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
 *
 * itemSketchSvg() is also exported for use by the DevisEditor React component.
 */

const NAVY = '#2A2C35';
const INSTALL_DESCRIPTION = 'Installation, finition et moulures extérieures';

// ─── Triple stripper (safety guard — parser should catch this first) ──────────

function stripTriple(str) {
  if (!str || typeof str !== 'string') return str;
  let result = str.replace(/\bTriple\s+coupe[-\s]froid\b/gi, '');
  result = result.replace(/\bTriple\b/gi, '');
  result = result.replace(/,\s*,/g, ',').replace(/^[\s,]+|[\s,]+$/g, '').replace(/\s{2,}/g, ' ');
  return result.trim();
}

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

import { richItemSvg } from './svg-ssr.js';
import { dedupeSpecs, renderDimsHtml } from '../devis/specs.js';

export function itemSketchSvg(item) {
  // Preferred path: if the item was built through the hub commande tool it has
  // the full rich config (_category + _window_type/_entry_door_style/
  // _patio_collection + _config{panels,max,widthRatios,vertical,mode}). Render
  // via the shared server-side SVG generator — pixel-identical to the
  // WindowConfigSVG / PatioDoorSVG / EntryDoorSVG React components the hub
  // displays. Legal/contract surfaces depend on this matching the editor.
  const rich = richItemSvg(item);
  if (rich) return rich;

  // Legacy fallback — items missing rich metadata (pre-hub quotes, imported
  // from handwritten papers, old regex-parsed soumissions). These keep the
  // original heuristic sketch so they continue to render something.
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

// ─── Item card (brisson-style card grid layout) ───────────────────────────────

function renderItemCard(item, index, priceDisplayMode, complexityMul = 1) {
  const type = stripTriple(item.type || item.description || 'Item');
  const model = item.model || null;
  const ouvrant = item.ouvrant || null;
  const dims = item.dimensions || null;
  const specs = item.specs ? stripTriple(item.specs) : null;
  const qty = item.qty || 1;
  // ENERGY STAR: explicit opt-out (energy_star === false) wins; otherwise auto-detect
  // PÜR policy: all PVC fenêtres are ENERGY STAR certified unless explicitly excluded.
  // Portes (any type) are excluded from auto-ENERGY STAR.
  const energyExplicitFalse = item.energy_star === false || item.energy === false;
  const typeText = (item.type || item.description || '').toLowerCase();
  const specsText = (Array.isArray(item.specs) ? item.specs.join(' ') : item.specs || '').toLowerCase();
  const isPvcWindow = (
    typeText.includes('fenêtre') &&
    !typeText.includes('porte') &&
    (specsText.includes('pvc') || typeText.includes('pvc') || (item.model || '').toLowerCase().includes('pvc'))
  );
  // item.energy_star === true → explicit opt-in (even for non-PVC)
  // item.energy_star === false → explicit opt-out
  // auto → show badge if isPvcWindow
  const energy = energyExplicitFalse
    ? false
    : (item.energy_star === true || item.energy || isPvcWindow);
  const cert = item.cert || null;
  const note = item.note || null;

  const sketchSvg = itemSketchSvg(item);
  const w = dims?.width || null;
  const h = dims?.height || null;

  // Build label: type + model + ouvrant
  let typeLabel = escHtml(type);
  if (model) typeLabel += ` <span class="item-model">${escHtml(model)}</span>`;
  if (ouvrant) typeLabel += ` <span class="item-ouvrant">${escHtml(ouvrant)}</span>`;

  // Specs as bullet list — deduped by category (e.g. two "Thermos" lines
  // collapse into one, keeping the one with the numeric value).
  let specsHtml = '';
  if (specs) {
    const parts = dedupeSpecs(specs);
    if (parts.length > 0) {
      specsHtml = `<ul class="specs">${parts.map(s => `<li>${escHtml(s)}</li>`).join('')}</ul>`;
    }
  }

  const energyBadge = energy ? '<span class="energy">★ ENERGY STAR</span>' : '';
  const certHtml = cert ? `<div class="cert">${escHtml(String(cert))}</div>` : '';
  const noteHtml = note ? `<div class="item-note"><strong>📍</strong> ${escHtml(note)}</div>` : '';
  // Dimensions: nowrap per value so "24 1/4" doesn't break across "24" and "1/4".
  const dimsHtml = renderDimsHtml(w, h);

  // Price line.
  // priceDisplayMode === 'unitaire' → show per-item prices (transparent breakdown)
  // priceDisplayMode === 'total'    → hide per-item prices; only the forfait
  //                                    global at the bottom of the quote is shown.
  //                                    Useful when Jérémy wants to present a
  //                                    package price without itemized breakdown.
  const showPerItemPrice = priceDisplayMode !== 'total';
  const installNoteHtml = showPerItemPrice
    ? `<div class="install-note">Installation incluse de niveau et de qualité</div>`
    : '';
  // Apply complexity multiplier invisibly — client sees inflated per-item
  // prices that sum to the correct subtotal without explanation.
  const displayUnitPrice = (Number(item.unit_price) || 0) * complexityMul;
  const displayTotal     = (Number(item.total) || displayUnitPrice * qty) * complexityMul / (Number(item.total) && item.unit_price ? (Number(item.total) / (Number(item.unit_price) * qty)) : 1);
  // Simpler: recompute total = qty × displayUnitPrice so it's always consistent
  const recomputedTotal  = qty * displayUnitPrice;
  const priceHtml = (showPerItemPrice && (item.unit_price || item.total)) ? `
    <div class="item-price-row">
      ${qty > 1 ? `<span class="item-qty-badge">× ${qty}</span>` : ''}
      <span class="item-price-val">${fmtPrice(recomputedTotal)}</span>
      ${qty > 1 ? `<span class="item-unit-price">(${fmtPrice(displayUnitPrice)} / unité)</span>` : ''}
    </div>
    ${installNoteHtml}` : (showPerItemPrice ? '' : '');

  // Photos of the EXISTING opening (for the install team — helps them match
  // which window to replace where). Rendered as small thumbnails below the
  // sketch. Only images — PDFs skipped since they make no sense here.
  const photos = Array.isArray(item._photos) ? item._photos.filter(u => typeof u === 'string' && u && !/\.pdf(\?|$)/i.test(u)) : [];
  const photosHtml = photos.length > 0
    ? `<div class="item-photos">${photos.map(url => `<a href="${escHtml(url)}" target="_blank"><img src="${escHtml(url)}" alt="Photo ouverture existante" loading="lazy"/></a>`).join('')}</div>`
    : '';

  return `
    <div class="item-card">
      <div class="item-num">${String(index).padStart(2, '0')}</div>
      ${qty > 1 ? `<div class="item-qty">× ${qty}</div>` : ''}
      <div class="item-sketch">
        ${sketchSvg}
        ${dimsHtml}
        ${photosHtml}
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

// ─── Item row (table layout — kept as fallback, used in subtotal/install rows) ─

function renderItemRow(item, index) {
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
        ${specs ? `<div class="item-specs">${escHtml(Array.isArray(specs) ? specs.join(', ') : String(specs))}</div>` : ''}
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

  // price_display_mode: 'unitaire' (default) | 'total'
  const priceDisplayMode = (data.meta?.price_display_mode) || 'unitaire';

  // Optional extras
  const containerOn = !!(data.meta?.container_option);
  const containerAmount = containerOn ? 175 : 0;
  const promoOn     = !!(data.meta?.promo_enabled);
  const promoRebate = promoOn ? Number(data.meta?.promo_rebate || 0) : 0;
  // Client discount — stored as amount (already resolved mode % or $ at save time).
  const clientDiscount = Math.max(0, Number(data.meta?.discount_amount || 0));
  const discountMode   = data.meta?.discount_mode === 'percent' ? 'percent' : 'amount';
  const discountRawValue = Number(data.meta?.discount_value || 0);
  // Complexity surcharge — baked invisibly into each item's rendered price.
  // Stored %, multiplier applied to unit_price + total at render time.
  // Complexity multiplier — prefer the pre-computed value saved by DevisEditor
  // (handles both percent + amount modes). Falls back to legacy complexity_pct
  // for quotes saved before the $/% toggle was added.
  const complexityMulStored = Number(data.meta?.complexity_multiplier);
  const complexityPct = Math.max(0, Number(data.meta?.complexity_pct || 0));
  const complexityMul = Number.isFinite(complexityMulStored) && complexityMulStored > 0
    ? complexityMulStored
    : 1 + complexityPct / 100;

  // Split items: installation line vs fenêtres/portes
  const installItem = line_items.find(it => it.description === INSTALL_DESCRIPTION);
  const fenItems = line_items.filter(it => it.description !== INSTALL_DESCRIPTION);

  // Apply complexity multiplier at render time — keeps stored unit_price /
  // total untouched for auditability, while the client sees inflated
  // per-item prices that sum to the recorded grand total.
  const sousTotalFenetres = fenItems.reduce((s, it) => s + (it.total || 0), 0) * complexityMul;
  const installationCost  = installItem ? (installItem.total || 0) * complexityMul : 0;

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

  // Logo — use config logo_url if set, otherwise fall back to /images/pur-logo-rbq-white.png
  // The fallback works on both bluewiseai.com (copied to public/images/) and pur-construction-site
  const logoSrc = b.logo_url || '/images/pur-logo-rbq-white.png';
  const logoHtml = `<img src="${escHtml(logoSrc)}" alt="${escHtml(businessName)}" height="84" style="height:84px;width:auto;object-fit:contain;display:block;">`;

  // Items HTML — card grid layout (brisson-style), grouped by category
  const fenetreItems = fenItems.filter(it => {
    const t = (it.type || it.description || '').toLowerCase();
    return !t.includes('porte') || t.includes('porte-fenêtre') || t.includes('porte fenêtre');
  });
  const porteItems = fenItems.filter(it => {
    const t = (it.type || it.description || '').toLowerCase();
    return t.includes('porte') && !t.includes('porte-fenêtre') && !t.includes('porte fenêtre');
  });

  let itemsHtml = '';
  if (fenetreItems.length > 0) {
    const totalUnits = fenetreItems.reduce((s, it) => s + (Number(it.qty) || 1), 0);
    itemsHtml += `<div class="category-title">Fenêtres <span class="cat-count">${totalUnits} unité${totalUnits > 1 ? 's' : ''}</span></div>`;
    itemsHtml += `<div class="item-grid">${fenetreItems.map((item, i) => renderItemCard(item, i + 1, priceDisplayMode, complexityMul)).join('\n')}</div>`;
  }
  if (porteItems.length > 0) {
    const porteOffset = fenetreItems.length;
    const totalPortes = porteItems.reduce((s, it) => s + (Number(it.qty) || 1), 0);
    itemsHtml += `<div class="category-title">Portes <span class="cat-count">${totalPortes} unité${totalPortes > 1 ? 's' : ''}</span></div>`;
    itemsHtml += `<div class="item-grid">${porteItems.map((item, i) => renderItemCard(item, porteOffset + i + 1, priceDisplayMode, complexityMul)).join('\n')}</div>`;
  }
  if (fenetreItems.length === 0 && porteItems.length === 0 && fenItems.length > 0) {
    // Fallback: no categorization possible
    itemsHtml += `<div class="item-grid">${fenItems.map((item, i) => renderItemCard(item, i + 1, priceDisplayMode, complexityMul)).join('\n')}</div>`;
  }

  // Installation notes section
  if (installItem) {
    itemsHtml += `<div class="category-title">Installation &amp; finition <span class="cat-count">Incluse</span></div>`;
    itemsHtml += `<div class="info-box" style="margin-top:8px"><ul><li>${escHtml(installItem.description || 'Installation professionnelle, finition et moulures extérieures')}</li></ul></div>`;
  }

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

  // Notes — default: 6 bullet points matching brisson reference
  const defaultNotes = [
    'Tous les items sont représentés en <strong>vue extérieure</strong>',
    'La porte patio de grandes dimensions fait l\'objet d\'une validation finale des mesures avant commande',
    'Les moulures extérieures en aluminium sont incluses au contour des ouvertures concernées',
    'L\'installation comprend le pré-perçage, la fixation, le sablage, le recouvrement en aluminium et le ramassage des débris',
    'Isolation au polyuréthane et/ou laine minérale, ruban pare-air, prise de mesure incluses',
    `Toutes les fenêtres sont homologuées <strong>ENERGY STAR</strong> sauf mention contraire`,
  ];
  const notesTemplate = q.notes_template || null;
  let notesItems;
  if (notesTemplate || notes) {
    notesItems = [];
    if (notesTemplate) {
      // notes_template can be a string (one item) or array
      if (Array.isArray(notesTemplate)) {
        notesItems.push(...notesTemplate);
      } else {
        notesItems.push(notesTemplate);
      }
    }
    if (notes && notes !== notesTemplate) {
      notesItems.push(notes);
    }
  } else {
    notesItems = defaultNotes;
  }
  const notesItemsHtml = notesItems.map(n => `<li>${n}</li>`).join('');

  // Acceptance section — P5: wired accept flow, data-accept triggers JS handler injected by /q/[token]
  const acceptHtml = `<section class="accept-section">
    <div class="title">Prêt à confirmer?</div>
    <button type="button" class="btn-accept" data-accept>Accepter ce devis →</button>
    <div class="note">Après acceptation, vous signerez le contrat électroniquement puis recevrez les instructions Interac pour le dépôt.</div>
  </section>`;

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

    /* PROJET BOX */
    .projet-box { background: var(--sage-light); border-left: 3px solid var(--navy); padding: 24px; border-radius: 4px; }
    .projet-box h3 { font-size: 16px; margin-bottom: 8px; }
    .projet-box p { font-size: 13px; color: var(--navy); opacity: 0.85; }

    /* CATEGORY TITLES */
    .category-title { font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 700; color: var(--navy); margin: 32px 0 16px; padding-bottom: 10px; border-bottom: 2px solid var(--navy); display: flex; align-items: baseline; justify-content: space-between; }
    .category-title:first-child { margin-top: 0; }
    .cat-count { font-size: 11px; font-weight: 500; opacity: 0.5; letter-spacing: 0.1em; }

    /* ITEM CARDS */
    .item-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .item-card { background: var(--pure); border: 1px solid var(--border); border-radius: 4px; padding: 20px; display: flex; gap: 18px; position: relative; break-inside: avoid; page-break-inside: avoid; }
    .item-num { position: absolute; top: -10px; left: 16px; background: var(--navy); color: var(--pure); font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 2px; letter-spacing: 0.05em; }
    .item-qty { position: absolute; top: 18px; right: 18px; background: var(--sage); color: var(--navy); font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 2px; }
    .item-sketch { flex-shrink: 0; width: 110px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .item-photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; width: 100%; margin-top: 4px; }
    .item-photos a { display: block; border-radius: 4px; overflow: hidden; border: 1px solid var(--border); }
    .item-photos img { display: block; width: 100%; height: 40px; object-fit: cover; }
    .item-sketch svg { display: block; background: var(--sage-light); border: 1px solid var(--sage-dark); border-radius: 2px; }
    .item-sketch .dims { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--navy); opacity: 0.7; text-align: center; font-weight: 600; white-space: normal; }
    .item-sketch .dims .x { opacity: 0.4; margin: 0 3px; }
    .item-sketch .dims .dim-val { white-space: nowrap; display: inline-block; }
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
    .install-note { font-size: 10px; color: var(--navy); opacity: 0.7; font-style: italic; margin-top: 4px; }
    .forfait-section .install-note { color: var(--pure); }

    /* SOUS-TOTAL ROW */
    .subtotal-box { background: var(--sage-light); border: 1px solid var(--sage-dark); border-radius: 4px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
    .subtotal-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--navy); opacity: 0.6; }
    .subtotal-amount { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 700; color: var(--navy); }
    .install-box { background: var(--ice); border-left: 3px solid var(--sage-dark); padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 8px; border-radius: 2px; }
    .install-label { font-size: 13px; color: var(--navy); opacity: 0.85; }
    .install-amount { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; color: var(--navy); }
    .promo-box { background: #ecfdf5; border: 1.5px solid #10b981; border-radius: 6px; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
    .promo-label { display: flex; flex-direction: column; gap: 2px; }
    .promo-label .tag { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #047857; }
    .promo-label .desc { font-size: 13px; color: #065f46; font-weight: 500; }
    .promo-amount { font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 700; color: #047857; }

    /* PRIX FORFAITAIRE */
    .forfait-section { background: var(--navy); color: var(--pure); padding: 48px 56px; text-align: center; }
    .forfait-section .label { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; letter-spacing: 0.25em; text-transform: uppercase; opacity: 0.6; margin-bottom: 12px; }
    .forfait-section h2 { font-size: 14px; font-weight: 600; opacity: 0.85; margin-bottom: 20px; letter-spacing: 0.02em; }
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

    /* ACCEPT SECTION (P5 — wired accept flow with Interac redirect) */
    .accept-section { padding: 40px 56px; background: #f0fdf4; border-top: 3px solid #22c55e; text-align: center; }
    .accept-section .title { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 16px; color: #166534; }
    .btn-accept { display: inline-block; padding: 18px 48px; font-size: 16px; font-weight: 700; color: white; background: linear-gradient(135deg, #16a34a, #22c55e); border: none; border-radius: 8px; cursor: pointer; font-family: 'Inter', sans-serif; letter-spacing: 0.02em; transition: all 200ms; box-shadow: 0 4px 12px rgba(22,163,74,0.25); }
    .btn-accept:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(22,163,74,0.35); }
    .btn-accept:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .accept-section .note { margin-top: 12px; font-size: 12px; color: #166534; opacity: 0.75; }

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
      .accept-section { padding: 32px 24px; }
      .btn-accept { width: 100%; padding: 18px 24px; }
    }
    /* ── Print-friendly CSS ────────────────────────────────────────────── */
    @media print {
      @page { size: Letter; margin: 12mm; }
      html, body { background: white !important; color: black !important; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { box-shadow: none; max-width: 100%; margin: 0; padding: 0; }
      .watermark { display: none !important; }
      .accept-section { display: none !important; }
      .no-print { display: none !important; }
      /* Keep item cards on the same page as much as possible */
      .item-card { break-inside: avoid; page-break-inside: avoid; }
      .section { break-inside: avoid-page; }
      .section-title { break-after: avoid; }
      /* Forfait + payment blocks shouldn't split */
      .forfait-section, .payment-list, .interac-note { break-inside: avoid; }
      .item-card:hover { border-color: var(--border); }
      /* URLs next to links — helps when the PDF is printed to paper */
      a[href^="http"]:not(.btn-accept):after { content: " (" attr(href) ")"; font-size: 9px; opacity: 0.6; }
    }

    /* Floating print button — hidden on print */
    .print-fab {
      position: fixed; top: 16px; right: 16px; z-index: 10;
      background: var(--navy); color: white; border: none;
      padding: 10px 18px; border-radius: 10px; cursor: pointer;
      font-family: inherit; font-size: 13px; font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: inline-flex; align-items: center; gap: 8px;
    }
    .print-fab:hover { opacity: 0.9; }
    @media print { .print-fab { display: none !important; } }
  </style>
</head>
<body>

<div class="watermark">CONFIDENTIEL — ${clientNameEsc.toUpperCase()}</div>

<button class="print-fab no-print" onclick="window.print()" aria-label="Imprimer ce devis">
  🖨️ Imprimer / PDF
</button>

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

  ${data.project_description ? `
  <!-- OBJET DU PROJET -->
  <section class="section">
    <div class="section-title">Objet du projet</div>
    <div class="projet-box">
      <p>${escHtml(data.project_description)}</p>
    </div>
  </section>` : ''}

  <!-- ITEMS — card grid layout -->
  <section class="section">
    <div class="section-title">Détail des ouvertures</div>
    <div id="items-container">
      ${itemsHtml}
    </div>
    ${priceDisplayMode !== 'total' ? `
    <!-- Sous-total (caché en mode 'total' — client ne voit que le forfait global) -->
    <div class="subtotal-box">
      <span class="subtotal-label">Sous-total fenêtres &amp; portes</span>
      <span class="subtotal-amount">${fmtPrice(sousTotalFenetres)}</span>
    </div>` : ''}
    ${installationCost > 0 ? `
    <div class="install-box">
      <span class="install-label">Installation, finition et moulures extérieures</span>
      <span class="install-amount">${fmtPrice(installationCost)}</span>
    </div>` : ''}
    ${promoOn && promoRebate > 0 ? `
    <div class="promo-box">
      <div class="promo-label">
        <span class="tag">🎁 Promo volume — 9 ouvertures et +</span>
        <span class="desc">Porte d'entrée simple installée offerte</span>
      </div>
      <span class="promo-amount">− ${fmtPrice(promoRebate)}</span>
    </div>` : ''}
    ${clientDiscount > 0 ? `
    <div class="promo-box">
      <div class="promo-label">
        <span class="tag">💰 Escompte client${discountMode === 'percent' ? ` — ${discountRawValue} %` : ''}</span>
        <span class="desc">Rabais accordé sur ce devis</span>
      </div>
      <span class="promo-amount">− ${fmtPrice(clientDiscount)}</span>
    </div>` : ''}
  </section>

  <!-- PRIX FORFAITAIRE -->
  <section class="forfait-section">
    <div class="label">Prix forfaitaire global</div>
    <h2>Matériaux, installation, finition et moulures extérieures</h2>
    <div class="amount">${fmtPrice(total_ttc)}</div>
    <div class="subtitle">Toutes taxes incluses (TPS + TVQ)</div>
    ${priceDisplayMode === 'total' ? `<div class="install-note" style="margin-top:12px;">Installation incluse de niveau et de qualité</div>` : ''}
    <div class="forfait-breakdown">
      <div class="b-cell">
        <span class="v">${fmtPrice(subtotal)}</span>
        <span class="l">Sous-total HT</span>
      </div>
      ${containerOn ? `<div class="b-cell">
        <span class="v">${fmtPrice(containerAmount)}</span>
        <span class="l">Conteneur déchets</span>
      </div>` : ''}
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

  <!-- ACCEPT SECTION (P5 — data-accept button, JS wired by /q/[token] tracking script) -->
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
