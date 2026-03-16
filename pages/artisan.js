import { useRouter } from "next/router";
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
import { getLocale, localePath } from "@/lib/locale";

const T = {
  badge: "BlueWise Artisan",
  heroTitle1: { en: "You Create the Art.", fr: "Tu crées l'art.", es: "Tú creas el arte." },
  heroTitle2: { en: "We Sell It to the World.", fr: "On le vend au monde.", es: "Nosotros lo vendemos al mundo." },
  heroSub: {
    en: "Premium website, Etsy shop, and digital marketing — all managed for you. You focus on your craft. We bring buyers to your door.",
    fr: "Site web premium, boutique Etsy et marketing digital — tout géré pour toi. Tu te concentres sur ton art. On amène les acheteurs chez toi.",
    es: "Sitio web premium, tienda Etsy y marketing digital — todo gestionado para ti. Tú te enfocas en tu arte. Nosotros traemos compradores a tu puerta.",
  },
  getStarted: { en: "Get Started", fr: "Commencer", es: "Comenzar" },
  liveExample: { en: "See a Live Example", fr: "Voir un exemple", es: "Ver ejemplo en vivo" },
  caseStudy: { en: "Case Study", fr: "Étude de cas", es: "Caso de éxito" },
  tcjDesc: {
    en: "A family pottery workshop in Puebla, Mexico. They sold only at local markets. We built their full online presence in one day — premium bilingual website, 42 product photos optimized, contact form, and WhatsApp integration.",
    fr: "Un atelier de poterie familial à Puebla, Mexique. Ils vendaient uniquement aux marchés locaux. On a bâti leur présence en ligne complète en un jour — site bilingue premium, 42 photos optimisées, formulaire de contact et intégration WhatsApp.",
    es: "Un taller familiar de cerámica en Puebla, México. Solo vendían en mercados locales. Construimos toda su presencia en línea en un día — sitio web bilingüe premium, 42 fotos de productos optimizadas, formulario de contacto e integración con WhatsApp.",
  },
  visitSite: { en: "Visit talaveracasajuarez.com", fr: "Visiter talaveracasajuarez.com", es: "Visitar talaveracasajuarez.com" },
  soundFamiliar: { en: "Sound Familiar?", fr: "Ça te dit quelque chose ?", es: "¿Te suena familiar?" },
  soundFamiliarSub: {
    en: "Most artisans lose thousands in potential revenue because they only sell in person. We fix that.",
    fr: "La plupart des artisans perdent des milliers en revenus potentiels parce qu'ils vendent seulement en personne. On règle ça.",
    es: "La mayoría de los artesanos pierden miles en ingresos potenciales porque solo venden en persona. Nosotros resolvemos eso.",
  },
  theProblem: { en: "The Problem", fr: "Le problème", es: "El problema" },
  withBW: { en: "With BlueWise", fr: "Avec BlueWise", es: "Con BlueWise" },
  howItWorks: { en: "How It Works", fr: "Comment ça marche", es: "Cómo funciona" },
  pricing: { en: "Simple, Transparent Pricing", fr: "Prix simples et transparents", es: "Precios simples y transparentes" },
  pricingSub: {
    en: "No hidden fees. No contracts. Cancel anytime. One artisan at a time, with full attention.",
    fr: "Pas de frais cachés. Pas de contrat. Annule quand tu veux. Un artisan à la fois, avec toute l'attention.",
    es: "Sin cargos ocultos. Sin contratos. Cancela cuando quieras. Un artesano a la vez, con toda la atención.",
  },
  mostPopular: { en: "Most Popular", fr: "Le plus populaire", es: "Más popular" },
  everythingTitle: { en: "Everything You Need to Sell Online", fr: "Tout pour vendre en ligne", es: "Todo lo que necesitas para vender en línea" },
  ctaTitle: { en: "Ready to Bring Your Art Online?", fr: "Prêt à mettre ton art en ligne ?", es: "¿Listo para llevar tu arte al mundo digital?" },
  ctaSub: {
    en: "Your craft deserves to be seen by the world. Let us handle the digital side while you focus on what you do best — creating beautiful things.",
    fr: "Ton art mérite d'être vu par le monde. On gère le digital pendant que tu fais ce que tu fais de mieux — créer de belles choses.",
    es: "Tu arte merece ser visto por el mundo. Nosotros nos encargamos de lo digital mientras tú te enfocas en lo que mejor sabes hacer — crear cosas hermosas.",
  },
  startJourney: { en: "Start Your Journey", fr: "Commencer", es: "Comienza tu camino" },
  whatsapp: { en: "Message Us on WhatsApp", fr: "Écris-nous sur WhatsApp", es: "Escríbenos por WhatsApp" },
};

