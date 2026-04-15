import PageHead from "../src/components/PageHead";
import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
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
  Check,
  Megaphone,
} from "lucide-react";
import { PRICING } from "@/data/pricing";
import { GlowCard } from "@/components/ui/GlowCard";
import { ShimmerButton } from "@/components/ui/ShimmerButton";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { getLocale, localePath } from "@/lib/locale";

const STEPS = {
  en: [
    { icon: PhoneIncoming, title: "Free Audit Call", time: "15 minutes", desc: "We get on a call and look at your business: how many calls you get, how many you miss, your average job value, and what tools you're using now. No sales pitch \u2014 just honest numbers and a clear recommendation.", bullets: ["Calculate your current revenue loss", "Identify your biggest automation opportunities", "Recommend the right plan (or tell you we're not the right fit)"] },
    { icon: Brain, title: "We Build Your System", time: "1-2 weeks", desc: "You keep running your business. We build everything in the background: your AI receptionist, CRM dashboard, SMS engine, automation workflows, and whatever your plan includes. When it's ready, we go live together.", bullets: ["Custom phone number or port your existing one", "AI trained on your specific business and services", "Dashboard configured with your branding", "Test calls and SMS before going live"] },
    { icon: TrendingUp, title: "We Run & Optimize", time: "ongoing", desc: "Your system runs 24/7. We monitor everything, fix issues before you notice them, and optimize based on real data. Every month, your system gets better. You just focus on the work.", bullets: ["24/7 monitoring and error handling", "Monthly optimization based on your lead data", "Priority support (response times depend on plan)", "No contracts \u2014 cancel anytime"] },
  ],
  fr: [
    { icon: PhoneIncoming, title: "Appel audit gratuit", time: "15 minutes", desc: "On fait un call et on regarde ta business : combien d'appels tu reçois, combien tu manques, ta valeur moyenne de contrat et les outils que tu utilises. Pas de pitch de vente \u2014 juste des vrais chiffres et une recommandation claire.", bullets: ["Calcul de ta perte de revenus actuelle", "Identification de tes plus grandes opportunités d'automatisation", "Recommandation du bon plan (ou on te dit si on est pas le bon fit)"] },
    { icon: Brain, title: "On build ton système", time: "1-2 semaines", desc: "Tu continues ta business. On build tout en background : ta réceptionniste IA, ton dashboard CRM, ton moteur SMS, tes workflows d'automatisation et tout ce que ton plan inclut. Quand c'est prêt, on part live ensemble.", bullets: ["Numéro de téléphone custom ou port de ton existant", "IA entraînée sur ta business et tes services spécifiques", "Dashboard configuré avec ton branding", "Appels test et SMS avant le go-live"] },
    { icon: TrendingUp, title: "On roule et optimise", time: "continu", desc: "Ton système roule 24/7. On monitor tout, on fix les issues avant que tu les remarques et on optimise basé sur des vraies données. Chaque mois, ton système s'améliore. Toi tu focus sur le terrain.", bullets: ["Monitoring et gestion d'erreurs 24/7", "Optimisation mensuelle basée sur tes données de leads", "Support prioritaire (temps de réponse selon le plan)", "Pas de contrat \u2014 annule quand tu veux"] },
  ],
  es: [
    { icon: PhoneIncoming, title: "Llamada de auditoría gratis", time: "15 minutos", desc: "Hacemos una llamada y analizamos tu negocio: cuántas llamadas recibes, cuántas pierdes, el valor promedio de tus trabajos y qué herramientas usas actualmente. Sin pitch de ventas \u2014 solo números reales y una recomendación clara.", bullets: ["Calculamos tu pérdida de ingresos actual", "Identificamos tus mayores oportunidades de automatización", "Te recomendamos el plan correcto (o te decimos si no somos el fit adecuado)"] },
    { icon: Brain, title: "Construimos tu sistema", time: "1-2 semanas", desc: "Tú sigues con tu negocio. Nosotros construimos todo en segundo plano: tu recepcionista IA, panel de control CRM, motor SMS, flujos de automatización y todo lo que incluya tu plan. Cuando esté listo, salimos en vivo juntos.", bullets: ["Número de teléfono personalizado o porta tu existente", "IA entrenada en tu negocio y servicios específicos", "Panel de control configurado con tu marca", "Llamadas y SMS de prueba antes de salir en vivo"] },
    { icon: TrendingUp, title: "Lo operamos y optimizamos", time: "continuo", desc: "Tu sistema funciona 24/7. Monitoreamos todo, arreglamos problemas antes de que los notes y optimizamos con datos reales. Cada mes, tu sistema mejora. Tú solo concéntrate en el trabajo.", bullets: ["Monitoreo y manejo de errores 24/7", "Optimización mensual basada en tus datos de leads", "Soporte prioritario (tiempos de respuesta según el plan)", "Sin contratos \u2014 cancela cuando quieras"] },
  ],
};

