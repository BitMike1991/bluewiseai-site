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

const STEPS_EN = [
  {
    icon: PhoneIncoming,
    title: "Free Audit Call",
    time: "15 minutes",
    desc: "We get on a call and look at your business: how many calls you get, how many you miss, your average job value, and what tools you're using now. No sales pitch \u2014 just honest numbers and a clear recommendation.",
    bullets: [
      "Calculate your current revenue loss",
      "Identify your biggest automation opportunities",
      "Recommend the right plan (or tell you we're not the right fit)",
    ],
  },
  {
    icon: Brain,
    title: "We Build Your System",
    time: "1-2 weeks",
    desc: "You keep running your business. We build everything in the background: your AI receptionist, CRM dashboard, SMS engine, automation workflows, and whatever your plan includes. When it's ready, we go live together.",
    bullets: [
      "Custom phone number or port your existing one",
      "AI trained on your specific business and services",
      "Dashboard configured with your branding",
      "Test calls and SMS before going live",
    ],
  },
  {
    icon: TrendingUp,
    title: "We Run & Optimize",
    time: "ongoing",
    desc: "Your system runs 24/7. We monitor everything, fix issues before you notice them, and optimize based on real data. Every month, your system gets better. You just focus on the work.",
    bullets: [
      "24/7 monitoring and error handling",
      "Monthly optimization based on your lead data",
      "Priority support (response times depend on plan)",
      "No contracts \u2014 cancel anytime",
    ],
  },
];

const STEPS_FR = [
  {
    icon: PhoneIncoming,
    title: "Appel audit gratuit",
    time: "15 minutes",
    desc: "On fait un call et on regarde ta business : combien d'appels tu reçois, combien tu manques, ta valeur moyenne de contrat et les outils que tu utilises. Pas de pitch de vente \u2014 juste des vrais chiffres et une recommandation claire.",
    bullets: [
      "Calcul de ta perte de revenus actuelle",
      "Identification de tes plus grandes opportunités d'automatisation",
      "Recommandation du bon plan (ou on te dit si on est pas le bon fit)",
    ],
  },
  {
    icon: Brain,
    title: "On build ton système",
    time: "1-2 semaines",
    desc: "Tu continues ta business. On build tout en background : ta réceptionniste IA, ton dashboard CRM, ton moteur SMS, tes workflows d'automatisation et tout ce que ton plan inclut. Quand c'est prêt, on part live ensemble.",
    bullets: [
      "Numéro de téléphone custom ou port de ton existant",
      "IA entraînée sur ta business et tes services spécifiques",
      "Dashboard configuré avec ton branding",
      "Appels test et SMS avant le go-live",
    ],
  },
  {
    icon: TrendingUp,
    title: "On roule et optimise",
    time: "continu",
    desc: "Ton système roule 24/7. On monitor tout, on fix les issues avant que tu les remarques et on optimise basé sur des vraies données. Chaque mois, ton système s'améliore. Toi tu focus sur le terrain.",
    bullets: [
      "Monitoring et gestion d'erreurs 24/7",
      "Optimisation mensuelle basée sur tes données de leads",
      "Support prioritaire (temps de réponse selon le plan)",
      "Pas de contrat \u2014 annule quand tu veux",
    ],
  },
];

const FEATURES_EN = [
  { icon: Phone, title: "AI Voice Agent", desc: "Answers calls 24/7, qualifies leads, collects job details. Sounds human, never gets tired.", tier: "Pro+" },
  { icon: MessageSquare, title: "Smart SMS Engine", desc: "Instant text-back on missed calls. Collects photos, details, and keeps leads warm.", tier: "All plans" },
  { icon: LayoutDashboard, title: "CRM Dashboard", desc: "Every lead, job, and conversation in one real-time interface. Mobile-friendly.", tier: "All plans" },
  { icon: FileText, title: "Automated Quotes", desc: "AI generates quotes from conversations. Client accepts with one click.", tier: "Pro+" },
  { icon: FileSignature, title: "Digital Contracts", desc: "Professional contracts with e-signatures. Automated deposit requests.", tier: "Pro+" },
  { icon: DollarSign, title: "Financial Tracking", desc: "Payments, expenses, receipts \u2014 all logged automatically. Accountant-ready exports.", tier: "Pro+" },
  { icon: PhoneIncoming, title: "Lead Capture Forms", desc: "Website forms that feed directly into your pipeline. No manual entry.", tier: "All plans" },
  { icon: Megaphone, title: "Meta Ads Management", desc: "We run your Facebook/Instagram ads and feed leads directly into your system.", tier: "Elite" },
];

