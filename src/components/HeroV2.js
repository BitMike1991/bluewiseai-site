import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function HeroV2() {
  const [scrollY, setScrollY] = useState(0);
  const { pathname } = useRouter();
  const isFr = pathname.startsWith("/fr");
  const contactHref = isFr ? "/fr/contact" : "/contact";

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

  // Parallax factors
  const bgOffset = scrollY * 0.12;
  const glowOffset = scrollY * 0.18;

  // Background placement – EN is perfect, FR a bit further right
  const bgPosX = isFr ? "83%" : "80%";
  const baseY = isFr ? -40 : -60;

  // 🧠 Bilingual text content
  const tagline = isFr
    ? "BLUEWISE AI – AGENCE D'AUTOMATISATION"
    : "BLUEWISE AI – AUTOMATION AGENCY";

  const titleLine1 = isFr
    ? "Automatisez votre entreprise."
    : "Automate Your Business.";

  // Only used for EN; FR will be rendered inline so we can control wrapping
  const titleLine2 = isFr ? null : (
    <>
      Save <span className="text-blue-300">5–10 Hours</span> Every Week.
    </>
  );

  const bodyText = isFr
    ? "Petites automatisations IA livrées en 24–48 heures. Agents email, bots de qualification de prospects, rappels SMS après appels manqués et workflows sur mesure — conçus pour de vraies petites entreprises."
    : "Small AI automations delivered in 24–48 hours. Email agents, lead bots, missed-call text-back, and custom workflows — built for real small businesses.";

  const primaryCtaText = isFr
    ? "Voir la démo de 2 minutes"
    : "See 2-Minute Demo";

  const secondaryCtaText = isFr
    ? "Réserver un audit d'automatisation gratuit"
    : "Book Free Automation Audit";

  // Heading sizes – EN untouched, FR slightly smaller but still strong
  const headingClassName = isFr
    ? "text-[2.3rem] sm:text-[2.7rem] lg:text-[3.1rem] font-bold leading-tight text-white mb-3 max-w-[34rem]"
    : "text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white mb-3 max-w-3xl";

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

      {/* Top glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 z-0 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-white/4 blur-3xl"
        style={{ transform: `translateY(${glowOffset * -0.4}px)` }}
      />

      {/* Side glow */}
      <div className="pointer-events-none absolute right-32 top-24 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl z-0" />

      {/* Dark overlay for readability */}
      <div className="pointer-events-none absolute inset-0 bg-slate-950/30 z-0" />

      {/* MAIN CONTENT */}
      <div className="relative z-20 max-w-4xl px-6 text-left pt-4 pb-24">
        {/* Tagline */}
        <p className="text-xs sm:text-sm font-medium tracking-[0.24em] text-blue-400/90 uppercase mb-2">
          {tagline}
        </p>

        {/* HEADLINE */}
        <h1 className={headingClassName}>
          {isFr ? (
            <>
              {/* Line 1 */}
              {"Automatisez votre entreprise."}
              <br />
              {/* Line 2 — never wraps */}
              <span className="text-white whitespace-nowrap">
                {"Gagnez "}
                <span className="text-blue-300">{"5–10 heures"}</span>
                {" chaque"}
              </span>
              <br />
              {/* Line 3 */}
              <span className="text-white">{"semaine."}</span>
            </>
          ) : (
            <>
              {titleLine1}
              <br />
              <span className="text-white">{titleLine2}</span>
            </>
          )}
        </h1>

        {/* Spacer so the ghost “BLUE WISE AI” can breathe */}
        <div
          className={
            isFr ? "h-12 sm:h-14 lg:h-16" : "h-24 sm:h-28 lg:h-32"
          }
        />

        {/* Subtext */}
        <p
          className={`text-base sm:text-lg text-slate-200/85 mb-12 ${
            isFr ? "max-w-lg" : "max-w-xl"
          }`}
        >
          {bodyText}
        </p>

        {/* CTA BUTTONS WITH GLOW */}
        <div className="relative inline-flex flex-wrap items-center gap-4">
          {/* Glow behind buttons */}
          <div className="pointer-events-none absolute -inset-x-6 -inset-y-3 bg-blue-500/30 blur-3xl opacity-80 z-0" />

          {/* Primary CTA – scroll to demo section */}
          <Link
            href="#demo"
            className="relative z-10 rounded-xl px-7 py-3.5 text-sm sm:text-base font-semibold
                       bg-blue-500 hover:bg-blue-400 text-white
                       shadow-xl shadow-blue-500/40
                       transition-all duration-300
                       hover:-translate-y-0.5
                       hover:shadow-[0_0_28px_rgba(59,130,246,0.95)]
                       hover:saturate-150 hover:animate-pulse"
          >
            {primaryCtaText}
          </Link>

          {/* Secondary CTA – goes to contact page */}
          <Link
            href={contactHref}
            className="relative z-10 rounded-xl px-7 py-3.5 text-sm sm:text-base font-semibold
                       border border-blue-400/70 text-blue-200
                       hover:bg-blue-500/10 hover:border-blue-300/80
                       backdrop-blur-sm shadow-md shadow-blue-900/20
                       transition-all duration-300
                       hover:-translate-y-0.5
                       hover:shadow-[0_0_22px_rgba(59,130,246,0.8)]
                       hover:saturate-150 hover:animate-pulse"
          >
            {secondaryCtaText}
          </Link>
        </div>
      </div>
    </section>
  );
}
