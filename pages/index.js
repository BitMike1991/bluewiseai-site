import HeroV2 from "../src/components/HeroV2";
import Link from "next/link";
import { PRICING } from "@/data/pricing";

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
      <h1 className="sr-only">BlueWise AI - AI-Powered Business Optimization for Contractors</h1>

      {/* HERO */}
      <HeroV2 />

      {/* HOW IT WORKS — 3 Steps */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-white">
        <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-center">How It Works</h2>
        <p className="text-slate-300 text-center mb-12 max-w-2xl mx-auto">
          We handle the setup, you keep running your business. Three steps to automated operations.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-2xl font-bold text-blue-300 mx-auto mb-4">1</div>
            <h3 className="text-xl font-semibold mb-2">Free Audit Call</h3>
            <p className="text-slate-300 text-sm">15 minutes. We analyze your current operations and show you exactly where you&apos;re losing money.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl font-bold text-emerald-300 mx-auto mb-4">2</div>
            <h3 className="text-xl font-semibold mb-2">We Build Your System</h3>
            <p className="text-slate-300 text-sm">In 1-2 weeks, we set up your AI receptionist, CRM, automation workflows, and dashboard.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl font-bold text-amber-300 mx-auto mb-4">3</div>
            <h3 className="text-xl font-semibold mb-2">We Run &amp; Optimize</h3>
            <p className="text-slate-300 text-sm">Your system runs 24/7. We monitor, optimize, and improve it every month. You focus on the work.</p>
          </div>
        </div>
      </section>

      {/* ROI MATH — The $72,000 Problem */}
      <section className="max-w-6xl mx-auto px-6 pb-20 text-white">
        <div className="rounded-3xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-slate-900/80 p-8 md:p-12 backdrop-blur">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
              Every Missed Call Is $300 Out the Door
            </h2>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-semibold text-amber-300 mb-4">The Math (Conservative)</h3>
                <div className="space-y-3 text-slate-200">
                  <div className="flex justify-between"><span>Missed calls per week:</span><strong className="text-white">15</strong></div>
                  <div className="flex justify-between"><span>Average job value:</span><strong className="text-white">$350</strong></div>
                  <div className="flex justify-between"><span>Conversion rate:</span><strong className="text-white">50%</strong></div>
                  <div className="h-px bg-slate-600 my-3"></div>
                  <div className="flex justify-between text-lg">
                    <span className="text-amber-300">Lost revenue per year:</span>
                    <strong className="text-amber-200 text-2xl">$136,500</strong>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-emerald-300 mb-4">With BlueWise Pro</h3>
                <div className="space-y-3 text-slate-200">
                  <div className="flex justify-between"><span>Setup fee:</span><strong className="text-white">${PRICING.pro.setup.toLocaleString()}</strong></div>
                  <div className="flex justify-between"><span>Monthly:</span><strong className="text-white">${PRICING.pro.monthly.toLocaleString()}/mo</strong></div>
                  <div className="flex justify-between"><span>First year total:</span><strong className="text-white">${(PRICING.pro.setup + PRICING.pro.monthly * 12).toLocaleString()}</strong></div>
                  <div className="h-px bg-slate-600 my-3"></div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-lg">
                      <span className="text-emerald-300">Recovered revenue (70%):</span>
                      <strong className="text-emerald-200">$95,550</strong>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Break-even in ~90 days. Everything after is profit.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link href="/lead-rescue"
                className="inline-block rounded-xl px-10 py-4 text-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300">
                Calculate Your ROI
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CASE STUDY */}
      <section className="max-w-6xl mx-auto px-6 pb-20 text-white">
        <div className="rounded-3xl border border-blue-500/30 bg-slate-900/80 p-8 md:p-12 backdrop-blur">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-block bg-emerald-600/20 border border-emerald-500/40 rounded-full px-4 py-1.5 mb-4">
                <span className="text-emerald-300 text-xs uppercase tracking-widest font-semibold">Case Study</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">Service Plus: $71K Pipeline in 30 Days</h2>
              <p className="text-slate-200 mb-6">
                We built the complete package for a residential contractor in Quebec — new website, social media
                strategy, targeted ads, AND the full operations system. AI receptionist, automated quotes,
                contracts, payment tracking. We drove the leads in and made sure none got lost.
              </p>
              <Link href="/portfolio"
                className="text-blue-300 hover:text-blue-200 font-semibold transition-colors">
                Read the full case study &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/60 rounded-xl p-4 border border-emerald-500/30 text-center">
                <div className="text-3xl font-bold text-emerald-300">$71K</div>
                <div className="text-xs text-slate-400 mt-1">Pipeline in 30 days</div>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-4 border border-blue-500/30 text-center">
                <div className="text-3xl font-bold text-blue-300">0</div>
                <div className="text-xs text-slate-400 mt-1">Missed leads</div>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-4 border border-purple-500/30 text-center">
                <div className="text-3xl font-bold text-purple-300">24/7</div>
                <div className="text-xs text-slate-400 mt-1">AI receptionist</div>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-4 border border-amber-500/30 text-center">
                <div className="text-3xl font-bold text-amber-300">100%</div>
                <div className="text-xs text-slate-400 mt-1">Automated quotes</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT WE DO — Features Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20 text-white">
        <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-center">Everything You Need to Run Your Business</h2>
        <p className="text-slate-300 text-center mb-10 max-w-2xl mx-auto">
          From the first missed call to the final payment — we automate the entire customer journey.
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'AI Receptionist', desc: 'Answers calls 24/7, qualifies leads, books jobs. Sounds human.', color: 'blue' },
            { title: 'Smart SMS Engine', desc: 'Instant text-back on missed calls. Collects details and photos automatically.', color: 'emerald' },
            { title: 'CRM Dashboard', desc: 'See every lead, job, and payment in one place. Real-time, mobile-friendly.', color: 'purple' },
            { title: 'Automated Quotes', desc: 'AI generates quotes from Slack messages. Client accepts with one click.', color: 'amber' },
            { title: 'Contract Pipeline', desc: 'Digital contracts, e-signatures, automated deposit requests.', color: 'blue' },
            { title: 'Financial Tracking', desc: 'Payment logging, expense tracking, auto-receipts, accountant exports.', color: 'emerald' },
          ].map((f) => (
            <div key={f.title} className={`rounded-2xl border border-${f.color}-500/40 bg-gradient-to-br from-${f.color}-900/20 to-slate-900/80 p-6 backdrop-blur`}>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-slate-300 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ — Contractor Objections */}
      <section className="max-w-4xl mx-auto px-6 pb-20 text-white">
        <h2 className="text-3xl font-bold mb-8 text-center">Common Questions</h2>
        <div className="space-y-4">
          {[
            { q: "I'm not tech-savvy. Will I need to manage software?", a: "No. We set up and manage everything. You use the dashboard to see your leads and jobs — that's it. If you can use a smartphone, you can use BlueWise." },
            { q: "How is this different from hiring a virtual assistant?", a: "A VA costs $2-4K/month, works limited hours, makes mistakes, and calls in sick. Our AI works 24/7, never forgets a follow-up, and costs less. Plus you get the full CRM and automation platform on top." },
            { q: "What if I only get 10-15 calls a week?", a: "That's actually our sweet spot. If you're missing even 5 calls/week at $350/job, that's $45K/year walking out the door. The Starter plan at $799/mo pays for itself fast." },
            { q: "Do you work with my industry?", a: "We specialize in home services: HVAC, plumbing, roofing, electrical, landscaping, cleaning, chimney. If you do residential or commercial service work, we're built for you." },
          ].map((item) => (
            <details key={item.q} className="group rounded-xl bg-slate-900/80 border border-slate-700/50 p-5">
              <summary className="cursor-pointer font-semibold text-slate-100 list-none flex justify-between items-center">
                {item.q}
                <span className="text-slate-500 group-open:rotate-180 transition-transform text-sm">&#9660;</span>
              </summary>
              <p className="text-slate-300 text-sm mt-3">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="rounded-3xl border-2 border-blue-500/50 bg-gradient-to-br from-blue-900/40 to-slate-900/90 p-8 md:p-12 text-center backdrop-blur-xl shadow-[0_0_60px_rgba(59,130,246,0.3)]">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
            Stop Losing Money. Start Automating.
          </h2>
          <p className="text-slate-200 text-lg mb-8 max-w-2xl mx-auto">
            15-minute strategy call. We&apos;ll show you exactly how much revenue you&apos;re leaving
            on the table — and how BlueWise fixes it.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Link href="/lead-rescue"
              className="rounded-xl px-10 py-4 text-lg font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all duration-300 hover:scale-105">
              See Plans &amp; Pricing
            </Link>
            <Link href="/contact"
              className="rounded-xl px-10 py-4 text-lg font-semibold border-2 border-slate-600 hover:border-blue-500 text-slate-200 hover:text-white transition-all duration-300">
              Book Strategy Call
            </Link>
          </div>

          <p className="text-slate-400 text-sm">
            Starting at ${PRICING.starter.monthly}/mo &bull; 90-day break-even guarantee &bull; We onboard 3 clients/month
          </p>
        </div>
      </section>
    </div>
  );
}
