import Link from "next/link";
import Image from "next/image";
import {
  Globe,
  Camera,
  TrendingUp,
  Check,
  Palette,
  Store,
  BarChart3,
  Megaphone,
  Package,
  MessageCircle,
  Star,
  ArrowRight,
} from "lucide-react";
import { GlowCard } from "@/components/ui/GlowCard";
import { ShimmerButton } from "@/components/ui/ShimmerButton";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { AuroraBackground } from "@/components/ui/AuroraBackground";

const TIERS = [
  {
    name: "Vitrina",
    tagline: "Montre ton art au monde",
    price: 49,
    setup: 299,
    color: "accent",
    features: [
      "Site web premium bilingue (5-7 pages)",
      "Domaine custom connecté",
      "15 photos de produits optimisées",
      "Formulaire de contact + WhatsApp",
      "Design responsive mobile",
      "SEO de base configuré",
      "Hébergé et maintenu par BlueWise",
    ],
    notIncluded: [
      "Boutique Etsy",
      "Gestion de publicité",
      "Rapports mensuels",
    ],
  },
  {
    name: "Mercado",
    tagline: "Vends en ligne, gagne même en dormant",
    price: 149,
    setup: 499,
    color: "accent2",
    popular: true,
    features: [
      "Tout ce qui est dans Vitrina",
      "Boutique Etsy créée et configurée",
      "Jusqu'à 30 listings avec SEO",
      "Titres, tags et descriptions professionnels",
      "Photos optimisées pour Etsy",
      "Profil d'expédition configuré",
      "Mises à jour mensuelles de l'inventaire",
      "Support prioritaire WhatsApp",
    ],
    notIncluded: [
      "Gestion de publicité",
      "Contenu Instagram",
    ],
  },
  {
    name: "Imperio",
    tagline: "Domine ton marché",
    price: 349,
    setup: 799,
    color: "amber-400",
    features: [
      "Tout ce qui est dans Mercado",
      "40+ listings de produits",
      "Gestion et optimisation Etsy Ads",
      "Meta Ads (Facebook/Instagram)",
      "Templates de contenu Instagram",
      "Rapport de performance mensuel",
      "Gestion de l'inventaire et des prix",
      "Support WhatsApp prioritaire",
      "Appel stratégie trimestriel",
    ],
    notIncluded: [],
  },
];

const PROCESS = [
  {
    icon: Camera,
    title: "Envoie-nous tes photos",
    time: "Jour 1",
    desc: "Prends tes pièces en photo avec ton cell. On s'occupe du reste — retrait de fond, optimisation et présentation professionnelle. Toi tu crées, nous on fait briller ton art en ligne.",
  },
  {
    icon: Globe,
    title: "On build tout",
    time: "48 heures",
    desc: "Ton site web premium est en ligne. Ta boutique Etsy est listée avec des titres et descriptions optimisés pour le SEO. Tes produits sont devant des millions d'acheteurs dans le monde. T'as pas levé le petit doigt.",
  },
  {
    icon: TrendingUp,
    title: "Tu gagnes, on optimise",
    time: "En continu",
    desc: "Les commandes commencent à rentrer. On gère ta présence en ligne, on met à jour l'inventaire, on roule les pubs et on t'envoie un rapport mensuel. Toi tu continues de faire ce que t'aimes — créer des pièces magnifiques.",
  },
];

const PAIN_POINTS = [
  { problem: "Des heures au marché sous le soleil", solution: "Les ventes arrivent 24/7 de partout dans le monde" },
  { problem: "Aucune présence en ligne", solution: "Site web premium + boutique Etsy avec 90M+ acheteurs" },
  { problem: "Photos de produits sur des draps blancs", solution: "Photos professionnelles optimisées pour la vente en ligne" },
  { problem: "Aucune idée comment le SEO ou Etsy fonctionne", solution: "On gère toute la tech — toi tu crées" },
  { problem: "Les revenus dépendent du trafic piéton", solution: "Plusieurs sources de revenus : Etsy, site web, vente en gros" },
  { problem: "Impossible de rejoindre les acheteurs internationaux", solution: "Site bilingue + Etsy expédie partout dans le monde" },
];

