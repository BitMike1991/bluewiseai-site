import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  PhoneIncoming,
  Brain,
  TrendingUp,
  Phone,
  MessageSquare,
  LayoutDashboard,
  FileText,
  FileSignature,
  DollarSign,
  ChevronDown,
  ShieldCheck,
  ArrowRight,
  Zap,
  Lock,
  CalendarCheck,
} from "lucide-react";
import { PRICING } from "@/data/pricing";
import { GlowCard } from "@/components/ui/GlowCard";
import { ShimmerButton } from "@/components/ui/ShimmerButton";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { NumberTicker } from "@/components/ui/NumberTicker";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { MovingBorder } from "@/components/ui/MovingBorder";
import { getLocale, localePath } from "@/lib/locale";

/* ──────────────────────── LOGO MARQUEE ──────────────────────── */

const TOOL_LOGOS = [
  { name: "Supabase", svg: "/logos/supabase.svg" },
  { name: "n8n", svg: "/logos/n8n.svg" },
  { name: "OpenAI", svg: "/logos/openai.svg" },
  { name: "Stripe", svg: "/logos/stripe.svg" },
  { name: "Vercel", svg: "/logos/vercel.svg" },
  { name: "Telnyx", svg: "/logos/telnyx.svg" },
];

function LogoMarquee({ locale }) {
  const label = {
    en: "Powered by enterprise-grade AI infrastructure",
    fr: "Propulsé par une infrastructure IA entreprise",
    es: "Impulsado por infraestructura IA de nivel empresarial",
  };
  return (
    <section className="py-12 overflow-hidden">
      <p className="text-center text-xs uppercase tracking-widest text-txt3 mb-8">
        {label[locale]}
      </p>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-bg to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-bg to-transparent z-10" />
        <div className="flex animate-marquee gap-16 items-center">
          {[...TOOL_LOGOS, ...TOOL_LOGOS].map((logo, i) => (
            <div
              key={`${logo.name}-${i}`}
              className="flex items-center gap-2 text-txt3 opacity-50 hover:opacity-80 transition-opacity flex-shrink-0"
            >
              <span className="text-sm font-medium whitespace-nowrap">
                {logo.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────── HOW IT WORKS ──────────────────────── */

const STEPS = {
  en: [
    { icon: PhoneIncoming, title: "Free Audit Call", desc: "15 minutes. We analyze your current operations and show you exactly where you're losing money.", accent: "accent" },
    { icon: Brain, title: "We Build Your System", desc: "In 1-2 weeks, we set up your AI receptionist, CRM, automation workflows, and dashboard.", accent: "accent2" },
    { icon: TrendingUp, title: "We Run & Optimize", desc: "Your system runs 24/7. We monitor, optimize, and improve it every month. You focus on the work.", accent: "accent" },
  ],
  fr: [
    { icon: PhoneIncoming, title: "Appel audit gratuit", desc: "15 minutes. On analyse tes opérations actuelles et on te montre exactement où tu perds de l'argent.", accent: "accent" },
    { icon: Brain, title: "On build ton système", desc: "En 1-2 semaines, on installe ta réceptionniste IA, ton CRM, tes automatisations et ton dashboard.", accent: "accent2" },
    { icon: TrendingUp, title: "On roule et optimise", desc: "Ton système roule 24/7. On monitor, optimise et améliore chaque mois. Toi tu focus sur le terrain.", accent: "accent" },
  ],
  es: [
    { icon: PhoneIncoming, title: "Llamada de auditoría gratis", desc: "15 minutos. Analizamos tus operaciones actuales y te mostramos exactamente dónde estás perdiendo dinero.", accent: "accent" },
    { icon: Brain, title: "Construimos tu sistema", desc: "En 1-2 semanas, configuramos tu recepcionista IA, CRM, flujos de automatización y panel de control.", accent: "accent2" },
    { icon: TrendingUp, title: "Lo operamos y optimizamos", desc: "Tu sistema funciona 24/7. Nosotros monitoreamos, optimizamos y mejoramos cada mes. Tú concéntrate en el trabajo.", accent: "accent" },
  ],
};

const HOW_T = {
  title: { en: "How It Works", fr: "Comment ça marche", es: "Cómo funciona" },
  subtitle: {
    en: "We handle the setup, you keep running your business. Three steps to automated operations.",
    fr: "On gère le setup, tu continues ta business. Trois étapes vers des opérations automatisées.",
    es: "Nosotros nos encargamos de la configuración, tú sigues con tu negocio. Tres pasos hacia operaciones automatizadas.",
  },
  step: { en: "Step", fr: "Étape", es: "Paso" },
};

function HowItWorks({ locale }) {
  const steps = STEPS[locale];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
      <ScrollReveal>
        <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-2 text-center text-white">
          {HOW_T.title[locale]}
        </h2>
        <p className="text-txt2 text-center mb-14 max-w-2xl mx-auto">
          {HOW_T.subtitle[locale]}
        </p>
      </ScrollReveal>

      <div className="grid md:grid-cols-3 gap-8 relative">
        <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-accent/30 via-accent2/30 to-accent/30" />

        {steps.map((step, i) => (
          <ScrollReveal key={step.title} delay={i * 150}>
            <GlowCard
              className="text-center p-6"
              glowColor={step.accent === "accent2" ? "rgba(0,212,170,0.15)" : "rgba(108,99,255,0.15)"}
            >
              <div
                className={`w-14 h-14 rounded-2xl ${
                  step.accent === "accent2" ? "bg-accent2/10 border-accent2/30" : "bg-accent/10 border-accent/30"
                } border flex items-center justify-center mx-auto mb-4 relative z-10`}
              >
                <step.icon className={`w-6 h-6 ${step.accent === "accent2" ? "text-accent2" : "text-accent"}`} />
              </div>
              <div className="text-xs font-bold text-txt3 mb-2 uppercase tracking-wider">
                {HOW_T.step[locale]} {i + 1}
              </div>
              <h3 className="text-lg font-heading font-semibold mb-2 text-white">{step.title}</h3>
              <p className="text-txt2 text-sm leading-relaxed">{step.desc}</p>
            </GlowCard>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────── ROI MATH ──────────────────────── */

const ROI_T = {
  title: {
    en: "Every Missed Call Is $300 Out the Door",
    fr: "Chaque appel manqué c'est 300 $ qui part",
    es: "Cada llamada perdida son $300 que se van",
  },
  mathTitle: { en: "The Math (Conservative)", fr: "Le calcul (conservateur)", es: "Los números (conservador)" },
  missedWeek: { en: "Missed calls per week", fr: "Appels manqués par semaine", es: "Llamadas perdidas por semana" },
  avgJob: { en: "Average job value", fr: "Valeur moyenne du contrat", es: "Valor promedio del trabajo" },
  convRate: { en: "Conversion rate", fr: "Taux de conversion", es: "Tasa de conversión" },
  lostYear: { en: "Lost revenue per year", fr: "Revenus perdus par année", es: "Ingresos perdidos por año" },
  withBW: { en: "With BlueWise Pro", fr: "Avec BlueWise Pro", es: "Con BlueWise Pro" },
  setupFee: { en: "Setup fee", fr: "Frais d'installation", es: "Costo de instalación" },
  monthly: { en: "Monthly", fr: "Mensuel", es: "Mensual" },
  firstYear: { en: "First year total", fr: "Total première année", es: "Total primer año" },
  recovered: { en: "Recovered revenue (70%)", fr: "Revenus récupérés (70 %)", es: "Ingresos recuperados (70%)" },
  breakeven: {
    en: "Break-even in ~90 days. Everything after is profit.",
    fr: "Rentabilisé en ~90 jours. Le reste c'est du profit.",
    es: "Recuperas la inversión en ~90 días. Todo lo demás es ganancia.",
  },
  calcROI: { en: "Calculate Your ROI", fr: "Calcule ton ROI", es: "Calcula tu ROI" },
};

function ROIMath({ locale }) {
  const prefix = localePath(locale);
  const pricingHref = `${prefix}/lead-rescue`;
  const dollar = (v) => locale === "fr" ? `${v.toLocaleString()} $` : `$${v.toLocaleString()}`;
  const mo = { en: "/mo", fr: "/mois", es: "/mes" };

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
      <ScrollReveal>
        <div className="rounded-2xl border border-amber-500/20 bg-surface p-8 md:p-12 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-20 -right-20 w-60 h-60 rounded-full bg-amber-500/5 blur-[80px]" />

          <div className="max-w-4xl mx-auto relative">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-8 text-center text-white">
              {ROI_T.title[locale]}
            </h2>

            <div className="grid md:grid-cols-2 gap-8 mb-10">
              <div className="rounded-xl bg-bg/60 border border-amber-500/20 p-6">
                <h3 className="text-lg font-heading font-semibold text-amber-400 mb-4">
                  {ROI_T.mathTitle[locale]}
                </h3>
                <div className="space-y-3 text-txt2">
                  <div className="flex justify-between">
                    <span>{ROI_T.missedWeek[locale]}</span>
                    <strong className="text-white">15</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{ROI_T.avgJob[locale]}</span>
                    <strong className="text-white">{dollar(350)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{ROI_T.convRate[locale]}</span>
                    <strong className="text-white">50%</strong>
                  </div>
                  <div className="h-px bg-border my-3" />
                  <div className="flex justify-between items-baseline text-lg">
                    <span className="text-amber-400">{ROI_T.lostYear[locale]}</span>
                    <strong className="text-amber-300 text-2xl font-heading tabular-nums">
                      {locale === "fr" ? "" : "$"}<NumberTicker value={136500} />{locale === "fr" ? " $" : ""}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-bg/60 border border-accent2/20 p-6">
                <h3 className="text-lg font-heading font-semibold text-accent2 mb-4">
                  {ROI_T.withBW[locale]}
                </h3>
                <div className="space-y-3 text-txt2">
                  <div className="flex justify-between">
                    <span>{ROI_T.setupFee[locale]}</span>
                    <strong className="text-white">{dollar(PRICING.pro.setup)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{ROI_T.monthly[locale]}</span>
                    <strong className="text-white">{dollar(PRICING.pro.monthly)}{mo[locale]}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{ROI_T.firstYear[locale]}</span>
                    <strong className="text-white">{dollar(PRICING.pro.setup + PRICING.pro.monthly * 12)}</strong>
                  </div>
                  <div className="h-px bg-border my-3" />
                  <div className="flex justify-between items-baseline text-lg">
                    <span className="text-accent2">{ROI_T.recovered[locale]}</span>
                    <strong className="text-accent2 text-2xl font-heading tabular-nums">
                      {locale === "fr" ? "" : "$"}<NumberTicker value={95550} />{locale === "fr" ? " $" : ""}
                    </strong>
                  </div>
                  <p className="text-xs text-txt3 mt-2">{ROI_T.breakeven[locale]}</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link href={pricingHref}>
                <ShimmerButton className="text-base px-10 py-4">
                  {ROI_T.calcROI[locale]}
                </ShimmerButton>
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

/* ──────────────────────── CASE STUDY ──────────────────────── */

const CASE_T = {
  badge: { en: "Case Study", fr: "Étude de cas", es: "Caso de éxito" },
  title: {
    en: "Service Plus: $71K Pipeline in 30 Days",
    fr: "Service Plus : 71 000 $ de pipeline en 30 jours",
    es: "Service Plus: $71K en pipeline en 30 días",
  },
  desc: {
    en: "We built the complete package for a residential contractor in Quebec \u2014 new website, social media strategy, targeted ads, AND the full operations system. AI receptionist, automated quotes, contracts, payment tracking.",
    fr: "On a bâti le package complet pour un entrepreneur résidentiel au Québec \u2014 nouveau site web, stratégie réseaux sociaux, pubs ciblées, ET le système d'opérations au complet. Réceptionniste IA, soumissions automatiques, contrats, suivi des paiements.",
    es: "Construimos el paquete completo para un contratista residencial en Quebec \u2014 nuevo sitio web, estrategia de redes sociales, anuncios dirigidos, Y el sistema de operaciones completo. Recepcionista IA, cotizaciones automáticas, contratos, seguimiento de pagos.",
  },
  quote: {
    en: '"Since we got BlueWise, we haven\'t missed a single call. The system paid for itself in 6 weeks."',
    fr: '"Depuis qu\'on a BlueWise, on manque plus un seul call. Le système a payé pour lui-même en 6 semaines."',
    es: '"Desde que tenemos BlueWise, no hemos perdido ni una sola llamada. El sistema se pagó solo en 6 semanas."',
  },
  cite: { en: "\u2014 Owner, Service Plus", fr: "\u2014 Propriétaire, Service Plus", es: "\u2014 Propietario, Service Plus" },
  readMore: { en: "Read the full case study", fr: "Lire l'étude de cas complète", es: "Leer el caso de éxito completo" },
};

function CaseStudy({ locale }) {
  const prefix = localePath(locale);
  const portfolioHref = `${prefix}/portfolio`;

  const statLabels = {
    pipeline: { en: "Pipeline in 30 days", fr: "Pipeline en 30 jours", es: "Pipeline en 30 días" },
    missed: { en: "Missed leads", fr: "Leads manqués", es: "Leads perdidos" },
    ai: { en: "AI receptionist", fr: "Réceptionniste IA", es: "Recepcionista IA" },
    quotes: { en: "Automated quotes", fr: "Soumissions automatisées", es: "Cotizaciones automatizadas" },
  };

  const stats = [
    { value: 71, suffix: "K", prefix: locale === "fr" ? "" : "$", label: statLabels.pipeline[locale], color: "accent2" },
    { value: 0, suffix: "", prefix: "", label: statLabels.missed[locale], color: "accent" },
    { value: 24, suffix: "/7", prefix: "", label: statLabels.ai[locale], color: "accent" },
    { value: 100, suffix: "%", prefix: "", label: statLabels.quotes[locale], color: "accent2" },
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
      <ScrollReveal>
        <MovingBorder containerClassName="w-full" className="p-8 md:p-12" duration={4000}>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent2/10 border border-accent2/20 mb-4">
                <Zap className="w-3.5 h-3.5 text-accent2" />
                <span className="text-xs font-medium text-accent2 tracking-wider uppercase">
                  {CASE_T.badge[locale]}
                </span>
              </div>
              <h2 className="text-3xl font-heading font-bold mb-4 text-white">{CASE_T.title[locale]}</h2>
              <p className="text-txt2 mb-6 leading-relaxed">{CASE_T.desc[locale]}</p>

              <blockquote className="border-l-2 border-accent2/40 pl-4 mb-6">
                <p className="text-txt2 italic text-sm">{CASE_T.quote[locale]}</p>
                <cite className="text-xs text-txt3 mt-2 block not-italic">{CASE_T.cite[locale]}</cite>
              </blockquote>

              <Link
                href={portfolioHref}
                className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-semibold transition-colors"
              >
                {CASE_T.readMore[locale]}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, i) => (
                <ScrollReveal key={stat.label} delay={i * 100}>
                  <div
                    className={`rounded-xl p-5 border ${
                      stat.color === "accent2" ? "border-accent2/20 bg-accent2/5" : "border-accent/20 bg-accent/5"
                    } text-center`}
                  >
                    <div className={`text-3xl font-heading font-bold tabular-nums ${stat.color === "accent2" ? "text-accent2" : "text-accent"}`}>
                      {stat.prefix}<NumberTicker value={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-xs text-txt3 mt-1">{stat.label}</div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </MovingBorder>
      </ScrollReveal>
    </section>
  );
}

/* ──────────────────────── FEATURE GRID ──────────────────────── */

const FEATURES = {
  en: [
    { icon: Phone, title: "AI Receptionist", desc: "Answers calls 24/7, qualifies leads, books jobs. Sounds human.", glowColor: "rgba(108,99,255,0.15)", span: true },
    { icon: MessageSquare, title: "Smart SMS Engine", desc: "Instant text-back on missed calls. Collects details and photos automatically.", glowColor: "rgba(0,212,170,0.15)" },
    { icon: LayoutDashboard, title: "CRM Dashboard", desc: "See every lead, job, and payment in one place. Real-time, mobile-friendly.", glowColor: "rgba(108,99,255,0.15)" },
    { icon: FileText, title: "Automated Quotes", desc: "AI generates quotes from Slack messages. Client accepts with one click.", glowColor: "rgba(0,212,170,0.15)" },
    { icon: FileSignature, title: "Contract Pipeline", desc: "Digital contracts, e-signatures, automated deposit requests.", glowColor: "rgba(108,99,255,0.15)" },
    { icon: DollarSign, title: "Financial Tracking", desc: "Payment logging, expense tracking, auto-receipts, accountant exports.", glowColor: "rgba(0,212,170,0.15)" },
  ],
  fr: [
    { icon: Phone, title: "Réceptionniste IA", desc: "Répond aux appels 24/7, qualifie les leads, book les jobs. Sonne humain.", glowColor: "rgba(108,99,255,0.15)", span: true },
    { icon: MessageSquare, title: "Moteur SMS intelligent", desc: "Texto instantané sur appels manqués. Collecte détails et photos automatiquement.", glowColor: "rgba(0,212,170,0.15)" },
    { icon: LayoutDashboard, title: "Tableau de bord CRM", desc: "Vois chaque lead, job et paiement au même endroit. Temps réel, mobile.", glowColor: "rgba(108,99,255,0.15)" },
    { icon: FileText, title: "Soumissions automatisées", desc: "L'IA génère des soumissions depuis Slack. Le client accepte en un clic.", glowColor: "rgba(0,212,170,0.15)" },
    { icon: FileSignature, title: "Pipeline de contrats", desc: "Contrats numériques, e-signatures, demandes de dépôt automatiques.", glowColor: "rgba(108,99,255,0.15)" },
    { icon: DollarSign, title: "Suivi financier", desc: "Enregistrement paiements, suivi dépenses, reçus auto, exports comptables.", glowColor: "rgba(0,212,170,0.15)" },
  ],
  es: [
    { icon: Phone, title: "Recepcionista IA", desc: "Contesta llamadas 24/7, califica leads, agenda trabajos. Suena humana.", glowColor: "rgba(108,99,255,0.15)", span: true },
    { icon: MessageSquare, title: "Motor SMS inteligente", desc: "Respuesta instantánea por texto en llamadas perdidas. Recopila detalles y fotos automáticamente.", glowColor: "rgba(0,212,170,0.15)" },
    { icon: LayoutDashboard, title: "Panel de control CRM", desc: "Ve cada lead, trabajo y pago en un solo lugar. Tiempo real, compatible con móvil.", glowColor: "rgba(108,99,255,0.15)" },
    { icon: FileText, title: "Cotizaciones automáticas", desc: "La IA genera cotizaciones desde las conversaciones. El cliente acepta con un clic.", glowColor: "rgba(0,212,170,0.15)" },
    { icon: FileSignature, title: "Pipeline de contratos", desc: "Contratos digitales, firmas electrónicas, solicitudes de anticipo automáticas.", glowColor: "rgba(108,99,255,0.15)" },
    { icon: DollarSign, title: "Seguimiento financiero", desc: "Registro de pagos, seguimiento de gastos, recibos automáticos, exportaciones contables.", glowColor: "rgba(0,212,170,0.15)" },
  ],
};

const FEAT_T = {
  title: {
    en: "Everything You Need to Run Your Business",
    fr: "Tout ce qu'il te faut pour gérer ta business",
    es: "Todo lo que necesitas para manejar tu negocio",
  },
  subtitle: {
    en: "From the first missed call to the final payment \u2014 we automate the entire customer journey.",
    fr: "Du premier appel manqué au dernier paiement \u2014 on automatise tout le parcours client.",
    es: "Desde la primera llamada perdida hasta el último pago \u2014 automatizamos todo el recorrido del cliente.",
  },
};

function FeatureGrid({ locale }) {
  const features = FEATURES[locale];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
      <ScrollReveal>
        <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-2 text-center text-white">
          {FEAT_T.title[locale]}
        </h2>
        <p className="text-txt2 text-center mb-12 max-w-2xl mx-auto">{FEAT_T.subtitle[locale]}</p>
      </ScrollReveal>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <ScrollReveal key={f.title} delay={i * 100} className={f.span ? "md:col-span-2 lg:col-span-2" : ""}>
            <GlowCard className="p-6 h-full" glowColor={f.glowColor}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-semibold mb-1 text-white">{f.title}</h3>
                  <p className="text-txt2 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </GlowCard>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────── FAQ ──────────────────────── */

const FAQ = {
  en: [
    { q: "I'm not tech-savvy. Will I need to manage software?", a: "No. We set up and manage everything. You use the dashboard to see your leads and jobs \u2014 that's it. If you can use a smartphone, you can use BlueWise." },
    { q: "How is this different from hiring a virtual assistant?", a: "A VA costs $2-4K/month, works limited hours, makes mistakes, and calls in sick. Our AI works 24/7, never forgets a follow-up, and costs less. Plus you get the full CRM and automation platform on top." },
    { q: "What if I only get 10-15 calls a week?", a: "That's actually our sweet spot. If you're missing even 5 calls/week at $350/job, that's $45K/year walking out the door. The Starter plan at $799/mo pays for itself fast." },
    { q: "Do you work with my industry?", a: "We specialize in home services: HVAC, plumbing, roofing, electrical, landscaping, cleaning, chimney. If you do residential or commercial service work, we're built for you." },
  ],
  fr: [
    { q: "Je suis pas tech. Faut-tu que je gère un logiciel ?", a: "Non. On setup et on gère tout. Tu utilises le dashboard pour voir tes leads et tes jobs \u2014 c'est tout. Si tu sais utiliser un cellulaire, tu sais utiliser BlueWise." },
    { q: "C'est quoi la différence avec une assistante virtuelle ?", a: "Une AV coûte 2-4K$/mois, travaille des heures limitées, fait des erreurs et appelle malade. Notre IA travaille 24/7, oublie jamais un suivi et coûte moins cher. En plus t'as le CRM complet et la plateforme d'automatisation." },
    { q: "Et si je reçois juste 10-15 appels par semaine ?", a: "C'est exactement notre sweet spot. Si tu manques même 5 appels/semaine à 350$/job, ça fait 45K$/année qui part. Le plan Starter à 799$/mois se rentabilise vite." },
    { q: "Vous travaillez avec mon industrie ?", a: "On se spécialise en services résidentiels : CVC, plomberie, toiture, électricité, aménagement paysager, ménage, ramonage. Si tu fais du service résidentiel ou commercial, on est bâti pour toi." },
  ],
  es: [
    { q: "No soy bueno con la tecnología. ¿Voy a tener que manejar software?", a: "No. Nosotros configuramos y manejamos todo. Tú usas el panel de control para ver tus leads y trabajos \u2014 eso es todo. Si sabes usar un celular, puedes usar BlueWise." },
    { q: "¿En qué se diferencia de contratar una asistente virtual?", a: "Una asistente virtual cuesta $2-4K/mes, trabaja horas limitadas, comete errores y se enferma. Nuestra IA trabaja 24/7, nunca olvida un seguimiento y cuesta menos. Además tienes el CRM completo y la plataforma de automatización." },
    { q: "¿Qué pasa si solo recibo 10-15 llamadas por semana?", a: "Ese es exactamente nuestro punto ideal. Si pierdes solo 5 llamadas/semana a $350/trabajo, son $45K/año que se van. El plan Starter a $799/mes se paga solo rápidamente." },
    { q: "¿Trabajan con mi industria?", a: "Nos especializamos en servicios residenciales: HVAC, plomería, techos, electricidad, jardinería, limpieza, chimeneas. Si haces trabajo de servicio residencial o comercial, estamos hechos para ti." },
  ],
};

const FAQ_T = {
  title: { en: "Common Questions", fr: "Questions fréquentes", es: "Preguntas frecuentes" },
};

function FAQSection({ locale }) {
  const [openIndex, setOpenIndex] = useState(null);
  const items = FAQ[locale];

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
      <ScrollReveal>
        <h2 className="text-3xl font-heading font-bold mb-10 text-center text-white">
          {FAQ_T.title[locale]}
        </h2>
      </ScrollReveal>

      <div className="space-y-3">
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <ScrollReveal key={item.q} delay={i * 80}>
              <div className="rounded-xl bg-surface border border-border overflow-hidden transition-colors hover:border-accent/30">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex justify-between items-center p-5 text-left cursor-pointer"
                >
                  <span className="font-semibold text-white pr-4 text-sm sm:text-base">{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-txt3 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-48 pb-5" : "max-h-0"}`}>
                  <p className="text-txt2 text-sm px-5 leading-relaxed">{item.a}</p>
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}

/* ──────────────────────── FINAL CTA ──────────────────────── */

const CTA_T = {
  title: {
    en: "Stop Losing Money. Start Automating.",
    fr: "Arrête de perdre de l'argent. Commence à automatiser.",
    es: "Deja de perder dinero. Empieza a automatizar.",
  },
  subtitle: {
    en: "15-minute strategy call. We'll show you exactly how much revenue you're leaving on the table \u2014 and how BlueWise fixes it.",
    fr: "Appel stratégique de 15 minutes. On te montre exactement combien de revenus tu laisses sur la table \u2014 et comment BlueWise règle ça.",
    es: "Llamada estratégica de 15 minutos. Te mostramos exactamente cuántos ingresos estás dejando sobre la mesa \u2014 y cómo BlueWise lo resuelve.",
  },
  plans: { en: "See Plans & Pricing", fr: "Voir les plans et prix", es: "Ver planes y precios" },
  book: { en: "Book Strategy Call", fr: "Réserver un appel", es: "Agendar llamada estratégica" },
  noLock: { en: "No lock-in contracts", fr: "Pas de contrat long terme", es: "Sin contratos a largo plazo" },
  guarantee: { en: "90-day guarantee", fr: "Garantie 90 jours", es: "Garantía de 90 días" },
  limit: { en: "We onboard 3 clients/month", fr: "3 clients/mois", es: "Incorporamos 3 clientes/mes" },
};

function FinalCTA({ locale }) {
  const prefix = localePath(locale);
  const pricingHref = `${prefix}/lead-rescue`;
  const contactHref = `${prefix}/contact`;

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
      <ScrollReveal>
        <AuroraBackground className="rounded-2xl p-8 md:p-14 text-center">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-4 text-white">
            {CTA_T.title[locale]}
          </h2>
          <p className="text-txt2 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            {CTA_T.subtitle[locale]}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href={pricingHref}>
              <ShimmerButton className="text-base px-10 py-4 w-full sm:w-auto">
                {CTA_T.plans[locale]}
              </ShimmerButton>
            </Link>
            <Link
              href={contactHref}
              className="rounded-lg px-10 py-4 text-base font-semibold
                         border border-border hover:border-accent/50
                         text-txt2 hover:text-white
                         transition-all duration-300 text-center cursor-pointer"
            >
              {CTA_T.book[locale]}
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center items-center text-txt3 text-xs">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" />
              <span>{CTA_T.noLock[locale]}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{CTA_T.guarantee[locale]}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>{CTA_T.limit[locale]}</span>
            </div>
          </div>
        </AuroraBackground>
      </ScrollReveal>
    </section>
  );
}

/* ──────────────────────── EXPORT ALL ──────────────────────── */

export default function HomeSections() {
  const { pathname } = useRouter();
  const locale = getLocale(pathname);

  return (
    <>
      <LogoMarquee locale={locale} />
      <HowItWorks locale={locale} />
      <ROIMath locale={locale} />
      <CaseStudy locale={locale} />
      <FeatureGrid locale={locale} />
      <FAQSection locale={locale} />
      <FinalCTA locale={locale} />
    </>
  );
}
