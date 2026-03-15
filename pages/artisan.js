import Link from "next/link";
import Image from "next/image";
import {
  Globe,
  ShoppingBag,
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
    tagline: "Show your art to the world",
    price: 49,
    setup: 299,
    color: "accent",
    features: [
      "Premium bilingual website (5-7 pages)",
      "Custom domain connected",
      "15 product photos optimized",
      "Contact form + WhatsApp integration",
      "Mobile responsive design",
      "SEO basics configured",
      "Hosted & maintained by BlueWise",
    ],
    notIncluded: [
      "Etsy shop",
      "Ads management",
      "Monthly analytics",
    ],
  },
  {
    name: "Mercado",
    tagline: "Sell online, earn while you sleep",
    price: 149,
    setup: 499,
    color: "accent2",
    popular: true,
    features: [
      "Everything in Vitrina",
      "Etsy shop setup & configuration",
      "Up to 30 product listings with SEO",
      "Professional titles, tags & descriptions",
      "Product photos optimized for Etsy",
      "Shipping profile configured",
      "Monthly inventory updates",
      "WhatsApp priority support",
    ],
    notIncluded: [
      "Ads management",
      "Instagram content",
    ],
  },
  {
    name: "Imperio",
    tagline: "Dominate your market",
    price: 349,
    setup: 799,
    color: "amber-400",
    features: [
      "Everything in Mercado",
      "40+ product listings",
      "Etsy Ads management & optimization",
      "Meta Ads (Facebook/Instagram)",
      "Instagram content templates",
      "Monthly performance report",
      "Inventory & pricing management",
      "Priority WhatsApp support",
      "Quarterly strategy call",
    ],
    notIncluded: [],
  },
];

const PROCESS = [
  {
    icon: Camera,
    title: "Send Us Your Photos",
    time: "Day 1",
    desc: "Take photos of your pieces with your phone. We handle the rest — background removal, optimization, and professional presentation. You create art, we make it look incredible online.",
  },
  {
    icon: Globe,
    title: "We Build Everything",
    time: "48 hours",
    desc: "Your premium website goes live. Your Etsy shop gets listed with SEO-optimized titles and descriptions. Your products are in front of millions of buyers worldwide. You didn't lift a finger.",
  },
  {
    icon: TrendingUp,
    title: "You Earn, We Optimize",
    time: "Ongoing",
    desc: "Orders start coming in. We manage your online presence, update inventory, run ads, and send you a monthly report. You keep doing what you love — creating beautiful pieces.",
  },
];

const PAIN_POINTS = [
  { problem: "Hours at the market in the sun", solution: "Sales come to you 24/7 from anywhere in the world" },
  { problem: "No online presence at all", solution: "Premium website + Etsy shop with 90M+ buyers" },
  { problem: "Bad product photos on white sheets", solution: "Professional photos optimized for online sales" },
  { problem: "No idea how SEO or Etsy works", solution: "We handle all the tech — you just create" },
  { problem: "Income depends on foot traffic", solution: "Multiple revenue streams: Etsy, website, wholesale" },
  { problem: "Can't reach international buyers", solution: "Bilingual site + Etsy ships worldwide" },
];

const FEATURES = [
  { icon: Globe, title: "Premium Website", desc: "5-7 page bilingual site that looks like a $5,000 build. Your brand, your story, your art — presented beautifully." },
  { icon: Store, title: "Etsy Shop Management", desc: "Full shop setup, product listings with SEO titles and tags, shipping profiles, and ongoing management." },
  { icon: Camera, title: "Photo Optimization", desc: "We transform your phone photos into professional product shots. Clean backgrounds, consistent style." },
  { icon: Palette, title: "Brand Identity", desc: "Logo placement, color palette, typography — a cohesive brand that says 'premium artisan' not 'market stall'." },
  { icon: Megaphone, title: "Ads Management", desc: "Etsy Ads and Meta Ads configured and optimized to bring buyers directly to your products." },
  { icon: BarChart3, title: "Monthly Reports", desc: "Clear reports showing your views, sales, and growth. We explain what's working and what we're improving." },
  { icon: Package, title: "Inventory Updates", desc: "New pieces? Sold out items? We update your shop and site so everything stays current." },
  { icon: MessageCircle, title: "WhatsApp Support", desc: "Questions? Changes? Message us on WhatsApp. We respond fast because your business matters." },
];

