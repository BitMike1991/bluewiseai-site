// pages/lead-rescue.js
import { useState } from "react";
import ConsultCTA from "@/components/ConsultCTA";
import ROICalculator from "@/components/ROICalculator";
import Link from "next/link";

export default function LeadRescueOffer() {
  const [selectedTier, setSelectedTier] = useState("pro");

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
            max-w-6xl mx-auto space-y-12 px-6 sm:px-12 py-10
            rounded-3xl
            bg-slate-950/80
            border border-white/10
            backdrop-blur-md
            shadow-[0_0_45px_rgba(15,23,42,0.9)]
          "
        >
          {/* HERO */}
          <div className="text-center space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-heading drop-shadow-md">
              Lead Rescue Platform
            </h1>
            <p className="text-xl sm:text-2xl text-blue-300 font-semibold">
              AI-Powered Lead Recovery for Trade Businesses
            </p>
            <p className="text-lg text-slate-200 drop-shadow-sm">
              Stop losing $28,800+/year to missed calls. Lead Rescue automatically responds to every lead
              via SMS, voice, and email—capturing jobs while you're on-site.
            </p>

            {/* Production Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 max-w-3xl mx-auto">
              <div className="bg-slate-900/60 rounded-xl p-3 border border-blue-500/30">
                <div className="text-2xl font-bold text-blue-300">10,118</div>
                <div className="text-xs text-slate-300">Operations/Week</div>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-3 border border-emerald-500/30">
                <div className="text-2xl font-bold text-emerald-300">97.6%</div>
                <div className="text-xs text-slate-300">Uptime</div>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-3 border border-purple-500/30">
                <div className="text-2xl font-bold text-purple-300">24/7</div>
                <div className="text-xs text-slate-300">Automated</div>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-3 border border-amber-500/30">
                <div className="text-2xl font-bold text-amber-300">97</div>
                <div className="text-xs text-slate-300">Leads Qualified</div>
              </div>
            </div>
          </div>

          {/* PROBLEM SECTION */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-blue-500/25 shadow-[0_0_30px_rgba(15,23,42,0.9)]">
            <h2 className="text-2xl sm:text-3xl font-heading flex items-center gap-2">
              <span>🚨</span>
              <span>The $28,800/Year Problem Every Trade Business Has</span>
            </h2>

            <p className="text-slate-200 text-lg">
              When you're on a roof, under a sink, or in front of a customer, you can't answer every call.
              And every missed call is money walking out the door.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-xl p-5 bg-slate-950/80 border border-red-500/40">
                <h3 className="font-semibold text-red-300 mb-3 text-lg">❌ Without Lead Rescue</h3>
                <ul className="space-y-2 text-slate-200">
                  <li>• 60% of calls go to voicemail</li>
                  <li>• 80% of voicemails never get returned</li>
                  <li>• Leads call your competitors next</li>
                  <li>• <strong>$28,800/year in lost revenue</strong> (20 calls/week)</li>
                  <li>• Manual follow-up takes 2+ hours/day</li>
                </ul>
              </div>

              <div className="rounded-xl p-5 bg-slate-950/80 border border-emerald-500/40">
                <h3 className="font-semibold text-emerald-300 mb-3 text-lg">✅ With Lead Rescue</h3>
                <ul className="space-y-2 text-slate-200">
                  <li>• 100% response within 5 minutes (automated)</li>
                  <li>• AI qualifies leads automatically</li>
                  <li>• Emergencies flagged and prioritized</li>
                  <li>• <strong>Recover $2,400+/month</strong> in lost revenue</li>
                  <li>• Zero manual follow-up required</li>
                </ul>
              </div>
            </div>

            {/* Real Testimonial */}
            <div className="mt-6 rounded-xl p-5 bg-slate-950/60 border border-slate-700/50">
              <p className="text-slate-200 italic text-sm sm:text-base">
                "We sent 90 Slybroadcast messages and got our first callback within 24 hours.
                The AI handled it automatically while I was working on site."
              </p>
              <p className="text-blue-300 text-sm mt-2">— Mikael, Ramoneur Multi-Services</p>
            </div>
          </div>

          {/* PRICING TIERS */}
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <h2 className="text-3xl sm:text-4xl font-heading">Choose Your Lead Rescue System</h2>
              <p className="text-slate-300 text-lg max-w-3xl mx-auto">
                All systems include your custom dashboard, production monitoring, and ongoing support.
                Choose the level of automation that fits your business.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* TIER 1: SMS LEAD RESCUE */}
              <div className={`rounded-2xl p-6 border-2 transition-all duration-200 ${selectedTier === 'starter' ? 'border-blue-500/70 bg-slate-900/80' : 'border-slate-700/50 bg-slate-900/60'}`}>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-heading text-slate-200">SMS Lead Rescue</h3>
                    <p className="text-sm text-slate-400 mt-1">Perfect for getting started</p>
                  </div>

                  <div className="py-4">
                    <div className="text-4xl font-bold text-blue-300">$497</div>
                    <div className="text-sm text-slate-400">One-time setup</div>
                    <div className="text-sm text-slate-300 mt-2">+ $249/mo support</div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-200">Missed call → SMS automation</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-200">SMS lead qualifier bot</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-200">Lead tracking dashboard</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-200">Daily lead summary emails</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-slate-500 mt-0.5">✗</span>
                      <span className="text-slate-500">Voice AI agent</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-slate-500 mt-0.5">✗</span>
                      <span className="text-slate-500">Inbox email engine</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedTier('starter')}
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${selectedTier === 'starter' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                  >
                    {selectedTier === 'starter' ? 'Selected' : 'Select Plan'}
                  </button>
                </div>
              </div>

              {/* TIER 2: FULL LEAD RESCUE (RECOMMENDED) */}
              <div className={`rounded-2xl p-6 border-2 relative ${selectedTier === 'pro' ? 'border-emerald-500/70 bg-gradient-to-br from-emerald-900/20 to-slate-900/80' : 'border-emerald-500/50 bg-slate-900/60'}`}>
                {/* Most Popular Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  ⭐ Most Popular
                </div>

                <div className="space-y-4 mt-2">
                  <div>
                    <h3 className="text-xl font-heading text-slate-50">Full Lead Rescue</h3>
                    <p className="text-sm text-emerald-300 mt-1">Complete automation suite</p>
                  </div>

                  <div className="py-4">
                    <div className="text-4xl font-bold text-emerald-300">$2,997</div>
                    <div className="text-sm text-slate-400">One-time setup</div>
                    <div className="text-sm text-slate-300 mt-2">+ $799/mo support</div>
                    <div className="text-xs text-emerald-300 mt-1">Save $3,000 vs competitors</div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-100 font-semibold">Everything in SMS tier</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-100"><strong>VAPI Voice AI agent</strong> (24/7 call answering)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-100">Voice-to-lead qualification</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-100">Multi-channel (voice + SMS + email)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-100">Advanced lead scoring</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-100">Priority support (4-hour response)</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedTier('pro')}
                    className="w-full py-3 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-500/30"
                  >
                    {selectedTier === 'pro' ? '✓ Selected' : 'Select Best Value'}
                  </button>

                  <div className="text-xs text-center text-slate-400 pt-2">
                    ROI: Break even in 45-60 days
                  </div>
                </div>
              </div>

              {/* TIER 3: ENTERPRISE */}
              <div className={`rounded-2xl p-6 border-2 transition-all duration-200 ${selectedTier === 'enterprise' ? 'border-amber-500/70 bg-slate-900/80' : 'border-slate-700/50 bg-slate-900/60'}`}>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-heading text-slate-200">Enterprise</h3>
                    <p className="text-sm text-slate-400 mt-1">For multi-location businesses</p>
                  </div>

                  <div className="py-4">
                    <div className="text-4xl font-bold text-amber-300">$4,997</div>
                    <div className="text-sm text-slate-400">One-time setup</div>
                    <div className="text-sm text-slate-300 mt-2">+ $1,200/mo support</div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-100 font-semibold">Everything in Full tier</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-200"><strong>Inbox AI engine</strong> (email triage)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-200">Multi-location support</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-200">Custom CRM integrations</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-200">Priority support (2-hour response)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-200">Monthly strategy calls</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedTier('enterprise')}
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${selectedTier === 'enterprise' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                  >
                    {selectedTier === 'enterprise' ? 'Selected' : 'Select Plan'}
                  </button>
                </div>
              </div>
            </div>

            {/* CTA Below Pricing */}
            <div className="text-center pt-4">
              <Link
                href="/onboarding-rescue"
                className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5"
              >
                Get Started with Lead Rescue →
              </Link>
              <p className="text-sm text-slate-400 mt-3">
                Book a 15-minute call to see which tier is right for your business
              </p>
            </div>
          </div>

          {/* INTERACTIVE ROI CALCULATOR */}
          <ROICalculator />

          {/* WHAT'S INCLUDED */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-blue-500/25">
            <h2 className="text-2xl sm:text-3xl font-heading flex items-center gap-2">
              <span>🤖</span>
              <span>What's Included In Every System</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-blue-300 text-lg">Technology Stack</h3>
                <ul className="space-y-2 text-slate-200 text-sm">
                  <li>✓ Custom n8n automation workflows</li>
                  <li>✓ Supabase database + authentication</li>
                  <li>✓ OpenAI GPT-4 for lead qualification</li>
                  <li>✓ Telnyx SMS/Voice integration</li>
                  <li>✓ VAPI Voice AI (Full & Enterprise tiers)</li>
                  <li>✓ Production monitoring & error handling</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-blue-300 text-lg">Your Dashboard</h3>
                <ul className="space-y-2 text-slate-200 text-sm">
                  <li>✓ Real-time lead tracking & conversations</li>
                  <li>✓ Lead scoring & qualification status</li>
                  <li>✓ Daily summary emails (8 AM)</li>
                  <li>✓ Emergency job detection & alerts</li>
                  <li>✓ Full conversation history</li>
                  <li>✓ Mobile-responsive design</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-slate-950/60 border border-slate-700/50">
              <p className="text-sm text-slate-300">
                <strong className="text-blue-300">All infrastructure included:</strong> You don't need
                to manage API keys, hosting, or technical setup. We handle everything so you can focus
                on running your business.
              </p>
            </div>
          </div>

          {/* WHO THIS IS FOR */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-blue-500/25">
            <h2 className="text-2xl sm:text-3xl font-heading flex items-center gap-2">
              <span>🎯</span>
              <span>Is Lead Rescue Right For Your Business?</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-emerald-300 mb-3">✓ Perfect For:</h3>
                <ul className="space-y-2 text-slate-200">
                  <li>• HVAC, plumbing, roofing, electrical, chimney businesses</li>
                  <li>• 1-20 employees ($300k-5M revenue/year)</li>
                  <li>• Getting 15-50 calls/week</li>
                  <li>• Missing 5-15 calls/week due to workload</li>
                  <li>• Average job value $300+</li>
                  <li>• Losing $20k-100k/year to missed opportunities</li>
                  <li>• <strong>Businesses with receptionists/assistants:</strong> Stop paying them $60K to answer "Do you work in my area?" 50 times per day. Lead Rescue pre-qualifies calls so your team only talks to hot leads. Have 4 assistants? Keep 2 for serious work and save $120K/year.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-red-300 mb-3">✗ Not For:</h3>
                <ul className="space-y-2 text-slate-200">
                  <li>• Businesses getting &lt;10 calls/week</li>
                  <li>• Average job value under $150</li>
                  <li>• Complex consultations requiring immediate human expertise (medical, legal, financial advice)</li>
                  <li>• Not ready to invest $2,997+ upfront</li>
                  <li>• Want to "try it out" for cheap — this is a premium platform</li>
                  <li>• Not committed to improving lead capture systems</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <p className="text-slate-200">
                <strong className="text-blue-300">Honest assessment:</strong> If you're losing less than
                $10,000/year to missed calls, the SMS tier ($497) might be a better fit. If you're losing
                $20,000+/year, the Full tier ($2,997) pays for itself in 2 months.
              </p>
            </div>
          </div>

          {/* PROCESS */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-blue-500/25">
            <h2 className="text-2xl sm:text-3xl font-heading flex items-center gap-2">
              <span>📋</span>
              <span>How The Process Works</span>
            </h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">1</div>
                <div>
                  <h3 className="font-semibold text-blue-300">Strategy Call (15 min)</h3>
                  <p className="text-slate-300 text-sm">We analyze your current lead flow and recommend the right tier</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">2</div>
                <div>
                  <h3 className="font-semibold text-blue-300">Custom Design (2-3 days)</h3>
                  <p className="text-slate-300 text-sm">We map your workflows, emergency triggers, and response templates</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">3</div>
                <div>
                  <h3 className="font-semibold text-blue-300">Build & Test (1-2 weeks)</h3>
                  <p className="text-slate-300 text-sm">We build your automations, dashboard, and voice scripts</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">4</div>
                <div>
                  <h3 className="font-semibold text-blue-300">Go Live (Day 1)</h3>
                  <p className="text-slate-300 text-sm">We launch with live monitoring and fine-tune based on real leads</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">5</div>
                <div>
                  <h3 className="font-semibold text-blue-300">Ongoing Support (Monthly)</h3>
                  <p className="text-slate-300 text-sm">We monitor, optimize, and improve your system continuously</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-blue-500/25">
            <h2 className="text-2xl sm:text-3xl font-heading">Frequently Asked Questions</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-blue-300 mb-2">Why is the Full tier $2,997 when others charge $6,000+?</h3>
                <p className="text-slate-300 text-sm">
                  Most competitors charge $3k-6k for JUST the voice agent. We bundle voice, SMS, email,
                  dashboard, and monitoring into one system because we've built it as a platform, not
                  custom code for each client. You get enterprise features at half the price.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-blue-300 mb-2">Can I upgrade from SMS to Full tier later?</h3>
                <p className="text-slate-300 text-sm">
                  Yes! Pay the difference ($2,500) and we'll add the voice agent and advanced features.
                  Most clients start with SMS to test, then upgrade within 30 days after seeing results.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-blue-300 mb-2">What's included in monthly support?</h3>
                <p className="text-slate-300 text-sm">
                  All the subscriptions (n8n, OpenAI, Telnyx, hosting), monitoring, bug fixes, small
                  tweaks, and optimization. You're not paying for our time—you're paying for peace of
                  mind that it just works.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-blue-300 mb-2">How many leads can the system handle?</h3>
                <p className="text-slate-300 text-sm">
                  Currently processing 10,118 operations/week across all clients with 97.6% uptime.
                  Your system can handle 100-500 leads/month easily. For higher volume, we move to Enterprise tier.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-blue-300 mb-2">What if it doesn't work for my business?</h3>
                <p className="text-slate-300 text-sm">
                  Honest answer: If you're not getting at least 10-15 calls/week, there's not enough
                  volume to justify the cost. That's why we do a strategy call first—to make sure it's
                  a good fit before you invest.
                </p>
              </div>
            </div>
          </div>

          {/* FINAL CTA */}
          <div className="text-center space-y-6 pt-8">
            <h2 className="text-3xl sm:text-4xl font-heading">Ready to Stop Losing Leads?</h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Book a 15-minute strategy call. We'll analyze your current lead flow and recommend
              the right tier for your business.
            </p>

            <Link
              href="/onboarding-rescue"
              className="inline-block px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xl rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5"
            >
              Book Your Strategy Call →
            </Link>

            <div className="pt-6 space-y-2">
              <p className="text-sm text-slate-400">
                Currently accepting 5 new clients this month
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                <span>✓ No credit card required</span>
                <span>✓ Free strategy call</span>
                <span>✓ Custom recommendations</span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800">
              <Link href="/portfolio" className="text-blue-400 hover:text-blue-300 text-sm">
                View full platform details & production metrics →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
