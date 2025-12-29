import ConsultCTA from "@/components/ConsultCTA";
import Link from "next/link";

export default function Portfolio() {
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
            max-w-5xl mx-auto space-y-12 px-6 sm:px-12 py-10
            rounded-3xl
            bg-slate-950/80
            border border-white/10
            backdrop-blur-md
            shadow-[0_0_45px_rgba(15,23,42,0.9)]
          "
        >
          {/* Page Title + Intro */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-heading drop-shadow-md">
              🚀 Production AI Systems
            </h1>
            <p className="text-lg sm:text-xl text-slate-100 drop-shadow-sm max-w-3xl mx-auto">
              I don&apos;t just build prototypes — I build production-ready AI systems that handle thousands of operations per week.
              Here&apos;s what I&apos;ve shipped.
            </p>
          </div>

          {/* FEATURED PROJECT - Lead Rescue Platform */}
          <article
            className="
              rounded-2xl p-6 md:p-8
              bg-gradient-to-br from-blue-900/40 to-slate-900/80
              border-2 border-blue-500/50
              shadow-[0_0_40px_rgba(37,99,235,0.4)]
              relative overflow-hidden
            "
          >
            {/* Featured Badge */}
            <div className="absolute top-4 right-4 bg-blue-500/90 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              ⭐ Featured
            </div>

            <div className="space-y-6">
              {/* Header */}
              <div className="space-y-3">
                <h2 className="text-3xl sm:text-4xl font-heading drop-shadow-sm">
                  Lead Rescue Platform
                </h2>
                <p className="text-lg text-blue-200 font-semibold">
                  Full-Stack AI SaaS for Trade Businesses
                </p>
              </div>

              {/* Key Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 rounded-xl p-3 border border-blue-500/30">
                  <div className="text-2xl font-bold text-blue-300">10,118</div>
                  <div className="text-xs text-slate-300">Executions/Week</div>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-3 border border-emerald-500/30">
                  <div className="text-2xl font-bold text-emerald-300">97.6%</div>
                  <div className="text-xs text-slate-300">Uptime</div>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-3 border border-purple-500/30">
                  <div className="text-2xl font-bold text-purple-300">97</div>
                  <div className="text-xs text-slate-300">Leads Qualified</div>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-3 border border-amber-500/30">
                  <div className="text-2xl font-bold text-amber-300">24/7</div>
                  <div className="text-xs text-slate-300">Automated</div>
                </div>
              </div>

              {/* Description */}
              <p className="leading-relaxed text-slate-100 text-base">
                A complete multi-tenant SaaS platform that automatically rescues missed leads for
                trade businesses (HVAC, plumbing, roofing, chimney, electrical). Handles voice calls,
                SMS, and email with AI-powered responses, lead qualification, and automated follow-ups.
              </p>

              {/* Tech Stack */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wider">Technology Stack</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-slate-950/80 border border-slate-600 px-3 py-1.5">Next.js 15</span>
                  <span className="rounded-full bg-slate-950/80 border border-slate-600 px-3 py-1.5">React 19</span>
                  <span className="rounded-full bg-slate-950/80 border border-slate-600 px-3 py-1.5">Supabase (PostgreSQL)</span>
                  <span className="rounded-full bg-slate-950/80 border border-slate-600 px-3 py-1.5">n8n Automation</span>
                  <span className="rounded-full bg-slate-950/80 border border-slate-600 px-3 py-1.5">VAPI Voice AI</span>
                  <span className="rounded-full bg-slate-950/80 border border-slate-600 px-3 py-1.5">OpenAI GPT-4</span>
                  <span className="rounded-full bg-slate-950/80 border border-slate-600 px-3 py-1.5">Telnyx (SMS/Voice)</span>
                  <span className="rounded-full bg-slate-950/80 border border-slate-600 px-3 py-1.5">Vercel</span>
                </div>
              </div>

              {/* Key Features */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wider">What It Does</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <ul className="space-y-2 text-sm text-slate-100">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span><strong>Multi-channel AI:</strong> Handles voice calls, SMS, and email automatically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span><strong>Real-time lead scoring:</strong> Qualifies leads based on urgency, budget, and timing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span><strong>Automated follow-ups:</strong> Never lets a lead go cold</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span><strong>Customer dashboard:</strong> Real-time view of all leads and conversations</span>
                    </li>
                  </ul>
                  <ul className="space-y-2 text-sm text-slate-100">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span><strong>Multi-tenant architecture:</strong> Designed to serve hundreds of businesses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span><strong>Enterprise auth:</strong> Supabase SSR with invite system</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span><strong>Production monitoring:</strong> Error handling, health checks, daily reports</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span><strong>Billing ready:</strong> $497 setup + $249-799/mo pricing validated</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Case Study */}
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-700/50">
                <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wider mb-3">Real-World Impact</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-red-300 font-semibold mb-2">❌ Before Lead Rescue</div>
                    <ul className="space-y-1 text-slate-300">
                      <li>• 60% of calls go to voicemail</li>
                      <li>• 80% of voicemails never get returned</li>
                      <li>• $28,800/year in lost revenue (20 calls/week)</li>
                      <li>• Manual follow-up takes 2+ hours/day</li>
                    </ul>
                  </div>
                  <div>
                    <div className="text-emerald-300 font-semibold mb-2">✅ After Lead Rescue</div>
                    <ul className="space-y-1 text-slate-300">
                      <li>• 100% automated response within 5 minutes</li>
                      <li>• Lead qualification happens automatically</li>
                      <li>• Recover $2,400+/month in previously lost revenue</li>
                      <li>• Zero manual follow-up required</li>
                    </ul>
                  </div>
                </div>
                <p className="mt-4 text-slate-300 italic">
                  "We sent 90 Slybroadcast messages and got our first callback within 24 hours.
                  The AI handled it automatically while I was working on site."
                  <span className="text-blue-300"> — Mikael, Ramoneur Multi-Services</span>
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/platform/overview"
                  className="
                    inline-flex items-center gap-2 px-5 py-3 rounded-xl
                    bg-blue-600 hover:bg-blue-500
                    text-white font-semibold
                    shadow-lg shadow-blue-500/30
                    transition-all duration-200
                    hover:-translate-y-0.5
                  "
                >
                  View Live Platform →
                </Link>
                <Link
                  href="/lead-rescue"
                  className="
                    inline-flex items-center gap-2 px-5 py-3 rounded-xl
                    border border-blue-500/50 hover:border-blue-400
                    text-blue-300 hover:text-blue-200
                    font-semibold
                    transition-all duration-200
                    hover:-translate-y-0.5
                  "
                >
                  See Pricing & Details
                </Link>
              </div>

              {/* Development Timeline */}
              <div className="pt-4 border-t border-slate-700/50">
                <p className="text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Development:</span> 4 months (Aug-Dec 2025) •
                  <span className="font-semibold text-slate-300"> Status:</span> Production (currently onboarding beta clients) •
                  <span className="font-semibold text-slate-300"> Next milestone:</span> 10 paying customers by Q1 2026
                </p>
              </div>
            </div>
          </article>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/50"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-950/80 px-4 text-sm text-slate-400 uppercase tracking-wider">
                Earlier Learning Projects
              </span>
            </div>
          </div>

          {/* Other Projects - Repositioned */}
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-slate-300 text-sm max-w-2xl mx-auto">
                Before building Lead Rescue, I prototyped several AI tools to understand the technology.
                These projects helped me learn what works in production before building the real thing.
              </p>
            </div>

            <div className="space-y-6">
              {/* Project 1 */}
              <article
                className="
                  rounded-2xl p-5 md:p-6
                  bg-slate-900/60
                  border border-slate-700/50
                  shadow-[0_0_20px_rgba(15,23,42,0.6)]
                  hover:border-slate-600
                  transition-all duration-300
                "
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                  <h3 className="text-xl font-heading drop-shadow-sm">
                    💼 Job Interview Coach GPT
                  </h3>
                  <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-slate-400">
                    <span className="rounded-full border border-slate-600 px-2.5 py-1">
                      Next.js
                    </span>
                    <span className="rounded-full border border-slate-600 px-2.5 py-1">
                      GPT-4
                    </span>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-slate-300 mb-3">
                  A web app that simulates interview scenarios with personalized feedback.
                  Helped me understand real-time AI interactions and state management.
                </p>

                <a
                  href="https://www.jobinterviewcoachgpt.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    inline-flex items-center gap-1
                    text-blue-400 hover:text-blue-300
                    text-sm font-medium
                    hover:underline
                  "
                >
                  View live demo →
                </a>
              </article>

              {/* Project 2 */}
              <article
                className="
                  rounded-2xl p-5 md:p-6
                  bg-slate-900/60
                  border border-slate-700/50
                  shadow-[0_0_20px_rgba(15,23,42,0.6)]
                  hover:border-slate-600
                  transition-all duration-300
                "
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                  <h3 className="text-xl font-heading drop-shadow-sm">
                    📚 Story Maker GPT
                  </h3>
                  <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-slate-400">
                    <span className="rounded-full border border-slate-600 px-2.5 py-1">
                      Custom GPT
                    </span>
                    <span className="rounded-full border border-slate-600 px-2.5 py-1">
                      Streamlit
                    </span>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-slate-300 mb-3">
                  Custom GPT for generating kids&apos; stories with automated PDF export.
                  Taught me prompt engineering and content generation workflows.
                </p>

                <a
                  href="https://chatgpt.com/g/g-685d9a9fec988191a649d0478b85dd56-storycraft-ai-custom-short-stories"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    inline-flex items-center gap-1
                    text-blue-400 hover:text-blue-300
                    text-sm font-medium
                    hover:underline
                  "
                >
                  View project →
                </a>
              </article>

              {/* Project 3 */}
              <article
                className="
                  rounded-2xl p-5 md:p-6
                  bg-slate-900/60
                  border border-slate-700/50
                  shadow-[0_0_20px_rgba(15,23,42,0.6)]
                  hover:border-slate-600
                  transition-all duration-300
                "
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                  <h3 className="text-xl font-heading drop-shadow-sm">
                    📆 30-Day Social Media Calendar GPT
                  </h3>
                  <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-slate-400">
                    <span className="rounded-full border border-slate-600 px-2.5 py-1">
                      LangChain
                    </span>
                    <span className="rounded-full border border-slate-600 px-2.5 py-1">
                      GPT
                    </span>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-slate-300 mb-3">
                  Generates a month of social media content with CSV export.
                  Experimented with structured outputs and bulk content generation.
                </p>

                <a
                  href="https://chatgpt.com/g/g-685da1abb65c81919f4af829257cbabc-30-day-social-media-content-calendar-generator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    inline-flex items-center gap-1
                    text-blue-400 hover:text-blue-300
                    text-sm font-medium
                    hover:underline
                  "
                >
                  View project →
                </a>
              </article>
            </div>
          </div>

          {/* What's Next */}
          <article
            className="
              rounded-2xl p-6 md:p-7
              bg-gradient-to-br from-slate-900/60 to-slate-950/80
              border border-slate-700/50
              shadow-[0_0_26px_rgba(15,23,42,0.9)]
            "
          >
            <h2 className="text-2xl font-heading drop-shadow-sm mb-3 flex items-center gap-2">
              <span>🎯</span>
              <span>Current Focus: Scaling Lead Rescue</span>
            </h2>
            <div className="space-y-3 text-slate-200">
              <p className="leading-relaxed">
                After 4 months of development, <strong>Lead Rescue is now in production</strong> with
                beta clients. The platform is handling 10,000+ automation executions per week with
                97.6% reliability.
              </p>
              <p className="leading-relaxed">
                <strong>Next milestone:</strong> Onboard 10 paying customers by end of Q1 2026.
                Currently accepting 5 more businesses this month.
              </p>
              <p className="leading-relaxed text-sm">
                <strong>Exploring next:</strong> Dental practice automation (appointment booking,
                multi-provider calendars, insurance capture). Early research shows this could be
                a $60-70k/year MRR opportunity.
              </p>
            </div>
          </article>

          {/* CTA */}
          <div className="pt-6 text-center space-y-4">
            <h3 className="text-2xl font-heading text-slate-100">
              Need a custom AI platform for your business?
            </h3>
            <p className="text-slate-300 max-w-2xl mx-auto">
              I build production-ready systems, not prototypes. If you need something
              similar to Lead Rescue—or something completely different—let&apos;s talk.
            </p>
            <ConsultCTA>Book Free 15-Min Strategy Call</ConsultCTA>
          </div>
        </section>
      </div>
    </div>
  );
}
