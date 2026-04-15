import PageHead from "../src/components/PageHead";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  Zap,
  ArrowRight,
  Check,
  X,
} from "lucide-react";
import { GlowCard } from "@/components/ui/GlowCard";
import { ShimmerButton } from "@/components/ui/ShimmerButton";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { NumberTicker } from "@/components/ui/NumberTicker";
import { getLocale, localePath } from "@/lib/locale";

const T = {
  title: { en: "Results", fr: "Résultats", es: "Resultados" },
  subtitle: {
    en: "Real numbers from real businesses. No vanity metrics — just revenue recovered and operations automated.",
    fr: "Des vrais chiffres de vraies businesses. Pas de métriques de vanité — juste des revenus récupérés et des opérations automatisées.",
    es: "Números reales de negocios reales. Sin métricas de vanidad — solo ingresos recuperados y operaciones automatizadas.",
  },
  caseStudy: { en: "Case Study", fr: "Étude de cas", es: "Caso de éxito" },
  before: { en: "Before BlueWise", fr: "Avant BlueWise", es: "Antes de BlueWise" },
  after: { en: "After BlueWise", fr: "Après BlueWise", es: "Después de BlueWise" },
  whatWeBuilt: { en: "What We Built", fr: "Ce qu'on a bâti", es: "Lo que construimos" },
  pipeline30: { en: "Pipeline in 30 days", fr: "Pipeline en 30 jours", es: "Pipeline en 30 días" },
  missedLeads: { en: "Missed leads", fr: "Leads manqués", es: "Leads perdidos" },
  autoQuotes: { en: "Auto quotes", fr: "Soumissions auto", es: "Cotizaciones auto" },
  aiReceptionist: { en: "AI receptionist", fr: "Réceptionniste IA", es: "Recepcionista IA" },
  missedRate: { en: "Missed call rate", fr: "Taux d'appels manqués", es: "Tasa de llamadas perdidas" },
  firstCallback: { en: "First callback", fr: "Premier rappel", es: "Primer callback" },
  manualFollowups: { en: "Manual follow-ups", fr: "Suivis manuels", es: "Seguimientos manuales" },
  ctaTitle: { en: "Want results like these?", fr: "Tu veux des résultats comme ça ?", es: "¿Quieres resultados como estos?" },
  ctaSub: {
    en: "Book a 15-minute call. We'll look at your business and tell you exactly what we can automate.",
    fr: "Réserve un appel de 15 minutes. On regarde ta business et on te dit exactement ce qu'on peut automatiser.",
    es: "Agenda una llamada de 15 minutos. Analizamos tu negocio y te decimos exactamente qué podemos automatizar.",
  },
  bookCall: { en: "Book Free Strategy Call", fr: "Réserver un appel", es: "Agendar llamada gratis" },
  seePlans: { en: "See Plans & Pricing", fr: "Voir les plans et prix", es: "Ver planes y precios" },
};

const SP_BEFORE = {
  en: [
    "No website or online presence",
    "No social media strategy",
    "No lead generation — word of mouth only",
    "Missing 40% of inbound calls",
    "Pen and paper for quotes and contracts",
    "No CRM — tracking leads in a notebook",
    "No visibility into financial performance",
    "3+ hours/day on admin",
  ],
  fr: [
    "Aucun site web ni présence en ligne",
    "Pas de stratégie réseaux sociaux",
    "Pas de génération de leads — bouche-à-oreille seulement",
    "40% des appels entrants manqués",
    "Stylo et papier pour soumissions et contrats",
    "Pas de CRM — suivi des leads dans un cahier",
    "Aucune visibilité sur la performance financière",
    "3+ heures/jour sur l'admin",
  ],
  es: [
    "Sin sitio web ni presencia en línea",
    "Sin estrategia de redes sociales",
    "Sin generación de leads — solo de boca en boca",
    "40% de llamadas entrantes perdidas",
    "Lápiz y papel para cotizaciones y contratos",
    "Sin CRM — seguimiento de leads en una libreta",
    "Sin visibilidad del desempeño financiero",
    "3+ horas/día en administración",
  ],
};

