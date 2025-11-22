import { useEffect, useState } from "react";
import background from "../public/styles/hero-bg.png"; // keep your owl hero image

export default function HeroV2() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // limit max value so it doesn't go crazy on long pages
      setScrollY(window.scrollY > 600 ? 600 : window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Parallax factors
  const bgOffset = scrollY * 0.12;       // slow parallax for background
  const glowOffset = scrollY * 0.18;     // slightly faster
  const ghostOffset = scrollY * 0.22;    // ghost text moves a bit more

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${background.src})`,
        backgroundSize: "cover",
        backgroundPosition: `center ${-bgOffset}px`, // parallax background
        backgroundColor: "#020617",
      }}
    >
      {/* Gradient overlay (with slight parallax) */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.38),transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.85),#020617)] mix-blend-soft-light z-0"
        style={{ transform: `translateY(${glowOffset * -0.2}px)` }}
      />

      {/* Top glow (parallax) */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 z-0 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-white/4 blur-3xl"
        style={{ transform: `translateY(${glowOffset * -0.4}px)` }}
      />

      {/* Dark overlay for readability */}
      <div className="pointer-events-none absolute inset-0 bg-slate-950/30 z-0" />

      {/* Ghost Background Title (parallax) */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center z-0"
        style={{ transform: `translateY(${ghostOffset * 0.2}px)` }}
      >
        <p className="select-none text-[5rem] sm:text-[7rem] lg:text-[9rem] font-extrabold tracking-[0.25em] text-white/5">
          BLUEWISE AI
        </p>
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-20 max-w-4xl px-6 text-left">

        {/* Spacer to push headline slightly up */}
        <div className="pt-24" />

        <p className="text-xs sm:text-sm font-medium tracking-[0.24em] text-blue-400/90 uppercase mb-6">
          BlueWise AI – Automation Agency
        </p>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white mb-10">
          Automate Your Business.
          <br />
          <span className="text-white">
            Save <span className="text-blue-300">5–10 Hours</span> Every Week.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-200/85 max-w-xl mb-14 mt-4">
          Small AI automations delivered in 24–48 hours. Email agents, lead bots,
          missed-call text-back, and custom workflows — built for real small
          businesses.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <button className="rounded-xl px-7 py-3.5 text-sm sm:text-base font-semibold bg-blue-500 hover:bg-blue-400 text-white shadow-xl shadow-blue-500/30 transition-transform hover:-translate-y-[1px]">
            See 2-Minute Demo
          </button>
          <button className="rounded-xl px-7 py-3.5 text-sm sm:text-base font-semibold border border-blue-400/70 text-blue-200 hover:bg-blue-500/10 hover:border-blue-300/80 backdrop-blur-sm transition-transform hover:-translate-y-[1px]">
            Book Free Automation Audit
          </button>
        </div>
      </div>
    </section>
  );
}
