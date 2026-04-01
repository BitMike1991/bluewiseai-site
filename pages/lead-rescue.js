import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  ShieldCheck,
  Check,
  X,
  ArrowRight,
  Sparkles,
  Clock,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import { TIERS, COMPARISON_FEATURES, PRICING } from "@/data/pricing";
import { GlowCard } from "@/components/ui/GlowCard";
import { ShimmerButton } from "@/components/ui/ShimmerButton";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { MovingBorder } from "@/components/ui/MovingBorder";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import ROICalculator from "@/components/ROICalculator";
import { getLocale, localePath } from "@/lib/locale";

const FAQ_ITEMS = [
  {
    q: { en: "How is this different from GoHighLevel?", fr: "C'est quoi la différence avec GoHighLevel ?", es: "¿En qué se diferencia de GoHighLevel?" },
    a: {
      en: "GoHighLevel is a DIY tool \u2014 you still need to set it up, maintain it, and figure out what works. BlueWise is a done-for-you service. We build, run, and optimize your entire lead operation. You don't touch software. You answer qualified leads.",
      fr: "GoHighLevel est un outil DIY \u2014 tu dois quand même le configurer, le maintenir et trouver ce qui marche. BlueWise c'est un service clé en main. On build, on roule et on optimise toute ton opération de leads. Tu touches pas au logiciel. Tu réponds aux leads qualifiés.",
      es: "GoHighLevel es una herramienta DIY \u2014 aún necesitas configurarla, mantenerla y descubrir qué funciona. BlueWise es un servicio llave en mano. Construimos, operamos y optimizamos toda tu operación de leads. Tú no tocas software. Tú contestas leads calificados.",
    },
  },
  {
    q: { en: "What if I already have a CRM?", fr: "Et si j'ai déjà un CRM ?", es: "¿Qué pasa si ya tengo un CRM?" },
    a: {
      en: "We can integrate with your existing tools or replace them entirely \u2014 whichever saves you more time and money. Most clients ditch their old CRM within 2 weeks because ours does more with zero manual work.",
      fr: "On peut s'intégrer à tes outils existants ou les remplacer complètement \u2014 ce qui te sauve le plus de temps et d'argent. La plupart des clients drop leur vieux CRM en 2 semaines parce que le nôtre fait plus sans travail manuel.",
      es: "Podemos integrarnos con tus herramientas existentes o reemplazarlas por completo \u2014 lo que te ahorre más tiempo y dinero. La mayoría de los clientes dejan su viejo CRM en 2 semanas porque el nuestro hace más con cero trabajo manual.",
    },
  },
  {
    q: { en: "Is this a scam? These numbers seem too good.", fr: "C'est-tu un scam ? Les chiffres ont l'air trop beaux.", es: "¿Es una estafa? Los números parecen demasiado buenos." },
    a: {
      en: "The ROI calculator uses conservative estimates (70% capture rate, not 100%). We built this system for Service Plus, a real contractor business that generated $71K in pipeline in 30 days. We have real numbers, real clients, and a 90-day guarantee. Book a call \u2014 we'll show you the dashboard live.",
      fr: "Le calculateur ROI utilise des estimations conservatrices (70% de capture, pas 100%). On a bâti ce système pour Service Plus, une vraie business d'entrepreneur qui a généré 71K$ de pipeline en 30 jours. On a des vrais chiffres, de vrais clients et une garantie 90 jours. Book un call \u2014 on te montre le dashboard en direct.",
      es: "La calculadora de ROI usa estimaciones conservadoras (70% de captura, no 100%). Construimos este sistema para Service Plus, un negocio real de contratista que generó $71K en pipeline en 30 días. Tenemos números reales, clientes reales y una garantía de 90 días. Agenda una llamada \u2014 te mostramos el panel de control en vivo.",
    },
  },
  {
    q: { en: "What if it doesn't work for my business?", fr: "Et si ça marche pas pour ma business ?", es: "¿Qué pasa si no funciona para mi negocio?" },
    a: {
      en: "That's what the strategy call is for. If your business doesn't fit (too few calls, job values too low), we'll tell you upfront. We don't want unhappy clients \u2014 it's bad for everyone. Plus, you're covered by the 90-day guarantee.",
      fr: "C'est à ça que sert l'appel stratégique. Si ta business fit pas (pas assez d'appels, valeur des jobs trop basse), on te le dit d'avance. On veut pas de clients mécontents \u2014 c'est mauvais pour tout le monde. En plus, t'es couvert par la garantie 90 jours.",
      es: "Para eso es la llamada estratégica. Si tu negocio no encaja (pocas llamadas, valor de trabajos muy bajo), te lo decimos de frente. No queremos clientes insatisfechos \u2014 es malo para todos. Además, estás cubierto por la garantía de 90 días.",
    },
  },
  {
    q: { en: "How long does setup take?", fr: "Le setup prend combien de temps ?", es: "¿Cuánto tiempo toma la configuración?" },
    a: {
      en: "Starter: 1 week. Pro: 1-2 weeks. Elite: 2 weeks with white-glove onboarding. You keep running your business normally \u2014 we handle everything in the background and go live when ready.",
      fr: "Starter: 1 semaine. Pro: 1-2 semaines. Elite: 2 semaines avec onboarding personnalisé. Tu continues ta business normalement \u2014 on gère tout en background et on part live quand c'est prêt.",
      es: "Starter: 1 semana. Pro: 1-2 semanas. Elite: 2 semanas con acompañamiento personalizado. Tú sigues con tu negocio normalmente \u2014 nosotros manejamos todo en segundo plano y salimos en vivo cuando esté listo.",
    },
  },
  {
    q: { en: "Can I upgrade later?", fr: "Je peux upgrader plus tard ?", es: "¿Puedo mejorar mi plan después?" },
    a: {
      en: "Yes. You pay the difference in setup fees and we add the new features. Most Starter clients upgrade to Pro within 60 days after seeing the ROI.",
      fr: "Oui. Tu paies la différence en frais d'installation et on ajoute les nouvelles fonctionnalités. La plupart des clients Starter upgrade au Pro en 60 jours après avoir vu le ROI.",
      es: "Sí. Pagas la diferencia en costos de instalación y agregamos las nuevas funcionalidades. La mayoría de los clientes Starter se pasan a Pro en 60 días después de ver el ROI.",
    },
  },
];

