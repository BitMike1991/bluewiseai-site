import HeroV2 from "../src/components/HeroV2";
import ConsultCTA from "../src/components/ConsultCTA";


export default function Home() {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: "url('/styles/backgroundpages.png')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundAttachment: "fixed",
        backgroundColor: "#020617",
      }}
    >
      {/* Hidden H1 for SEO */}
      {/*
        Adding a hidden H1 improves search engine optimisation without affecting
        the visual design. This heading clearly states what this site offers
        and reinforces the small‑business automation niche. The class `sr-only`
        keeps it accessible for screen readers while hiding it from view.
      */}
      <h1 className="sr-only">AI automation for small businesses</h1>

      {/* HERO */}
      <HeroV2 />

      {/* INTRO — Why choose AI automation */}
      {/*
        A short, punchy introduction that speaks directly to the pain our
        audience feels (drowning in admin) and the primary benefit (freeing
        time and boosting growth). This sits immediately below the hero and
        uses centred text to match the overall layout. The language is bold
        and direct in keeping with the chosen tone.
      */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Stop drowning in admin.</h2>
        <p className="text-xl text-slate-300">
          We build AI assistants and automation systems that free up your time,
          convert more leads and simplify your business. Save 5–10 hours a
          week by letting technology handle the repetitive work.
        </p>
      </section>
      {/* SECTION 2 — What We Automate */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-white">
        <h2 className="text-3xl font-bold mb-6">🔥 What We Automate</h2>

        <ul className="space-y-4 text-slate-300 text-lg">
          <li>⚡ Email Sorting, Summary & Auto-Replies</li>
          <li>🤖 Lead Qualification Bots</li>
          <li>📞 Missed-Call Text-Back Systems</li>
          <li>🔁 Lead Drip Automations</li>
          <li>🧾 Quote & Contract Generators</li>
          <li>📁 Smart File Sorting + Naming Agents</li>
        </ul>
      </section>

      {/* SECTION 3 — Portfolio / Demo Anchor */}
      <section
        id="demo"
        className="max-w-5xl mx-auto px-6 py-20 text-white"
      >
        <h2 className="text-3xl font-bold mb-6">🧠 Recent Automations</h2>

        <ul className="space-y-4 text-slate-300 text-lg">
          <li>💼 Job Interview Coach GPT</li>
          <li>📚 Story Maker GPT</li>
          <li>📆 30-Day Social Media Planner</li>
          <li>🛠 Custom business automations for multiple industries</li>
        </ul>

        <div className="mt-8">
          {/* Uses your neon ConsultCTA, which routes to /contact or /fr/contact */}
          <ConsultCTA>
            Book a free consultation
          </ConsultCTA>
        </div>
      </section>
    </div>
  );
}
