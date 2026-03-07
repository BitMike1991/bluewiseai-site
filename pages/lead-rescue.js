// pages/lead-rescue.js
import { useState } from "react";
import ROICalculator from "@/components/ROICalculator";
import Link from "next/link";
import { TIERS, COMPARISON_FEATURES } from "@/data/pricing";

export default function LeadRescueOffer() {
  const [selectedTier, setSelectedTier] = useState("pro");
  const lang = "en";

  return (
    <div className="min-h-screen bg-[url('/styles/backgroundpages.png')] bg-cover bg-center text-white">
      <div className="min-h-screen py-16 px-4 backdrop-brightness-110">
        <section className="max-w-6xl mx-auto space-y-12 px-6 sm:px-12 py-10 rounded-3xl bg-slate-950/80 border border-white/10 backdrop-blur-md shadow-[0_0_45px_rgba(15,23,42,0.9)]">

          {/* HERO */}
          <div className="text-center space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold">
              We Run Your Business Operations
              <br />
              <span className="text-blue-300">While You Do the Work</span>
            </h1>
            <p className="text-lg text-slate-200 max-w-2xl mx-auto">
              Complete AI-powered business management for contractors. From missed calls to paid invoices
              — we handle everything so you can focus on the job.
            </p>
          </div>

          {/* PRICING TIERS */}
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <h2 className="text-3xl sm:text-4xl font-bold">Choose Your Plan</h2>
              <p className="text-slate-300 text-lg max-w-3xl mx-auto">
                All plans include setup, onboarding, and ongoing support. Pick the level that fits your business.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {TIERS.map((tier) => {
                const isSelected = selectedTier === tier.id;
                const isPopular = tier.popular;
                return (
                  <div key={tier.id}
                    className={`rounded-2xl p-6 border-2 transition-all duration-200 relative ${
                      isPopular
                        ? isSelected
                          ? 'border-emerald-500/70 bg-gradient-to-br from-emerald-900/20 to-slate-900/80'
                          : 'border-emerald-500/50 bg-slate-900/60'
                        : isSelected
                          ? 'border-blue-500/70 bg-slate-900/80'
                          : 'border-slate-700/50 bg-slate-900/60'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        Most Popular
                      </div>
                    )}

                    <div className={`space-y-4 ${isPopular ? 'mt-2' : ''}`}>
                      <div>
                        <h3 className={`text-xl font-bold ${isPopular ? 'text-slate-50' : 'text-slate-200'}`}>
                          {tier.name[lang]}
                        </h3>
                        <p className={`text-sm mt-1 ${isPopular ? 'text-emerald-300' : 'text-slate-400'}`}>
                          {tier.tagline[lang]}
                        </p>
                      </div>

                      <div className="py-4">
                        <div className={`text-4xl font-bold ${isPopular ? 'text-emerald-300' : tier.id === 'elite' ? 'text-amber-300' : 'text-blue-300'}`}>
                          ${tier.setup.toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-400">One-time setup</div>
                        <div className="text-sm text-slate-300 mt-2">+ ${tier.monthly.toLocaleString()}/mo</div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {tier.features[lang].map((f, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className={`mt-0.5 ${f.included ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {f.included ? '✓' : '—'}
                            </span>
                            <span className={f.included ? 'text-slate-100' : 'text-slate-500'}>{f.text}</span>
                          </div>
                        ))}
                      </div>

                      <div className="text-xs text-slate-400 pt-2">
                        <div>Support: {tier.support[lang]}</div>
                        <div>Onboarding: {tier.onboarding[lang]}</div>
                      </div>

                      <button
                        onClick={() => setSelectedTier(tier.id)}
                        className={`w-full py-3 rounded-xl font-semibold transition-all ${
                          isPopular
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                            : isSelected
                              ? tier.id === 'elite' ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {isSelected ? '✓ Selected' : isPopular ? 'Select Best Value' : 'Select Plan'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA Below Pricing */}
            <div className="text-center pt-4">
              <Link href="/contact"
                className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5">
                Book Your Free Strategy Call
              </Link>
              <p className="text-sm text-slate-400 mt-3">
                15 minutes. We&apos;ll tell you exactly which plan makes sense for your business.
              </p>
            </div>
          </div>

          {/* FEATURE COMPARISON TABLE */}
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-center">Feature Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Feature</th>
                    <th className="text-center py-3 px-4 text-blue-300 font-semibold">Starter</th>
                    <th className="text-center py-3 px-4 text-emerald-300 font-semibold">Pro</th>
                    <th className="text-center py-3 px-4 text-amber-300 font-semibold">Elite</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4 text-slate-300 font-semibold">Setup</td>
                    <td className="py-3 px-4 text-center text-white font-bold">$2,997</td>
                    <td className="py-3 px-4 text-center text-white font-bold">$4,997</td>
                    <td className="py-3 px-4 text-center text-white font-bold">$7,500</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4 text-slate-300 font-semibold">Monthly</td>
                    <td className="py-3 px-4 text-center text-white font-bold">$799/mo</td>
                    <td className="py-3 px-4 text-center text-white font-bold">$1,997/mo</td>
                    <td className="py-3 px-4 text-center text-white font-bold">$3,997/mo</td>
                  </tr>
                  {COMPARISON_FEATURES.map((feat, i) => (
                    <tr key={i} className="border-b border-slate-800/50">
                      <td className="py-3 px-4 text-slate-200">{feat[lang]}</td>
                      {['starter', 'pro', 'elite'].map((tid) => {
                        const val = feat[tid];
                        if (typeof val === 'boolean') {
                          return (
                            <td key={tid} className="py-3 px-4 text-center">
                              {val ? <span className="text-emerald-400">✓</span> : <span className="text-slate-600">—</span>}
                            </td>
                          );
                        }
                        const display = typeof val === 'object' ? val[lang] : val;
                        return <td key={tid} className="py-3 px-4 text-center text-slate-300 text-xs">{display}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ROI CALCULATOR */}
          <ROICalculator />

          {/* WHAT YOU'RE REPLACING */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-blue-500/25">
            <h2 className="text-2xl sm:text-3xl font-bold">What You&apos;re Replacing</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-red-300 text-lg">Without BlueWise</h3>
                <div className="space-y-2 text-slate-200 text-sm">
                  <div className="flex justify-between"><span>Receptionist/assistant</span><strong className="text-red-300">$3,500/mo</strong></div>
                  <div className="flex justify-between"><span>CRM software (GoHighLevel, etc.)</span><strong className="text-red-300">$297/mo</strong></div>
                  <div className="flex justify-between"><span>Marketing agency</span><strong className="text-red-300">$2,000/mo</strong></div>
                  <div className="flex justify-between"><span>Bookkeeping/admin</span><strong className="text-red-300">$1,500/mo</strong></div>
                  <div className="h-px bg-slate-600 my-2"></div>
                  <div className="flex justify-between text-lg"><span className="text-red-300">Total</span><strong className="text-red-200 text-xl">$7,297/mo</strong></div>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-emerald-300 text-lg">With BlueWise Pro</h3>
                <div className="space-y-2 text-slate-200 text-sm">
                  <div className="flex justify-between"><span>AI receptionist 24/7</span><strong className="text-emerald-300">Included</strong></div>
                  <div className="flex justify-between"><span>Full CRM + dashboard</span><strong className="text-emerald-300">Included</strong></div>
                  <div className="flex justify-between"><span>Lead capture + qualification</span><strong className="text-emerald-300">Included</strong></div>
                  <div className="flex justify-between"><span>Contracts + invoicing</span><strong className="text-emerald-300">Included</strong></div>
                  <div className="h-px bg-slate-600 my-2"></div>
                  <div className="flex justify-between text-lg"><span className="text-emerald-300">Total</span><strong className="text-emerald-200 text-xl">$1,997/mo</strong></div>
                </div>
              </div>
            </div>
            <div className="text-center pt-2">
              <p className="text-emerald-300 font-semibold text-lg">Save $5,300/mo — that&apos;s $63,600/year back in your pocket.</p>
            </div>
          </div>

          {/* 90-DAY GUARANTEE */}
          <div className="text-center p-6 md:p-8 rounded-2xl bg-gradient-to-br from-emerald-900/30 to-slate-900/80 border-2 border-emerald-500/40">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">90-Day Break-Even Guarantee</h2>
            <p className="text-slate-200 max-w-2xl mx-auto">
              If your system doesn&apos;t generate enough leads to cover its monthly cost within 90 days,
              we keep optimizing for free until it does. No hidden fees, no excuses.
            </p>
          </div>

          {/* FAQ */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-blue-500/25">
            <h2 className="text-2xl sm:text-3xl font-bold">Frequently Asked Questions</h2>

            <div className="space-y-4">
              <details className="group">
                <summary className="cursor-pointer font-semibold text-blue-300 mb-2 list-none flex justify-between items-center">
                  How is this different from GoHighLevel?
                  <span className="text-slate-500 group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <p className="text-slate-300 text-sm pl-0 pb-4">
                  GoHighLevel is a DIY tool — you still need to set it up, maintain it, and figure out what works.
                  BlueWise is a done-for-you service. We build, run, and optimize your entire lead operation.
                  You don&apos;t touch software. You answer qualified leads.
                </p>
              </details>

              <details className="group">
                <summary className="cursor-pointer font-semibold text-blue-300 mb-2 list-none flex justify-between items-center">
                  What if I already have a CRM?
                  <span className="text-slate-500 group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <p className="text-slate-300 text-sm pl-0 pb-4">
                  We can integrate with your existing tools or replace them entirely — whichever saves you more
                  time and money. Most clients ditch their old CRM within 2 weeks because ours does more with
                  zero manual work.
                </p>
              </details>

              <details className="group">
                <summary className="cursor-pointer font-semibold text-blue-300 mb-2 list-none flex justify-between items-center">
                  Is this a scam? These numbers seem too good.
                  <span className="text-slate-500 group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <p className="text-slate-300 text-sm pl-0 pb-4">
                  The ROI calculator uses conservative estimates (70% capture rate, not 100%). We built this system
                  for Service Plus, a real contractor business that generated $71K in pipeline in 30 days. We have
                  real numbers, real clients, and a 90-day guarantee. Book a call — we&apos;ll show you the dashboard live.
                </p>
              </details>

              <details className="group">
                <summary className="cursor-pointer font-semibold text-blue-300 mb-2 list-none flex justify-between items-center">
                  What if it doesn&apos;t work for my business?
                  <span className="text-slate-500 group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <p className="text-slate-300 text-sm pl-0 pb-4">
                  That&apos;s what the strategy call is for. If your business doesn&apos;t fit (too few calls, job values
                  too low), we&apos;ll tell you upfront. We don&apos;t want unhappy clients — it&apos;s bad for everyone.
                  Plus, you&apos;re covered by the 90-day guarantee.
                </p>
              </details>

              <details className="group">
                <summary className="cursor-pointer font-semibold text-blue-300 mb-2 list-none flex justify-between items-center">
                  How long does setup take?
                  <span className="text-slate-500 group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <p className="text-slate-300 text-sm pl-0 pb-4">
                  Starter: 1 week. Pro: 1-2 weeks. Elite: 2 weeks with white-glove onboarding. You keep running
                  your business normally — we handle everything in the background and go live when ready.
                </p>
              </details>

              <details className="group">
                <summary className="cursor-pointer font-semibold text-blue-300 mb-2 list-none flex justify-between items-center">
                  Can I upgrade later?
                  <span className="text-slate-500 group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <p className="text-slate-300 text-sm pl-0 pb-4">
                  Yes. You pay the difference in setup fees and we add the new features. Most Starter clients
                  upgrade to Pro within 60 days after seeing the ROI.
                </p>
              </details>
            </div>
          </div>

          {/* FINAL CTA */}
          <div className="text-center space-y-6 pt-8">
            <h2 className="text-3xl sm:text-4xl font-bold">Ready to Automate Your Business?</h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Book a 15-minute strategy call. We&apos;ll analyze your business and tell you exactly
              which plan will work — or if BlueWise isn&apos;t the right fit.
            </p>

            <Link href="/contact"
              className="inline-block px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xl rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5">
              Book Your Strategy Call
            </Link>

            <div className="pt-6 space-y-2">
              <p className="text-sm text-slate-400">We onboard 3 new clients per month — limited capacity.</p>
              <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                <span>&#10003; No credit card required</span>
                <span>&#10003; 90-day guarantee</span>
                <span>&#10003; Free strategy call</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
