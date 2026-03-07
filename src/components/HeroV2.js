import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function HeroV2() {
  const [scrollY, setScrollY] = useState(0);
  const { pathname } = useRouter();
  const isFr = pathname.startsWith("/fr");
  const contactHref = isFr ? "/fr/contact" : "/contact";
  const pricingHref = isFr ? "/fr/lead-rescue" : "/lead-rescue";

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrollY(y > 600 ? 600 : y);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const bgOffset = scrollY * 0.12;
  const glowOffset = scrollY * 0.18;
  const bgPosX = "80%";
  const baseY = -60;

  const tagline = isFr
    ? "BLUEWISE AI \u2014 OPTIMISATION D'ENTREPRISE"
    : "BLUEWISE AI \u2014 BUSINESS OPTIMIZATION";

  return (
    <section
      className="relative min-h-screen flex items-start justify-center overflow-hidden"
      style={{
        backgroundImage: "url('/styles/hero-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: `${bgPosX} ${baseY - bgOffset}px`,
        backgroundColor: "#020617",
      }}
    >
      {/* Soft blue gradients */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.38),transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.85),#020617)] mix-blend-soft-light z-0"
        style={{ transform: `translateY(${glowOffset * -0.2}px)` }}
      />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 z-0 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-white/4 blur-3xl"
        style={{ transform: `translateY(${glowOffset * -0.4}px)` }}
      />
      <div className="pointer-events-none absolute right-32 top-24 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl z-0" />
      <div className="pointer-events-none absolute inset-0 bg-slate-950/30 z-0" />

      {/* MAIN CONTENT */}
      <div className="relative z-20 max-w-4xl px-6 text-left pt-4 pb-24">
        {/* Tagline */}
        <p className="text-xs sm:text-sm font-medium tracking-[0.24em] text-blue-400/90 uppercase mb-2">
          {tagline}
        </p>

        {/* HEADLINE */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white mb-3 max-w-3xl">
          {isFr ? (
            <>
              On gère ta business
              <br />
              <span className="text-blue-300">pendant que tu fais ta job.</span>
            </>
          ) : (
            <>
              We Run Your Business
              <br />
              <span className="text-blue-300">While You Do the Work.</span>
            </>
          )}
        </h1>

        {/* Spacer */}
        <div className="h-24 sm:h-28 lg:h-32" />

        {/* Subtext */}
        <p className="text-base sm:text-lg text-slate-200/85 mb-12 max-w-xl">
          {isFr
            ? "IA + automatisation pour entrepreneurs. Appels manqués, soumissions, contrats, paiements \u2014 tout géré automatiquement."
            : "AI-powered operations for contractors. Missed calls, quotes, contracts, payments \u2014 all handled automatically."}
        </p>

        {/* TWO CTAs */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={pricingHref}
            className="relative z-10 rounded-xl px-8 py-4 text-lg font-bold
                       bg-blue-600 hover:bg-blue-500 text-white
                       shadow-[0_0_30px_rgba(59,130,246,0.5)]
                       transition-all duration-300 hover:scale-105 text-center"
          >
            {isFr ? "Voir les plans" : "See Plans"}
          </Link>
          <Link
            href={contactHref}
            className="rounded-xl px-8 py-4 text-lg font-semibold
                       border-2 border-slate-500 hover:border-blue-500
                       text-slate-200 hover:text-white
                       transition-all duration-300 text-center"
          >
            {isFr ? "Réserver une démo" : "Book a Demo"}
          </Link>
        </div>
      </div>
    </section>
  );
}
