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
            max-w-6xl mx-auto space-y-10 px-6 sm:px-12 py-10
            rounded-3xl
            bg-slate-950/80
            border border-white/10
            backdrop-blur-md
            shadow-[0_0_45px_rgba(15,23,42,0.9)]
          "
        >
          {/* TITLE + ONE-LINER */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-heading drop-shadow-md">
              AI Automation Services
            </h1>
            <p className="text-lg text-slate-100 drop-shadow-sm max-w-3xl mx-auto">
              Stop drowning in admin. Our done-for-you AI assistants and
              automation systems free up
              <span className="text-blue-300 font-semibold">
                {" "}
                5–10 hours a week
              </span>{" "}
              so you can focus on running your business — not chasing emails and
              missed calls.
            </p>
            <p className="text-sm text-slate-300 drop-shadow-sm">
              All prices in{" "}
              <span className="text-blue-300 font-semibold">USD</span>. Card,
              bank transfer and — on request — crypto (USDC, USDT, BTC, ETH).
            </p>
          </div>

          {/* PACKAGE 1 – Starter Automation (one-time) */}
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
                <p className="text-xs uppercase tracking-wide text-slate-300">
                  One-time project · Single automation
                </p>
                <p className="text-xl font-semibold text-blue-300">
                  $497 – $997 USD
                </p>
              </div>
            </div>

            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              A single, focused automation built to solve{" "}
              <span className="font-semibold">
                ONE repetitive problem
              </span>{" "}
              in your business. We pick a painful manual task, automate it
              end-to-end and deliver it ready to use. This is a{" "}
              <span className="font-semibold">one-time build</span>, not a
              subscription.
            </p>

            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>Email triage &amp; summary assistant for your inbox.</li>
              <li>Missed-call text-back with simple follow-up questions.</li>
              <li>Lead intake flow from a single form, chatbot or SMS channel.</li>
              <li>Small, task-specific custom GPT for one job in your business.</li>
            </ul>

            <p className="text-sm text-slate-300 drop-shadow-sm">
              <span className="font-semibold text-blue-300">Best for:</span>{" "}
              owners who want a clear first win and to see automation working
              in their real business without committing to a big project yet.
            </p>

            <p className="text-xs text-slate-400 drop-shadow-sm">
              Typical timeline: ~1–2 weeks from kickoff to delivery.
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
                  3–6 integrated automations
                </p>
                <p className="text-xl font-semibold text-blue-300">
                  $1,997 – $3,500 USD
                </p>
              </div>
            </div>

            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Transform your operations with a small system of{" "}
              <span className="font-semibold">3–6 automations</span> that work
              together: capture leads, follow up automatically, support your
              team, and keep your internal processes running smoothly.
            </p>

            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>
                3–6 workflows across email, SMS, CRM, chat, or internal tools
                (e.g. n8n, Supabase, Telnyx, etc.).
              </li>
              <li>
                Lead capture, qualification and multi-step follow-up sequences
                so no one slips through the cracks.
              </li>
              <li>
                Internal assistants for documents, SOPs, and client/project
                knowledge.
              </li>
              <li>
                Simple dashboards or logs so you can see what your automations
                are doing behind the scenes.
              </li>
            </ul>

            <p className="text-sm text-slate-300 drop-shadow-sm">
              <span className="font-semibold text-blue-300">Best for:</span>{" "}
              small businesses who are ready to seriously reduce manual work and
              build a long-term automation foundation instead of a one-off
              quick fix.
            </p>

            <p className="text-xs text-slate-400 drop-shadow-sm">
              Typical timeline: ~2–4 weeks depending on complexity.
            </p>
          </div>

          {/* PACKAGE 3 – Ongoing Care & Optimization (Retainers) */}
          <div
            className="
              space-y-5 p-5 md:p-6 rounded-2xl
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
                    From $249 / month
                  </p>
                </div>
              </div>

              <p className="leading-relaxed text-slate-100 drop-shadow-sm">
                Once your first automation(s) are live, our retainers turn us
                into your <span className="font-semibold">automation team</span>.
                We don&apos;t just “maintain” things — we{" "}
                <span className="font-semibold">
                  monitor, improve, and keep building
                </span>{" "}
                while also taking care of all the underlying tools and
                subscriptions for you.
              </p>

              {/* What's included in monthly plans */}
              <div className="bg-slate-950/60 border border-blue-500/40 p-4 rounded-xl">
                <p className="text-sm text-blue-300 font-semibold mb-2">
                  What’s included in your monthly plan:
                </p>
                <ul className="text-sm text-slate-200 space-y-1">
                  <li>• All automation infrastructure managed by us (n8n, DB, etc.)</li>
                  <li>• Required subscriptions & dev tools bundled into one fee*</li>
                  <li>• OpenAI usage (within fair-use limits) included</li>
                  <li>• Telnyx messaging setup and routing managed by us</li>
                  <li>• We create and configure ALL needed accounts for you</li>
                  <li>• Ongoing improvements and new small automation steps</li>
                  <li>• Debugging, monitoring and handling API changes</li>
                </ul>
                <p className="text-[11px] text-slate-400 mt-2">
                  *Most businesses spend $120–$250/month on these tools alone —
                  we bundle them into one predictable plan.
                </p>
              </div>

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
                    $249 / month
                  </p>
                  <ul className="text-sm space-y-1 text-slate-100 drop-shadow-sm">
                    <li>• Monitoring of key automations</li>
                    <li>• Fixes & small tweaks included</li>
                    <li>• Monthly health check report</li>
                    <li>• All infra & subscriptions handled for you</li>
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
                    $449 / month
                  </p>
                  <ul className="text-sm space-y-1 text-slate-100 drop-shadow-sm">
                    <li>• Everything in Basic</li>
                    <li>• 1–2 new automation steps each month</li>
                    <li>• Monthly optimization / strategy review</li>
                    <li>• Priority setup for new tools & flows</li>
                    <li>• All software subscriptions included</li>
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
                    $799 / month
                  </p>
                  <ul className="text-sm space-y-1 text-slate-100 drop-shadow-sm">
                    <li>• Everything in Standard</li>
                    <li>• Unlimited small automations & updates</li>
                    <li>• Priority support & faster turnaround</li>
                    <li>• Automation roadmap & strategy input</li>
                    <li>• Full done-for-you subscription management</li>
                  </ul>
                </div>
              </div>

              <p className="text-sm text-slate-300 drop-shadow-sm">
                Retainers are available after an initial automation project.
                We build something solid first, then keep it running, improving
                and growing with your business.
              </p>
            </div>

            {/* What we handle for you */}
            <div className="mt-6 p-6 rounded-2xl bg-slate-950/70 border border-blue-500/30">
              <h3 className="text-xl font-semibold mb-3 text-white">
                What we handle for you (so you don’t have to):
              </h3>
              <ul className="text-slate-200 space-y-2 text-sm">
                <li>• Creating accounts and connecting all required tools</li>
                <li>• Managing n8n servers, databases and hosting</li>
                <li>• Paying for and managing automation-related software</li>
                <li>• Configuring Telnyx, OpenAI, Gmail/Google Workspace, etc.</li>
                <li>• Testing key workflows regularly so nothing quietly breaks</li>
                <li>• Debugging errors and handling platform or API changes</li>
              </ul>
              <p className="text-slate-300 text-sm mt-3">
                You get one clear monthly fee. We handle the entire backend, all
                the tools, all the plumbing — so you can stay focused on clients
                and growth.
              </p>
            </div>
          </div>

          {/* WHO THIS IS FOR */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>🎯</span>
              <span>Who this is for</span>
            </h2>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              These services are designed for small business owners and solo
              founders who are overwhelmed by manual admin and client
              communication, service businesses that need to respond faster, and
              agencies or consultants who want consistent, repeatable systems.
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>Drowning in emails, follow-ups and admin tasks.</li>
              <li>Missing leads because you can’t respond 24/7.</li>
              <li>
                Wasting hours every week on routine processes instead of high-impact
                work.
              </li>
            </ul>
          </div>

          {/* RESULTS TO EXPECT */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>🔑</span>
              <span>What results to expect</span>
            </h2>
            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>Reclaim 5–10 hours per week by automating repetitive tasks.</li>
              <li>Stop missing leads — your assistants work 24/7 in the background.</li>
              <li>Deliver a faster, more consistent client experience.</li>
              <li>Build a scalable foundation that can grow with your business.</li>
            </ul>
          </div>

          {/* FAQ */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>❓</span>
              <span>Frequently asked questions</span>
            </h2>
            <div className="space-y-3 text-slate-100 drop-shadow-sm">
              <div>
                <p className="font-semibold">
                  Do these automations actually work for small businesses?
                </p>
                <p className="text-slate-300">
                  Yes. When they&apos;re designed properly around your real
                  processes, they quietly handle the repetitive work that eats
                  your time so you can focus on clients, projects and growth.
                </p>
              </div>
              <div>
                <p className="font-semibold">Will I need technical skills?</p>
                <p className="text-slate-300">
                  No. We design, build and maintain everything for you. You
                  don&apos;t need to touch code — just tell us what needs to
                  happen and we translate it into systems.
                </p>
              </div>
              <div>
                <p className="font-semibold">How long does it take?</p>
                <p className="text-slate-300">
                  Starter automations typically take 1–2 weeks. Business
                  Automation Systems take about 2–4 weeks depending on the
                  number of workflows and tools involved.
                </p>
              </div>
              <div>
                <p className="font-semibold">What happens after launch?</p>
                <p className="text-slate-300">
                  That&apos;s where the retainers come in. We keep everything
                  healthy, make improvements based on how you use the system,
                  and add new pieces over time so your automation grows with
                  your business.
                </p>
              </div>
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
              <li>
                We pick the most impactful starting point from the options above.
              </li>
              <li>
                We design and deliver a first version in about 1–2 weeks (or
                slightly more for larger systems).
              </li>
              <li>
                We refine it together until it genuinely saves you time and
                feels like a natural part of how you work.
              </li>
            </ol>
          </div>

          {/* CTA */}
          <div className="pt-4 text-center space-y-3">
            <p className="text-slate-100 drop-shadow-sm">
              Not sure which option fits you best? That&apos;s exactly what the
              free consultation is for.
            </p>
            <ConsultCTA>Free 15-Min Automation Audit</ConsultCTA>
          </div>
        </section>
      </div>
    </div>
  );
}
