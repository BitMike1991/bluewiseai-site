import HeroV2 from "../src/components/HeroV2";
import Link from "next/link";

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
      <h1 className="sr-only">Lead Rescue Platform - AI-Powered Lead Management System</h1>

      {/* HERO */}
      <HeroV2 />

      {/* PRODUCTION STATS BANNER */}
      <section className="max-w-6xl mx-auto px-6 -mt-12 relative z-30">
        <div className="rounded-3xl border-2 border-blue-500/40 bg-slate-950/95 p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(59,130,246,0.3)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-300">10,118</div>
              <div className="text-xs text-slate-400 mt-1">Operations/Week</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-300">97.6%</div>
              <div className="text-xs text-slate-400 mt-1">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-300">24/7</div>
              <div className="text-xs text-slate-400 mt-1">Availability</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-300">&lt;2 min</div>
              <div className="text-xs text-slate-400 mt-1">Response Time</div>
            </div>
          </div>
          <p className="text-center text-slate-300 text-sm mt-4">
            Live production metrics from the Lead Rescue Platform
          </p>
        </div>
      </section>

      {/* SECTION 1 — Lead Rescue Platform Overview */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-white">
        <div className="grid gap-12 lg:grid-cols-[1.4fr,1fr] items-center">
          {/* Copy */}
          <div>
            <div className="inline-block bg-blue-600/20 border border-blue-500/40 rounded-full px-4 py-1.5 mb-4">
              <span className="text-blue-300 text-xs uppercase tracking-widest font-semibold">
                Production SaaS Platform
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Lead Rescue Platform: Your 24/7 Lead Management System
            </h2>

            <p className="text-lg sm:text-xl text-slate-200/90 mb-6">
              A complete multi-tenant SaaS platform that captures missed calls,
              qualifies leads via AI voice agents and SMS, manages your inbox,
              and delivers everything to a real-time dashboard. Built for home
              services, trades, and local businesses that can&apos;t afford to
              miss opportunities.
            </p>

            <div className="space-y-3 text-slate-300 text-base sm:text-lg mb-6">
              <div className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>
                  <strong className="text-white">Missed Call? Instant SMS.</strong>{" "}
                  Your leads get a text within seconds asking how you can help.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>
                  <strong className="text-white">AI Voice Agent.</strong>{" "}
                  Handles qualification calls 24/7, asks the right questions,
                  collects details, and schedules follow-ups.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>
                  <strong className="text-white">Smart Inbox Engine.</strong>{" "}
                  Automatically sorts, prioritizes, and drafts replies for your
                  email and SMS conversations.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>
                  <strong className="text-white">Real-Time Dashboard.</strong>{" "}
                  See all leads, calls, messages, and tasks in one clean interface
                  — no more juggling apps.
                </span>
              </div>
            </div>

            <Link
              href="/lead-rescue"
              className="inline-block rounded-xl px-8 py-4 text-lg font-bold
                         bg-blue-600 hover:bg-blue-500 text-white
                         shadow-[0_0_30px_rgba(59,130,246,0.5)]
                         transition-all duration-300 hover:scale-105"
            >
              See How Lead Rescue Works →
            </Link>
          </div>

          {/* Tech Stack / Proof */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-blue-500/40 bg-slate-900/80 p-6 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.18em] text-blue-300/80 mb-3">
                Production Architecture
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                <div className="bg-slate-950/60 rounded-lg px-3 py-2">
                  <span className="font-semibold text-white">Next.js 15</span>
                  <div className="text-[10px] text-slate-400">React 19</div>
                </div>
                <div className="bg-slate-950/60 rounded-lg px-3 py-2">
                  <span className="font-semibold text-white">Supabase</span>
                  <div className="text-[10px] text-slate-400">PostgreSQL</div>
                </div>
                <div className="bg-slate-950/60 rounded-lg px-3 py-2">
                  <span className="font-semibold text-white">n8n</span>
                  <div className="text-[10px] text-slate-400">Workflows</div>
                </div>
                <div className="bg-slate-950/60 rounded-lg px-3 py-2">
                  <span className="font-semibold text-white">VAPI</span>
                  <div className="text-[10px] text-slate-400">Voice AI</div>
                </div>
                <div className="bg-slate-950/60 rounded-lg px-3 py-2">
                  <span className="font-semibold text-white">Telnyx</span>
                  <div className="text-[10px] text-slate-400">SMS/Voice</div>
                </div>
                <div className="bg-slate-950/60 rounded-lg px-3 py-2">
                  <span className="font-semibold text-white">Vercel</span>
                  <div className="text-[10px] text-slate-400">Hosting</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700/70 bg-slate-900/80 p-5 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.18em] text-emerald-300/80 mb-2">
                Real Client Result
              </p>
              <p className="text-slate-200 text-sm mb-3">
                "We went from missing 60% of calls to capturing every lead. The
                AI voice agent handles qualification while we&apos;re on the job.
                It&apos;s like having a full-time receptionist who never sleeps."
              </p>
              <p className="text-xs text-slate-400">
                — <strong className="text-slate-300">Alex D.</strong>, Ramoneur Multi-Services
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — The $72,000 Problem */}
      <section className="max-w-6xl mx-auto px-6 pb-20 text-white">
        <div className="rounded-3xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-slate-900/80 p-8 md:p-12 backdrop-blur">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
              Every Missed Call Is $300 Out the Door
            </h2>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* The Problem */}
              <div>
                <h3 className="text-xl font-semibold text-amber-300 mb-4">
                  The Math (Conservative)
                </h3>
                <div className="space-y-3 text-slate-200">
                  <div className="flex justify-between">
                    <span>Missed calls per week:</span>
                    <strong className="text-white">20</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Average job value:</span>
                    <strong className="text-white">$300</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Conversion rate (if you answered):</span>
                    <strong className="text-white">60%</strong>
                  </div>
                  <div className="h-px bg-slate-600 my-3"></div>
                  <div className="flex justify-between text-lg">
                    <span className="text-amber-300">Lost revenue per year:</span>
                    <strong className="text-amber-200 text-2xl">$187,200</strong>
                  </div>
                </div>
              </div>

              {/* The Solution */}
              <div>
                <h3 className="text-xl font-semibold text-emerald-300 mb-4">
                  With Lead Rescue (Full Tier)
                </h3>
                <div className="space-y-3 text-slate-200">
                  <div className="flex justify-between">
                    <span>Setup fee:</span>
                    <strong className="text-white">$2,997</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly support:</span>
                    <strong className="text-white">$799/mo</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>First year total:</span>
                    <strong className="text-white">$12,585</strong>
                  </div>
                  <div className="h-px bg-slate-600 my-3"></div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-lg">
                      <span className="text-emerald-300">Recovered revenue:</span>
                      <strong className="text-emerald-200">$112,320</strong>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="text-emerald-300">Net profit first year:</span>
                      <strong className="text-emerald-200 text-2xl">$99,735</strong>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Break-even in ~45 days. Everything after is pure profit.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/lead-rescue"
                className="inline-block rounded-xl px-10 py-4 text-lg font-bold
                           bg-emerald-600 hover:bg-emerald-500 text-white
                           shadow-[0_0_30px_rgba(16,185,129,0.5)]
                           transition-all duration-300"
              >
                See Pricing & Features →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — Platform Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20 text-white">
        <h2 className="text-3xl sm:text-4xl font-bold mb-2">
          Complete Lead Management System
        </h2>
        <p className="text-slate-300 text-base sm:text-lg mb-10 max-w-3xl">
          Lead Rescue isn&apos;t just an SMS bot or a voice agent. It&apos;s a
          complete platform that captures, qualifies, and manages every lead
          across every channel — all working together seamlessly.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Feature 1: Voice AI */}
          <div className="rounded-2xl border border-blue-500/40 bg-gradient-to-br from-blue-900/30 to-slate-900/80 p-6 backdrop-blur">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-2xl">
                📞
              </div>
              <h3 className="text-xl font-semibold">AI Voice Agent</h3>
            </div>
            <p className="text-slate-300 text-sm sm:text-base mb-4">
              VAPI-powered voice AI that answers calls 24/7, asks qualification
              questions, collects job details, captures photos via SMS, and
              schedules callbacks. Sounds natural, never gets tired, and learns
              your business.
            </p>
            <div className="flex gap-2 text-xs">
              <span className="bg-blue-500/20 border border-blue-500/40 rounded-full px-3 py-1 text-blue-300">
                Natural Voice
              </span>
              <span className="bg-blue-500/20 border border-blue-500/40 rounded-full px-3 py-1 text-blue-300">
                24/7 Available
              </span>
            </div>
          </div>

          {/* Feature 2: SMS Automation */}
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-900/30 to-slate-900/80 p-6 backdrop-blur">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl">
                💬
              </div>
              <h3 className="text-xl font-semibold">Smart SMS Engine</h3>
            </div>
            <p className="text-slate-300 text-sm sm:text-base mb-4">
              Instant text-back on missed calls with intelligent follow-ups.
              Asks qualification questions via SMS, collects photos and details,
              and keeps the conversation going until you&apos;re ready to take over.
            </p>
            <div className="flex gap-2 text-xs">
              <span className="bg-emerald-500/20 border border-emerald-500/40 rounded-full px-3 py-1 text-emerald-300">
                Instant Response
              </span>
              <span className="bg-emerald-500/20 border border-emerald-500/40 rounded-full px-3 py-1 text-emerald-300">
                Photo Collection
              </span>
            </div>
          </div>

          {/* Feature 3: Inbox Engine */}
          <div className="rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-900/30 to-slate-900/80 p-6 backdrop-blur">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-2xl">
                ✉️
              </div>
              <h3 className="text-xl font-semibold">Inbox Management</h3>
            </div>
            <p className="text-slate-300 text-sm sm:text-base mb-4">
              AI-powered email and SMS inbox that sorts by priority, summarizes
              threads, drafts replies in your tone, and keeps everything
              organized. Never miss an important message or waste time on junk.
            </p>
            <div className="flex gap-2 text-xs">
              <span className="bg-purple-500/20 border border-purple-500/40 rounded-full px-3 py-1 text-purple-300">
                Auto-Sort
              </span>
              <span className="bg-purple-500/20 border border-purple-500/40 rounded-full px-3 py-1 text-purple-300">
                Smart Replies
              </span>
            </div>
          </div>

          {/* Feature 4: Dashboard */}
          <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-900/30 to-slate-900/80 p-6 backdrop-blur">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl">
                📊
              </div>
              <h3 className="text-xl font-semibold">Unified Dashboard</h3>
            </div>
            <p className="text-slate-300 text-sm sm:text-base mb-4">
              See every lead, call, message, and task in one clean real-time
              interface. Filter by status, priority, or source. Assign to team
              members. Track follow-ups. Everything in one place, always up to date.
            </p>
            <div className="flex gap-2 text-xs">
              <span className="bg-amber-500/20 border border-amber-500/40 rounded-full px-3 py-1 text-amber-300">
                Real-Time
              </span>
              <span className="bg-amber-500/20 border border-amber-500/40 rounded-full px-3 py-1 text-amber-300">
                Multi-Tenant
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — Who This Is For */}
      <section className="max-w-6xl mx-auto px-6 pb-20 text-white">
        <h2 className="text-3xl sm:text-4xl font-bold mb-10 text-center">
          Built For Businesses That Can&apos;t Afford to Miss Calls
        </h2>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Perfect For */}
          <div className="rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-900/20 to-slate-900/80 p-6 backdrop-blur">
            <h3 className="text-2xl font-bold text-emerald-300 mb-4">
              ✓ Perfect For
            </h3>
            <ul className="space-y-3 text-slate-200">
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">→</span>
                <span>
                  <strong className="text-white">Home Services & Trades:</strong>{" "}
                  HVAC, plumbing, electrical, roofing, landscaping, cleaning
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">→</span>
                <span>
                  <strong className="text-white">Service Businesses:</strong>{" "}
                  Contractors, handymen, property maintenance, pest control
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">→</span>
                <span>
                  <strong className="text-white">Local Pros:</strong>{" "}
                  Auto repair, towing, locksmiths, appliance repair
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">→</span>
                <span>
                  Businesses with 1-20 employees who are too busy to answer every call
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">→</span>
                <span>
                  Companies where average job value is $300+ and missed calls = lost revenue
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">→</span>
                <span>
                  <strong className="text-white">Businesses with receptionists/assistants:</strong>{" "}
                  Stop paying them $60K to answer "Do you work in my area?" 50 times per day.
                  Lead Rescue pre-qualifies calls so your team only talks to hot leads.
                  Turn your receptionist from a call screener into a closer. Have 4 assistants?
                  Keep 2 for serious work and save $120K/year.
                </span>
              </li>
            </ul>
          </div>

          {/* Not For */}
          <div className="rounded-2xl border-2 border-red-500/50 bg-gradient-to-br from-red-900/20 to-slate-900/80 p-6 backdrop-blur">
            <h3 className="text-2xl font-bold text-red-300 mb-4">
              ✗ Not For
            </h3>
            <ul className="space-y-3 text-slate-200">
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-1">→</span>
                <span>
                  Businesses where most calls are complex consultations requiring
                  human expertise immediately (medical, legal, financial advice, etc.)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-1">→</span>
                <span>
                  Businesses where average job value is under $150 (ROI won&apos;t
                  justify the investment)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-1">→</span>
                <span>
                  Anyone looking for a cheap DIY solution or free trial — this is
                  a premium platform
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-1">→</span>
                <span>
                  Companies not ready to commit to improving their lead capture
                  systems
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center">
          <p className="text-slate-300 text-lg mb-6">
            Ready to see if Lead Rescue is right for your business?
          </p>
          <Link
            href="/lead-rescue"
            className="inline-block rounded-xl px-10 py-4 text-lg font-bold
                       bg-blue-600 hover:bg-blue-500 text-white
                       shadow-[0_0_30px_rgba(59,130,246,0.5)]
                       transition-all duration-300"
          >
            View Pricing & Book Strategy Call →
          </Link>
        </div>
      </section>

      {/* SECTION 5 — Final CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="rounded-3xl border-2 border-blue-500/50 bg-gradient-to-br from-blue-900/40 to-slate-900/90 p-8 md:p-12 text-center backdrop-blur-xl shadow-[0_0_60px_rgba(59,130,246,0.3)]">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
            Stop Losing $72,000+ Per Year in Missed Calls
          </h2>
          <p className="text-slate-200 text-lg mb-8 max-w-2xl mx-auto">
            Lead Rescue Platform handles every missed call, qualifies every lead,
            and delivers them to your dashboard — so you can focus on the work
            that actually makes money.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Link
              href="/lead-rescue"
              className="rounded-xl px-10 py-4 text-lg font-bold
                         bg-blue-600 hover:bg-blue-500 text-white
                         shadow-[0_0_30px_rgba(59,130,246,0.6)]
                         transition-all duration-300 hover:scale-105"
            >
              See How It Works →
            </Link>
            <Link
              href="/contact"
              className="rounded-xl px-10 py-4 text-lg font-semibold
                         border-2 border-slate-600 hover:border-blue-500
                         text-slate-200 hover:text-white
                         transition-all duration-300"
            >
              Book Strategy Call
            </Link>
          </div>

          <p className="text-slate-400 text-sm">
            Starting at $497 (SMS only) • Full system at $2,997 setup + $799/mo
          </p>
        </div>
      </section>
    </div>
  );
}
