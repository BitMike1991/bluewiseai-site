import HeroV2 from "@/components/HeroV2";
import ConsultCTA from "@/components/ConsultCTA";

export default function Home() {
  return (
    <div className="bg-black">
      {/* HERO */}
      <HeroV2 />

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

      {/* SECTION 3 — Portfolio Quick Preview */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-white">
        <h2 className="text-3xl font-bold mb-6">🧠 Recent Automations</h2>

        <ul className="space-y-4 text-slate-300 text-lg">
          <li>💼 Job Interview Coach GPT</li>
          <li>📚 Story Maker GPT</li>
          <li>📆 30-Day Social Media Planner</li>
          <li>🛠 Custom business automations for multiple industries</li>
        </ul>

        <div className="mt-8">
          <ConsultCTA>Book a free consultation</ConsultCTA>
        </div>
      </section>
    </div>
  );
}