const TIERS = {
  en: [
    { name: "Vitrina", tagline: "Show your art to the world", price: 49, setup: 299, color: "accent", features: ["Premium bilingual website (5-7 pages)", "Custom domain connected", "15 product photos optimized", "Contact form + WhatsApp integration", "Mobile responsive design", "SEO basics configured", "Hosted & maintained by BlueWise"], notIncluded: ["Etsy shop", "Ads management", "Monthly analytics"] },
    { name: "Mercado", tagline: "Sell online, earn while you sleep", price: 149, setup: 499, color: "accent2", popular: true, features: ["Everything in Vitrina", "Etsy shop setup & configuration", "Up to 30 product listings with SEO", "Professional titles, tags & descriptions", "Product photos optimized for Etsy", "Shipping profile configured", "Monthly inventory updates", "WhatsApp priority support"], notIncluded: ["Ads management", "Instagram content"] },
    { name: "Imperio", tagline: "Dominate your market", price: 349, setup: 799, color: "amber-400", features: ["Everything in Mercado", "40+ product listings", "Etsy Ads management & optimization", "Meta Ads (Facebook/Instagram)", "Instagram content templates", "Monthly performance report", "Inventory & pricing management", "Priority WhatsApp support", "Quarterly strategy call"], notIncluded: [] },
  ],
  fr: [
    { name: "Vitrina", tagline: "Montre ton art au monde", price: 49, setup: 299, color: "accent", features: ["Site web bilingue premium (5-7 pages)", "Domaine personnalisé connecté", "15 photos de produits optimisées", "Formulaire de contact + intégration WhatsApp", "Design adaptatif mobile", "SEO de base configuré", "Hébergé et maintenu par BlueWise"], notIncluded: ["Boutique Etsy", "Gestion de publicité", "Analytiques mensuels"] },
    { name: "Mercado", tagline: "Vends en ligne, gagne en dormant", price: 149, setup: 499, color: "accent2", popular: true, features: ["Tout dans Vitrina", "Boutique Etsy configurée", "Jusqu'à 30 produits listés avec SEO", "Titres, tags et descriptions professionnels", "Photos optimisées pour Etsy", "Profil d'expédition configuré", "Mises à jour d'inventaire mensuelles", "Support WhatsApp prioritaire"], notIncluded: ["Gestion de publicité", "Contenu Instagram"] },
    { name: "Imperio", tagline: "Domine ton marché", price: 349, setup: 799, color: "amber-400", features: ["Tout dans Mercado", "40+ produits listés", "Gestion et optimisation Etsy Ads", "Publicités Meta (Facebook/Instagram)", "Templates de contenu Instagram", "Rapport de performance mensuel", "Gestion d'inventaire et prix", "Support WhatsApp prioritaire", "Appel stratégique trimestriel"], notIncluded: [] },
  ],
  es: [
    { name: "Vitrina", tagline: "Muestra tu arte al mundo", price: 49, setup: 299, color: "accent", features: ["Sitio web bilingüe premium (5-7 páginas)", "Dominio personalizado conectado", "15 fotos de productos optimizadas", "Formulario de contacto + integración WhatsApp", "Diseño responsivo para móvil", "SEO básico configurado", "Alojado y mantenido por BlueWise"], notIncluded: ["Tienda Etsy", "Gestión de anuncios", "Analíticas mensuales"] },
    { name: "Mercado", tagline: "Vende en línea, gana mientras duermes", price: 149, setup: 499, color: "accent2", popular: true, features: ["Todo lo de Vitrina", "Tienda Etsy configurada", "Hasta 30 productos listados con SEO", "Títulos, etiquetas y descripciones profesionales", "Fotos optimizadas para Etsy", "Perfil de envío configurado", "Actualizaciones de inventario mensuales", "Soporte WhatsApp prioritario"], notIncluded: ["Gestión de anuncios", "Contenido Instagram"] },
    { name: "Imperio", tagline: "Domina tu mercado", price: 349, setup: 799, color: "amber-400", features: ["Todo lo de Mercado", "40+ productos listados", "Gestión y optimización de Etsy Ads", "Meta Ads (Facebook/Instagram)", "Plantillas de contenido Instagram", "Reporte de rendimiento mensual", "Gestión de inventario y precios", "Soporte WhatsApp prioritario", "Llamada estratégica trimestral"], notIncluded: [] },
  ],
};

