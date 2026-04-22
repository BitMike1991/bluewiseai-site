// Universal Contract Generation API — Multi-tenant
// Called by n8n when a quote is accepted → generates full contract HTML
// Fully dynamic via quote_config from the customers table
// Template routing: config.branding.html_template === 'pur' → PÜR specialized template
//                   otherwise → generic blue template (BW / SP)
import crypto from 'crypto';
import { getSupabaseServerClient } from '../../../../lib/supabaseServer';
import { generatePurContractHtml } from '../../../../lib/contract-templates/pur.js';
import { applyCorsHeaders } from '../../../../lib/universal-api-auth';
import { sanitizeProjectDescription } from '../../../../lib/devis/specs.js';

const supabase = getSupabaseServerClient();

// ─── Legal clause library ────────────────────────────────────────────────────
const LEGAL_CLAUSES = {
  clause_standard_qc: {
    title: 'Loi applicable et juridiction',
    text: 'Le présent contrat est régi par les lois de la province de Québec. En cas de litige, les parties s\'engagent d\'abord à tenter une résolution à l\'amiable.'
  },
  clause_cancellation: {
    title: 'Annulation et résiliation',
    text: null // rendered separately as structured HTML (see renderCancellationClause)
  },
  clause_liability: {
    title: 'Limitation de responsabilité',
    text: null // rendered separately (see renderLiabilityClause)
  },
  clause_force_majeure: {
    title: 'Force majeure',
    text: 'L\'entrepreneur ne peut être tenu responsable des retards ou de l\'impossibilité d\'exécuter les travaux en raison de circonstances hors de son contrôle, incluant mais sans s\'y limiter : conditions météorologiques extrêmes, grèves, pénuries de matériaux ou catastrophes naturelles.'
  },
  clause_divisibility: {
    title: 'Divisibilité',
    text: 'Si une clause du présent contrat est jugée invalide ou inapplicable par un tribunal compétent, les autres clauses demeurent pleinement en vigueur.'
  },
  clause_rbq: {
    title: 'Licence RBQ',
    text: 'L\'entrepreneur détient une licence valide délivrée par la Régie du bâtiment du Québec (RBQ). Les travaux sont exécutés conformément aux normes et règlements applicables.'
  },
  clause_photo_marketing: {
    title: 'Documentation photographique',
    text: 'Le client autorise l\'entrepreneur à prendre des photographies et vidéos avant, pendant et après les travaux. Ces images pourront être utilisées à des fins de marketing, de portfolio et de réseaux sociaux, sans identification du client ni de l\'adresse précise. Le client peut retirer cette autorisation par écrit en tout temps.'
  },
  clause_modifications: {
    title: 'Modifications au contrat',
    text: 'Toute modification aux travaux ou aux conditions du présent contrat doit faire l\'objet d\'un avenant écrit signé par les deux parties.'
  },
  clause_integrity: {
    title: 'Intégralité de l\'accord',
    text: 'Le présent contrat, incluant l\'Annexe A, constitue l\'entente complète entre les parties et remplace tout accord verbal ou écrit antérieur.'
  }
};

// ─── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  branding: {
    logo_url: null,
    primary_color: '#1e40af',
    accent_color: '#2563eb',
    business_name: 'BlueWise AI',
    legal_name: 'BlueWise AI',
    phone: '',
    email: '',
    address: '',
    rbq_number: null
  },
  quote: {
    prefix: 'BW',
    valid_days: 30,
    exclusions: ['Tout travail non explicitement décrit dans le présent contrat'],
    warranties: []
  },
  contract: {
    authorized_rep: null,
    interac_email: null,
    legal_clauses: ['clause_standard_qc', 'clause_force_majeure', 'clause_divisibility', 'clause_modifications', 'clause_integrity'],
    client_responsibilities: [
      'Assurer un accès raisonnable, sécuritaire et dégagé à la zone de travail.',
      'Sécuriser les animaux domestiques et les enfants en bas âge pendant les travaux.',
      'Informer l\'entrepreneur de toute condition particulière (allergies, problèmes structurels connus, etc.).',
      'Assurer l\'accès à l\'électricité et à l\'eau courante.',
      'Tout retard causé par le non-respect de ces obligations ne sera pas attribuable à l\'entrepreneur.'
    ]
  },
  payment_schedule: [
    { label: 'Dépôt (50 %)', description: 'À la signature du contrat', percentage: 50 },
    { label: 'Solde final (50 %)', description: 'À la fin des travaux et à la satisfaction du client', percentage: 50 }
  ]
};