export default function Artisan() {
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
              You Create the Art.<br />
              <span className="text-accent2">We Sell It to the World.</span>
            </h1>
            <p className="text-lg text-txt2 max-w-2xl mx-auto leading-relaxed">
              Premium website, Etsy shop, and digital marketing — all managed for you.
              You focus on your craft. We bring buyers to your door.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <ShimmerButton className="px-8 py-3.5">
                <Link href="/contact" className="flex items-center gap-2">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
              </ShimmerButton>
              <a
                href="https://talaveracasajuarez.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3.5 border border-border rounded-xl text-txt hover:text-white hover:border-accent/50 transition-colors text-center cursor-pointer"
              >
                See a Live Example
              </a>
            </div>
          </div>
        </ScrollReveal>

        {/* LIVE EXAMPLE */}
        <ScrollReveal>
          <GlowCard className="p-6 md:p-8" glowColor="rgba(0,212,170,0.12)">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-accent2 text-xs font-semibold tracking-widest uppercase">Case Study</span>
                <h2 className="text-2xl font-heading font-bold text-white mt-2 mb-4">
                  Talavera Casa Juárez
                </h2>
                <p className="text-txt2 leading-relaxed mb-4">
                  A family pottery workshop in Puebla, Mexico. They sold only at local markets.
                  We built their full online presence in one day — premium bilingual website,
                  42 product photos optimized, contact form, and WhatsApp integration.
                </p>
                <a
                  href="https://talaveracasajuarez.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-accent2 font-semibold text-sm hover:underline cursor-pointer"
                >
                  Visit talaveracasajuarez.com <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                <Image
                  src="https://talaveracasajuarez.com/photos/plate-baroque-blue-gold.jpg"
                  alt="Talavera Casa Juárez — handcrafted ceramic plate"
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
              Sound Familiar?
            </h2>
            <p className="text-txt3 text-center max-w-2xl mx-auto text-sm mt-2">
              Most artisans lose thousands in potential revenue because they only sell in person. We fix that.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <GlowCard className="p-6 md:p-8">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-danger font-semibold">The Problem</th>
                      <th className="text-left py-3 px-4 text-accent2 font-semibold">With BlueWise</th>
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
              How It Works
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
              Simple, Transparent Pricing
            </h2>
            <p className="text-txt3 text-center max-w-2xl mx-auto text-sm mt-2">
              No hidden fees. No contracts. Cancel anytime. One artisan at a time, with full attention.
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
                      <span className="text-accent2 text-xs font-bold uppercase tracking-wider">Most Popular</span>
                    </div>
                  )}
                  <h3 className="text-2xl font-heading font-bold text-white">{tier.name}</h3>
                  <p className="text-txt3 text-sm mt-1 mb-4">{tier.tagline}</p>

                  <div className="mb-1">
                    <span className="text-4xl font-heading font-bold text-white">${tier.price}</span>
                    <span className="text-txt3 text-sm">/mo</span>
                  </div>
                  <p className="text-txt3 text-xs mb-6">${tier.setup} one-time setup</p>

                  <ul className="space-y-2.5 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-txt2">
                        <Check className="w-4 h-4 text-accent2 mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/contact"
                    className={`mt-6 block text-center py-3 rounded-xl font-semibold text-sm transition-colors cursor-pointer ${
                      tier.popular
                        ? "bg-accent2 text-bg hover:bg-accent2/90"
                        : "border border-border text-txt hover:text-white hover:border-accent/50"
                    }`}
                  >
                    Get Started
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
              Everything You Need to Sell Online
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
              Ready to Bring Your Art Online?
            </h3>
            <p className="text-txt2 mb-8 max-w-2xl mx-auto leading-relaxed">
              Your craft deserves to be seen by the world. Let us handle the digital side
              while you focus on what you do best — creating beautiful things.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <ShimmerButton className="px-8 py-3.5">
                <Link href="/contact" className="flex items-center gap-2">
                  Start Your Journey <ArrowRight className="w-4 h-4" />
                </Link>
              </ShimmerButton>
              <a
                href="https://wa.me/15144184743"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3.5 border border-border rounded-xl text-txt hover:text-white hover:border-accent/50 transition-colors cursor-pointer"
              >
                Message Us on WhatsApp
              </a>
            </div>
          </AuroraBackground>
        </ScrollReveal>

      </div>
    </div>
  );
}