const FEATURES = [
  { icon: Globe, title: "Site web premium", desc: "Site bilingue de 5-7 pages qui a l'air d'un build à 5 000 $. Ta marque, ton histoire, ton art — présenté avec classe." },
  { icon: Store, title: "Gestion boutique Etsy", desc: "Setup complet de la boutique, listings avec titres et tags SEO, profils d'expédition et gestion continue." },
  { icon: Camera, title: "Optimisation des photos", desc: "On transforme tes photos de cell en shots de produits professionnels. Fonds clean, style uniforme." },
  { icon: Palette, title: "Identité de marque", desc: "Logo, palette de couleurs, typographie — une marque cohérente qui dit « artisan premium » pas « stand de marché »." },
  { icon: Megaphone, title: "Gestion de publicité", desc: "Etsy Ads et Meta Ads configurés et optimisés pour amener les acheteurs directement à tes produits." },
  { icon: BarChart3, title: "Rapports mensuels", desc: "Des rapports clairs qui montrent tes vues, ventes et croissance. On t'explique ce qui marche et ce qu'on améliore." },
  { icon: Package, title: "Mises à jour inventaire", desc: "Nouvelles pièces ? Articles vendus ? On met à jour ta boutique et ton site pour que tout reste à jour." },
  { icon: MessageCircle, title: "Support WhatsApp", desc: "Des questions ? Des changements ? Écris-nous sur WhatsApp. On répond vite parce que ta business compte." },
];

