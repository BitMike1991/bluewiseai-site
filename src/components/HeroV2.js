import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { ChevronDown, Zap, Target, ShieldCheck } from "lucide-react";
import { TextGenerateEffect } from "@/components/ui/TextGenerateEffect";
import { ShimmerButton } from "@/components/ui/ShimmerButton";
import { NumberTicker } from "@/components/ui/NumberTicker";

// Lazy-load Spline — never block page render
const Spline = dynamic(
  () => import("@splinetool/react-spline").then((m) => m.default || m),
  { ssr: false, loading: () => null }
);

function SocialProofStat({ icon: Icon, value, suffix, label, delay }) {
  return (
    <div
      className="flex items-center gap-3 opacity-0 animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4.5 h-4.5 text-accent" />
      </div>
      <div>
        <div className="text-2xl sm:text-3xl font-heading font-bold text-white tabular-nums">
          <NumberTicker value={value} suffix={suffix} />
        </div>
        <div className="text-xs text-txt3">{label}</div>
      </div>
    </div>
  );
}

export default function HeroV2() {
  const { pathname } = useRouter();
  const isFr = pathname.startsWith("/fr");
  const contactHref = isFr ? "/fr/contact" : "/contact";
  const pricingHref = isFr ? "/fr/lead-rescue" : "/lead-rescue";

  const [splineError, setSplineError] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* ─── Background layers ─── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-bg" />

        {/* Animated aurora mesh */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="pointer-events-none absolute -inset-[10px] opacity-50"
            style={{
              backgroundImage:
                "repeating-linear-gradient(100deg, #6c63ff15 10%, #00d4aa10 15%, #6c63ff10 20%, #00d4aa15 25%, #6c63ff15 30%)",
              backgroundSize: "300% 200%",
              animation: "aurora 60s linear infinite",
              filter: "blur(40px)",
            }}
          />
        </div>

        {/* Glow orbs */}
        <div className="pointer-events-none absolute top-10 right-[15%] w-[600px] h-[600px] rounded-full bg-accent/10 blur-[150px]" />
        <div className="pointer-events-none absolute bottom-10 left-[10%] w-[500px] h-[500px] rounded-full bg-accent2/8 blur-[120px]" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-accent/5 blur-[80px]" />

        {/* Spline 3D — robot / AI visualization */}
        {!splineError && (
          <div className="absolute right-0 top-0 w-full h-full md:w-[60%] md:right-[-5%] opacity-50 md:opacity-75 transition-opacity duration-1000">
            <Spline
              scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode"
              onError={() => setSplineError(true)}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        )}

        {/* Gradient overlays for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/95 to-bg/30 z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-bg/60 z-[1]" />
      </div>

      {/* ─── Content ─── */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-32 pb-20 md:py-0 w-full">
        <div className="max-w-2xl">
          {/* Tagline pill */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8 opacity-0 animate-fade-in"
            style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
          >
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-semibold text-accent tracking-wider uppercase">
              {isFr
                ? "Automatisation IA pour entrepreneurs"
                : "AI-Powered Business Automation"}
            </span>
          </div>

          {/* Headline — two lines with gradient accent */}
          <h1 className="mb-8">
            <TextGenerateEffect
              words={isFr ? "On gère ta business" : "We Run Your Business"}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold leading-[1.08] text-white"
              duration={0.6}
            />
            <span
              className="block mt-2 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold leading-[1.08] opacity-0 animate-fade-in bg-gradient-to-r from-accent via-accent2 to-accent bg-clip-text text-transparent"
              style={{ animationDelay: "800ms", animationFillMode: "forwards" }}
            >
              {isFr ? "Pendant que tu fais ta job" : "While You Do the Work"}
            </span>
          </h1>

          {/* Subtext */}
          <p
            className="text-base sm:text-lg text-txt2 mb-10 max-w-xl leading-relaxed opacity-0 animate-fade-in"
            style={{ animationDelay: "1.2s", animationFillMode: "forwards" }}
          >
            {isFr
              ? "Appels manqués, soumissions, contrats, paiements — tout géré automatiquement par l'IA. Toi, tu fais ce que tu fais de mieux."
              : "Missed calls, quotes, contracts, payments — all handled automatically by AI. You focus on what you do best."}
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row gap-4 mb-16 opacity-0 animate-fade-in"
            style={{ animationDelay: "1.4s", animationFillMode: "forwards" }}
          >
            <Link href={pricingHref}>
              <ShimmerButton className="text-base px-8 py-4 w-full sm:w-auto">
                {isFr ? "Voir les plans" : "See Plans"}
              </ShimmerButton>
            </Link>
            <Link
              href={contactHref}
              className="rounded-lg px-8 py-4 text-base font-semibold
                         border border-border hover:border-accent/50
                         text-txt2 hover:text-white
                         transition-all duration-300 text-center cursor-pointer"
            >
              {isFr ? "Réserver un appel" : "Book a Call"}
            </Link>
          </div>

          {/* Social Proof Strip */}
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-12">
            <SocialProofStat
              icon={Zap}
              value={97.6}
              suffix="%"
              label={isFr ? "Taux d'automatisation" : "Automation rate"}
              delay={1800}
            />
            <SocialProofStat
              icon={Target}
              value={71}
              suffix="K"
              label={isFr ? "Pipeline en 30 jours" : "Pipeline in 30 days"}
              delay={2000}
            />
            <SocialProofStat
              icon={ShieldCheck}
              value={0}
              suffix=""
              label={isFr ? "Leads manqués" : "Missed leads"}
              delay={2200}
            />
          </div>
        </div>
      </div>

      {/* ─── Scroll indicator ─── */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 opacity-0 animate-fade-in"
        style={{ animationDelay: "2.8s", animationFillMode: "forwards" }}
      >
        <div className="flex flex-col items-center gap-2 text-txt3">
          <span className="text-xs tracking-wider uppercase">
            {isFr ? "Défiler" : "Scroll"}
          </span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
