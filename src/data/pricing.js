// src/data/pricing.js — Single source of truth for all pricing
export const PRICING = {
  starter: {
    id: 'starter',
    name: { en: 'Starter', fr: 'Starter' },
    tagline: { en: 'For solo operators ready to stop losing calls', fr: 'Pour les opérateurs solo prêts à arrêter de perdre des appels' },
    setup: 2997,
    monthly: 799,
    features: {
      en: [
        { text: 'CRM + Dashboard', included: true },
        { text: 'AI SMS Engine', included: true },
        { text: 'Lead Capture (web + missed calls)', included: true },
        { text: 'AI Voice Agent 24/7', included: false },
        { text: 'Quote/Contract Pipeline', included: false },
        { text: 'Financial Tracking', included: false },
        { text: 'Meta Ads Management', included: false },
        { text: 'Dedicated Account Manager', included: false },
        { text: 'Monthly Strategy Call', included: false },
      ],
      fr: [
        { text: 'CRM + Tableau de bord', included: true },
        { text: 'Moteur SMS IA', included: true },
        { text: 'Capture de leads (web + appels manqués)', included: true },
        { text: 'Agent vocal IA 24/7', included: false },
        { text: 'Pipeline soumission/contrat', included: false },
        { text: 'Suivi financier', included: false },
        { text: 'Gestion publicité Meta', included: false },
        { text: 'Gestionnaire de compte dédié', included: false },
        { text: 'Appel stratégique mensuel', included: false },
      ],
    },
    support: { en: 'Email (48h)', fr: 'Courriel (48h)' },
    onboarding: { en: 'Self-guided', fr: 'Auto-guidé' },
  },
  pro: {
    id: 'pro',
    name: { en: 'Pro', fr: 'Pro' },
    tagline: { en: 'Complete business automation — most popular', fr: 'Automatisation complète — le plus populaire' },
    setup: 4997,
    monthly: 1997,
    popular: true,
    features: {
      en: [
        { text: 'CRM + Dashboard', included: true },
        { text: 'AI SMS Engine', included: true },
        { text: 'Lead Capture (web + missed calls)', included: true },
        { text: 'AI Voice Agent 24/7', included: true },
        { text: 'Quote/Contract Pipeline', included: true },
        { text: 'Financial Tracking', included: true },
        { text: 'Meta Ads Management', included: false },
        { text: 'Dedicated Account Manager', included: false },
        { text: 'Monthly Strategy Call', included: false },
      ],
      fr: [
        { text: 'CRM + Tableau de bord', included: true },
        { text: 'Moteur SMS IA', included: true },
        { text: 'Capture de leads (web + appels manqués)', included: true },
        { text: 'Agent vocal IA 24/7', included: true },
        { text: 'Pipeline soumission/contrat', included: true },
        { text: 'Suivi financier', included: true },
        { text: 'Gestion publicité Meta', included: false },
        { text: 'Gestionnaire de compte dédié', included: false },
        { text: 'Appel stratégique mensuel', included: false },
      ],
    },
    support: { en: 'Email + Chat (4h)', fr: 'Courriel + Chat (4h)' },
    onboarding: { en: '1-week assisted', fr: '1 semaine assisté' },
  },
  elite: {
    id: 'elite',
    name: { en: 'Elite', fr: 'Elite' },
    tagline: { en: 'Full-service — we run your entire lead operation', fr: 'Service complet — on gère toute ton opération' },
    setup: 7500,
    monthly: 3997,
    features: {
      en: [
        { text: 'CRM + Dashboard', included: true },
        { text: 'AI SMS Engine', included: true },
        { text: 'Lead Capture (web + missed calls)', included: true },
        { text: 'AI Voice Agent 24/7', included: true },
        { text: 'Quote/Contract Pipeline', included: true },
        { text: 'Financial Tracking', included: true },
        { text: 'Meta Ads Management', included: true },
        { text: 'Dedicated Account Manager', included: true },
        { text: 'Monthly Strategy Call', included: true },
      ],
      fr: [
        { text: 'CRM + Tableau de bord', included: true },
        { text: 'Moteur SMS IA', included: true },
        { text: 'Capture de leads (web + appels manqués)', included: true },
        { text: 'Agent vocal IA 24/7', included: true },
        { text: 'Pipeline soumission/contrat', included: true },
        { text: 'Suivi financier', included: true },
        { text: 'Gestion publicité Meta', included: true },
        { text: 'Gestionnaire de compte dédié', included: true },
        { text: 'Appel stratégique mensuel', included: true },
      ],
    },
    support: { en: 'Phone + Chat (2h)', fr: 'Téléphone + Chat (2h)' },
    onboarding: { en: 'White-glove 2 weeks', fr: 'Accompagnement complet 2 semaines' },
  },
};

export const TIERS = [PRICING.starter, PRICING.pro, PRICING.elite];

// ROI Calculator defaults
export const ROI_DEFAULTS = {
  missedCallsPerWeek: 15,
  avgJobValue: 350,
  conversionRate: 50,
  captureRate: 70,
};

// Feature comparison for table display
export const COMPARISON_FEATURES = [
  { en: 'CRM + Dashboard', fr: 'CRM + Tableau de bord', starter: true, pro: true, elite: true },
  { en: 'AI SMS Engine', fr: 'Moteur SMS IA', starter: true, pro: true, elite: true },
  { en: 'Lead Capture (web + missed calls)', fr: 'Capture de leads (web + appels manqués)', starter: true, pro: true, elite: true },
  { en: 'AI Voice Agent 24/7', fr: 'Agent vocal IA 24/7', starter: false, pro: true, elite: true },
  { en: 'Quote/Contract Pipeline', fr: 'Pipeline soumission/contrat', starter: false, pro: true, elite: true },
  { en: 'Financial Tracking', fr: 'Suivi financier', starter: false, pro: true, elite: true },
  { en: 'Meta Ads Management', fr: 'Gestion publicité Meta', starter: false, pro: false, elite: true },
  { en: 'Dedicated Account Manager', fr: 'Gestionnaire de compte dédié', starter: false, pro: false, elite: true },
  { en: 'Monthly Strategy Call', fr: 'Appel stratégique mensuel', starter: false, pro: false, elite: true },
  { en: 'Support', fr: 'Support', starter: 'Email (48h)', pro: 'Email + Chat (4h)', elite: 'Phone + Chat (2h)' },
  { en: 'Onboarding', fr: 'Intégration', starter: { en: 'Self-guided', fr: 'Auto-guidé' }, pro: { en: '1-week assisted', fr: '1 semaine assisté' }, elite: { en: 'White-glove 2 weeks', fr: '2 semaines accompagné' } },
];