const FEATURES = {
  en: [
    { icon: Phone, title: "AI Voice Agent", desc: "Answers calls 24/7, qualifies leads, collects job details. Sounds human, never gets tired.", tier: "Pro+" },
    { icon: MessageSquare, title: "Smart SMS Engine", desc: "Instant text-back on missed calls. Collects photos, details, and keeps leads warm.", tier: "All plans" },
    { icon: LayoutDashboard, title: "CRM Dashboard", desc: "Every lead, job, and conversation in one real-time interface. Mobile-friendly.", tier: "All plans" },
    { icon: FileText, title: "Automated Quotes", desc: "AI generates quotes from conversations. Client accepts with one click.", tier: "Pro+" },
    { icon: FileSignature, title: "Digital Contracts", desc: "Professional contracts with e-signatures. Automated deposit requests.", tier: "Pro+" },
    { icon: DollarSign, title: "Financial Tracking", desc: "Payments, expenses, receipts \u2014 all logged automatically. Accountant-ready exports.", tier: "Pro+" },
    { icon: PhoneIncoming, title: "Lead Capture Forms", desc: "Website forms that feed directly into your pipeline. No manual entry.", tier: "All plans" },
    { icon: Megaphone, title: "Meta Ads Management", desc: "We run your Facebook/Instagram ads and feed leads directly into your system.", tier: "Elite" },
  ],
  fr: [
    { icon: Phone, title: "Agent vocal IA", desc: "Répond aux appels 24/7, qualifie les leads, collecte les détails du job. Sonne humain, jamais fatigué.", tier: "Pro+" },
    { icon: MessageSquare, title: "Moteur SMS intelligent", desc: "Texto instantané sur appels manqués. Collecte photos, détails et garde les leads chauds.", tier: "Tous les plans" },
    { icon: LayoutDashboard, title: "Dashboard CRM", desc: "Chaque lead, job et conversation dans une interface temps réel. Mobile-friendly.", tier: "Tous les plans" },
    { icon: FileText, title: "Soumissions automatisées", desc: "L'IA génère des soumissions à partir des conversations. Le client accepte en un clic.", tier: "Pro+" },
    { icon: FileSignature, title: "Contrats numériques", desc: "Contrats professionnels avec e-signatures. Demandes de dépôt automatisées.", tier: "Pro+" },
    { icon: DollarSign, title: "Suivi financier", desc: "Paiements, dépenses, reçus \u2014 tout loggé automatiquement. Exports prêts pour le comptable.", tier: "Pro+" },
    { icon: PhoneIncoming, title: "Formulaires de capture", desc: "Formulaires web qui alimentent directement ton pipeline. Pas d'entrée manuelle.", tier: "Tous les plans" },
    { icon: Megaphone, title: "Gestion publicité Meta", desc: "On roule tes pubs Facebook/Instagram et on feed les leads directement dans ton système.", tier: "Elite" },
  ],
  es: [
    { icon: Phone, title: "Agente de voz IA", desc: "Contesta llamadas 24/7, califica leads, recopila detalles del trabajo. Suena humano, nunca se cansa.", tier: "Pro+" },
    { icon: MessageSquare, title: "Motor SMS inteligente", desc: "Respuesta instantánea por texto en llamadas perdidas. Recopila fotos, detalles y mantiene los leads activos.", tier: "Todos" },
    { icon: LayoutDashboard, title: "Panel de control CRM", desc: "Cada lead, trabajo y conversación en una interfaz en tiempo real. Compatible con móvil.", tier: "Todos" },
    { icon: FileText, title: "Cotizaciones automáticas", desc: "La IA genera cotizaciones desde las conversaciones. El cliente acepta con un clic.", tier: "Pro+" },
    { icon: FileSignature, title: "Contratos digitales", desc: "Contratos profesionales con firma electrónica. Solicitudes de anticipo automatizadas.", tier: "Pro+" },
    { icon: DollarSign, title: "Seguimiento financiero", desc: "Pagos, gastos, recibos \u2014 todo registrado automáticamente. Exportaciones listas para el contador.", tier: "Pro+" },
    { icon: PhoneIncoming, title: "Formularios de captura", desc: "Formularios web que alimentan directamente tu pipeline. Sin entrada manual.", tier: "Todos" },
    { icon: Megaphone, title: "Gestión de anuncios Meta", desc: "Manejamos tus anuncios de Facebook/Instagram y alimentamos los leads directamente a tu sistema.", tier: "Elite" },
  ],
};