const T = {
  heroTitle: { en: "We Run Your Business Operations", fr: "On gère tes opérations business", es: "Gestionamos las operaciones de tu negocio" },
  heroAccent: { en: "While You Do the Work", fr: "Pendant que tu fais la job", es: "Mientras tú haces el trabajo" },
  heroSub: {
    en: "Complete AI-powered business management for contractors. From missed calls to paid invoices \u2014 we handle everything so you can focus on the job.",
    fr: "Gestion complète propulsée par IA pour entrepreneurs. Des appels manqués aux factures payées \u2014 on gère tout pour que tu focus sur le terrain.",
    es: "Gestión empresarial completa con IA para contratistas. Desde llamadas perdidas hasta facturas pagadas \u2014 nosotros manejamos todo para que tú te concentres en el trabajo.",
  },
  guarantee: { en: "90-Day Break-Even Guarantee", fr: "Garantie rentabilité 90 jours", es: "Garantía de punto de equilibrio en 90 días" },
  guaranteeSub: {
    en: "If your system doesn't generate enough leads to cover its monthly cost within 90 days, we keep optimizing for free until it does. No hidden fees, no excuses.",
    fr: "Si ton système génère pas assez de leads pour couvrir son coût mensuel en 90 jours, on continue d'optimiser gratuitement jusqu'à ce que ça marche. Pas de frais cachés, pas d'excuses.",
    es: "Si tu sistema no genera suficientes leads para cubrir su costo mensual en 90 días, seguimos optimizando gratis hasta que lo haga. Sin cargos ocultos, sin excusas.",
  },
  choosePlan: { en: "Choose Your Plan", fr: "Choisis ton plan", es: "Elige tu plan" },
  chooseSub: {
    en: "All plans include setup, onboarding, and ongoing support. Pick the level that fits your business.",
    fr: "Tous les plans incluent le setup, l'onboarding et le support continu. Choisis le niveau qui fit ta business.",
    es: "Todos los planes incluyen configuración, integración y soporte continuo. Elige el nivel que se adapte a tu negocio.",
  },
  mostPopular: { en: "Most Popular", fr: "Le plus populaire", es: "Más popular" },
  mo: { en: "mo", fr: "mois", es: "mes" },
  oneTimeSetup: { en: "one-time setup", fr: "installation (une fois)", es: "instalación (una vez)" },
  onboarding: { en: "Onboarding", fr: "Intégration", es: "Integración" },
  bookMyCall: { en: "Book My Strategy Call", fr: "Réserver mon appel", es: "Agendar mi llamada" },
  selectBest: { en: "Select Best Value", fr: "Choisir ce plan", es: "Elegir mejor valor" },
  selectPlan: { en: "Select Plan", fr: "Choisir ce plan", es: "Elegir plan" },
  selected: { en: "Selected", fr: "Sélectionné", es: "Seleccionado" },
  bookStrategy: { en: "Book Your Free Strategy Call", fr: "Réserver ton appel stratégique", es: "Agenda tu llamada estratégica gratis" },
  bookStrategySub: {
    en: "15 minutes. We'll tell you exactly which plan makes sense for your business.",
    fr: "15 minutes. On te dit exactement quel plan fait du sens pour ta business.",
    es: "15 minutos. Te decimos exactamente qué plan tiene sentido para tu negocio.",
  },
  featureComp: { en: "Feature Comparison", fr: "Comparaison des fonctionnalités", es: "Comparación de funcionalidades" },
  feature: { en: "Feature", fr: "Fonctionnalité", es: "Funcionalidad" },
  monthly: { en: "Monthly", fr: "Mensuel", es: "Mensual" },
  replacing: { en: "What You're Replacing", fr: "Ce que tu remplaces", es: "Lo que estás reemplazando" },
  without: { en: "Without BlueWise", fr: "Sans BlueWise", es: "Sin BlueWise" },
  with: { en: "With BlueWise Pro", fr: "Avec BlueWise Pro", es: "Con BlueWise Pro" },
  receptionist: { en: "Receptionist/assistant", fr: "Réceptionniste/assistante", es: "Recepcionista/asistente" },
  crm: { en: "CRM software (GoHighLevel, etc.)", fr: "Logiciel CRM (GoHighLevel, etc.)", es: "Software CRM (GoHighLevel, etc.)" },
  agency: { en: "Marketing agency", fr: "Agence marketing", es: "Agencia de marketing" },
  bookkeeping: { en: "Bookkeeping/admin", fr: "Comptabilité/admin", es: "Contabilidad/admin" },
  included: { en: "Included", fr: "Inclus", es: "Incluido" },
  aiRec: { en: "AI receptionist 24/7", fr: "Réceptionniste IA 24/7", es: "Recepcionista IA 24/7" },
  fullCRM: { en: "Full CRM + dashboard", fr: "CRM + dashboard complet", es: "CRM completo + panel de control" },
  leadCapture: { en: "Lead capture + qualification", fr: "Capture + qualification de leads", es: "Captura + calificación de leads" },
  contracts: { en: "Contracts + invoicing", fr: "Contrats + facturation", es: "Contratos + facturación" },
  save: {
    en: "Save $5,300/mo \u2014 that's $63,600/year back in your pocket.",
    fr: "Économise 5 300 $/mois \u2014 c'est 63 600 $/année de retour dans ta poche.",
    es: "Ahorra $5,300/mes \u2014 son $63,600/año de vuelta a tu bolsillo.",
  },
  faq: { en: "Frequently Asked Questions", fr: "Questions fréquentes", es: "Preguntas frecuentes" },
  ctaTitle: { en: "Ready to Automate Your Business?", fr: "Prêt à automatiser ta business ?", es: "¿Listo para automatizar tu negocio?" },
  ctaSub: {
    en: "Book a 15-minute strategy call. We'll analyze your business and tell you exactly which plan will work.",
    fr: "Appel stratégique de 15 minutes. On analyse ta business et on te dit exactement quel plan va marcher.",
    es: "Agenda una llamada estratégica de 15 minutos. Analizamos tu negocio y te decimos exactamente qué plan funcionará.",
  },
  bookYourCall: { en: "Book Your Strategy Call", fr: "Réserver ton appel", es: "Agenda tu llamada" },
  noCC: { en: "No credit card required", fr: "Pas de carte de crédit", es: "No se requiere tarjeta" },
  guaranteeShort: { en: "90-day guarantee", fr: "Garantie 90 jours", es: "Garantía de 90 días" },
  freeCall: { en: "Free 15-min strategy call", fr: "Appel gratuit de 15 min", es: "Llamada gratis de 15 min" },
};

