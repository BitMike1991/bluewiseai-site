import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function HeroV2() {
  const [scrollY, setScrollY] = useState(0);
  const { pathname } = useRouter();
  const isFr = pathname.startsWith("/fr");
  const contactHref = isFr ? "/fr/contact" : "/contact";
  const offerHref = isFr ? "/fr/lead-rescue" : "/lead-rescue";

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

  // Background placement – use same for both languages
  const bgPosX = "80%";
  const baseY = -60;

  // 🧠 Bilingual text content
  const tagline = isFr
    ? "BLUEWISE AI – PLATEFORME LEAD RESCUE"
    : "BLUEWISE AI – LEAD RESCUE PLATFORM";

  const titleLine1 = isFr
    ? "Ne perdez plus jamais un prospect."
    : "Never Miss Another Lead.";

  const titleLine2 = isFr ? null : (
    <>
      Capture <span className="text-blue-300">Every Call</span>. Qualify <span className="text-blue-300">24/7</span>.
    </>
  );

  const bodyText = isFr
    ? "Plateforme SaaS complète qui capture les appels manqués, qualifie les prospects via IA vocale et SMS, gère votre inbox et livre tout sur un tableau de bord en temps réel."
    : "Complete SaaS platform that captures missed calls, qualifies leads via AI voice & SMS, manages your inbox, and delivers everything to a real-time dashboard.";

  // Use same heading size for both languages
  const headingClassName = "text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white mb-3 max-w-3xl";

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

      {/* Dark overlay */}
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
              {"Ne perdez plus jamais un prospect."}
              <br />
              <span className="text-white">
                {"Capturez "}
                <span className="text-blue-300">{"chaque appel"}</span>
                {"."}
              </span>
            </>
          ) : (
            <>
              {titleLine1}
              <br />
              <span className="text-white">{titleLine2}</span>
            </>
          )}
        </h1>

        {/* Spacer */}
        <div className="h-24 sm:h-28 lg:h-32" />

        {/* Subtext */}
        <p className="text-base sm:text-lg text-slate-200/85 mb-12 max-w-xl">
          {bodyText}
        </p>

        {/* SINGLE SPECIAL OFFER CTA */}
        <div className="relative inline-flex items-center">
          {/* Glow */}
          <div className="pointer-events-none absolute -inset-x-6 -inset-y-3 bg-blue-500/30 blur-3xl opacity-80 z-0" />

          <Link
            href={offerHref}
            className="relative z-10 rounded-2xl px-10 py-5 text-xl sm:text-2xl font-extrabold
                       bg-blue-600 text-white tracking-wide
                       shadow-[0_0_40px_rgba(59,130,246,0.75)]
                       animate-flashSpecial
                       transition-all duration-300"
          >
            {isFr ? "OFFRE SPÉCIALE" : "SPECIAL OFFER"}
          </Link>
        </div>
      </div>
    </section>
  );
}