const REPLACEMENTS = {
  en: [
    { item: "Receptionist / Office admin", cost: "$3,500/mo", bw: "AI handles it 24/7" },
    { item: "CRM software (GoHighLevel, Jobber, etc.)", cost: "$200-400/mo", bw: "Built-in dashboard" },
    { item: "Marketing agency or lead gen", cost: "$1,500-3,000/mo", bw: "AI captures & qualifies leads" },
    { item: "Bookkeeping / invoicing", cost: "$500-1,500/mo", bw: "Auto-tracking & receipts" },
    { item: "Answering service", cost: "$200-500/mo", bw: "AI voice agent included" },
  ],
  fr: [
    { item: "Réceptionniste / Admin bureau", cost: "3 500 $/mois", bw: "L'IA gère 24/7" },
    { item: "Logiciel CRM (GoHighLevel, Jobber, etc.)", cost: "200-400 $/mois", bw: "Dashboard intégré" },
    { item: "Agence marketing ou génération de leads", cost: "1 500-3 000 $/mois", bw: "L'IA capture et qualifie les leads" },
    { item: "Comptabilité / facturation", cost: "500-1 500 $/mois", bw: "Suivi auto et reçus" },
    { item: "Service de réponse téléphonique", cost: "200-500 $/mois", bw: "Agent vocal IA inclus" },
  ],
  es: [
    { item: "Recepcionista / Admin de oficina", cost: "$3,500/mes", bw: "La IA lo maneja 24/7" },
    { item: "Software CRM (GoHighLevel, Jobber, etc.)", cost: "$200-400/mes", bw: "Panel de control integrado" },
    { item: "Agencia de marketing o generación de leads", cost: "$1,500-3,000/mes", bw: "La IA captura y califica leads" },
    { item: "Contabilidad / facturación", cost: "$500-1,500/mes", bw: "Seguimiento automático y recibos" },
    { item: "Servicio de contestadora", cost: "$200-500/mes", bw: "Agente de voz IA incluido" },
  ],
};

const T = {
  heroTitle: { en: "How It Works", fr: "Comment ça marche", es: "Cómo funciona" },
  heroSub: {
    en: "From your first call to your tenth client \u2014 here's exactly what happens when you work with BlueWise.",
    fr: "De ton premier appel à ton dixième client \u2014 voici exactement ce qui se passe quand tu travailles avec BlueWise.",
    es: "Desde tu primera llamada hasta tu décimo cliente \u2014 esto es exactamente lo que pasa cuando trabajas con BlueWise.",
  },
  replacing: { en: "What You're Replacing", fr: "Ce que tu remplaces", es: "Lo que estás reemplazando" },
  replacingSub: {
    en: "Most contractors piece together 4-5 different tools and people to manage their business. BlueWise replaces all of them in one platform.",
    fr: "La plupart des entrepreneurs assemblent 4-5 outils et personnes différentes pour gérer leur business. BlueWise remplace tout en une plateforme.",
    es: "La mayoría de los contratistas juntan 4-5 herramientas y personas diferentes para manejar su negocio. BlueWise reemplaza todo en una plataforma.",
  },
  payingNow: { en: "What you're paying for now", fr: "Ce que tu paies maintenant", es: "Lo que pagas actualmente" },
  currentCost: { en: "Current Cost", fr: "Coût actuel", es: "Costo actual" },
  withBW: { en: "With BlueWise", fr: "Avec BlueWise", es: "Con BlueWise" },
  totalFrom: { en: `From $${PRICING.starter.monthly}/mo`, fr: `À partir de ${PRICING.starter.monthly} $/mois`, es: `Desde $${PRICING.starter.monthly}/mes` },
  totalOld: { en: "$6,000-8,900/mo", fr: "6 000-8 900 $/mois", es: "$6,000-8,900/mes" },
  included: { en: "What's Included", fr: "Ce qui est inclus", es: "Qué incluye" },
  ctaTitle: {
    en: "Ready to Stop Doing Everything Yourself?",
    fr: "Prêt à arrêter de tout faire toi-même ?",
    es: "¿Listo para dejar de hacerlo todo tú mismo?",
  },
  ctaSub: {
    en: "Book a 15-minute audit call. We'll show you exactly where automation can save you time and money.",
    fr: "Réserve un appel audit de 15 minutes. On te montre exactement où l'automatisation peut te sauver du temps et de l'argent.",
    es: "Agenda una llamada de auditoría de 15 minutos. Te mostramos exactamente dónde la automatización puede ahorrarte tiempo y dinero.",
  },
  bookAudit: { en: "Book Free Audit Call", fr: "Réserver un appel audit", es: "Agendar auditoría gratis" },
  seePlans: { en: "See Plans & Pricing", fr: "Voir les plans et prix", es: "Ver planes y precios" },
};

