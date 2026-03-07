import Link from "next/link";
import { PRICING } from "@/data/pricing";

export default function Services() {
  return (
    <div className="min-h-screen bg-[url('/styles/backgroundpages.png')] bg-cover bg-center text-white">
      <div className="min-h-screen py-16 px-4 backdrop-brightness-110">
        <section className="max-w-6xl mx-auto space-y-12 px-6 sm:px-12 py-10 rounded-3xl bg-slate-950/80 border border-white/10 backdrop-blur-md shadow-[0_0_45px_rgba(15,23,42,0.9)]">

          {/* HERO */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold">How It Works</h1>
            <p className="text-lg text-slate-200 max-w-2xl mx-auto">
              From your first call to your tenth client — here&apos;s exactly what happens when you work with BlueWise.
            </p>
          </div>

          {/* 3-STEP PROCESS */}
          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row gap-6 items-start p-6 rounded-2xl bg-slate-900/80 border border-blue-500/25">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-2xl font-bold text-blue-300">1</div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Free Audit Call <span className="text-slate-400 text-base font-normal">(15 minutes)</span></h2>
                <p className="text-slate-200 mb-3">
                  We get on a call and look at your business: how many calls you get, how many you miss,
                  your average job value, and what tools you&apos;re using now. No sales pitch — just honest
                  numbers and a clear recommendation.
                </p>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>&#10003; Calculate your current revenue loss</li>
                  <li>&#10003; Identify your biggest automation opportunities</li>
                  <li>&#10003; Recommend the right plan (or tell you we&apos;re not the right fit)</li>
                </ul>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row gap-6 items-start p-6 rounded-2xl bg-slate-900/80 border border-emerald-500/25">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl font-bold text-emerald-300">2</div>
              <div>
                <h2 className="text-2xl font-bold mb-2">We Build Your System <span className="text-slate-400 text-base font-normal">(1-2 weeks)</span></h2>
                <p className="text-slate-200 mb-3">
                  You keep running your business. We build everything in the background: your AI receptionist,
                  CRM dashboard, SMS engine, automation workflows, and whatever your plan includes. When
                  it&apos;s ready, we go live together and make sure everything works.
                </p>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>&#10003; Custom phone number or port your existing one</li>
                  <li>&#10003; AI trained on your specific business and services</li>
                  <li>&#10003; Dashboard configured with your branding</li>
                  <li>&#10003; Test calls and SMS before going live</li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row gap-6 items-start p-6 rounded-2xl bg-slate-900/80 border border-amber-500/25">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl font-bold text-amber-300">3</div>
              <div>
                <h2 className="text-2xl font-bold mb-2">We Run &amp; Optimize <span className="text-slate-400 text-base font-normal">(ongoing)</span></h2>
                <p className="text-slate-200 mb-3">
                  Your system runs 24/7. We monitor everything, fix issues before you notice them,
                  and optimize based on real data. Every month, your system gets better. You just
                  focus on the work.
                </p>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>&#10003; 24/7 monitoring and error handling</li>
                  <li>&#10003; Monthly optimization based on your lead data</li>
                  <li>&#10003; Priority support (response times depend on plan)</li>
                  <li>&#10003; No contracts — cancel anytime</li>
                </ul>
              </div>
            </div>
          </div>

          {/* WHAT YOU'RE REPLACING */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-950 border border-slate-700/50">
            <h2 className="text-2xl sm:text-3xl font-bold text-center">What You&apos;re Replacing</h2>
            <p className="text-slate-300 text-center max-w-2xl mx-auto text-sm">
              Most contractors piece together 4-5 different tools and people to manage their business.
              BlueWise replaces all of them in one platform.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-300">What you&apos;re paying for now</th>
                    <th className="text-center py-3 px-4 text-red-300">Current Cost</th>
                    <th className="text-center py-3 px-4 text-emerald-300">With BlueWise</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { item: 'Receptionist / Office admin', cost: '$3,500/mo', bw: 'AI handles it 24/7' },
                    { item: 'CRM software (GoHighLevel, Jobber, etc.)', cost: '$200-400/mo', bw: 'Built-in dashboard' },
                    { item: 'Marketing agency or lead gen', cost: '$1,500-3,000/mo', bw: 'AI captures & qualifies leads' },
                    { item: 'Bookkeeping / invoicing', cost: '$500-1,500/mo', bw: 'Auto-tracking & receipts' },
                    { item: 'Answering service', cost: '$200-500/mo', bw: 'AI voice agent included' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-slate-800/50">
                      <td className="py-3 px-4 text-slate-200">{row.item}</td>
                      <td className="py-3 px-4 text-center text-red-300 font-semibold">{row.cost}</td>
                      <td className="py-3 px-4 text-center text-emerald-300">{row.bw}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-600">
                    <td className="py-3 px-4 text-white font-bold">Total</td>
                    <td className="py-3 px-4 text-center text-red-200 font-bold text-lg">$6,000-8,900/mo</td>
                    <td className="py-3 px-4 text-center text-emerald-200 font-bold text-lg">From ${PRICING.starter.monthly}/mo</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* FEATURE GRID */}
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-center">What&apos;s Included</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: 'AI Voice Agent', desc: 'Answers calls 24/7, qualifies leads, collects job details. Sounds human, never gets tired.', tier: 'Pro+' },
                { title: 'Smart SMS Engine', desc: 'Instant text-back on missed calls. Collects photos, details, and keeps leads warm.', tier: 'All plans' },
                { title: 'CRM Dashboard', desc: 'Every lead, job, and conversation in one real-time interface. Mobile-friendly.', tier: 'All plans' },
                { title: 'Automated Quotes', desc: 'AI generates quotes from conversations. Client accepts with one click.', tier: 'Pro+' },
                { title: 'Digital Contracts', desc: 'Professional contracts with e-signatures. Automated deposit requests.', tier: 'Pro+' },
                { title: 'Financial Tracking', desc: 'Payments, expenses, receipts — all logged automatically. Accountant-ready exports.', tier: 'Pro+' },
                { title: 'Lead Capture Forms', desc: 'Website forms that feed directly into your pipeline. No manual entry.', tier: 'All plans' },
                { title: 'Meta Ads Management', desc: 'We run your Facebook/Instagram ads and feed leads directly into your system.', tier: 'Elite' },
              ].map((f) => (
                <div key={f.title} className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-white">{f.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      f.tier === 'All plans' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                      f.tier === 'Elite' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>{f.tier}</span>
                  </div>
                  <p className="text-slate-300 text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="pt-4 text-center space-y-6">
            <div className="bg-gradient-to-br from-blue-900/40 to-slate-900/80 border-2 border-blue-500/50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-3">Ready to Stop Doing Everything Yourself?</h3>
              <p className="text-slate-200 mb-6 max-w-2xl mx-auto">
                Book a 15-minute audit call. We&apos;ll show you exactly where automation can save you time and money.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact"
                  className="inline-block rounded-xl px-8 py-4 text-lg font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5">
                  Book Free Audit Call
                </Link>
                <Link href="/lead-rescue"
                  className="inline-block rounded-xl px-8 py-4 text-lg font-semibold border-2 border-slate-600 hover:border-blue-500 text-slate-200 hover:text-white transition-all">
                  See Plans &amp; Pricing
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