const FEATURES_FR = [
  { icon: Phone, title: "Agent vocal IA", desc: "Répond aux appels 24/7, qualifie les leads, collecte les détails du job. Sonne humain, jamais fatigué.", tier: "Pro+" },
  { icon: MessageSquare, title: "Moteur SMS intelligent", desc: "Texto instantané sur appels manqués. Collecte photos, détails et garde les leads chauds.", tier: "Tous les plans" },
  { icon: LayoutDashboard, title: "Dashboard CRM", desc: "Chaque lead, job et conversation dans une interface temps réel. Mobile-friendly.", tier: "Tous les plans" },
  { icon: FileText, title: "Soumissions automatisées", desc: "L'IA génère des soumissions à partir des conversations. Le client accepte en un clic.", tier: "Pro+" },
  { icon: FileSignature, title: "Contrats numériques", desc: "Contrats professionnels avec e-signatures. Demandes de dépôt automatisées.", tier: "Pro+" },
  { icon: DollarSign, title: "Suivi financier", desc: "Paiements, dépenses, reçus \u2014 tout loggé automatiquement. Exports prêts pour le comptable.", tier: "Pro+" },
  { icon: PhoneIncoming, title: "Formulaires de capture", desc: "Formulaires web qui alimentent directement ton pipeline. Pas d'entrée manuelle.", tier: "Tous les plans" },
  { icon: Megaphone, title: "Gestion publicité Meta", desc: "On roule tes pubs Facebook/Instagram et on feed les leads directement dans ton système.", tier: "Elite" },
];

const REPLACEMENTS_EN = [
  { item: "Receptionist / Office admin", cost: "$3,500/mo", bw: "AI handles it 24/7" },
  { item: "CRM software (GoHighLevel, Jobber, etc.)", cost: "$200-400/mo", bw: "Built-in dashboard" },
  { item: "Marketing agency or lead gen", cost: "$1,500-3,000/mo", bw: "AI captures & qualifies leads" },
  { item: "Bookkeeping / invoicing", cost: "$500-1,500/mo", bw: "Auto-tracking & receipts" },
  { item: "Answering service", cost: "$200-500/mo", bw: "AI voice agent included" },
];

const REPLACEMENTS_FR = [
  { item: "Réceptionniste / Admin bureau", cost: "3 500 $/mois", bw: "L'IA gère 24/7" },
  { item: "Logiciel CRM (GoHighLevel, Jobber, etc.)", cost: "200-400 $/mois", bw: "Dashboard intégré" },
  { item: "Agence marketing ou génération de leads", cost: "1 500-3 000 $/mois", bw: "L'IA capture et qualifie les leads" },
  { item: "Comptabilité / facturation", cost: "500-1 500 $/mois", bw: "Suivi auto et reçus" },
  { item: "Service de réponse téléphonique", cost: "200-500 $/mois", bw: "Agent vocal IA inclus" },
];