const SP_AFTER = {
  en: [
    "Professional website driving leads 24/7",
    "Social media strategy + targeted ad campaigns",
    "Zero missed leads — AI answers every call",
    "Quotes generated automatically from Slack",
    "Digital contracts with e-signatures",
    "Automated deposit requests after signing",
    "Real-time financial dashboard with P&L",
    "0 hours/day on admin — fully automated",
  ],
  fr: [
    "Site web professionnel qui génère des leads 24/7",
    "Stratégie réseaux sociaux + campagnes pub ciblées",
    "Zéro lead manqué — l'IA répond à chaque appel",
    "Soumissions générées automatiquement depuis Slack",
    "Contrats numériques avec e-signatures",
    "Demandes de dépôt automatiques après signature",
    "Dashboard financier en temps réel avec P&L",
    "0 heure/jour sur l'admin — entièrement automatisé",
  ],
  es: [
    "Sitio web profesional generando leads 24/7",
    "Estrategia de redes sociales + campañas de anuncios dirigidas",
    "Cero leads perdidos — la IA contesta cada llamada",
    "Cotizaciones generadas automáticamente desde Slack",
    "Contratos digitales con firma electrónica",
    "Solicitudes de anticipo automáticas después de firmar",
    "Panel financiero en tiempo real con P&L",
    "0 horas/día en admin — totalmente automatizado",
  ],
};

const BUILT_ITEMS = [
  { en: "Website", fr: "Site web", es: "Sitio web" },
  { en: "Social Media", fr: "Réseaux sociaux", es: "Redes sociales" },
  { en: "Ad Campaigns", fr: "Campagnes pub", es: "Campañas de anuncios" },
  { en: "AI Voice Agent (24/7)", fr: "Agent vocal IA (24/7)", es: "Agente de voz IA (24/7)" },
  { en: "SMS Lead Capture", fr: "Capture leads SMS", es: "Captura de leads SMS" },
  { en: "CRM Dashboard", fr: "Dashboard CRM", es: "Panel de control CRM" },
  { en: "Quote Pipeline", fr: "Pipeline soumissions", es: "Pipeline de cotizaciones" },
  { en: "Digital Contracts", fr: "Contrats numériques", es: "Contratos digitales" },
  { en: "E-Signatures", fr: "E-signatures", es: "Firmas electrónicas" },
  { en: "Payment Tracking", fr: "Suivi paiements", es: "Seguimiento de pagos" },
  { en: "Expense Tracking", fr: "Suivi dépenses", es: "Seguimiento de gastos" },
  { en: "Auto Receipts", fr: "Reçus auto", es: "Recibos automáticos" },
  { en: "Financial Reports", fr: "Rapports financiers", es: "Reportes financieros" },
  { en: "Morning Briefing", fr: "Briefing matinal", es: "Briefing matutino" },
  { en: "Slack Integration", fr: "Intégration Slack", es: "Integración Slack" },
];

const RAM_BEFORE = {
  en: [
    "60% of calls going to voicemail",
    "80% of voicemails never returned",
    "Leads calling competitors next",
    "2+ hours/day on manual follow-up",
  ],
  fr: [
    "60% des appels allaient à la boîte vocale",
    "80% des messages jamais rappelés",
    "Les leads appelaient la compétition ensuite",
    "2+ heures/jour de suivi manuel",
  ],
  es: [
    "60% de las llamadas iban al buzón de voz",
    "80% de los mensajes nunca devueltos",
    "Los leads llamaban a la competencia después",
    "2+ horas/día en seguimiento manual",
  ],
};

const RAM_AFTER = {
  en: [
    "Every call answered or texted within 2 min",
    "AI qualifies leads automatically",
    "First results within 24 hours",
    "Zero manual follow-up needed",
  ],
  fr: [
    "Chaque appel répondu ou texté en 2 min",
    "L'IA qualifie les leads automatiquement",
    "Premiers résultats en 24 heures",
    "Zéro suivi manuel nécessaire",
  ],
  es: [
    "Cada llamada contestada o respondida por texto en 2 min",
    "La IA califica leads automáticamente",
    "Primeros resultados en 24 horas",
    "Cero seguimiento manual necesario",
  ],
};