function mergeConfig(dbConfig) {
  if (!dbConfig) return DEFAULT_CONFIG;
  return {
    branding: { ...DEFAULT_CONFIG.branding, ...(dbConfig.branding || {}) },
    quote: { ...DEFAULT_CONFIG.quote, ...(dbConfig.quote || {}) },
    contract: { ...DEFAULT_CONFIG.contract, ...(dbConfig.contract || {}) },
    payment_schedule: dbConfig.payment_schedule || DEFAULT_CONFIG.payment_schedule,
    pricing_guide: dbConfig.pricing_guide || {},
    promotions: dbConfig.promotions || []
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
// CSPRNG contract token — matches generateQuoteNumber in universal/devis/index.js.
// 16 hex chars = 64 bits of entropy, making contract number enumeration
// computationally infeasible.
function generateContractNumber(prefix) {
  const p = (prefix || 'BW').toUpperCase();
  return `${p}-C-${crypto.randomBytes(8).toString('hex')}`;
}

function formatMoney(amount) {
  return Number(amount).toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' $';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ─── HTML Generator ───────────────────────────────────────────────────────────
function generateContractHtml(data, config) {
  const {
    contract_number, date, start_date, valid_days,
    client_name, client_phone, client_email, client_address, client_city,
    project_description, line_items, subtotal, tax_gst, tax_qst, total_ttc,
    scope_items,
    gift_items,
    client_acknowledgments
  } = data;

  const b = config.branding;
  const c = config.contract;
  const primaryColor = b.primary_color || '#1e40af';
  const accentColor = b.accent_color || '#2563eb';
  const businessName = b.business_name || 'BlueWise AI';
  const authorizedRep = c.authorized_rep || businessName;
  const interacEmail = c.interac_email || b.email || '';
  const validDays = valid_days || config.quote.valid_days || 30;
  const dateFormatted = formatDate(date);
  const paymentSchedule = config.payment_schedule || DEFAULT_CONFIG.payment_schedule;
  const exclusions = data.exclusions || config.quote.exclusions || DEFAULT_CONFIG.quote.exclusions;
  const clientResponsibilities = data.client_responsibilities || c.client_responsibilities || DEFAULT_CONFIG.contract.client_responsibilities;

  // ── Payment table rows (dynamic, any number of tranches) ──
  const paymentTableRows = paymentSchedule.map(tranche => {
    const pct = Number(tranche.percentage);
    const amount = subtotal * pct / 100;
    return `
    <tr>
      <td>${tranche.label}</td>
      <td>${tranche.description || ''}</td>
      <td class="amt">${formatMoney(amount)}</td>
    </tr>`;
  }).join('');

  // ── First tranche (deposit) for payment condition text ──
  const firstTranche = paymentSchedule[0] || { label: 'Dépôt', percentage: 50 };
  const firstPct = Number(firstTranche.percentage);
  const depositTtc = Number((subtotal * firstPct / 100 * 1.14975).toFixed(2));

  // ── Scope / Annex A ──
  const scopeHtml = (scope_items || []).map((section, i) => `
    <div class="annex-box" ${i > 0 ? 'style="margin-top: 16px;"' : ''}>
      <h3 style="color: #92400e; margin-bottom: 10px;">${i + 1}. ${section.title}</h3>
      <ul style="padding-left: 20px; font-size: 12px;">
        ${(section.items || []).map(item => `<li>${item}</li>`).join('\n        ')}
      </ul>
    </div>`).join('');

  // ── Exclusions ──
  const exclusionHtml = exclusions.map(e => `<li>${e}</li>`).join('\n        ');

  // ── Client responsibilities ──
  const responsibilitiesHtml = clientResponsibilities.map(r => `<li>${r}</li>`).join('\n        ');

  // ── Warranties ──
  const warranties = data.warranty_sections_override || config.quote.warranties || [];
  let warrantyHtml;
  if (typeof warranties === 'string') {
    warrantyHtml = warranties;
  } else if (Array.isArray(warranties) && warranties.length > 0) {
    warrantyHtml = `<ul style="padding-left: 20px; font-size: 12px;">
      ${warranties.map(w => `<li>${typeof w === 'string' ? w : `<strong>${w.item || w.label || w.title} :</strong> ${w.duration || w.text || w.description || ''}`}</li>`).join('\n      ')}
    </ul>`;
  } else {
    warrantyHtml = `<p>${businessName} garantit la qualité de la main-d'œuvre et des matériaux utilisés pour une période conforme aux normes de l'industrie.</p>`;
  }

  // ── Gift items ──
  const giftHtml = (gift_items && gift_items.length > 0) ? `
  <div class="gift-box">
    <h3>Cadeau gracieuseté de ${businessName}</h3>
    <ul style="padding-left: 20px; font-size: 12px;">
      ${gift_items.map(g => `<li>${g.description || g}</li>`).join('\n      ')}
    </ul>
  </div>` : '';

  // ── Acknowledgments ──
  const acknowledgmentsHtml = (client_acknowledgments && client_acknowledgments.length > 0)
    ? `<ul style="padding-left: 20px; font-size: 12px;">\n        ${client_acknowledgments.map(a => `<li>${a}</li>`).join('\n        ')}\n      </ul>`
    : `<p>Le client reconnaît et accepte que les travaux décrits à la section A.1 représentent l'intégralité des travaux couverts par le présent contrat. Tout travail supplémentaire fera l'objet d'un avenant ou d'un nouveau devis.</p>`;

  // ── Logo block ──
  const logoHtml = b.logo_url
    ? `<img src="${b.logo_url}" alt="${businessName}" style="max-height: 50px; max-width: 200px; object-fit: contain;" />`
    : `<div style="width: 60px; height: 60px; border-radius: 10px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 10px; color: white; text-align: center; padding: 4px;">${businessName.substring(0,2).toUpperCase()}</div>`;

  // ── RBQ block ──
  const rbqHtml = b.rbq_number
    ? `<p style="font-size: 11px; opacity: 0.85; margin-top: 4px;">Licence RBQ : ${b.rbq_number}</p>`
    : '';

  // ── Legal clauses from library ──
  const activeClauses = (c.legal_clauses || DEFAULT_CONFIG.contract.legal_clauses).filter(
    key => LEGAL_CLAUSES[key] && key !== 'clause_cancellation' && key !== 'clause_liability' && key !== 'clause_photo_marketing'
  );

  const legalClausesHtml = activeClauses.map((key, i) => {
    const clause = LEGAL_CLAUSES[key];
    return `
      <h3>${i + 1 + 3}. ${clause.title}</h3>
      <p>${clause.text}</p>`;
  }).join('');

  // ── Photo/marketing clause ──
  const hasPhotoClause = (c.legal_clauses || []).includes('clause_photo_marketing');
  const photoSectionHtml = hasPhotoClause ? `
  <div class="section">
    <h2>8. Documentation photographique et marketing</h2>
    <div class="terms">
      <p>${LEGAL_CLAUSES.clause_photo_marketing.text.replace(/l'entrepreneur/g, businessName)}</p>
    </div>
  </div>` : '';

  // ── Cancellation clause ──
  const hasCancellation = (c.legal_clauses || ['clause_cancellation']).includes('clause_cancellation');
  const cancellationSectionNum = hasPhotoClause ? 9 : 8;
  const cancellationHtml = hasCancellation ? `
  <div class="section">
    <h2>${cancellationSectionNum}. Annulation et résiliation</h2>
    <div class="terms">
      <h3>${cancellationSectionNum}.1 Annulation par le client</h3>
      <ul>
        <li>Annulation avant la commande des matériaux : remboursement du dépôt moins 10 % de frais administratifs.</li>
        <li>Annulation après la commande des matériaux : dépôt non remboursable.</li>
        <li>Annulation après le début des travaux : le client est responsable du paiement des travaux complétés et des matériaux utilisés.</li>
      </ul>
      <h3>${cancellationSectionNum}.2 Résiliation par ${businessName}</h3>
      <p>${businessName} peut résilier le contrat dans les cas suivants :</p>
      <ul>
        <li>Non-paiement selon l'échéancier convenu après un avis écrit de 5 jours.</li>
        <li>Conditions de travail dangereuses ou insalubres sur le site.</li>
        <li>Impossibilité d'accéder au site malgré les demandes répétées.</li>
      </ul>
      <p>En cas de résiliation, les travaux complétés et les matériaux utilisés demeurent payables.</p>
    </div>
  </div>` : '';

  // ── Liability clause ──
  const hasLiability = (c.legal_clauses || ['clause_liability']).includes('clause_liability');
  const liabilitySectionNum = cancellationSectionNum + (hasCancellation ? 1 : 0);
  const liabilityHtml = hasLiability ? `
  <div class="section">
    <h2>${liabilitySectionNum}. Limitation de responsabilité</h2>
    <div class="terms">
      <ul>
        <li>La responsabilité totale de ${businessName}, toutes causes confondues, est limitée au montant total du présent contrat (${formatMoney(subtotal)} avant taxes).</li>
        <li>${businessName} n'est pas responsable des dommages indirects, consécutifs ou accessoires, incluant mais sans s'y limiter : perte d'usage, frais d'hébergement, frais de restauration, perte de revenus ou inconvénients.</li>
        <li>${businessName} n'est pas responsable des retards causés par : l'humidité ambiante, les délais de livraison des fournisseurs, les conditions météorologiques, ou le manque d'accès au site.</li>
      </ul>
    </div>
  </div>` : '';

  // Dispositions générales section number
  const dispositionsSectionNum = liabilitySectionNum + (hasLiability ? 1 : 0);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrat ${businessName} - ${contract_number}</title>
  <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
  <style>
    .sig-handwritten {
      font-family: 'Dancing Script', cursive;
      font-size: 26px; font-weight: 400; color: #1a1a1a;
      line-height: 1.2; letter-spacing: -1.2px;
      transform: rotate(-2.5deg) skewX(-3deg);
      display: inline-block; opacity: 0.88;
      -webkit-text-stroke: 0.2px rgba(0,0,0,0.3);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      color: #1f2937; line-height: 1.7; font-size: 13px;
      padding: 0; margin: 0; background: #fff;
    }
    .page { max-width: 800px; margin: 0 auto; padding: 40px 50px; }
    .header {
      background: #ffffff; border-bottom: 4px solid ${primaryColor};
      color: ${accentColor}; padding: 35px 50px; margin-bottom: 0;
    }
    .header h1 { font-size: 32px; font-weight: 700; letter-spacing: 1px; margin-bottom: 4px; }
    .header .subtitle { font-size: 14px; opacity: 0.9; font-weight: 400; }
    .contract-bar {
      background: #f0f4ff; border-left: 4px solid ${accentColor};
      padding: 14px 20px; margin: 25px 0;
      display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;
    }
    .contract-bar p { margin: 2px 0; font-size: 13px; }
    .section { margin-bottom: 22px; page-break-inside: avoid; }
    .section h2 {
      color: ${primaryColor}; font-size: 14px; text-transform: uppercase;
      letter-spacing: 0.8px; border-bottom: 2px solid #e5e7eb;
      padding-bottom: 6px; margin-bottom: 12px; font-weight: 700;
    }
    .section h3 { font-size: 13px; font-weight: 700; color: #1f2937; margin: 14px 0 6px 0; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
    .info-box {
      background: #f9fafb; padding: 16px; border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    .info-box .label {
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;
      color: #6b7280; font-weight: 700; margin-bottom: 8px;
    }
    .info-box p { margin: 3px 0; font-size: 13px; }
    .pay-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    .pay-table th, .pay-table td {
      padding: 10px 14px; text-align: left;
      border-bottom: 1px solid #e5e7eb; font-size: 13px;
    }
    .pay-table th { background: #f9fafb; font-weight: 700; color: #374151; }
    .pay-table .amt { text-align: right; font-weight: 600; }
    .pay-table .tax-row td { font-size: 12px; color: #6b7280; }
    .pay-table .total-row { background: ${primaryColor}; color: white; }
    .pay-table .total-row td { font-weight: 700; font-size: 14px; border: none; }
    .warranty-box {
      background: #ecfdf5; border: 1px solid #10b981;
      padding: 16px; border-radius: 6px; margin: 10px 0;
    }
    .warranty-box h3 { color: #047857; margin: 0 0 8px 0; }
    .warranty-box p, .warranty-box li { font-size: 12px; margin-bottom: 4px; }
    .annex-box {
      background: #fefce8; border: 1px solid #eab308;
      padding: 16px; border-radius: 6px; margin: 10px 0;
    }
    .gift-box {
      background: #f0fdf4; border: 2px solid #22c55e;
      padding: 16px; border-radius: 6px; margin: 16px 0;
    }
    .gift-box h3 { color: #15803d; margin-bottom: 10px; }
    .gift-box p, .gift-box li { font-size: 12px; margin-bottom: 4px; }
    .terms p, .terms li { font-size: 12px; color: #374151; margin-bottom: 6px; }
    .terms ul { padding-left: 20px; }
    .terms li { margin-bottom: 4px; }
    .sig-section { margin-top: 35px; padding-top: 25px; border-top: 2px solid #e5e7eb; }
    .accept-box {
      background: #fef3c7; border: 1px solid #f59e0b;
      padding: 16px; border-radius: 6px; margin: 16px 0;
    }
    .accept-box li { font-size: 12px; margin-bottom: 4px; }
    .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-top: 25px; }
    .sig-block .sig-line { border-bottom: 1px solid #1f2937; height: 45px; margin-bottom: 4px; }
    .sig-block .sig-label { font-size: 11px; color: #6b7280; }
    .sig-block p { margin: 3px 0; }
    .footer {
      margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb;
      font-size: 10px; color: #9ca3af; text-align: center;
    }
    .footer p { margin: 2px 0; }
    .page-break { page-break-before: always; margin-top: 40px; padding-top: 20px; }
    @media (max-width: 640px) {
      .page { padding: 16px; }
      .header { padding: 20px 16px; flex-direction: column; text-align: center; gap: 10px; }
      .header h1 { font-size: 18px; }
      .header img { width: 48px; height: 48px; }
      .contract-bar { flex-direction: column; padding: 12px 16px; gap: 4px; }
      .two-col { grid-template-columns: 1fr; gap: 12px; }
      .info-box { padding: 12px; }
      .pay-table { font-size: 11px; }
      .pay-table th, .pay-table td { padding: 8px 4px; }
      .pay-table .total-row td { font-size: 12px; }
      .terms p, .terms li { font-size: 11px; }
      .annex-box, .warranty-box, .exclusion-box, .accept-box, .gift-box { padding: 12px; }
      .sig-grid { grid-template-columns: 1fr; gap: 24px; }
      .sig-section { padding-top: 16px; }
      .signature-section { padding: 20px 16px; }
      .sig-canvas-wrap canvas { height: 120px; }
      .sig-form-row { flex-direction: column; gap: 8px; }
      .sig-actions { flex-direction: column; }
      .sig-actions button { width: 100%; }
      .footer { font-size: 9px; }
      .footer p { word-break: break-word; }
      .page-break { margin-top: 20px; padding-top: 10px; }
    }
    @media print {
      body { padding: 0; }
      .page { max-width: 100%; padding: 20px 40px; }
      .header { padding: 25px 40px; }
      .signature-section { display: none !important; }
    }
    .signature-section {
      max-width: 800px; margin: 30px auto; padding: 30px 50px;
      background: #f8fafc; border-top: 3px solid ${accentColor};
    }
    .signature-section h2 {
      color: ${primaryColor}; font-size: 18px; font-weight: 700; margin-bottom: 20px;
    }
    .sig-canvas-wrap {
      border: 2px dashed #cbd5e1; border-radius: 8px; background: #fff;
      margin-bottom: 16px; position: relative;
    }
    .sig-canvas-wrap canvas { display: block; width: 100%; border-radius: 6px; }
    .sig-canvas-wrap .placeholder {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      color: #94a3b8; font-size: 14px; pointer-events: none;
    }
    .sig-form-row { display: flex; gap: 16px; margin-bottom: 12px; }
    .sig-form-row input {
      flex: 1; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px;
      font-size: 14px; font-family: inherit;
    }
    .sig-form-row input:focus { outline: none; border-color: ${accentColor}; box-shadow: 0 0 0 2px rgba(37,99,235,0.15); }
    .sig-checkbox { display: flex; align-items: flex-start; gap: 10px; margin: 16px 0; }
    .sig-checkbox input[type="checkbox"] { margin-top: 3px; width: 18px; height: 18px; accent-color: ${accentColor}; }
    .sig-checkbox label { font-size: 13px; color: #374151; line-height: 1.5; }
    .sig-actions { display: flex; gap: 12px; margin-top: 16px; }
    .sig-actions button {
      padding: 12px 28px; border: none; border-radius: 6px; font-size: 14px;
      font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .btn-clear { background: #f1f5f9; color: #475569; }
    .btn-clear:hover { background: #e2e8f0; }
    .btn-sign {
      background: linear-gradient(135deg, ${primaryColor}, ${accentColor}); color: white; flex: 1;
    }
    .btn-sign:hover { opacity: 0.9; }
    .btn-sign:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-download { background: #059669; color: white; flex: 1; display: none; }
    .btn-download:hover { background: #047857; }
    .sig-status {
      margin-top: 16px; padding: 16px; border-radius: 8px;
      font-size: 14px; display: none;
    }
    .sig-status.success { display: block; background: #ecfdf5; border: 1px solid #10b981; color: #047857; }
    .sig-status.error { display: block; background: #fef2f2; border: 1px solid #ef4444; color: #dc2626; }
    .sig-status.loading { display: block; background: #eff6ff; border: 1px solid #3b82f6; color: #1d4ed8; }
    .sig-embedded-img { max-height: 40px; margin-bottom: 4px; }
    .sig-timestamp { font-size: 10px; color: #6b7280; font-style: italic; }
  </style>
</head>
<body>

<div class="page">

  <div class="header" style="display: flex; align-items: center; gap: 20px;">
    ${logoHtml}
    <div>
      <h1>${businessName.toUpperCase()}</h1>
      <div class="subtitle">Contrat de service résidentiel — Conditions générales</div>
      ${rbqHtml}
    </div>
  </div>

  <div class="contract-bar">
    <div>
      <p><strong>Contrat nº :</strong> ${contract_number}</p>
      <p><strong>Date d'émission :</strong> ${dateFormatted}</p>
    </div>
    <div>
      ${start_date ? `<p><strong>Début des travaux :</strong> ${formatDate(start_date)}</p>` : ''}
      <p><strong>Validité :</strong> ${validDays} jours</p>
      <p><strong>Type :</strong> Résidentiel — Province de Québec</p>
    </div>
  </div>

  <div class="section">
    <h2>1. Parties au contrat</h2>
    <div class="two-col">
      <div class="info-box">
        <div class="label">Entrepreneur</div>
        <p><strong>${businessName}</strong></p>
        ${b.address ? `<p>${b.address}</p>` : ''}
        ${b.phone ? `<p>Tél. : ${b.phone}</p>` : ''}
        ${b.email ? `<p>${b.email}</p>` : ''}
        ${b.rbq_number ? `<p>RBQ : ${b.rbq_number}</p>` : ''}
      </div>
      <div class="info-box">
        <div class="label">Client</div>
        <p><strong>${client_name}</strong></p>
        ${client_address ? `<p>${client_address}</p>` : ''}
        ${client_city ? `<p>${client_city}</p>` : ''}
        ${client_phone ? `<p>Tél. : ${client_phone}</p>` : ''}
        ${client_email ? `<p>${client_email}</p>` : ''}
      </div>
    </div>
  </div>

  <div class="section">
    <h2>2. Description générale des travaux</h2>
    <div class="info-box">
      <p><strong>Projet :</strong> ${project_description || 'Voir Annexe A'}</p>
      ${client_address ? `<p><strong>Adresse des travaux :</strong> ${client_address}${client_city ? ', ' + client_city : ''}</p>` : ''}
      <p style="margin-top: 8px;">Les travaux sont décrits en détail à l'<strong>Annexe A — Étendue des travaux</strong>, laquelle fait partie intégrante du présent contrat. Seuls les travaux explicitement décrits à l'Annexe A sont inclus.</p>
    </div>
  </div>

  <div class="section">
    <h2>3. Conditions financières</h2>

    <table class="pay-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Échéance</th>
          <th class="amt">Montant</th>
        </tr>
      </thead>
      <tbody>
        ${paymentTableRows}
        <tr style="border-top: 2px solid #e5e7eb;">
          <td colspan="2"><strong>Sous-total avant taxes</strong></td>
          <td class="amt"><strong>${formatMoney(subtotal)}</strong></td>
        </tr>
        <tr class="tax-row">
          <td colspan="2">TPS (5 %)</td>
          <td class="amt">${formatMoney(tax_gst)}</td>
        </tr>
        <tr class="tax-row">
          <td colspan="2">TVQ (9,975 %)</td>
          <td class="amt">${formatMoney(tax_qst)}</td>
        </tr>
        <tr class="total-row">
          <td colspan="2">TOTAL</td>
          <td class="amt">${formatMoney(total_ttc)} CAD</td>
        </tr>
      </tbody>
    </table>

    <p style="font-size: 11px; color: #6b7280; margin-top: 8px;">
      Les taxes (TPS et TVQ) s'appliquent proportionnellement à chaque paiement.
      Le dépôt (${firstPct} %) inclut donc les taxes applicables sur sa portion (<strong>${formatMoney(depositTtc)} TTC</strong>).
      ${interacEmail ? `Paiement accepté <strong>par virement Interac uniquement</strong> à ${interacEmail}.` : ''}
    </p>

    <h3>3.1 Conditions de paiement</h3>
    <div class="terms">
      <ul>
        <li><strong>Aucun travail ne débute</strong> avant la réception du contrat signé et du dépôt de réservation (${firstPct} %).</li>
        <li>Le dépôt de réservation confirme la date de début des travaux et devient non remboursable une fois que les matériaux ont été commandés.</li>
        <li>Tout retard de paiement de plus de 15 jours entraîne des frais d'intérêt au taux annuel de 2 %, calculés mensuellement sur le solde impayé.</li>
        <li>${businessName} se réserve le droit de suspendre les travaux en cas de non-paiement selon l'échéancier convenu.</li>
      </ul>
    </div>
  </div>

  <div class="section">
    <h2>4. Garantie</h2>
    <div class="warranty-box">
      ${warrantyHtml}
    </div>
  </div>

  <div class="section">
    <h2>5. Responsabilités du client</h2>
    <div class="terms">
      <ul>
        ${responsibilitiesHtml}
      </ul>
    </div>
  </div>

  ${cancellationHtml}

  ${liabilityHtml}

  ${photoSectionHtml}

  <div class="section">
    <h2>${dispositionsSectionNum + (hasPhotoClause ? 1 : 0)}. Dispositions générales</h2>
    <div class="terms">
      ${legalClausesHtml}
      <h3>Modifications au contrat</h3>
      <p>Toute modification aux travaux ou aux conditions du présent contrat doit faire l'objet d'un avenant écrit signé par les deux parties.</p>
      <h3>Intégralité de l'accord</h3>
      <p>Le présent contrat, incluant l'Annexe A, constitue l'entente complète entre les parties.</p>
    </div>
  </div>

  ${giftHtml}

  <div class="section sig-section">
    <h2>Acceptation du contrat</h2>
    <div class="accept-box">
      <p><strong>En signant le présent contrat, le client confirme :</strong></p>
      <ul>
        <li>Avoir lu et compris l'ensemble des termes et conditions, incluant l'Annexe A.</li>
        <li>Accepter les conditions de paiement spécifiées à la section 3.</li>
        <li>Accepter les termes et limitations de la garantie à la section 4.</li>
        <li>Autoriser ${businessName} à effectuer les travaux décrits à l'Annexe A.</li>
        <li>Reconnaître que les exclusions à l'Annexe A ont été clairement communiquées.</li>
      </ul>
    </div>

    <div class="sig-grid">
      <div class="sig-block">
        <p><strong>Le Client :</strong></p>
        <div class="sig-line" id="sig-client-main"></div>
        <p class="sig-label">Signature</p>
        <p style="margin-top: 14px;"><strong>${client_name}</strong></p>
        <p class="sig-label">Nom en lettres moulées</p>
        <div class="sig-line" id="sig-date-main" style="margin-top: 14px;"></div>
        <p class="sig-label">Date</p>
      </div>
      <div class="sig-block">
        <p><strong>Pour ${businessName} :</strong></p>
        <div style="border-bottom: 1px solid #1f2937; padding: 4px 0 2px 0; margin-bottom: 4px;">
          <span class="sig-handwritten">${authorizedRep}</span>
        </div>
        <p class="sig-label">Signature</p>
        <p style="margin-top: 14px;"><strong>${authorizedRep}</strong></p>
        <p class="sig-label">Représentant autorisé</p>
        <div style="border-bottom: 1px solid #1f2937; padding: 8px 0 2px 0; margin-top: 14px; margin-bottom: 4px;">
          <span class="sig-timestamp">${dateFormatted}</span>
        </div>
        <p class="sig-label">Date</p>
      </div>
    </div>
  </div>

  <!-- ANNEXE A -->
  <div class="page-break">
    <div class="header" style="margin-bottom: 0; display: flex; align-items: center; gap: 20px;">
      ${logoHtml}
      <div>
        <h1>ANNEXE A</h1>
        <div class="subtitle">Étendue détaillée des travaux — Contrat nº ${contract_number}</div>
      </div>
    </div>
  </div>

  <div class="contract-bar" style="margin-top: 25px;">
    <div>
      <p><strong>Client :</strong> ${client_name}</p>
      ${client_address ? `<p><strong>Adresse des travaux :</strong> ${client_address}${client_city ? ', ' + client_city : ''}</p>` : ''}
    </div>
    <div>
      <p><strong>Contrat nº :</strong> ${contract_number}</p>
      <p><strong>Date :</strong> ${dateFormatted}</p>
    </div>
  </div>

  <div class="section" style="margin-top: 20px;">
    <h2>A.1 Travaux inclus</h2>
    ${scopeHtml || `
    <div class="annex-box">
      <p>Les travaux inclus correspondent aux items décrits dans le devis accepté par le client. Voir les détails dans la section 2 du présent contrat.</p>
    </div>`}
  </div>

  <div class="section">
    <h2>A.2 Travaux exclus</h2>
    <div class="info-box" style="background: #fef2f2; border-color: #ef4444;">
      <p style="font-size: 12px; margin-bottom: 8px;"><strong>Les travaux suivants ne sont PAS inclus dans le présent contrat :</strong></p>
      <ul style="padding-left: 20px; font-size: 12px;">
        ${exclusionHtml}
      </ul>
    </div>
  </div>

  <div class="section">
    <h2>A.3 Reconnaissance du client</h2>
    <div class="terms">
      ${acknowledgmentsHtml}
    </div>
  </div>

  <div class="section" style="margin-top: 25px;">
    <p style="font-size: 12px;"><strong>La présente Annexe A fait partie intégrante du Contrat nº ${contract_number} et a la même force obligatoire.</strong></p>

    <div class="sig-grid" style="margin-top: 30px;">
      <div class="sig-block">
        <p><strong>Le Client :</strong></p>
        <div class="sig-line" id="sig-client-annex"></div>
        <p class="sig-label">Signature — Date</p>
      </div>
      <div class="sig-block">
        <p><strong>Pour ${businessName} :</strong></p>
        <p style="margin-top: 4px;"><strong>${authorizedRep}</strong></p>
        <div style="border-bottom: 1px solid #1f2937; padding: 4px 0 2px 0; margin-bottom: 4px;">
          <span class="sig-handwritten">${authorizedRep}</span>
          <span style="margin-left: 16px;" class="sig-timestamp">${dateFormatted}</span>
        </div>
        <p class="sig-label">Signature — Date</p>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>${businessName}${b.address ? ' | ' + b.address : ''}${b.phone ? ' | ' + b.phone : ''}${b.email ? ' | ' + b.email : ''}</p>
    <p>Contrat généré le ${dateFormatted}. Ce document est valide avec signature manuscrite ou électronique.</p>
  </div>

</div>

<!-- SIGNATURE SECTION -->
<div class="signature-section" id="signatureSection">
  <h2>Signature électronique du contrat</h2>
  <p style="font-size: 13px; color: #475569; margin-bottom: 20px;">
    Veuillez dessiner votre signature ci-dessous, entrer votre nom complet et accepter les termes du contrat.
  </p>

  <div class="sig-canvas-wrap">
    <canvas id="signatureCanvas" width="700" height="160"></canvas>
    <div class="placeholder" id="canvasPlaceholder">Dessinez votre signature ici</div>
  </div>

  <div class="sig-form-row">
    <input type="text" id="signerName" placeholder="Nom complet *" value="${client_name}" />
    <input type="email" id="signerEmail" placeholder="Courriel (optionnel)" value="${client_email || ''}" />
  </div>

  <div class="sig-checkbox">
    <input type="checkbox" id="acceptTerms" />
    <label for="acceptTerms">
      J'ai lu et j'accepte l'ensemble des termes et conditions du contrat nº ${contract_number}, incluant l'Annexe A — Étendue des travaux. Je reconnais que cette signature électronique a la même valeur juridique qu'une signature manuscrite.
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
  var CONTRACT_NUMBER = '${contract_number}';
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
    penColor: '#1e40af',
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

    if (!name) { showStatus('error', 'Veuillez entrer votre nom complet.'); return; }
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
          signed_html: signedHtml
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

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (applyCorsHeaders(req, res, { methods: ['POST', 'OPTIONS'] })) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const {
      quote_id,
      customer_id,
      // Direct data fields
      client_name, client_phone, client_email, client_address, client_city,
      project_description, line_items, subtotal, start_date,
      warranty_sections_override, exclusions, client_responsibilities,
      scope_items, gift_items, client_acknowledgments,
      // Auth
      api_key
    } = body;

    // ── Auth ──
    if (!process.env.UNIVERSAL_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const validKeys = [process.env.UNIVERSAL_API_KEY.trim()];
    const isUniversalAuth = validKeys.includes(api_key?.trim());

    if (!isUniversalAuth && !api_key) {
      return res.status(401).json({ error: 'Unauthorized: api_key required' });
    }

    // ── Resolve customer_id from quote_id if not provided ──
    let resolvedCustomerId = customer_id ? Number(customer_id) : null;
    let quoteRow = null;

    if (quote_id) {
      const { data: qData, error: qErr } = await supabase
        .from('quotes')
        .select('*, jobs!inner(id, client_name, client_phone, client_email, client_address, project_description, address, customer_id)')
        .eq('id', quote_id)
        .maybeSingle();

      if (qErr || !qData) {
        return res.status(404).json({ error: 'Quote not found', details: qErr?.message });
      }

      quoteRow = qData;
      resolvedCustomerId = resolvedCustomerId || qData.jobs?.customer_id || qData.customer_id;
    }

    if (!resolvedCustomerId) {
      return res.status(400).json({ error: 'customer_id is required (or quote_id with embedded customer_id)' });
    }

    // ── Fetch customer quote_config ──
    const { data: customerData, error: custErr } = await supabase
      .from('customers')
      .select('quote_config, contract_api_key, domain')
      .eq('id', resolvedCustomerId)
      .maybeSingle();

    if (custErr || !customerData) {
      return res.status(404).json({ error: 'Customer not found', details: custErr?.message });
    }

    // Per-customer key check (if not universal auth)
    if (!isUniversalAuth) {
      if (!customerData.contract_api_key || api_key !== customerData.contract_api_key) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const config = mergeConfig(customerData.quote_config);

    // ── Build contract data ──
    let contractData;

    if (quoteRow) {
      const job = quoteRow.jobs;
      const items = typeof quoteRow.line_items === 'string'
        ? JSON.parse(quoteRow.line_items)
        : (quoteRow.line_items || []);

      const sub = Number(quoteRow.subtotal);
      const tGst = Number(quoteRow.tax_gst || (sub * 0.05).toFixed(2));
      const tQst = Number(quoteRow.tax_qst || (sub * 0.09975).toFixed(2));
      const total = Number(quoteRow.total_ttc || (sub + tGst + tQst).toFixed(2));

      contractData = {
        job_db_id: job?.id || null,
        // Surface the human project_ref (PUR-0042) so the contract header
        // can show it alongside the contract_number.
        project_ref: quoteRow.project_ref || null,
        // Global project notes from the devis (Mikael 2026-04-22 — "jeremy
        // peut mettre des note global sur le projet"). Rendered as a
        // dedicated "Notes du projet" block on the contract.
        project_notes: quoteRow.notes || null,
        client_name: job?.client_name || quoteRow.client_name || '',
        client_phone: job?.client_phone || '',
        client_email: job?.client_email || '',
        client_address: job?.address || job?.client_address || '',
        client_city: null,
        project_description: sanitizeProjectDescription(job?.project_description),
        line_items: items,
        meta: quoteRow.meta || {},  // carries complexity_pct, discount_*, etc.
        subtotal: sub,
        tax_gst: tGst,
        tax_qst: tQst,
        total_ttc: total,
        warranty_sections_override: warranty_sections_override || null,
        exclusions: exclusions || null,
        client_responsibilities: client_responsibilities || null,
        scope_items: scope_items || items.map(item => ({
          title: item.description || item.label || 'Item',
          items: [`${item.description || item.label || ''}${item.qty ? ` (${item.qty})` : ''}`]
        })),
        gift_items: gift_items || null,
        client_acknowledgments: client_acknowledgments || null,
        start_date: start_date || null
      };
    } else {
      // Direct data
      if (!client_name || subtotal == null) {
        return res.status(400).json({ error: 'Required: client_name, subtotal (or provide quote_id)' });
      }

      const sub = Number(subtotal);
      const tGst = Number((sub * 0.05).toFixed(2));
      const tQst = Number((sub * 0.09975).toFixed(2));
      const total = Number((sub + tGst + tQst).toFixed(2));

      contractData = {
        job_db_id: null,
        client_name, client_phone, client_email, client_address, client_city,
        project_description, line_items,
        subtotal: sub, tax_gst: tGst, tax_qst: tQst, total_ttc: total,
        warranty_sections_override: warranty_sections_override || null,
        exclusions: exclusions || null,
        client_responsibilities: client_responsibilities || null,
        scope_items: scope_items || null,
        gift_items: gift_items || null,
        client_acknowledgments: client_acknowledgments || null,
        start_date: start_date || null
      };
    }

    // ── Generate contract number using customer prefix ──
    const prefix = config.quote?.prefix || 'BW';
    const contract_number = generateContractNumber(prefix);
    const date = new Date().toISOString().split('T')[0];

    // ── Generate HTML — route to PÜR template for customer_id 9 ──
    const isPur = config.branding?.html_template === 'pur';
    const html = isPur
      ? generatePurContractHtml({ contract_number, date, ...contractData }, config)
      : generateContractHtml({ contract_number, date, ...contractData }, config);

    const filename = `${prefix}-contrat-${contract_number.split('-C-')[1] || contract_number}.html`;

    // ── Persist to DB ──
    const jobDbId = contractData.job_db_id || null;

    if (jobDbId) {
      const { error: insertErr } = await supabase
        .from('contracts')
        .insert({
          job_id: jobDbId,
          customer_id: resolvedCustomerId,
          signature_status: 'pending',
          signature_request_id: contract_number,
          storage_path: filename,
          storage_bucket: 'contracts',
          html_content: html
        });

      if (insertErr) {
        console.error('Contract insert error:', insertErr);
        // Non-fatal: still return the HTML
      }

      // CRITICAL: do NOT overwrite jobs.job_id here. The contract number lives
      // in contracts.contract_number (or .storage_path). Before 2026-04-19 this
      // update clobbered the human-readable job_id (e.g. PUR-733022) with the
      // contract number (e.g. PUR-C-XXXXXX), destroying the link in every CRM
      // view. Leave job_id alone; only flip the status.
      const { error: updateErr } = await supabase
        .from('jobs')
        .update({ status: 'contract_sent', updated_at: new Date().toISOString() })
        .eq('id', jobDbId);

      if (updateErr) {
        console.error('Job update error:', updateErr);
      }
    }

    // Get customer domain for URL
    const custDomain = customerData.domain || 'bluewiseai.com';

    return res.status(200).json({
      success: true,
      contract_number,
      filename,
      html,
      total_ttc: contractData.total_ttc,
      customer_id: resolvedCustomerId,
      url: `https://${custDomain}/${filename}`
    });

  } catch (error) {
    console.error('Universal contract create error:', error);
    return res.status(500).json({
      error: 'Erreur lors de la création du contrat',
      details: error.message
    });
  }
}
