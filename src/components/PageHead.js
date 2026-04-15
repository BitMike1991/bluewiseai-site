import Head from "next/head";

const BASE_URL = "https://bluewiseai.com";
const DEFAULT_IMAGE = `${BASE_URL}/og-default.png`;

const SEO = {
  "/": {
    en: {
      title: "BlueWise AI — AI-Powered Business Automation for Contractors",
      description: "Missed calls, quotes, contracts, payments — all handled automatically by AI. We run your business while you do the work.",
    },
    fr: {
      title: "BlueWise AI — Automatisation IA pour entrepreneurs au Québec",
      description: "Appels manqués, soumissions, contrats, paiements — tout géré automatiquement par l'IA. On gère ta business pendant que tu fais ta job.",
    },
  },
  "/lead-rescue": {
    en: {
      title: "Lead Rescue — Never Lose a Lead Again | BlueWise AI",
      description: "AI answers your missed calls in seconds, qualifies leads, and books appointments automatically. Stop losing revenue to voicemail.",
    },
    fr: {
      title: "Lead Rescue — Ne perds plus jamais un lead | BlueWise AI",
      description: "L'IA répond à tes appels manqués en secondes, qualifie les leads et prend des rendez-vous automatiquement. Arrête de perdre des revenus.",
    },
  },
  "/services": {
    en: {
      title: "Services — Voice AI, CRM & Automation | BlueWise AI",
      description: "Voice AI agents, smart CRM, automated quotes & contracts, payment collection — everything a trades business needs to scale.",
    },
    fr: {
      title: "Services — IA vocale, CRM & Automatisation | BlueWise AI",
      description: "Agents vocaux IA, CRM intelligent, soumissions et contrats automatisés, collecte de paiements — tout ce qu'un entrepreneur a besoin pour scaler.",
    },
  },
  "/contact": {
    en: {
      title: "Contact Us — BlueWise AI",
      description: "Ready to automate your business? Get in touch with the BlueWise AI team. We help contractors save time and never miss a lead.",
    },
    fr: {
      title: "Contactez-nous — BlueWise AI",
      description: "Prêt à automatiser ta business? Contacte l'équipe BlueWise AI. On aide les entrepreneurs à sauver du temps et ne plus manquer de leads.",
    },
  },
  "/about": {
    en: {
      title: "About BlueWise AI — Built by Contractors, for Contractors",
      description: "BlueWise AI was built to solve the problems trades businesses face every day. AI-powered tools that actually understand your workflow.",
    },
    fr: {
      title: "À propos de BlueWise AI — Fait par des entrepreneurs, pour des entrepreneurs",
      description: "BlueWise AI a été conçu pour résoudre les vrais problèmes des entreprises de services. Des outils IA qui comprennent ta réalité.",
    },
  },
  "/results": {
    en: {
      title: "Results — Real ROI for Real Businesses | BlueWise AI",
      description: "See how trades businesses are saving hours per week and capturing more leads with BlueWise AI automation.",
    },
    fr: {
      title: "Résultats — Du vrai ROI pour de vraies entreprises | BlueWise AI",
      description: "Vois comment des entreprises de services sauvent des heures par semaine et captent plus de leads avec l'automatisation BlueWise AI.",
    },
  },
  "/artisan": {
    en: {
      title: "Artisan Plan — AI Tools for Solo Contractors | BlueWise AI",
      description: "The essential AI toolkit for independent contractors. Missed call rescue, automated follow-ups, and a simple CRM — starting at $149/mo.",
    },
    fr: {
      title: "Plan Artisan — Outils IA pour travailleurs autonomes | BlueWise AI",
      description: "L'essentiel pour les travailleurs autonomes. Rappels automatiques, suivi de leads et CRM simple — à partir de 149$/mois.",
    },
  },
};

export default function PageHead({ page, locale = "en", image }) {
  const pageSeo = SEO[page] || SEO["/"];
  const seo = pageSeo[locale] || pageSeo.en;
  const ogImage = image || DEFAULT_IMAGE;
  const canonical = locale === "fr" ? `${BASE_URL}/fr${page === "/" ? "" : page}` : `${BASE_URL}${page}`;

  return (
    <Head>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="BlueWise AI" />
      <meta property="og:locale" content={locale === "fr" ? "fr_CA" : "en_CA"} />
      {locale === "fr" && <meta property="og:locale:alternate" content="en_CA" />}
      {locale === "en" && <meta property="og:locale:alternate" content="fr_CA" />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={ogImage} />
    </Head>
  );
}
