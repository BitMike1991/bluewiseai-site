import imgHeroBg1 from "figma:asset/a030c285260fc5fedc5a13e26406093ccfe551d4.png";

export default function HeroV2() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${imgHeroBg1})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#020617",
      }}
    >
      {/* BLEND GRADIENT OVERLAY */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.45),transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.95),#020617)] mix-blend-soft-light" />

      {/* TOP GLOW */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />

      {/* DARK OVERLAY */}
      <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />

      {/* GHOST WATERMARK */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <p className="select-none text-[5rem] sm:text-[7rem] lg:text-[9rem] font-extrabold tracking-[0.25em] text-white/5">
          BLUEWISE AI
        </p>
      </div>

      {/* CONTENT */}
      <div className="relative z-20 max-w-4xl px-6 text-left">
        <p className="text-xs sm:text-sm font-medium tracking-[0.24em] text-blue-300 uppercase mb-4">
          BlueWise AI – Automation Agency
        </p>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white mb-5">
          Automate Your Business.
          <br />
          <span>
            Save{" "}
            <span className="text-blue-300 font-bold">5–10 Hours</span> Every Week.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-200/80 max-w-xl mb-9">
          Small AI automations delivered in 24–48 hours. Email agent, lead bots,
          missed-call text-back, and more — built for real small businesses.
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Main CTA */}
          <button className="rounded-xl px-7 py-3.5 text-sm sm:text-base font-semibold
            bg-blue-600 hover:bg-blue-500 text-white
            shadow-xl shadow-blue-500/30
            transition-transform hover:-translate-y-[2px]">
            See 2-Minute Demo
          </button>

          {/* Secondary CTA */}
          <button className="rounded-xl px-7 py-3.5 text-sm sm:text-base font-semibold
            border border-blue-300/60 text-blue-200
            hover:bg-blue-500/10 hover:border-blue-300/80
            backdrop-blur-md
            shadow-md shadow-blue-900/10
            transition-transform hover:-translate-y-[2px]">
            Book Free Automation Audit
          </button>
        </div>
      </div>
    </section>
  );
}