const RAM_QUOTE = {
  en: '"We sent 90 Slybroadcast messages and got our first callback within 24 hours. The AI handled it automatically while I was working on site."',
  fr: '"On a envoyé 90 messages Slybroadcast et on a eu notre premier rappel en 24 heures. L\'IA a tout géré automatiquement pendant que je travaillais sur le terrain."',
  es: '"Enviamos 90 mensajes Slybroadcast y recibimos nuestro primer callback en 24 horas. La IA lo manejó automáticamente mientras yo trabajaba en el sitio."',
};

export default function Results() {
  const { pathname } = useRouter();
  const locale = getLocale(pathname);
  const prefix = localePath(locale);
  const contactHref = `${prefix}/contact`;
  const pricingHref = `${prefix}/lead-rescue`;

  return (
    <div className="min-h-screen bg-bg text-white">
      <PageHead page="/results" locale={locale} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 space-y-16">

        {/* TITLE */}
        <ScrollReveal>
          <div className="text-center space-y-4 pt-8">
            <h1 className="text-4xl sm:text-5xl font-heading font-bold">{T.title[locale]}</h1>
            <p className="text-lg text-txt2 max-w-2xl mx-auto leading-relaxed">{T.subtitle[locale]}</p>
          </div>
        </ScrollReveal>

        {/* CASE STUDY 1: SERVICE PLUS */}
        <ScrollReveal>
          <GlowCard className="p-6 md:p-8" glowColor="rgba(0,212,170,0.12)">
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent2/10 border border-accent2/20 mb-4">
                  <Zap className="w-3.5 h-3.5 text-accent2" />
                  <span className="text-xs font-medium text-accent2 tracking-wider uppercase">{T.caseStudy[locale]}</span>
                </div>
                <h2 className="text-3xl font-heading font-bold text-white">Service Plus</h2>
                <p className="text-accent2 font-semibold">
                  {locale === "fr" ? "Entrepreneur résidentiel — Québec" : locale === "es" ? "Contratista residencial — Quebec" : "Residential Contractor — Quebec"}
                </p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl p-5 border border-accent2/20 bg-accent2/5 text-center">
                  <div className="text-3xl font-heading font-bold text-accent2 tabular-nums">$<NumberTicker value={71} suffix="K" /></div>
                  <div className="text-xs text-txt3 mt-1">{T.pipeline30[locale]}</div>
                </div>
                <div className="rounded-xl p-5 border border-accent/20 bg-accent/5 text-center">
                  <div className="text-3xl font-heading font-bold text-accent tabular-nums"><NumberTicker value={0} /></div>
                  <div className="text-xs text-txt3 mt-1">{T.missedLeads[locale]}</div>
                </div>
                <div className="rounded-xl p-5 border border-accent/20 bg-accent/5 text-center">
                  <div className="text-3xl font-heading font-bold text-accent tabular-nums"><NumberTicker value={100} suffix="%" /></div>
                  <div className="text-xs text-txt3 mt-1">{T.autoQuotes[locale]}</div>
                </div>
                <div className="rounded-xl p-5 border border-accent2/20 bg-accent2/5 text-center">
                  <div className="text-3xl font-heading font-bold text-accent2">24/7</div>
                  <div className="text-xs text-txt3 mt-1">{T.aiReceptionist[locale]}</div>
                </div>
              </div>

              {/* Before/After */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl bg-bg/60 border border-danger/20 p-6">
                  <h3 className="font-heading font-semibold text-danger text-lg mb-4">{T.before[locale]}</h3>
                  <ul className="space-y-2 text-txt2 text-sm">
                    {SP_BEFORE[locale].map((item) => (
                      <li key={item} className="flex items-start gap-2"><X className="w-4 h-4 text-danger mt-0.5 flex-shrink-0" />{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-bg/60 border border-accent2/20 p-6">
                  <h3 className="font-heading font-semibold text-accent2 text-lg mb-4">{T.after[locale]}</h3>
                  <ul className="space-y-2 text-txt2 text-sm">
                    {SP_AFTER[locale].map((item) => (
                      <li key={item} className="flex items-start gap-2"><Check className="w-4 h-4 text-accent2 mt-0.5 flex-shrink-0" />{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* What we built */}
              <div>
                <h3 className="font-heading font-semibold text-white mb-3">{T.whatWeBuilt[locale]}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {BUILT_ITEMS.map((item) => (
                    <div key={item.en} className="rounded-lg px-3 py-2 border border-border bg-surface text-txt2">{item[locale]}</div>
                  ))}
                </div>
              </div>
            </div>
          </GlowCard>
        </ScrollReveal>

        {/* CASE STUDY 2: RAMONEUR */}
        <ScrollReveal>
          <GlowCard className="p-6 md:p-8" glowColor="rgba(108,99,255,0.12)">
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-4">
                  <Zap className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-medium text-accent tracking-wider uppercase">{T.caseStudy[locale]}</span>
                </div>
                <h2 className="text-2xl font-heading font-bold text-white">Ramoneur Multi-Services</h2>
                <p className="text-accent font-semibold">
                  {locale === "fr" ? "Services de ramonage — Québec" : locale === "es" ? "Servicios de chimenea — Quebec" : "Chimney Services — Quebec"}
                </p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="rounded-xl p-5 border border-accent/20 bg-accent/5 text-center">
                  <div className="text-3xl font-heading font-bold text-accent">60%→0%</div>
                  <div className="text-xs text-txt3 mt-1">{T.missedRate[locale]}</div>
                </div>
                <div className="rounded-xl p-5 border border-accent2/20 bg-accent2/5 text-center">
                  <div className="text-3xl font-heading font-bold text-accent2">24h</div>
                  <div className="text-xs text-txt3 mt-1">{T.firstCallback[locale]}</div>
                </div>
                <div className="rounded-xl p-5 border border-accent/20 bg-accent/5 text-center">
                  <div className="text-3xl font-heading font-bold text-accent">0</div>
                  <div className="text-xs text-txt3 mt-1">{T.manualFollowups[locale]}</div>
                </div>
              </div>

              {/* Before/After */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl bg-bg/60 border border-danger/20 p-6">
                  <h3 className="font-heading font-semibold text-danger mb-3">{T.before[locale]}</h3>
                  <ul className="space-y-2 text-txt2 text-sm">
                    {RAM_BEFORE[locale].map((item) => (
                      <li key={item} className="flex items-start gap-2"><X className="w-4 h-4 text-danger mt-0.5 flex-shrink-0" />{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-bg/60 border border-accent2/20 p-6">
                  <h3 className="font-heading font-semibold text-accent2 mb-3">{T.after[locale]}</h3>
                  <ul className="space-y-2 text-txt2 text-sm">
                    {RAM_AFTER[locale].map((item) => (
                      <li key={item} className="flex items-start gap-2"><Check className="w-4 h-4 text-accent2 mt-0.5 flex-shrink-0" />{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Quote */}
              <blockquote className="rounded-xl bg-surface border border-border p-5">
                <p className="text-txt2 italic text-sm">{RAM_QUOTE[locale]}</p>
                <cite className="text-accent text-sm mt-2 block not-italic font-semibold">— Ramoneur Multi-Services</cite>
              </blockquote>
            </div>
          </GlowCard>
        </ScrollReveal>

        {/* CTA */}
        <ScrollReveal>
          <AuroraBackground className="rounded-2xl p-8 md:p-12 text-center">
            <h3 className="text-2xl sm:text-3xl font-heading font-bold mb-3 text-white">{T.ctaTitle[locale]}</h3>
            <p className="text-txt2 mb-8 max-w-2xl mx-auto leading-relaxed">{T.ctaSub[locale]}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={contactHref}>
                <ShimmerButton className="text-base px-8 py-4 w-full sm:w-auto">{T.bookCall[locale]}</ShimmerButton>
              </Link>
              <Link href={pricingHref} className="rounded-lg px-8 py-4 text-base font-semibold border border-border hover:border-accent/50 text-txt2 hover:text-white transition-all duration-300 text-center cursor-pointer">
                {T.seePlans[locale]}
              </Link>
            </div>
          </AuroraBackground>
        </ScrollReveal>
      </div>
    </div>
  );
}
