/**
 * Shared quote configuration helpers — used by:
 *   - pages/api/universal/devis/index.js (quote creation)
 *   - pages/api/universal/devis/render.js (HTML regeneration for /q/[token])
 */

export const DEFAULT_QUOTE_CONFIG = {
  branding: {
    logo_url: null,
    primary_color: '#1e40af',
    accent_color: '#2563eb',
    business_name: 'BlueWise AI',
    legal_name: 'BlueWise AI',
    phone: '',
    email: '',
    address: '',
    rbq_number: null,
    html_template: null
  },
  quote: {
    prefix: 'BW',
    valid_days: 30,
    exclusions: ['Tout travail non explicitement décrit dans le présent devis'],
    warranties: [],
    notes_template: null
  },
  payment_schedule: [
    { label: '50 % — Dépôt', description: 'À la signature du devis', percentage: 50 },
    { label: '50 % — Solde final', description: 'À la fin des travaux', percentage: 50 }
  ],
  promotions: []
};

export function mergeConfig(dbConfig) {
  if (!dbConfig) return DEFAULT_QUOTE_CONFIG;
  return {
    branding: { ...DEFAULT_QUOTE_CONFIG.branding, ...(dbConfig.branding || {}) },
    quote: { ...DEFAULT_QUOTE_CONFIG.quote, ...(dbConfig.quote || {}) },
    contract: dbConfig.contract || {},
    pricing_guide: dbConfig.pricing_guide || {},
    payment_schedule: dbConfig.payment_schedule || DEFAULT_QUOTE_CONFIG.payment_schedule,
    promotions: dbConfig.promotions || []
  };
}