export default function LeadRescueOffer() {
  const { pathname } = useRouter();
  const locale = getLocale(pathname);
  const lang = locale;
  const prefix = localePath(locale);
  const contactHref = `${prefix}/contact`;

  const [selectedTier, setSelectedTier] = useState("pro");
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => { window.fbq?.("track", "ViewContent", { content_name: "Lead Rescue", content_category: "product" }); }, []);

  return (
    <div className="min-h-screen bg-bg text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 space-y-16">

        {/* HERO */}
        <ScrollReveal>
          <div className="text-center space-y-4 max-w-3xl mx-auto pt-8">
            <h1 className="text-4xl sm:text-5xl font-heading font-bold leading-tight">
              {T.heroTitle[locale]}<br />
              <span className="text-accent">{T.heroAccent[locale]}</span>
            </h1>
            <p className="text-lg text-txt2 max-w-2xl mx-auto leading-relaxed">{T.heroSub[locale]}</p>
          </div>
        </ScrollReveal>

        {/* 90-DAY GUARANTEE */}
        <ScrollReveal>
          <GlowCard className="p-6 md:p-8 text-center" glowColor="rgba(0,212,170,0.15)">
            <div className="flex items-center justify-center gap-3 mb-3">
              <ShieldCheck className="w-8 h-8 text-accent2" />
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white">{T.guarantee[locale]}</h2>
            </div>
            <p className="text-txt2 max-w-2xl mx-auto">{T.guaranteeSub[locale]}</p>
          </GlowCard>
        </ScrollReveal>

        {/* PRICING TIERS */}
        <div className="space-y-8">
          <ScrollReveal>
            <div className="text-center space-y-3">
              <h2 className="text-3xl sm:text-4xl font-heading font-bold">{T.choosePlan[locale]}</h2>
              <p className="text-txt2 text-lg max-w-3xl mx-auto">{T.chooseSub[locale]}</p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {TIERS.map((tier, idx) => {
              const isSelected = selectedTier === tier.id;
              const isPopular = tier.popular;

              const CardWrapper = isPopular ? MovingBorder : "div";
              const wrapperProps = isPopular
                ? { containerClassName: "w-full h-full", className: "p-6 h-full", duration: 3000 }
                : { className: `rounded-xl p-6 border transition-all duration-300 h-full ${isSelected ? "border-accent/50 bg-surface" : "border-border bg-surface hover:border-accent/30"}` };

              return (
                <ScrollReveal key={tier.id} delay={idx * 100}>
                  <CardWrapper {...wrapperProps}>
                    {isPopular && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-medium text-accent mb-4">
                        <Sparkles className="w-3 h-3" />
                        {T.mostPopular[locale]}
                      </div>
                    )}

                    <div className="space-y-5">
                      <div>
                        <h3 className="text-xl font-heading font-bold text-white">{tier.name[lang]}</h3>
                        <p className="text-sm mt-1 text-txt3">{tier.tagline[lang]}</p>
                      </div>

                      <div>
                        <div className="text-4xl font-heading font-bold text-white">
                          ${tier.monthly.toLocaleString()}
                          <span className="text-lg text-txt3 font-normal">/{T.mo[locale]}</span>
                        </div>
                        <div className="text-sm text-txt3 mt-1">
                          + ${tier.setup.toLocaleString()} {T.oneTimeSetup[locale]}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {tier.features[lang].map((f, i) => (
                          <div key={i} className="flex items-start gap-2">
                            {f.included ? <Check className="w-4 h-4 text-accent2 mt-0.5 flex-shrink-0" /> : <X className="w-4 h-4 text-txt3/50 mt-0.5 flex-shrink-0" />}
                            <span className={f.included ? "text-txt" : "text-txt3"}>{f.text}</span>
                          </div>
                        ))}
                      </div>

                      <div className="text-xs text-txt3 pt-2 space-y-1">
                        <div>Support: {tier.support[lang]}</div>
                        <div>{T.onboarding[locale]}: {tier.onboarding[lang]}</div>
                      </div>

                      {isPopular ? (
                        <Link href={`${contactHref}?plan=${tier.id}`}>
                          <ShimmerButton className="w-full py-3 text-sm">
                            {isSelected ? T.bookMyCall[locale] : T.selectBest[locale]}
                          </ShimmerButton>
                        </Link>
                      ) : (
                        <button
                          onClick={() => setSelectedTier(tier.id)}
                          className={`w-full py-3 rounded-lg font-semibold text-sm transition-all cursor-pointer ${isSelected ? "bg-accent text-white shadow-[0_0_15px_rgba(108,99,255,0.3)]" : "bg-surface2 text-txt2 hover:bg-accent/10 border border-border hover:border-accent/30"}`}
                        >
                          {isSelected ? (
                            <span className="flex items-center justify-center gap-2"><Check className="w-4 h-4" />{T.selected[locale]}</span>
                          ) : T.selectPlan[locale]}
                        </button>
                      )}
                    </div>
                  </CardWrapper>
                </ScrollReveal>
              );
            })}
          </div>

          {selectedTier && (
            <ScrollReveal>
              <div className="text-center pt-2">
                <Link href={`${contactHref}?plan=${selectedTier}`}>
                  <ShimmerButton className="text-base px-10 py-4">
                    {T.bookStrategy[locale]}
                    <ArrowRight className="w-4 h-4 ml-2 inline" />
                  </ShimmerButton>
                </Link>
                <p className="text-sm text-txt3 mt-3">{T.bookStrategySub[locale]}</p>
              </div>
            </ScrollReveal>
          )}
        </div>

        {/* FEATURE COMPARISON */}
        <ScrollReveal>
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center">{T.featureComp[locale]}</h2>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-txt3 font-semibold">{T.feature[locale]}</th>
                    <th className="text-center py-3 px-4 text-txt2 font-semibold">Starter</th>
                    <th className="text-center py-3 px-4 text-accent font-semibold">Pro</th>
                    <th className="text-center py-3 px-4 text-txt2 font-semibold">Elite</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4 text-txt2 font-semibold">Setup</td>
                    <td className="py-3 px-4 text-center text-white font-bold">$2,997</td>
                    <td className="py-3 px-4 text-center text-white font-bold">$4,997</td>
                    <td className="py-3 px-4 text-center text-white font-bold">$7,500</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4 text-txt2 font-semibold">{T.monthly[locale]}</td>
                    <td className="py-3 px-4 text-center text-white font-bold">$799/{T.mo[locale]}</td>
                    <td className="py-3 px-4 text-center text-white font-bold">$1,997/{T.mo[locale]}</td>
                    <td className="py-3 px-4 text-center text-white font-bold">$3,997/{T.mo[locale]}</td>
                  </tr>
                  {COMPARISON_FEATURES.map((feat, i) => (
                    <tr key={i} className={`border-b border-border/30 ${i % 2 === 0 ? "bg-surface/50" : ""}`}>
                      <td className="py-3 px-4 text-txt">{feat[lang]}</td>
                      {["starter", "pro", "elite"].map((tid) => {
                        const val = feat[tid];
                        if (typeof val === "boolean") {
                          return (
                            <td key={tid} className="py-3 px-4 text-center">
                              {val ? <Check className="w-4 h-4 text-accent2 mx-auto" /> : <X className="w-4 h-4 text-txt3/30 mx-auto" />}
                            </td>
                          );
                        }
                        const display = typeof val === "object" ? val[lang] : val;
                        return <td key={tid} className="py-3 px-4 text-center text-txt2 text-xs">{display}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-4">
              {TIERS.map((tier) => (
                <GlowCard key={tier.id} className="p-5">
                  <h3 className="text-lg font-heading font-bold text-white mb-3">{tier.name[lang]}</h3>
                  <div className="space-y-2 text-sm">
                    {tier.features[lang].map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {f.included ? <Check className="w-4 h-4 text-accent2 flex-shrink-0" /> : <X className="w-4 h-4 text-txt3/30 flex-shrink-0" />}
                        <span className={f.included ? "text-txt" : "text-txt3"}>{f.text}</span>
                      </div>
                    ))}
                  </div>
                </GlowCard>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* WHAT YOU'RE REPLACING */}
        <ScrollReveal>
          <GlowCard className="p-6 md:p-8">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-6">{T.replacing[locale]}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-xl bg-bg/60 border border-danger/20 p-6">
                <h3 className="font-heading font-semibold text-danger text-lg mb-4">{T.without[locale]}</h3>
                <div className="space-y-2 text-txt2 text-sm">
                  <div className="flex justify-between"><span>{T.receptionist[locale]}</span><strong className="text-danger">$3,500/{T.mo[locale]}</strong></div>
                  <div className="flex justify-between"><span>{T.crm[locale]}</span><strong className="text-danger">$297/{T.mo[locale]}</strong></div>
                  <div className="flex justify-between"><span>{T.agency[locale]}</span><strong className="text-danger">$2,000/{T.mo[locale]}</strong></div>
                  <div className="flex justify-between"><span>{T.bookkeeping[locale]}</span><strong className="text-danger">$1,500/{T.mo[locale]}</strong></div>
                  <div className="h-px bg-border my-3" />
                  <div className="flex justify-between text-lg"><span className="text-danger font-semibold">Total</span><strong className="text-danger text-xl">$7,297/{T.mo[locale]}</strong></div>
                </div>
              </div>

              <div className="rounded-xl bg-bg/60 border border-accent2/20 p-6">
                <h3 className="font-heading font-semibold text-accent2 text-lg mb-4">{T.with[locale]}</h3>
                <div className="space-y-2 text-txt2 text-sm">
                  <div className="flex justify-between"><span>{T.aiRec[locale]}</span><strong className="text-accent2">{T.included[locale]}</strong></div>
                  <div className="flex justify-between"><span>{T.fullCRM[locale]}</span><strong className="text-accent2">{T.included[locale]}</strong></div>
                  <div className="flex justify-between"><span>{T.leadCapture[locale]}</span><strong className="text-accent2">{T.included[locale]}</strong></div>
                  <div className="flex justify-between"><span>{T.contracts[locale]}</span><strong className="text-accent2">{T.included[locale]}</strong></div>
                  <div className="h-px bg-border my-3" />
                  <div className="flex justify-between text-lg"><span className="text-accent2 font-semibold">Total</span><strong className="text-accent2 text-xl">$1,997/{T.mo[locale]}</strong></div>
                </div>
              </div>
            </div>
            <div className="text-center pt-6">
              <p className="text-accent2 font-heading font-semibold text-lg">{T.save[locale]}</p>
            </div>
          </GlowCard>
        </ScrollReveal>

        {/* ROI CALCULATOR */}
        <ScrollReveal>
          <GlowCard className="p-0 overflow-hidden"><ROICalculator /></GlowCard>
        </ScrollReveal>

        {/* FAQ */}
        <ScrollReveal>
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center">{T.faq[locale]}</h2>
            <div className="max-w-3xl mx-auto space-y-3">
              {FAQ_ITEMS.map((item, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={i} className="rounded-xl bg-surface border border-border overflow-hidden transition-colors hover:border-accent/30">
                    <button onClick={() => setOpenFaq(isOpen ? null : i)} className="w-full flex justify-between items-center p-5 text-left cursor-pointer">
                      <span className="font-semibold text-white pr-4 text-sm sm:text-base">{item.q[lang]}</span>
                      <ChevronDown className={`w-5 h-5 text-txt3 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-60 pb-5" : "max-h-0"}`}>
                      <p className="text-txt2 text-sm px-5 leading-relaxed">{item.a[lang]}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* FINAL CTA */}
        <ScrollReveal>
          <AuroraBackground className="rounded-2xl p-8 md:p-14 text-center">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-4 text-white">{T.ctaTitle[locale]}</h2>
            <p className="text-txt2 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">{T.ctaSub[locale]}</p>
            <Link href={contactHref}>
              <ShimmerButton className="text-lg px-10 py-4">{T.bookYourCall[locale]}</ShimmerButton>
            </Link>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center items-center text-txt3 text-xs mt-8">
              <div className="flex items-center gap-2"><CreditCard className="w-3.5 h-3.5" /><span>{T.noCC[locale]}</span></div>
              <div className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /><span>{T.guaranteeShort[locale]}</span></div>
              <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /><span>{T.freeCall[locale]}</span></div>
            </div>
          </AuroraBackground>
        </ScrollReveal>
      </div>
    </div>
  );
}
