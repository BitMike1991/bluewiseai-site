const imgHeroBg1 = "/styles/hero-bg.png";

export default function HeroV2() {
  return (
    <section
      className="relative flex items-center justify-center overflow-hidden min-h-[90vh]"
      style={{
        backgroundImage: `url(${imgHeroBg1})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundColor: "#020617",
      }}
    >
      {/* Layer 1 – subtle blue soft-light gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.35),transparent_60%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.75),#020617)] mix-blend-soft-light" />

      {/* Layer 2 – slightly lighter dark overlay (was darker before) */}
      <div className="pointer-events-none absolute inset-0 bg-slate-950/25" />

      {/* Layer 3 – top glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-white/10 blur-[130px]" />

      {/* Watermark – moved down and softened */}
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-20">
        <p className="select-none text-[5rem] sm:text-[7rem] lg:text-[9rem] font-extrabold tracking-[0.25em] text-white/5">
          BLUEWISE AI
        </p>
      </div>

      {/* CONTENT */}
      <div className="relative z-20 max-w-4xl px-6 text-left mt-16 mb-20">
        <p className="text-xs sm:text-sm font-medium tracking-[0.24em] text-blue-400/90 uppercase mb-6">
          BlueWise AI – Automation Agency
        </p>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white mb-8">
          Automate Your Business.
          <br />
          <span>
            Save <span className="text-blue-300">5–10 Hours</span> Every Week.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-200/85 max-w-xl mb-10">
          Small AI automations delivered in 24–48 hours. Email agents, lead
          bots, missed-call text-back, and custom workflows — built for real
          small businesses.
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-5">
          <button className="rounded-xl px-8 py-3.5 text-sm sm:text-base font-semibold bg-blue-500 hover:bg-blue-400 text-white shadow-xl shadow-blue-500/30 transition-transform hover:-translate-y-[2px]">
            See 2-Minute Demo
          </button>

          <button className="rounded-xl px-8 py-3.5 text-sm sm:text-base font-semibold border border-blue-300/60 text-blue-200 hover:bg-blue-500/10 hover:border-blue-300/80 backdrop-blur-md shadow-md shadow-blue-900/10 transition-transform hover:-translate-y-[2px]">
            Book Free Automation Audit
          </button>
        </div>
      </div>
    </section>
  );
}
