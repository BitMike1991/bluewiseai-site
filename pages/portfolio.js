import Link from "next/link";

export default function Portfolio() {
  return (
    <div className="min-h-screen bg-[url('/styles/backgroundpages.png')] bg-cover bg-center text-white">
      <div className="min-h-screen py-16 px-4 backdrop-brightness-110">
        <section className="max-w-5xl mx-auto space-y-12 px-6 sm:px-12 py-10 rounded-3xl bg-slate-950/80 border border-white/10 backdrop-blur-md shadow-[0_0_45px_rgba(15,23,42,0.9)]">

          {/* TITLE */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold">Results</h1>
            <p className="text-lg text-slate-200 max-w-2xl mx-auto">
              Real numbers from real businesses. No vanity metrics — just revenue recovered and operations automated.
            </p>
          </div>

          {/* CASE STUDY 1: SERVICE PLUS */}
          <article className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-emerald-900/20 to-slate-900/80 border-2 border-emerald-500/40">
            <div className="space-y-6">
              <div>
                <div className="inline-block bg-emerald-600/20 border border-emerald-500/40 rounded-full px-4 py-1.5 mb-3">
                  <span className="text-emerald-300 text-xs uppercase tracking-widest font-semibold">Case Study</span>
                </div>
                <h2 className="text-3xl font-bold">Service Plus</h2>
                <p className="text-emerald-300 font-semibold">Residential Contractor — Quebec</p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950/60 rounded-xl p-4 border border-emerald-500/30 text-center">
                  <div className="text-3xl font-bold text-emerald-300">$71K</div>
                  <div className="text-xs text-slate-400 mt-1">Pipeline in 30 days</div>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-4 border border-blue-500/30 text-center">
                  <div className="text-3xl font-bold text-blue-300">0</div>
                  <div className="text-xs text-slate-400 mt-1">Missed leads</div>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-4 border border-purple-500/30 text-center">
                  <div className="text-3xl font-bold text-purple-300">100%</div>
                  <div className="text-xs text-slate-400 mt-1">Auto quotes</div>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-4 border border-amber-500/30 text-center">
                  <div className="text-3xl font-bold text-amber-300">24/7</div>
                  <div className="text-xs text-slate-400 mt-1">AI receptionist</div>
                </div>
              </div>

              {/* Before/After */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl p-5 bg-slate-950/80 border border-red-500/30">
                  <h3 className="font-semibold text-red-300 mb-3">Before BlueWise</h3>
                  <ul className="space-y-2 text-slate-200 text-sm">
                    <li>&#8226; No website or online presence</li>
                    <li>&#8226; No social media strategy</li>
                    <li>&#8226; No lead generation — word of mouth only</li>
                    <li>&#8226; Missing 40% of inbound calls</li>
                    <li>&#8226; Pen and paper for quotes and contracts</li>
                    <li>&#8226; No CRM — tracking leads in a notebook</li>
                    <li>&#8226; No visibility into financial performance</li>
                    <li>&#8226; 3+ hours/day on admin</li>
                  </ul>
                </div>
                <div className="rounded-xl p-5 bg-slate-950/80 border border-emerald-500/30">
                  <h3 className="font-semibold text-emerald-300 mb-3">After BlueWise</h3>
                  <ul className="space-y-2 text-slate-200 text-sm">
                    <li>&#8226; Professional website driving leads 24/7</li>
                    <li>&#8226; Social media strategy + targeted ad campaigns</li>
                    <li>&#8226; Zero missed leads — AI answers every call</li>
                    <li>&#8226; Quotes generated automatically from Slack</li>
                    <li>&#8226; Digital contracts with e-signatures</li>
                    <li>&#8226; Automated deposit requests after signing</li>
                    <li>&#8226; Real-time financial dashboard with P&amp;L</li>
                    <li>&#8226; 0 hours/day on admin — fully automated</li>
                  </ul>
                </div>
              </div>

              {/* What we built */}
              <div>
                <h3 className="font-semibold text-white mb-3">What We Built</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {['Website', 'Social Media', 'Ad Campaigns', 'AI Voice Agent (24/7)', 'SMS Lead Capture', 'CRM Dashboard', 'Quote Pipeline', 'Digital Contracts', 'E-Signatures',
                    'Payment Tracking', 'Expense Tracking', 'Auto Receipts', 'Financial Reports', 'Morning Briefing', 'Slack Integration'].map((item) => (
                    <div key={item} className="bg-slate-900/60 rounded-lg px-3 py-2 border border-slate-700/50 text-slate-300">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          {/* CASE STUDY 2: RAMONEUR */}
          <article className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-blue-900/20 to-slate-900/80 border border-blue-500/30">
            <div className="space-y-6">
              <div>
                <div className="inline-block bg-blue-600/20 border border-blue-500/40 rounded-full px-4 py-1.5 mb-3">
                  <span className="text-blue-300 text-xs uppercase tracking-widest font-semibold">Case Study</span>
                </div>
                <h2 className="text-2xl font-bold">Ramoneur Multi-Services</h2>
                <p className="text-blue-300 font-semibold">Chimney Services — Quebec</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-950/60 rounded-xl p-4 border border-blue-500/30 text-center">
                  <div className="text-3xl font-bold text-blue-300">60%→0%</div>
                  <div className="text-xs text-slate-400 mt-1">Missed call rate</div>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-4 border border-emerald-500/30 text-center">
                  <div className="text-3xl font-bold text-emerald-300">24h</div>
                  <div className="text-xs text-slate-400 mt-1">First callback</div>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-4 border border-purple-500/30 text-center">
                  <div className="text-3xl font-bold text-purple-300">0</div>
                  <div className="text-xs text-slate-400 mt-1">Manual follow-ups</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-red-300 mb-2">Before</h3>
                  <ul className="space-y-1 text-slate-300 text-sm">
                    <li>&#8226; 60% of calls going to voicemail</li>
                    <li>&#8226; 80% of voicemails never returned</li>
                    <li>&#8226; Leads calling competitors next</li>
                    <li>&#8226; 2+ hours/day on manual follow-up</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-300 mb-2">After</h3>
                  <ul className="space-y-1 text-slate-300 text-sm">
                    <li>&#8226; Every call answered or texted within 2 min</li>
                    <li>&#8226; AI qualifies leads automatically</li>
                    <li>&#8226; First results within 24 hours</li>
                    <li>&#8226; Zero manual follow-up needed</li>
                  </ul>
                </div>
              </div>

              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-700/50">
                <p className="text-slate-200 italic text-sm">
                  &quot;We sent 90 Slybroadcast messages and got our first callback within 24 hours.
                  The AI handled it automatically while I was working on site.&quot;
                </p>
                <p className="text-blue-300 text-sm mt-2">— Ramoneur Multi-Services</p>
              </div>
            </div>
          </article>

          {/* CTA */}
          <div className="pt-4 text-center space-y-4">
            <h3 className="text-2xl font-bold">Want results like these?</h3>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Book a 15-minute call. We&apos;ll look at your business and tell you exactly what we can automate.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact"
                className="inline-block bg-blue-600 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all hover:-translate-y-0.5">
                Book Free Strategy Call
              </Link>
              <Link href="/lead-rescue"
                className="inline-block border-2 border-slate-600 hover:border-blue-500 text-slate-200 hover:text-white font-semibold px-8 py-4 rounded-xl transition-all">
                See Plans &amp; Pricing
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
