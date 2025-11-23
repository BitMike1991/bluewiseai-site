import ConsultCTA from "@/components/ConsultCTA";

export default function Services() {
  return (
    <div
      className="
        min-h-screen
        bg-[url('/styles/backgroundpages.png')]
        bg-cover bg-center
        text-white
      "
    >
      <div className="min-h-screen py-16 px-4 backdrop-brightness-110">
        <section
          className="
            max-w-5xl mx-auto space-y-10 px-6 sm:px-12 py-10
            rounded-3xl
            bg-slate-950/80
            border border-white/10
            backdrop-blur-md
            shadow-[0_0_45px_rgba(15,23,42,0.9)]
          "
        >
          {/* TITLE + ONE-LINER */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-heading drop-shadow-md">Services</h1>
            <p className="text-lg text-slate-100 drop-shadow-sm">
              Pick a starting point. Each offer is designed to help you{" "}
              <span className="text-blue-300">win back 5–10 hours a week</span>{" "}
              by automating the work that drains your time.
            </p>
            <p className="text-sm text-slate-300 drop-shadow-sm">
              All prices in <span className="text-blue-300 font-semibold">USD</span>.
              Card, bank transfer, and — on request — crypto (USDC, USDT, BTC, ETH).
            </p>
          </div>

          {/* PACKAGE 1 – Starter Automation */}
          <div
            className="
              space-y-4 p-5 md:p-6 rounded-2xl
              bg-slate-900/80 border border-blue-500/25
              shadow-[0_0_30px_rgba(15,23,42,0.9)]
            "
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
                <span>⚡</span>
                <span>Starter Automation</span>
              </h2>
              <div className="text-right">
                <p className="text-sm uppercase tracking-wide text-slate-300">
                  Single workflow
                </p>
                <p className="text-xl font-semibold text-blue-300">
                  $297 – $497 USD
                </p>
              </div>
            </div>

            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              A focused, done-for-you automation that targets one painful manual
              process and turns it into a simple, reliable system.
            </p>

            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>Email triage &amp; summary assistant.</li>
              <li>Missed-call text-back with basic follow-up.</li>
              <li>Lead qualification flow from a single form or chatbot.</li>
              <li>Small, task-specific custom GPT for your business.</li>
            </ul>

            <p className="text-sm text-slate-300 drop-shadow-sm">
              <span className="font-semibold text-blue-300">Best for:</span>{" "}
              business owners who want a first win and to see the value of AI
              automation without a big project.
            </p>
          </div>

          {/* PACKAGE 2 – Business Automation System */}
          <div
            className="
              space-y-4 p-5 md:p-6 rounded-2xl
              bg-slate-900/80 border border-blue-500/25
              shadow-[0_0_30px_rgba(15,23,42,0.9)]
            "
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
                <span>🧩</span>
                <span>Business Automation System</span>
              </h2>
              <div className="text-right">
                <p className="text-sm uppercase tracking-wide text-slate-300">
                  Multiple automations
                </p>
                <p className="text-xl font-semibold text-blue-300">
                  $997 – $1,997 USD
                </p>
              </div>
            </div>

            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              A connected system of several automations working together to
              support your core workflows — from lead capture to follow-up,
              delivery, and internal operations.
            </p>

            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>
                3–6 integrated workflows across email, CRM, chat, or internal tools.
              </li>
              <li>
                Lead capture, qualification, and multi-step follow-up sequences.
              </li>
              <li>
                Internal assistants for documents, SOPs, and client knowledge.
              </li>
              <li>
                Light dashboards or logs so you can see what the system is doing.
              </li>
            </ul>

            <p className="text-sm text-slate-300 drop-shadow-sm">
              <span className="font-semibold text-blue-300">Best for:</span>{" "}
              small businesses ready to seriously reduce manual work and build
              a solid, long-term automation foundation.
            </p>
          </div>

          {/* PACKAGE 3 – Ongoing Care & Optimization (Retainers) */}
          <div
            className="
              space-y-4 p-5 md:p-6 rounded-2xl
              bg-slate-900/80 border border-blue-500/25
              shadow-[0_0_30px_rgba(15,23,42,0.9)]
            "
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
                  <span>🛠️</span>
                  <span>Ongoing Care &amp; Optimization</span>
                </h2>
                <div className="text-right">
                  <p className="text-sm uppercase tracking-wide text-slate-300">
                    Monthly retainers
                  </p>
                  <p className="text-sm text-blue-300 font-semibold">
                    From $149 / month
                  </p>
                </div>
              </div>

              <p className="leading-relaxed text-slate-100 drop-shadow-sm">
                Keep your automations healthy, up to date, and improving over time.
                Instead of “set it and forget it”, you get a partner who watches,
                tweaks, and evolves your system with you.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Basic */}
                <div
                  className="
                    rounded-2xl p-4
                    bg-slate-950/70 border border-slate-700/70
                    shadow-[0_0_18px_rgba(15,23,42,0.8)]
                  "
                >
                  <h3 className="font-heading text-lg drop-shadow-sm">
                    Basic
                  </h3>
                  <p className="text-blue-300 font-semibold text-sm mb-2">
                    $149 / month
                  </p>
                  <ul className="text-sm space-y-1 text-slate-100 drop-shadow-sm">
                    <li>✅ Monitoring of key automations</li>
                    <li>✅ Small fixes &amp; tweaks</li>
                    <li>✅ Email support</li>
                  </ul>
                </div>

                {/* Standard */}
                <div
                  className="
                    rounded-2xl p-4
                    bg-slate-950/80 border border-blue-500/60
                    shadow-[0_0_24px_rgba(37,99,235,0.7)]
                  "
                >
                  <h3 className="font-heading text-lg drop-shadow-sm">
                    Standard
                  </h3>
                  <p className="text-blue-300 font-semibold text-sm mb-2">
                    $249 / month
                  </p>
                  <ul className="text-sm space-y-1 text-slate-100 drop-shadow-sm">
                    <li>✅ Everything in Basic</li>
                    <li>✅ Monthly improvements &amp; optimizations</li>
                    <li>✅ Small new automation steps over time</li>
                  </ul>
                </div>

                {/* Premium */}
                <div
                  className="
                    rounded-2xl p-4
                    bg-slate-950/70 border border-amber-400/70
                    shadow-[0_0_24px_rgba(251,191,36,0.6)]
                  "
                >
                  <h3 className="font-heading text-lg drop-shadow-sm">
                    Premium
                  </h3>
                  <p className="text-blue-300 font-semibold text-sm mb-2">
                    $399 / month
                  </p>
                  <ul className="text-sm space-y-1 text-slate-100 drop-shadow-sm">
                    <li>✅ Priority support</li>
                    <li>✅ Faster turnaround on changes</li>
                    <li>✅ Strategy input as your systems grow</li>
                  </ul>
                </div>
              </div>

              <p className="text-sm text-slate-300 drop-shadow-sm">
                Retainers are available after an initial automation project, so we
                build something solid first, then keep it running and improving.
              </p>
            </div>
          </div>

          {/* HOW IT WORKS */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>📋</span>
              <span>How we work together</span>
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>We hop on a short call to understand your business and goals.</li>
              <li>We pick the most impactful starting point from the menu above.</li>
              <li>I design and deliver a first version in about 1–2 weeks.</li>
              <li>We refine it together until it genuinely saves you time.</li>
            </ol>
          </div>

          {/* CTA */}
          <div className="pt-4 text-center space-y-3">
            <p className="text-slate-100 drop-shadow-sm">
              Not sure which option fits you best? That&apos;s exactly what the
              free consultation is for.
            </p>
            <ConsultCTA>Book a free consultation</ConsultCTA>
          </div>
        </section>
      </div>
    </div>
  );
}