const PROCESS = {
  en: [
    { icon: Camera, title: "Send Us Your Photos", time: "Day 1", desc: "Take photos of your pieces with your phone. We handle the rest — background removal, optimization, and professional presentation. You create art, we make it look incredible online." },
    { icon: Globe, title: "We Build Everything", time: "48 hours", desc: "Your premium website goes live. Your Etsy shop gets listed with SEO-optimized titles and descriptions. Your products are in front of millions of buyers worldwide. You didn't lift a finger." },
    { icon: TrendingUp, title: "You Earn, We Optimize", time: "Ongoing", desc: "Orders start coming in. We manage your online presence, update inventory, run ads, and send you a monthly report. You keep doing what you love — creating beautiful pieces." },
  ],
  fr: [
    { icon: Camera, title: "Envoie-nous tes photos", time: "Jour 1", desc: "Prends des photos de tes pièces avec ton téléphone. On s'occupe du reste — retrait de fond, optimisation et présentation professionnelle. Tu crées l'art, on le rend incroyable en ligne." },
    { icon: Globe, title: "On construit tout", time: "48 heures", desc: "Ton site web premium est en ligne. Ta boutique Etsy est listée avec des titres et descriptions optimisés SEO. Tes produits sont devant des millions d'acheteurs dans le monde. T'as pas levé le petit doigt." },
    { icon: TrendingUp, title: "Tu gagnes, on optimise", time: "Continu", desc: "Les commandes commencent à rentrer. On gère ta présence en ligne, on met à jour l'inventaire, on roule les pubs et on t'envoie un rapport mensuel. Toi tu continues à faire ce que t'aimes — créer de belles pièces." },
  ],
  es: [
    { icon: Camera, title: "Envíanos tus fotos", time: "Día 1", desc: "Toma fotos de tus piezas con tu teléfono. Nosotros nos encargamos del resto — remoción de fondo, optimización y presentación profesional. Tú creas el arte, nosotros lo hacemos ver increíble en línea." },
    { icon: Globe, title: "Nosotros construimos todo", time: "48 horas", desc: "Tu sitio web premium sale en vivo. Tu tienda Etsy queda listada con títulos y descripciones optimizados para SEO. Tus productos están frente a millones de compradores en todo el mundo. Tú no moviste un dedo." },
    { icon: TrendingUp, title: "Tú ganas, nosotros optimizamos", time: "Continuo", desc: "Los pedidos empiezan a llegar. Gestionamos tu presencia en línea, actualizamos inventario, manejamos anuncios y te enviamos un reporte mensual. Tú sigue haciendo lo que amas — crear piezas hermosas." },
  ],
};

