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

  const titleLine2 = isFr ? null : (
    <>
      Save <span className="text-blue-300">5–10 Hours</span> Every Week.
    </>
  );

  const bodyText = isFr
    ? "Petites automatisations IA livrées en 24–48 heures. Agents email, bots de qualification de prospects, rappels SMS après appels manqués et workflows sur mesure — conçus pour de vraies petites entreprises."
    : "Small AI automations delivered in 24–48 hours. Email agents, lead bots, missed-call text-back, and custom workflows — built for real small businesses.";

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
              {"Automatisez votre entreprise."}
              <br />
              <span className="text-white whitespace-normal sm:whitespace-nowrap">
                {"Gagnez "}
                <span className="text-blue-300">{"5–10 heures"}</span>
                {" chaque"}
              </span>
              <br />
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

        {/* Spacer */}
        <div className={isFr ? "h-12 sm:h-14 lg:h-16" : "h-24 sm:h-28 lg:h-32"} />

        {/* Subtext */}
        <p
          className={`text-base sm:text-lg text-slate-200/85 mb-12 ${
            isFr ? "max-w-lg" : "max-w-xl"
          }`}
        >
          {bodyText}
        </p>

        {/* SINGLE SPECIAL OFFER CTA */}
        <div className="relative inline-flex items-center">
          {/* Glow */}
          <div className="pointer-events-none absolute -inset-x-6 -inset-y-3 bg-blue-500/30 blur-3xl opacity-80 z-0" />

          <Link
            href="https://www.bluewiseai.com/lead-rescue"
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