export default function Services() {
  const { pathname } = useRouter();
  const isFr = pathname.startsWith("/fr");
  const contactHref = isFr ? "/fr/contact" : "/contact";
  const pricingHref = isFr ? "/fr/lead-rescue" : "/lead-rescue";
  const steps = isFr ? STEPS_FR : STEPS_EN;
  const features = isFr ? FEATURES_FR : FEATURES_EN;
  const replacements = isFr ? REPLACEMENTS_FR : REPLACEMENTS_EN;

  return (
    <div className="min-h-screen bg-bg text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 space-y-16">

        {/* HERO */}
        <ScrollReveal>
          <div className="text-center space-y-4 pt-8">
            <h1 className="text-4xl sm:text-5xl font-heading font-bold">
              {isFr ? "Comment ça marche" : "How It Works"}
            </h1>
            <p className="text-lg text-txt2 max-w-2xl mx-auto leading-relaxed">
              {isFr
                ? "De ton premier appel à ton dixième client \u2014 voici exactement ce qui se passe quand tu travailles avec BlueWise."
                : "From your first call to your tenth client \u2014 here's exactly what happens when you work with BlueWise."}
            </p>
          </div>
        </ScrollReveal>

        {/* 3-STEP PROCESS */}
        <div className="space-y-6">
          {steps.map((step, i) => (
            <ScrollReveal key={step.title} delay={i * 100}>
              <GlowCard
                className="p-6 md:p-8"
                glowColor={
                  i === 1
                    ? "rgba(0,212,170,0.12)"
                    : "rgba(108,99,255,0.12)"
                }
              >
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div
                    className={`flex-shrink-0 w-14 h-14 rounded-2xl border flex items-center justify-center ${
                      i === 1
                        ? "bg-accent2/10 border-accent2/30"
                        : "bg-accent/10 border-accent/30"
                    }`}
                  >
                    <step.icon
                      className={`w-6 h-6 ${
                        i === 1 ? "text-accent2" : "text-accent"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3 mb-2">
                      <h2 className="text-2xl font-heading font-bold text-white">
                        {step.title}
                      </h2>
                      <span className="text-txt3 text-sm">({step.time})</span>
                    </div>
                    <p className="text-txt2 mb-4 leading-relaxed">
                      {step.desc}
                    </p>
                    <ul className="space-y-2">
                      {step.bullets.map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-2 text-txt2 text-sm"
                        >
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
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center mb-2">
              {isFr ? "Ce que tu remplaces" : "What You're Replacing"}
            </h2>
            <p className="text-txt3 text-center max-w-2xl mx-auto text-sm mb-8">
              {isFr
                ? "La plupart des entrepreneurs assemblent 4-5 outils et personnes différentes pour gérer leur business. BlueWise remplace tout en une plateforme."
                : "Most contractors piece together 4-5 different tools and people to manage their business. BlueWise replaces all of them in one platform."}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-txt3 font-semibold">
                      {isFr ? "Ce que tu paies maintenant" : "What you're paying for now"}
                    </th>
                    <th className="text-center py-3 px-4 text-danger font-semibold">
                      {isFr ? "Coût actuel" : "Current Cost"}
                    </th>
                    <th className="text-center py-3 px-4 text-accent2 font-semibold">
                      {isFr ? "Avec BlueWise" : "With BlueWise"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {replacements.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-border/30 ${
                        i % 2 === 0 ? "bg-surface/30" : ""
                      }`}
                    >
                      <td className="py-3 px-4 text-txt">{row.item}</td>
                      <td className="py-3 px-4 text-center text-danger font-semibold">
                        {row.cost}
                      </td>
                      <td className="py-3 px-4 text-center text-accent2">
                        {row.bw}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border">
                    <td className="py-3 px-4 text-white font-bold">Total</td>
                    <td className="py-3 px-4 text-center text-danger font-bold text-lg">
                      {isFr ? "6 000-8 900 $/mois" : "$6,000-8,900/mo"}
                    </td>
                    <td className="py-3 px-4 text-center text-accent2 font-bold text-lg">
                      {isFr
                        ? `À partir de ${PRICING.starter.monthly} $/mois`
                        : `From $${PRICING.starter.monthly}/mo`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </GlowCard>
        </ScrollReveal>

        {/* FEATURE GRID */}
        <div className="space-y-6">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center">
              {isFr ? "Ce qui est inclus" : "What's Included"}
            </h2>
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
                      <h3 className="font-heading font-semibold text-white">
                        {f.title}
                      </h3>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                        f.tier === "All plans" || f.tier === "Tous les plans"
                          ? "bg-accent/10 text-accent border border-accent/20"
                          : f.tier === "Elite"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-accent2/10 text-accent2 border border-accent2/20"
                      }`}
                    >
                      {f.tier}
                    </span>
                  </div>
                  <p className="text-txt2 text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </GlowCard>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* CTA */}
        <ScrollReveal>
          <AuroraBackground className="rounded-2xl p-8 md:p-12 text-center">
            <h3 className="text-2xl sm:text-3xl font-heading font-bold mb-3 text-white">
              {isFr
                ? "Prêt à arrêter de tout faire toi-même ?"
                : "Ready to Stop Doing Everything Yourself?"}
            </h3>
            <p className="text-txt2 mb-8 max-w-2xl mx-auto leading-relaxed">
              {isFr
                ? "Réserve un appel audit de 15 minutes. On te montre exactement où l'automatisation peut te sauver du temps et de l'argent."
                : "Book a 15-minute audit call. We'll show you exactly where automation can save you time and money."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={contactHref}>
                <ShimmerButton className="text-base px-8 py-4 w-full sm:w-auto">
                  {isFr ? "Réserver un appel audit" : "Book Free Audit Call"}
                </ShimmerButton>
              </Link>
              <Link
                href={pricingHref}
                className="rounded-lg px-8 py-4 text-base font-semibold
                           border border-border hover:border-accent/50
                           text-txt2 hover:text-white
                           transition-all duration-300 text-center cursor-pointer"
              >
                {isFr ? "Voir les plans et prix" : "See Plans & Pricing"}
              </Link>
            </div>
          </AuroraBackground>
        </ScrollReveal>
      </div>
    </div>
  );
}