const PAIN_POINTS = {
  en: [
    { problem: "Hours at the market in the sun", solution: "Sales come to you 24/7 from anywhere in the world" },
    { problem: "No online presence at all", solution: "Premium website + Etsy shop with 90M+ buyers" },
    { problem: "Bad product photos on white sheets", solution: "Professional photos optimized for online sales" },
    { problem: "No idea how SEO or Etsy works", solution: "We handle all the tech — you just create" },
    { problem: "Income depends on foot traffic", solution: "Multiple revenue streams: Etsy, website, wholesale" },
    { problem: "Can't reach international buyers", solution: "Bilingual site + Etsy ships worldwide" },
  ],
  fr: [
    { problem: "Des heures au marché sous le soleil", solution: "Les ventes viennent à toi 24/7 de partout dans le monde" },
    { problem: "Aucune présence en ligne", solution: "Site web premium + boutique Etsy avec 90M+ acheteurs" },
    { problem: "Mauvaises photos sur des draps blancs", solution: "Photos professionnelles optimisées pour la vente en ligne" },
    { problem: "Aucune idée du SEO ou d'Etsy", solution: "On gère toute la tech — toi tu crées" },
    { problem: "Revenus dépendent du trafic piéton", solution: "Sources de revenus multiples : Etsy, site web, gros" },
    { problem: "Pas accès aux acheteurs internationaux", solution: "Site bilingue + Etsy livre mondialement" },
  ],
  es: [
    { problem: "Horas en el mercado bajo el sol", solution: "Las ventas llegan a ti 24/7 desde cualquier parte del mundo" },
    { problem: "Cero presencia en línea", solution: "Sitio web premium + tienda Etsy con 90M+ compradores" },
    { problem: "Malas fotos de productos en sábanas blancas", solution: "Fotos profesionales optimizadas para ventas en línea" },
    { problem: "No sabes nada de SEO ni de Etsy", solution: "Nosotros manejamos toda la tecnología — tú solo crea" },
    { problem: "Ingresos dependen del tráfico peatonal", solution: "Múltiples fuentes de ingreso: Etsy, sitio web, mayoreo" },
    { problem: "No puedes llegar a compradores internacionales", solution: "Sitio bilingüe + Etsy envía a todo el mundo" },
  ],
};

const FEATURES = {
  en: [
    { icon: Globe, title: "Premium Website", desc: "5-7 page bilingual site that looks like a $5,000 build. Your brand, your story, your art — presented beautifully." },
    { icon: Store, title: "Etsy Shop Management", desc: "Full shop setup, product listings with SEO titles and tags, shipping profiles, and ongoing management." },
    { icon: Camera, title: "Photo Optimization", desc: "We transform your phone photos into professional product shots. Clean backgrounds, consistent style." },
    { icon: Palette, title: "Brand Identity", desc: "Logo placement, color palette, typography — a cohesive brand that says 'premium artisan' not 'market stall'." },
    { icon: Megaphone, title: "Ads Management", desc: "Etsy Ads and Meta Ads configured and optimized to bring buyers directly to your products." },
    { icon: BarChart3, title: "Monthly Reports", desc: "Clear reports showing your views, sales, and growth. We explain what's working and what we're improving." },
    { icon: Package, title: "Inventory Updates", desc: "New pieces? Sold out items? We update your shop and site so everything stays current." },
    { icon: MessageCircle, title: "WhatsApp Support", desc: "Questions? Changes? Message us on WhatsApp. We respond fast because your business matters." },
  ],
  fr: [
    { icon: Globe, title: "Site web premium", desc: "Site bilingue de 5-7 pages qui a l'air d'une construction à 5 000 $. Ta marque, ton histoire, ton art — présenté magnifiquement." },
    { icon: Store, title: "Gestion boutique Etsy", desc: "Configuration complète, produits listés avec titres et tags SEO, profils d'expédition et gestion continue." },
    { icon: Camera, title: "Optimisation photos", desc: "On transforme tes photos téléphone en shots produits professionnels. Fonds propres, style cohérent." },
    { icon: Palette, title: "Identité de marque", desc: "Placement logo, palette de couleurs, typographie — une marque cohérente qui dit 'artisan premium'." },
    { icon: Megaphone, title: "Gestion de publicité", desc: "Etsy Ads et Meta Ads configurés et optimisés pour amener les acheteurs directement à tes produits." },
    { icon: BarChart3, title: "Rapports mensuels", desc: "Rapports clairs montrant tes vues, ventes et croissance. On explique ce qui marche et ce qu'on améliore." },
    { icon: Package, title: "Mises à jour inventaire", desc: "Nouvelles pièces ? Articles vendus ? On met à jour ta boutique et ton site pour que tout reste à jour." },
    { icon: MessageCircle, title: "Support WhatsApp", desc: "Questions ? Changements ? Écris-nous sur WhatsApp. On répond vite parce que ta business compte." },
  ],
  es: [
    { icon: Globe, title: "Sitio web premium", desc: "Sitio bilingüe de 5-7 páginas que parece una construcción de $5,000. Tu marca, tu historia, tu arte — presentado hermosamente." },
    { icon: Store, title: "Gestión de tienda Etsy", desc: "Configuración completa, productos listados con títulos y etiquetas SEO, perfiles de envío y gestión continua." },
    { icon: Camera, title: "Optimización de fotos", desc: "Transformamos tus fotos del celular en tomas profesionales de producto. Fondos limpios, estilo consistente." },
    { icon: Palette, title: "Identidad de marca", desc: "Ubicación de logo, paleta de colores, tipografía — una marca coherente que dice 'artesano premium'." },
    { icon: Megaphone, title: "Gestión de anuncios", desc: "Etsy Ads y Meta Ads configurados y optimizados para traer compradores directamente a tus productos." },
    { icon: BarChart3, title: "Reportes mensuales", desc: "Reportes claros mostrando tus vistas, ventas y crecimiento. Te explicamos qué funciona y qué estamos mejorando." },
    { icon: Package, title: "Actualizaciones de inventario", desc: "¿Piezas nuevas? ¿Artículos agotados? Actualizamos tu tienda y sitio para que todo esté al día." },
    { icon: MessageCircle, title: "Soporte WhatsApp", desc: "¿Preguntas? ¿Cambios? Escríbenos por WhatsApp. Respondemos rápido porque tu negocio importa." },
  ],
};

