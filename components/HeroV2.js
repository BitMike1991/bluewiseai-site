import { useEffect, useState } from "react";
import background from "../public/styles/hero-bg.png";

export default function HeroV2() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrollY(y > 600 ? 600 : y);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const bgOffset = scrollY * 0.12;
  const glowOffset = scrollY * 0.18;
  const ghostOffset = scrollY * 0.22;

  return (
    <section
      className="relative min-h-screen flex items-start justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${background.src})`,
        backgroundSize: "cover",
        backgroundPosition: `center ${-bgOffset}px`,
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

      {/* GHOST TEXT — lifted more so it sits between heading + body */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center z-0"
        style={{
          // smaller parallax factor, much bigger negative offset
          transform: `translateY(${ghostOffset * 0.12 - 260}px)`,
        }}
      >
        <p className="select-none text-[5rem] sm:text-[7rem] lg:text-[9rem] font-extrabold tracking-[0.25em] text-white/5">
          BLUE WISE AI
        </p>
      </div>

      {/* MAIN CONTENT — STARTS HIGHER */}
      <div className="relative z-20 max-w-4xl px-6 text-left pt-6 pb-24">
        {/* Tagline */}
        <p className="text-xs sm:text-sm font-medium tracking-[0.24em] text-blue-400/90 uppercase mb-3">
          BlueWise AI – Automation Agency
        </p>

        {/* HEADLINE */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white mb-4">
          Automate Your Business.
          <br />
          <span className="text-white">
            Save <span className="text-blue-300">5–10 Hours</span> Every Week.
          </span>
        </h1>

        {/* SPACER under H1 */}
        <div className="h-16 sm:h-20 lg:h-24" />

        {/* PARAGRAPH */}
        <p className="text-base sm:text-lg text-slate-200/85 max-w-xl mb-12">
          Small AI automations delivered in 24–48 hours. Email agents, lead bots,
          missed-call text-back, and custom workflows — built for real small
          businesses.
        </p>

        {/* CTA BUTTONS WITH GLOW */}
        <div className="relative inline-flex flex-wrap items-center gap-4">
          <div className="pointer-events-none absolute -inset-x-6 -inset-y-3 bg-blue-500/30 blur-3xl opacity-80 z-0" />

          <button className="relative z-10 rounded-xl px-7 py-3.5 text-sm sm:text-base font-semibold bg-blue-500 hover:bg-blue-400 text-white shadow-xl shadow-blue-500/40 transition-transform hover:-translate-y-[1px]">
            See 2-Minute Demo
          </button>

          <button className="relative z-10 rounded-xl px-7 py-3.5 text-sm sm:text-base font-semibold border border-blue-400/70 text-blue-200 hover:bg-blue-500/10 hover:border-blue-300/80 backdrop-blur-sm shadow-md shadow-blue-900/20 transition-transform hover:-translate-y-[1px]">
            Book Free Automation Audit
          </button>
        </div>
      </div>
    </section>
  );
}
