// pages/lead-rescue.js
import ConsultCTA from "@/components/ConsultCTA";

export default function LeadRescueOffer() {
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
          {/* HERO */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-heading drop-shadow-md">
              Trade Lead Rescue System
            </h1>
            <p className="text-lg text-slate-100 drop-shadow-sm">
              <span className="font-semibold text-blue-300">
                Every missed call is a lost job.
              </span>{" "}
              Stop leaving money on the table. Let an AI assistant rescue your
              leads 24/7 for your HVAC, plumbing, roofing, chimney or
              electrical business.
            </p>
            <p className="text-sm text-slate-300 drop-shadow-sm">
              Special offer for small trades:{" "}
              <span className="font-semibold text-blue-300">
                one-time setup fee $497
              </span>{" "}
              (instead of{" "}
              <span className="font-semibold">$1,997–$3,500</span>) when you
              choose any monthly care plan.
            </p>
            <ConsultCTA href="/onboarding-rescue">
              Start My Lead Rescue System
            </ConsultCTA>
          </div>

          {/* PROBLEM + STATS + SIMPLE MATH */}
          <div
            className="
              space-y-5 p-5 md:p-6 rounded-2xl
              bg-slate-900/80 border border-blue-500/25
              shadow-[0_0_30px_rgba(15,23,42,0.9)]
            "
          >
            <h2 className="text-2xl font-heading drop-shadow-sm flex items-center gap-2">
              <span>🚨</span>
              <span>Why small trade businesses quietly lose thousands</span>
            </h2>

            <p className="text-slate-100 drop-shadow-sm">
              Most trades are booked by phone, text or email. When you&apos;re
              on a roof, under a sink or in front of a customer, you simply
              can&apos;t answer everything in time.
            </p>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div
                className="
                  rounded-2xl p-4
                  bg-slate-950/80 border border-red-500/40
                "
              >
                <h3 className="font-semibold text-red-300 mb-2">
                  Without Lead Rescue
                </h3>
                <ul className="space-y-1 text-slate-100">
                  <li>❌ Calls go to voicemail and never call back.</li>
                  <li>❌ Emails sit unread until late at night.</li>
                  <li>❌ Emergencies get missed or answered too late.</li>
                  <li>❌ No follow-up means warm leads go cold.</li>
                  <li>❌ You never see the full picture of your leads.</li>
                </ul>
              </div>

              <div
                className="
                  rounded-2xl p-4
                  bg-slate-950/80 border border-emerald-500/40
                "
              >
                <h3 className="font-semibold text-emerald-300 mb-2">
                  With Lead Rescue
                </h3>
                <ul className="space-y-1 text-slate-100">
                  <li>✅ Every missed call gets an instant text back.</li>
                  <li>✅ Email is auto-sorted by lead vs noise.</li>
                  <li>✅ Emergencies are flagged and prioritized.</li>
                  <li>✅ Auto follow-up keeps you top of mind.</li>
                  <li>✅ Daily summary shows every opportunity.</li>
                </ul>
              </div>
            </div>

            {/* STATS BLOCK – REAL, SOURCE-BASED NUMBERS */}
            <div
              className="
                mt-3 rounded-2xl p-4
                bg-slate-950/80 border border-blue-500/40
                text-sm text-slate-100
              "
            >
              <h3 className="font-semibold text-blue-300 mb-1">
                What the data says about missed calls:
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Industry call-tracking studies show that around{" "}
                  <span className="font-semibold">
                    60–62% of calls to small businesses go unanswered
                  </span>
                  .
                </li>
                <li>
                  Only about{" "}
                  <span className="font-semibold">1 in 5 callers</span> who hit
                  voicemail actually leave a message — the rest just hang up.
                </li>
                <li>
                  Research from InsideSales / HubSpot-style reports shows{" "}
                  <span className="font-semibold">
                    roughly 50% of buyers choose the vendor that responds first
                  </span>
                  .
                </li>
                <li>
                  Responding to a new lead within{" "}
                  <span className="font-semibold">5 minutes</span> can make you
                  dramatically more likely to qualify and win that job compared
                  to waiting hours or days.
                </li>
              </ul>
              <p className="mt-2 text-slate-300">
                In plain language: if you don&apos;t answer or follow up fast,
                a huge percentage of those leads simply disappear — and often go
                straight to your competitors.
              </p>
            </div>

            {/* SIMPLE, HONEST MATH */}
            <div
              className="
                mt-3 rounded-2xl p-4
                bg-slate-950/80 border border-slate-700/70
                text-sm text-slate-100
              "
            >
              <h3 className="font-semibold text-blue-300 mb-1">
                Simple, honest math (no hype):
              </h3>
              <p>
                If you get just{" "}
                <span className="font-semibold">20 calls per week</span> and
                miss 8 of them, and if only{" "}
                <span className="font-semibold">3 of those could become jobs</span>{" "}
                at a conservative{" "}
                <span className="font-semibold">$200 per job</span>, that&apos;s:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  <span className="font-semibold">$600 / week</span> in possible
                  work
                </li>
                <li>
                  ≈ <span className="font-semibold">$2,400 / month</span> in
                  missed revenue
                </li>
                <li>
                  ≈ <span className="font-semibold">$28,800 / year</span> left
                  on the table
                </li>
              </ul>
              <p className="mt-2 text-slate-300">
                Recovering even <span className="font-semibold">one job</span>{" "}
                per month usually pays for the system by itself.
              </p>
            </div>
          </div>

          {/* WHAT THE SYSTEM DOES */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>🤖</span>
              <span>What your Lead Rescue System actually does</span>
            </h2>
            <p className="text-slate-100 drop-shadow-sm">
              Think of it as a{" "}
              <span className="font-semibold text-blue-300">
                digital front-desk assistant
              </span>{" "}
              that never sleeps and never forgets to follow up.
            </p>

            <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-100">
              <div className="rounded-2xl p-4 bg-slate-900/80 border border-slate-700/70">
                <h3 className="font-semibold mb-2 text-blue-200">
                  Included in every Lead Rescue setup:
                </h3>
                <ul className="space-y-1">
                  <li>✅ Missed-call → instant text-back flow</li>
                  <li>✅ Automatic email triage</li>
                  <li>✅ Emergency job detection &amp; priority tagging</li>
                  <li>✅ Auto follow-up sequence for leads</li>
                  <li>✅ Daily 8AM job &amp; lead summary</li>
                  <li>✅ Lead tracking + logs for every contact</li>
                </ul>
              </div>

              <div className="rounded-2xl p-4 bg-slate-900/80 border border-slate-700/70">
                <h3 className="font-semibold mb-2 text-blue-200">
                  Built specifically for small trades:
                </h3>
                <ul className="space-y-1">
                  <li>✅ HVAC, plumbing, roofing, chimney, electricians</li>
                  <li>✅ Works with your existing phone &amp; email</li>
                  <li>✅ No need to learn a new app or CRM</li>
                  <li>✅ You stay in control of approvals &amp; changes</li>
                  <li>✅ I handle the technical stack (n8n, LLM, APIs…)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* OFFER + PRICING */}
          <div
            className="
              space-y-5 p-5 md:p-6 rounded-2xl
              bg-slate-900/80 border border-blue-500/35
              shadow-[0_0_30px_rgba(15,23,42,0.9)]
            "
          >
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>💼</span>
              <span>The Trade Lead Rescue Offer</span>
            </h2>

            <p className="text-slate-100 drop-shadow-sm">
              Normally, building a set of integrated automations like this would
              sit inside a{" "}
              <span className="font-semibold text-blue-300">
                $1,997–$3,500 system project
              </span>
              . For small trade businesses, I&apos;m packaging the essential
              pieces into a focused Lead Rescue System instead.
            </p>

            <div
              className="
                rounded-2xl p-4 md:p-5
                bg-slate-950/80 border border-emerald-500/60
                shadow-[0_0_26px_rgba(16,185,129,0.4)]
              "
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-wide text-emerald-300">
                    One-time setup (Lead Rescue System)
                  </p>
                  <h3 className="text-2xl font-heading drop-shadow-sm">
                    Trade Lead Rescue Setup
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-sm line-through text-slate-400">
                    $1,997 – $3,500 USD
                  </p>
                  <p className="text-xl font-semibold text-emerald-300">
                    $497 USD one-time
                  </p>
                  <p className="text-xs text-slate-300">
                    with any monthly care plan
                  </p>
                </div>
              </div>

              <p className="mt-3 text-sm text-slate-100">
                This covers design, build, testing and deployment of your Lead
                Rescue System. No hidden hourly fees. If you later want more
                custom automations (quotes, scheduling, internal tools, etc.),
                we can scope those as separate projects.
              </p>
            </div>

            {/* ROI BLOCK */}
            <div
              className="
                rounded-2xl p-4
                bg-slate-950/80 border border-slate-700/80
                text-sm text-slate-100
              "
            >
              <h3 className="font-semibold text-blue-300 mb-1">
                What does it need to recover to pay for itself?
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Recover <span className="font-semibold">1 job / month</span>{" "}
                  at $300 → your monthly plan is covered.
                </li>
                <li>
                  Recover <span className="font-semibold">1 job / week</span> at
                  $250 → you&apos;re up roughly $700–$900 / month.
                </li>
                <li>
                  Recover{" "}
                  <span className="font-semibold">a single emergency job</span>{" "}
                  at $500+ → you&apos;ve already paid for the $497 setup.
                </li>
              </ul>
              <p className="mt-2 text-slate-300">
                We design your system so it only takes a{" "}
                <span className="font-semibold">small fraction</span> of your
                lost leads to make it profitable.
              </p>
            </div>
          </div>

          {/* ONGOING CARE & OPTIMIZATION (MONTHLY RETAINERS) */}
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
                    From $249 / month
                  </p>
                </div>
              </div>

              <p className="leading-relaxed text-slate-100 drop-shadow-sm">
                Once your Lead Rescue System is live, you don&apos;t want to
                worry about tools, API keys, updates or breakage. These
                retainers keep your automations healthy, up to date and
                improving — and they bundle{" "}
                <span className="font-semibold">
                  the core tools and subscriptions
                </span>{" "}
                into one predictable fee.
              </p>

              {/* What’s included in monthly plans */}
              <div className="bg-slate-950/60 border border-blue-500/40 p-4 rounded-xl text-sm text-slate-100">
                <p className="text-blue-300 font-semibold mb-2">
                  Every monthly plan includes:
                </p>
                <ul className="space-y-1">
                  <li>• Hosting & monitoring of your automations (n8n, DB, logs)</li>
                  <li>• Core subscriptions (OpenAI usage, infra, dev tools)</li>
                  <li>• Telnyx messaging setup and management</li>
                  <li>• Account creation & configuration for all needed tools</li>
                  <li>• Debugging and fixes when APIs or platforms change</li>
                </ul>
                <p className="text-[11px] text-slate-400 mt-2">
                  Most businesses spend $120–$250/month on these tools alone —
                  here they&apos;re bundled inside your plan.
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
                  <h3 className="font-heading text-lg drop-shadow-sm">Basic</h3>
                  <p className="text-blue-300 font-semibold text-sm mb-2">
                    $249 / month
                  </p>
                  <ul className="text-sm space-y-1 text-slate-100 drop-shadow-sm">
                    <li>• Monitoring of key Lead Rescue flows</li>
                    <li>• Fixes & small tweaks included</li>
                    <li>• Monthly health check summary</li>
                    <li>• Core infra & tools covered</li>
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
                    <li>• Ongoing tuning of follow-up, tagging, summaries</li>
                    <li>• Priority for new feature requests</li>
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
                    <li>• Unlimited small Lead Rescue tweaks & variants</li>
                    <li>• Fast turnaround & priority support</li>
                    <li>• Strategy input as your systems expand</li>
                  </ul>
                </div>
              </div>

              <p className="text-sm text-slate-300 drop-shadow-sm">
                Your{" "}
                <span className="font-semibold text-blue-300">
                  $497 setup fee
                </span>{" "}
                is paid once to build and launch your Lead Rescue System. The
                monthly plan keeps everything running smoothly and evolving with
                your business.
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
              This offer is designed for{" "}
              <span className="font-semibold text-blue-300">
                small trade business owners
              </span>{" "}
              who are still wearing the tool belt and running the office at the
              same time.
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>HVAC techs, plumbers, roofers, chimney pros, electricians.</li>
              <li>Solo operators and small teams with no full-time office staff.</li>
              <li>
                Owners who know they&apos;re losing work when they&apos;re too
                busy to answer everything.
              </li>
            </ul>
          </div>

          {/* HOW IT WORKS */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>📋</span>
              <span>How the process works</span>
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>
                <span className="font-semibold">Quick call:</span> we map your
                current calls, texts and emails.
              </li>
              <li>
                <span className="font-semibold">Design:</span> we define what
                counts as an emergency, what to ignore, and how follow-up should
                work.
              </li>
              <li>
                <span className="font-semibold">Build:</span> I set up the
                automation stack (n8n, prompts, logs, summaries).
              </li>
              <li>
                <span className="font-semibold">Test &amp; launch:</span> we run
                live tests, tweak language, and then go fully live.
              </li>
              <li>
                <span className="font-semibold">Care plan:</span> your monthly
                retainer keeps it monitored, updated and improving.
              </li>
            </ol>
          </div>

          {/* FINAL CTA */}
          <div className="pt-4 text-center space-y-3">
            <p className="text-slate-100 drop-shadow-sm">
              If you&apos;re tired of missing calls and guessing how much work
              you&apos;re losing, this is your chance to put a{" "}
              <span className="font-semibold text-blue-300">
                Lead Rescue System
              </span>{" "}
              in place once and for all.
            </p>
            <ConsultCTA href="/onboarding-rescue">
              Book My Lead Rescue Call
            </ConsultCTA>

            <p className="text-xs text-slate-400">
              One-time setup $497 with any monthly plan. Additional custom
              automations can be added later as your systems grow.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