export default function Services() {
  const { pathname } = useRouter();
  const locale = getLocale(pathname);
  const prefix = localePath(locale);
  const contactHref = `${prefix}/contact`;
  const pricingHref = `${prefix}/lead-rescue`;
  const steps = STEPS[locale];
  const features = FEATURES[locale];
  const replacements = REPLACEMENTS[locale];

  useEffect(() => { window.fbq?.("track", "ViewContent", { content_name: "Services", content_category: "product" }); }, []);

  return (
    <div className="min-h-screen bg-bg text-white">
      <PageHead page="/services" locale={locale} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 space-y-16">

        {/* HERO */}
        <ScrollReveal>
          <div className="text-center space-y-4 pt-8">
            <h1 className="text-4xl sm:text-5xl font-heading font-bold">{T.heroTitle[locale]}</h1>
            <p className="text-lg text-txt2 max-w-2xl mx-auto leading-relaxed">{T.heroSub[locale]}</p>
          </div>
        </ScrollReveal>

        {/* 3-STEP PROCESS */}
        <div className="space-y-6">
          {steps.map((step, i) => (
            <ScrollReveal key={step.title} delay={i * 100}>
              <GlowCard className="p-6 md:p-8" glowColor={i === 1 ? "rgba(0,212,170,0.12)" : "rgba(108,99,255,0.12)"}>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className={`flex-shrink-0 w-14 h-14 rounded-2xl border flex items-center justify-center ${i === 1 ? "bg-accent2/10 border-accent2/30" : "bg-accent/10 border-accent/30"}`}>
                    <step.icon className={`w-6 h-6 ${i === 1 ? "text-accent2" : "text-accent"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3 mb-2">
                      <h2 className="text-2xl font-heading font-bold text-white">{step.title}</h2>
                      <span className="text-txt3 text-sm">({step.time})</span>
                    </div>
                    <p className="text-txt2 mb-4 leading-relaxed">{step.desc}</p>
                    <ul className="space-y-2">
                      {step.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-txt2 text-sm">
                          <Check className="w-4 h-4 text-accent2 mt-0.5 flex-shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </GlowCard>
            </ScrollReveal>
          ))}
        </div>

        {/* WHAT YOU'RE REPLACING */}
        <ScrollReveal>
          <GlowCard className="p-6 md:p-8">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center mb-2">{T.replacing[locale]}</h2>
            <p className="text-txt3 text-center max-w-2xl mx-auto text-sm mb-8">{T.replacingSub[locale]}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-txt3 font-semibold">{T.payingNow[locale]}</th>
                    <th className="text-center py-3 px-4 text-danger font-semibold">{T.currentCost[locale]}</th>
                    <th className="text-center py-3 px-4 text-accent2 font-semibold">{T.withBW[locale]}</th>
                  </tr>
                </thead>
                <tbody>
                  {replacements.map((row, i) => (
                    <tr key={i} className={`border-b border-border/30 ${i % 2 === 0 ? "bg-surface/30" : ""}`}>
                      <td className="py-3 px-4 text-txt">{row.item}</td>
                      <td className="py-3 px-4 text-center text-danger font-semibold">{row.cost}</td>
                      <td className="py-3 px-4 text-center text-accent2">{row.bw}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border">
                    <td className="py-3 px-4 text-white font-bold">Total</td>
                    <td className="py-3 px-4 text-center text-danger font-bold text-lg">{T.totalOld[locale]}</td>
                    <td className="py-3 px-4 text-center text-accent2 font-bold text-lg">{T.totalFrom[locale]}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </GlowCard>
        </ScrollReveal>

        {/* FEATURE GRID */}
        <div className="space-y-6">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center">{T.included[locale]}</h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 80}>
                <GlowCard className="p-5 h-full">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <f.icon className="w-4 h-4 text-accent" />
                      </div>
                      <h3 className="font-heading font-semibold text-white">{f.title}</h3>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      f.tier === "All plans" || f.tier === "Tous les plans" || f.tier === "Todos"
                        ? "bg-accent/10 text-accent border border-accent/20"
                        : f.tier === "Elite"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-accent2/10 text-accent2 border border-accent2/20"
                    }`}>
                      {f.tier}
                    </span>
                  </div>
                  <p className="text-txt2 text-sm leading-relaxed">{f.desc}</p>
                </GlowCard>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* CTA */}
        <ScrollReveal>
          <AuroraBackground className="rounded-2xl p-8 md:p-12 text-center">
            <h3 className="text-2xl sm:text-3xl font-heading font-bold mb-3 text-white">{T.ctaTitle[locale]}</h3>
            <p className="text-txt2 mb-8 max-w-2xl mx-auto leading-relaxed">{T.ctaSub[locale]}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={contactHref}>
                <ShimmerButton className="text-base px-8 py-4 w-full sm:w-auto">{T.bookAudit[locale]}</ShimmerButton>
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
