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
      <h1 className="sr-only">AI automation for small businesses</h1>

      {/* HERO */}
      <HeroV2 />

      {/* SECTION 1 — From Chaos to Clarity */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-white">
        <div className="grid gap-12 lg:grid-cols-[1.4fr,1fr] items-center">
          {/* Copy */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Stop drowning in admin. Start running your business again.
            </h2>
            <p className="text-lg sm:text-xl text-slate-200/90 mb-6">
              BlueWise AI builds done-for-you automations that answer leads,
              organise your inbox, and follow up so you don&apos;t have to.
              We focus on small businesses that need real results — not more
              tech headaches.
            </p>

            <ul className="space-y-3 text-slate-300 text-base sm:text-lg">
              <li>✅ Capture more leads from phone, email, and forms.</li>
              <li>✅ Cut repetitive admin by 5–10 hours per week.</li>
              <li>✅ Get simple systems you actually understand and control.</li>
            </ul>
          </div>

          {/* Stats / Proof-ish */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-5 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.18em] text-blue-300/80 mb-2">
                What clients want
              </p>
              <p className="text-slate-200 text-sm">
                <span className="font-semibold text-white">
                  Faster replies, fewer missed jobs, clear follow-ups.
                </span>{" "}
                Every automation we build is designed to protect your time and
                stop money leaking out of your inbox and missed calls.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/80 px-3 py-4 text-center">
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                  Time Saved
                </p>
                <p className="text-xl font-bold text-blue-300">5–10h</p>
                <p className="text-[11px] text-slate-400 mt-1">per week</p>
              </div>
              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/80 px-3 py-4 text-center">
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                  Lead Response
                </p>
                <p className="text-xl font-bold text-blue-300">&lt; 2 min</p>
                <p className="text-[11px] text-slate-400 mt-1">with automations</p>
              </div>
              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/80 px-3 py-4 text-center">
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                  Availability
                </p>
                <p className="text-xl font-bold text-blue-300">24/7</p>
                <p className="text-[11px] text-slate-400 mt-1">for new leads</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — What We Automate */}
      <section className="max-w-6xl mx-auto px-6 pb-20 text-white">
        <h2 className="text-3xl sm:text-4xl font-bold mb-2">
          🔧 What We Automate For You
        </h2>
        <p className="text-slate-300 text-base sm:text-lg mb-10 max-w-3xl">
          We don&apos;t sell vague &quot;AI consulting&quot;. We build concrete
          systems that plug into the tools you already use and quietly handle
          the boring work in the background.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1 */}
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6 backdrop-blur">
            <h3 className="text-xl font-semibold mb-2">
              📞 Lead Rescue & Missed-Call Text-Back
            </h3>
            <p className="text-slate-300 text-sm sm:text-base mb-3">
              Turn missed calls into conversations. Automatically text back,
              ask the right questions, collect photos, and log everything in
              one place so your team can follow up and close the job.
            </p>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-300/90">
              Great for: trades, home services, local businesses
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6 backdrop-blur">
            <h3 className="text-xl font-semibold mb-2">
              ✉️ Inbox Triage & Smart Replies
            </h3>
            <p className="text-slate-300 text-sm sm:text-base mb-3">
              AI agents that read your emails, sort by priority, summarise long
              threads, and draft clean replies using your tone of voice — so
              you can focus on the conversations that matter.
            </p>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-300/90">
              Works with: Gmail, Outlook & more
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6 backdrop-blur">
            <h3 className="text-xl font-semibold mb-2">
              🤖 Lead Qualification & Intake Bots
            </h3>
            <p className="text-slate-300 text-sm sm:text-base mb-3">
              Web, SMS or chatbots that ask smart questions, qualify leads,
              and send clean summaries to your inbox or CRM — no more chasing
              half-filled forms or missing project details.
            </p>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-300/90">
              Ideal for: quotes, bookings, discovery calls
            </p>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6 backdrop-blur">
            <h3 className="text-xl font-semibold mb-2">
              📄 Quotes, Contracts & File Automations
            </h3>
            <p className="text-slate-300 text-sm sm:text-base mb-3">
              Auto-generate quotes, proposals and simple contracts from your
              templates, then name and file everything correctly so your
              business stays organised without extra effort.
            </p>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-300/90">
              Keeps your operations clean & searchable
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3 — Recent Automations / Demo Anchor */}
      <section
        id="demo"
        className="max-w-6xl mx-auto px-6 pb-24 text-white"
      >
        <div className="grid gap-10 lg:grid-cols-[1.1fr,1fr] items-start">
          {/* Recent automations list */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              🧠 Recent Builds & Experiments
            </h2>
            <p className="text-slate-300 text-base sm:text-lg mb-6 max-w-3xl">
              A mix of client projects and internal tools we&apos;ve built
              recently. Every automation starts small, ships fast, and can grow
              with your business.
            </p>

            <div className="space-y-4 text-slate-200 text-base sm:text-lg">
              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
                <p className="font-semibold">
                  💼 Job Interview Coach GPT
                </p>
                <p className="text-slate-300 text-sm sm:text-base">
                  A custom GPT that helps candidates practice interviews with
                  realistic questions and feedback — built as a productised
                  mini-SaaS.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
                <p className="font-semibold">📚 Story Maker GPT</p>
                <p className="text-slate-300 text-sm sm:text-base">
                  A storytelling assistant that turns simple prompts into
                  full children&apos;s stories with structure, style and
                  illustrations ready to be turned into books.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
                <p className="font-semibold">
                  📆 30-Day Social Media Planner
                </p>
                <p className="text-slate-300 text-sm sm:text-base">
                  A planning GPT that generates full content calendars in your
                  brand voice — including hooks, angles and call-to-actions.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
                <p className="font-semibold">
                  🛠 Custom business automations
                </p>
                <p className="text-slate-300 text-sm sm:text-base">
                  From trades and home services to online businesses, we stitch
                  together tools like n8n, Postgres, Telnyx, Gmail and more to
                  create tailored workflows that quietly do the work for you.
                </p>
              </div>
            </div>
          </div>

          {/* Simple “How it works” + CTA */}
          <div className="rounded-3xl border border-slate-700/80 bg-slate-950/80 p-6 lg:p-7 xl:p-8 backdrop-blur">
            <h3 className="text-2xl font-semibold mb-4">
              How working with BlueWise AI feels
            </h3>

            <ol className="space-y-4 text-slate-300 text-sm sm:text-base mb-6">
              <li>
                <span className="font-semibold text-white">1. Quick chat.</span>{" "}
                We look at where you&apos;re losing time and leads today.
              </li>
              <li>
                <span className="font-semibold text-white">2. Mini game-plan.</span>{" "}
                You get a simple plan for one or two high-impact automations —
                no fluff, no jargon.
              </li>
              <li>
                <span className="font-semibold text-white">3. Build & ship.</span>{" "}
                We build, test and deploy in 24–72 hours, then refine based on
                real usage.
              </li>
            </ol>

            <p className="text-slate-300 text-sm sm:text-base mb-5">
              If you&apos;re curious but not sure where to start, the easiest
              move is a quick 15-minute call. We&apos;ll show you what&apos;s
              possible for <span className="font-semibold text-white">
                your
              </span>{" "}
              business.
            </p>

            <ConsultCTA>
              Free 15-Min Automation Audit
            </ConsultCTA>
          </div>
        </div>
      </section>
    </div>
  );
}