export default function ArtisanFr() {
  return (
    <div className="min-h-screen bg-bg text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 space-y-20">

        {/* HERO */}
        <ScrollReveal>
          <div className="text-center space-y-6 pt-8">
            <span className="text-accent text-sm font-semibold tracking-widest uppercase">
              BlueWise Artisan
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold leading-tight">
              Toi tu crées l&apos;art.<br />
              <span className="text-accent2">Nous, on le vend au monde.</span>
            </h1>
            <p className="text-lg text-txt2 max-w-2xl mx-auto leading-relaxed">
              Site web premium, boutique Etsy et marketing digital — tout géré pour toi.
              Toi tu focus sur ton craft. Nous on t&apos;amène les acheteurs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <ShimmerButton className="px-8 py-3.5">
                <Link href="/fr/contact" className="flex items-center gap-2">
                  Commencer <ArrowRight className="w-4 h-4" />
                </Link>
              </ShimmerButton>
              <a
                href="https://talaveracasajuarez.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3.5 border border-border rounded-xl text-txt hover:text-white hover:border-accent/50 transition-colors text-center cursor-pointer"
              >
                Voir un exemple live
              </a>
            </div>
          </div>
        </ScrollReveal>

        {/* LIVE EXAMPLE */}
        <ScrollReveal>
          <GlowCard className="p-6 md:p-8" glowColor="rgba(0,212,170,0.12)">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-accent2 text-xs font-semibold tracking-widest uppercase">Étude de cas</span>
                <h2 className="text-2xl font-heading font-bold text-white mt-2 mb-4">
                  Talavera Casa Juárez
                </h2>
                <p className="text-txt2 leading-relaxed mb-4">
                  Un atelier familial de poterie à Puebla, au Mexique. Ils vendaient uniquement dans les marchés locaux.
                  On a bâti leur présence en ligne complète en une journée — site web bilingue premium,
                  42 photos de produits optimisées, formulaire de contact et intégration WhatsApp.
                </p>
                <a
                  href="https://talaveracasajuarez.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-accent2 font-semibold text-sm hover:underline cursor-pointer"
                >
                  Visiter talaveracasajuarez.com <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                <Image
                  src="https://talaveracasajuarez.com/photos/plate-baroque-blue-gold.jpg"
                  alt="Talavera Casa Juárez — plat céramique artisanal"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </GlowCard>
        </ScrollReveal>

        {/* THE PROBLEM */}
        <div className="space-y-6">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center">
              Ça te dit quelque chose ?
            </h2>
            <p className="text-txt3 text-center max-w-2xl mx-auto text-sm mt-2">
              La plupart des artisans perdent des milliers en revenus potentiels parce qu&apos;ils vendent seulement en personne. On règle ça.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <GlowCard className="p-6 md:p-8">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-danger font-semibold">Le problème</th>
                      <th className="text-left py-3 px-4 text-accent2 font-semibold">Avec BlueWise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PAIN_POINTS.map((row, i) => (
                      <tr key={i} className={`border-b border-border/30 ${i % 2 === 0 ? "bg-surface/30" : ""}`}>
                        <td className="py-3 px-4 text-txt2">{row.problem}</td>
                        <td className="py-3 px-4 text-accent2">{row.solution}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlowCard>
          </ScrollReveal>
        </div>

        {/* HOW IT WORKS */}
        <div className="space-y-6">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center">
              Comment ça marche
            </h2>
          </ScrollReveal>

          {PROCESS.map((step, i) => (
            <ScrollReveal key={step.title} delay={i * 100}>
              <GlowCard className="p-6 md:p-8" glowColor={i === 1 ? "rgba(0,212,170,0.12)" : "rgba(108,99,255,0.12)"}>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className={`flex-shrink-0 w-14 h-14 rounded-2xl border flex items-center justify-center ${i === 1 ? "bg-accent2/10 border-accent2/30" : "bg-accent/10 border-accent/30"}`}>
                    <step.icon className={`w-6 h-6 ${i === 1 ? "text-accent2" : "text-accent"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3 mb-2">
                      <h3 className="text-2xl font-heading font-bold text-white">{step.title}</h3>
                      <span className="text-txt3 text-sm">({step.time})</span>
                    </div>
                    <p className="text-txt2 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </GlowCard>
            </ScrollReveal>
          ))}
        </div>

        {/* PRICING TIERS */}
        <div className="space-y-6">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center">
              Prix simples et transparents
            </h2>
            <p className="text-txt3 text-center max-w-2xl mx-auto text-sm mt-2">
              Pas de frais cachés. Pas de contrat. Annule quand tu veux. Un artisan à la fois, avec toute notre attention.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {TIERS.map((tier, i) => (
              <ScrollReveal key={tier.name} delay={i * 100}>
                <GlowCard
                  className={`p-6 h-full flex flex-col ${tier.popular ? "ring-2 ring-accent2/50" : ""}`}
                  glowColor={tier.popular ? "rgba(0,212,170,0.15)" : "rgba(108,99,255,0.08)"}
                >
                  {tier.popular && (
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-4 h-4 text-accent2 fill-accent2" />
                      <span className="text-accent2 text-xs font-bold uppercase tracking-wider">Le plus populaire</span>
                    </div>
                  )}
                  <h3 className="text-2xl font-heading font-bold text-white">{tier.name}</h3>
                  <p className="text-txt3 text-sm mt-1 mb-4">{tier.tagline}</p>

                  <div className="mb-1">
                    <span className="text-4xl font-heading font-bold text-white">{tier.price} $</span>
                    <span className="text-txt3 text-sm">/mois</span>
                  </div>
                  <p className="text-txt3 text-xs mb-6">{tier.setup} $ de setup unique</p>

                  <ul className="space-y-2.5 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-txt2">
                        <Check className="w-4 h-4 text-accent2 mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/fr/contact"
                    className={`mt-6 block text-center py-3 rounded-xl font-semibold text-sm transition-colors cursor-pointer ${
                      tier.popular
                        ? "bg-accent2 text-bg hover:bg-accent2/90"
                        : "border border-border text-txt hover:text-white hover:border-accent/50"
                    }`}
                  >
                    Commencer
                  </Link>
                </GlowCard>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* WHAT'S INCLUDED */}
        <div className="space-y-6">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center">
              Tout ce qu&apos;il te faut pour vendre en ligne
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 80}>
                <GlowCard className="p-5 h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <f.icon className="w-4 h-4 text-accent" />
                    </div>
                    <h3 className="font-heading font-semibold text-white">{f.title}</h3>
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
            <h3 className="text-2xl sm:text-3xl font-heading font-bold mb-3 text-white">
              Prêt à mettre ton art en ligne ?
            </h3>
            <p className="text-txt2 mb-8 max-w-2xl mx-auto leading-relaxed">
              Ton craft mérite d&apos;être vu par le monde entier. Laisse-nous gérer le côté digital
              pendant que toi tu fais ce que tu fais de mieux — créer des belles choses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <ShimmerButton className="px-8 py-3.5">
                <Link href="/fr/contact" className="flex items-center gap-2">
                  Commence ton parcours <ArrowRight className="w-4 h-4" />
                </Link>
              </ShimmerButton>
              <a
                href="https://wa.me/15144184743"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3.5 border border-border rounded-xl text-txt hover:text-white hover:border-accent/50 transition-colors cursor-pointer"
              >
                Écris-nous sur WhatsApp
              </a>
            </div>
          </AuroraBackground>
        </ScrollReveal>

      </div>
    </div>
  );
}