export default function Artisan() {
  const { pathname } = useRouter();
  const locale = getLocale(pathname);
  const prefix = localePath(locale);
  const contactHref = `${prefix}/contact`;
  const tiers = TIERS[locale];
  const process = PROCESS[locale];
  const painPoints = PAIN_POINTS[locale];
  const features = FEATURES[locale];

  return (
    <div className="min-h-screen bg-bg text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 space-y-20">

        {/* HERO */}
        <ScrollReveal>
          <div className="text-center space-y-6 pt-8">
            <span className="text-accent text-sm font-semibold tracking-widest uppercase">{T.badge}</span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold leading-tight">
              {T.heroTitle1[locale]}<br />
              <span className="text-accent2">{T.heroTitle2[locale]}</span>
            </h1>
            <p className="text-lg text-txt2 max-w-2xl mx-auto leading-relaxed">{T.heroSub[locale]}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <ShimmerButton className="px-8 py-3.5">
                <Link href={contactHref} className="flex items-center gap-2">
                  {T.getStarted[locale]} <ArrowRight className="w-4 h-4" />
                </Link>
              </ShimmerButton>
              <a href="https://talaveracasajuarez.com" target="_blank" rel="noopener noreferrer"
                className="px-8 py-3.5 border border-border rounded-xl text-txt hover:text-white hover:border-accent/50 transition-colors text-center cursor-pointer">
                {T.liveExample[locale]}
              </a>
            </div>
          </div>
        </ScrollReveal>

        {/* LIVE EXAMPLE */}
        <ScrollReveal>
          <GlowCard className="p-6 md:p-8" glowColor="rgba(0,212,170,0.12)">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-accent2 text-xs font-semibold tracking-widest uppercase">{T.caseStudy[locale]}</span>
                <h2 className="text-2xl font-heading font-bold text-white mt-2 mb-4">Talavera Casa Juárez</h2>
                <p className="text-txt2 leading-relaxed mb-4">{T.tcjDesc[locale]}</p>
                <a href="https://talaveracasajuarez.com" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-accent2 font-semibold text-sm hover:underline cursor-pointer">
                  {T.visitSite[locale]} <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                <Image src="https://talaveracasajuarez.com/photos/plate-baroque-blue-gold.jpg" alt="Talavera Casa Juárez — handcrafted ceramic plate" fill className="object-cover" />
              </div>
            </div>
          </GlowCard>
        </ScrollReveal>

        {/* THE PROBLEM */}
        <div className="space-y-6">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center">{T.soundFamiliar[locale]}</h2>
            <p className="text-txt3 text-center max-w-2xl mx-auto text-sm mt-2">{T.soundFamiliarSub[locale]}</p>
          </ScrollReveal>
          <ScrollReveal>
            <GlowCard className="p-6 md:p-8">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-danger font-semibold">{T.theProblem[locale]}</th>
                      <th className="text-left py-3 px-4 text-accent2 font-semibold">{T.withBW[locale]}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {painPoints.map((row, i) => (
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
          <ScrollReveal><h2 className="text-2xl sm:text-3xl font-heading font-bold text-center">{T.howItWorks[locale]}</h2></ScrollReveal>
          {process.map((step, i) => (
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
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center">{T.pricing[locale]}</h2>
            <p className="text-txt3 text-center max-w-2xl mx-auto text-sm mt-2">{T.pricingSub[locale]}</p>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier, i) => (
              <ScrollReveal key={tier.name} delay={i * 100}>
                <GlowCard className={`p-6 h-full flex flex-col ${tier.popular ? "ring-2 ring-accent2/50" : ""}`} glowColor={tier.popular ? "rgba(0,212,170,0.15)" : "rgba(108,99,255,0.08)"}>
                  {tier.popular && (
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-4 h-4 text-accent2 fill-accent2" />
                      <span className="text-accent2 text-xs font-bold uppercase tracking-wider">{T.mostPopular[locale]}</span>
                    </div>
                  )}
                  <h3 className="text-2xl font-heading font-bold text-white">{tier.name}</h3>
                  <p className="text-txt3 text-sm mt-1 mb-4">{tier.tagline}</p>
                  <div className="mb-1">
                    <span className="text-4xl font-heading font-bold text-white">${tier.price}</span>
                    <span className="text-txt3 text-sm">{locale === "fr" ? "/mois" : locale === "es" ? "/mes" : "/mo"}</span>
                  </div>
                  <p className="text-txt3 text-xs mb-6">${tier.setup} {locale === "fr" ? "installation unique" : locale === "es" ? "instalación única" : "one-time setup"}</p>
                  <ul className="space-y-2.5 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-txt2">
                        <Check className="w-4 h-4 text-accent2 mt-0.5 flex-shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <Link href={contactHref}
                    className={`mt-6 block text-center py-3 rounded-xl font-semibold text-sm transition-colors cursor-pointer ${tier.popular ? "bg-accent2 text-bg hover:bg-accent2/90" : "border border-border text-txt hover:text-white hover:border-accent/50"}`}>
                    {T.getStarted[locale]}
                  </Link>
                </GlowCard>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* WHAT'S INCLUDED */}
        <div className="space-y-6">
          <ScrollReveal><h2 className="text-2xl sm:text-3xl font-heading font-bold text-center">{T.everythingTitle[locale]}</h2></ScrollReveal>
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((f, i) => (
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
            <h3 className="text-2xl sm:text-3xl font-heading font-bold mb-3 text-white">{T.ctaTitle[locale]}</h3>
            <p className="text-txt2 mb-8 max-w-2xl mx-auto leading-relaxed">{T.ctaSub[locale]}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <ShimmerButton className="px-8 py-3.5">
                <Link href={contactHref} className="flex items-center gap-2">
                  {T.startJourney[locale]} <ArrowRight className="w-4 h-4" />
                </Link>
              </ShimmerButton>
              <a href="https://wa.me/15144184743" target="_blank" rel="noopener noreferrer"
                className="px-8 py-3.5 border border-border rounded-xl text-txt hover:text-white hover:border-accent/50 transition-colors cursor-pointer">
                {T.whatsapp[locale]}
              </a>
            </div>
          </AuroraBackground>
        </ScrollReveal>
      </div>
    </div>
  );
}
