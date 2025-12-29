import ConsultCTA from "@/components/ConsultCTA";
import Link from "next/link";

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
          {/* HERO SECTION */}
          <div className="text-center space-y-4">
            <div className="inline-block bg-blue-600/20 border border-blue-500/40 rounded-full px-4 py-1.5 mb-4">
              <span className="text-blue-300 text-xs uppercase tracking-widest font-semibold">
                Production SaaS Platform
              </span>
            </div>
            <h1 className="text-4xl font-heading drop-shadow-md">
              Lead Rescue Platform
            </h1>
            <p className="text-lg text-slate-100 drop-shadow-sm max-w-3xl mx-auto">
              Stop losing $72,000-$187,000 per year in missed calls. Our complete
              SaaS platform captures every lead via AI voice agents and SMS, qualifies
              them 24/7, and delivers everything to your real-time dashboard.
            </p>

            {/* Production Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8">
              <div className="bg-slate-950/60 rounded-xl p-4 border border-blue-500/30">
                <div className="text-2xl font-bold text-blue-300">10,118</div>
                <div className="text-xs text-slate-400">Operations/Week</div>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-4 border border-emerald-500/30">
                <div className="text-2xl font-bold text-emerald-300">97.6%</div>
                <div className="text-xs text-slate-400">Uptime</div>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-4 border border-purple-500/30">
                <div className="text-2xl font-bold text-purple-300">24/7</div>
                <div className="text-xs text-slate-400">Availability</div>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-4 border border-amber-500/30">
                <div className="text-2xl font-bold text-amber-300">&lt;2 min</div>
                <div className="text-xs text-slate-400">Response Time</div>
              </div>
            </div>
          </div>

          {/* PRIMARY OFFERING - LEAD RESCUE PLATFORM */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-blue-900/40 to-slate-900/80 border-2 border-blue-500/50 shadow-[0_0_40px_rgba(37,99,235,0.4)]">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-heading flex items-center gap-2 drop-shadow-sm">
                <span>🚀</span>
                <span>Lead Rescue Platform</span>
              </h2>
              <div className="bg-blue-500/20 border border-blue-400/40 rounded-full px-4 py-1">
                <span className="text-blue-300 text-sm font-semibold">Primary Offering</span>
              </div>
            </div>

            <p className="text-lg leading-relaxed text-slate-100 drop-shadow-sm">
              A complete multi-tenant SaaS platform that captures missed calls, qualifies leads
              via AI voice agents and SMS, manages your inbox, and delivers everything to a
              real-time dashboard. Built specifically for home services, trades, and local businesses
              that can't afford to miss opportunities.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              {/* SMS Only Tier */}
              <div className="rounded-2xl p-5 bg-slate-950/70 border border-slate-700/70">
                <h3 className="font-heading text-xl mb-2">SMS Only</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-blue-300">$497</span>
                  <span className="text-slate-400 text-sm"> setup</span>
                  <div className="text-sm text-slate-300">+ $249/mo support</div>
                </div>
                <ul className="text-sm space-y-2 text-slate-200">
                  <li>✓ Instant SMS on missed calls</li>
                  <li>✓ Lead qualification via text</li>
                  <li>✓ Photo collection</li>
                  <li>✓ Basic dashboard</li>
                  <li className="text-slate-500">✗ No voice AI</li>
                  <li className="text-slate-500">✗ No inbox management</li>
                </ul>
              </div>

              {/* Full System Tier - FEATURED */}
              <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-900/30 to-slate-900/80 border-2 border-emerald-500/60 relative shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  ⭐ Most Popular
                </div>
                <h3 className="font-heading text-xl mb-2 mt-2">Full System</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-emerald-300">$2,997</span>
                  <span className="text-slate-400 text-sm"> setup</span>
                  <div className="text-sm text-emerald-300">+ $799/mo support</div>
                  <div className="text-xs text-emerald-400 mt-1">Save $3,000 vs competitors</div>
                </div>
                <ul className="text-sm space-y-2 text-slate-200">
                  <li>✓ Everything in SMS tier</li>
                  <li>✓ <strong>AI Voice Agent (VAPI)</strong></li>
                  <li>✓ <strong>Smart Inbox Engine</strong></li>
                  <li>✓ <strong>Email integration</strong></li>
                  <li>✓ Multi-channel dashboard</li>
                  <li>✓ Break-even in 45-60 days</li>
                </ul>
              </div>

              {/* Enterprise Tier */}
              <div className="rounded-2xl p-5 bg-slate-950/70 border border-amber-500/70">
                <h3 className="font-heading text-xl mb-2">Enterprise</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-amber-300">$4,997</span>
                  <span className="text-slate-400 text-sm"> setup</span>
                  <div className="text-sm text-slate-300">+ $1,200/mo support</div>
                </div>
                <ul className="text-sm space-y-2 text-slate-200">
                  <li>✓ Everything in Full tier</li>
                  <li>✓ Multi-location support</li>
                  <li>✓ Advanced CRM integrations</li>
                  <li>✓ Custom workflows</li>
                  <li>✓ Dedicated success manager</li>
                  <li>✓ White-label options</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
              <p className="text-slate-200">
                <strong className="text-blue-300">ROI Reality:</strong> Businesses missing
                20 calls/week at $300 avg job value lose $187,200/year. Lead Rescue costs
                $12,585 in year one. Net profit: <strong className="text-emerald-300">$99,735</strong>.
              </p>
            </div>

            <div className="text-center">
              <Link
                href="/lead-rescue"
                className="inline-block rounded-xl px-10 py-4 text-lg font-bold
                           bg-blue-600 hover:bg-blue-500 text-white
                           shadow-[0_0_30px_rgba(59,130,246,0.5)]
                           transition-all duration-300 hover:scale-105"
              >
                View Full Details & Interactive ROI Calculator →
              </Link>
            </div>
          </div>

          {/* CUSTOM ENTERPRISE SOLUTIONS */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-purple-500/25 shadow-[0_0_30px_rgba(15,23,42,0.9)]">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-heading flex items-center gap-2 drop-shadow-sm">
                <span>🏢</span>
                <span>Custom Enterprise Solutions</span>
              </h2>
              <div className="bg-purple-500/20 border border-purple-400/40 rounded-full px-4 py-1">
                <span className="text-purple-300 text-sm font-semibold">Beyond the Platform</span>
              </div>
            </div>

            <p className="text-lg leading-relaxed text-slate-100 drop-shadow-sm">
              For larger organizations, franchises, or agencies that need Lead Rescue Platform
              with custom integrations, white-label branding, or specialized workflows beyond
              our standard offering.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Multi-Location Deployments */}
              <div className="bg-slate-950/60 border border-purple-500/30 rounded-xl p-5">
                <h3 className="text-xl font-semibold mb-3 text-purple-300">
                  Multi-Location Deployments
                </h3>
                <p className="text-slate-200 text-sm mb-4">
                  Deploy Lead Rescue across 5-50+ locations with centralized management,
                  location-specific routing, and consolidated reporting.
                </p>
                <ul className="text-sm space-y-2 text-slate-300">
                  <li>• Franchise operations</li>
                  <li>• Multi-state service businesses</li>
                  <li>• Regional office networks</li>
                  <li>• Master-franchise models</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-slate-400 text-sm">
                    <strong className="text-purple-300">Investment:</strong> Starting at $25,000 + $2,500/location/month
                  </p>
                </div>
              </div>

              {/* White-Label & Agency Licensing */}
              <div className="bg-slate-950/60 border border-purple-500/30 rounded-xl p-5">
                <h3 className="text-xl font-semibold mb-3 text-purple-300">
                  White-Label & Agency Licensing
                </h3>
                <p className="text-slate-200 text-sm mb-4">
                  Rebrand Lead Rescue Platform under your agency name and resell to your
                  clients with your own pricing structure and support model.
                </p>
                <ul className="text-sm space-y-2 text-slate-300">
                  <li>• Marketing agencies</li>
                  <li>• MSPs and IT consultants</li>
                  <li>• Business coaches</li>
                  <li>• Industry-specific VARs</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-slate-400 text-sm">
                    <strong className="text-purple-300">Investment:</strong> $50,000 licensing + revenue share model
                  </p>
                </div>
              </div>

              {/* Custom Integration Projects */}
              <div className="bg-slate-950/60 border border-purple-500/30 rounded-xl p-5">
                <h3 className="text-xl font-semibold mb-3 text-purple-300">
                  Custom Integration Projects
                </h3>
                <p className="text-slate-200 text-sm mb-4">
                  Extend Lead Rescue with custom integrations to your existing CRM, ERP,
                  scheduling systems, or industry-specific software.
                </p>
                <ul className="text-sm space-y-2 text-slate-300">
                  <li>• ServiceTitan, Housecall Pro, Jobber</li>
                  <li>• Salesforce, HubSpot, custom CRMs</li>
                  <li>• QuickBooks, SAP, NetSuite</li>
                  <li>• Industry-specific platforms</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-slate-400 text-sm">
                    <strong className="text-purple-300">Investment:</strong> $10,000-$35,000 depending on complexity
                  </p>
                </div>
              </div>

              {/* Strategic Consulting */}
              <div className="bg-slate-950/60 border border-purple-500/30 rounded-xl p-5">
                <h3 className="text-xl font-semibold mb-3 text-purple-300">
                  Strategic Consulting
                </h3>
                <p className="text-slate-200 text-sm mb-4">
                  6-12 week engagement to audit your lead capture systems, design a comprehensive
                  automation strategy, and plan your Lead Rescue implementation roadmap.
                </p>
                <ul className="text-sm space-y-2 text-slate-300">
                  <li>• Process audit & gap analysis</li>
                  <li>• ROI modeling & business case</li>
                  <li>• Implementation roadmap</li>
                  <li>• Change management planning</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-slate-400 text-sm">
                    <strong className="text-purple-300">Investment:</strong> $5,000-$15,000 (credited toward implementation)
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5">
              <p className="text-slate-200 text-sm">
                <strong className="text-purple-300">Note:</strong> Custom enterprise solutions
                require a minimum 12-month commitment and begin with a 2-week scoping phase
                ($2,500, credited toward project). All pricing is USD and excludes third-party
                software licenses (CRMs, telephony, etc.).
              </p>
            </div>
          </div>

          {/* WHO THIS IS FOR */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-blue-500/25">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>🎯</span>
              <span>Who Lead Rescue Is Built For</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Perfect For */}
              <div>
                <h3 className="font-semibold text-emerald-300 mb-3 text-lg">✓ Perfect For:</h3>
                <ul className="space-y-3 text-slate-200 text-sm">
                  <li>
                    <strong className="text-white">Home Services & Trades:</strong> HVAC,
                    plumbing, electrical, roofing, landscaping, cleaning, chimney services
                  </li>
                  <li>
                    <strong className="text-white">Service Businesses:</strong> Contractors,
                    handymen, property maintenance, pest control, auto repair
                  </li>
                  <li>
                    <strong className="text-white">1-20 employees</strong> who are too busy
                    to answer every call
                  </li>
                  <li>
                    Companies where <strong className="text-white">average job value is $300+</strong> and
                    missed calls = lost revenue
                  </li>
                  <li>
                    <strong className="text-white">Businesses with receptionists/assistants:</strong> Stop
                    paying them $60K to answer "Do you work in my area?" 50 times per day. Lead Rescue
                    pre-qualifies calls so your team only talks to hot leads. Have 4 assistants? Keep 2
                    for serious work and save $120K/year.
                  </li>
                </ul>
              </div>

              {/* Not For */}
              <div>
                <h3 className="font-semibold text-red-300 mb-3 text-lg">✗ Not For:</h3>
                <ul className="space-y-3 text-slate-200 text-sm">
                  <li>
                    Businesses where most calls are <strong className="text-white">complex consultations
                    requiring immediate human expertise</strong> (medical, legal, financial advice)
                  </li>
                  <li>
                    Businesses where <strong className="text-white">average job value is under $150</strong>
                    (ROI won't justify the investment)
                  </li>
                  <li>
                    Anyone looking for a <strong className="text-white">cheap DIY solution or free trial</strong> —
                    this is a premium platform
                  </li>
                  <li>
                    Companies <strong className="text-white">not ready to commit</strong> to improving
                    their lead capture systems
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* RESULTS TO EXPECT */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>📈</span>
              <span>Results Our Clients See</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-slate-950/60 border border-emerald-500/30 rounded-xl p-5">
                <div className="text-3xl font-bold text-emerald-300 mb-2">60-80%</div>
                <p className="text-slate-200 text-sm">
                  of previously missed calls now captured and qualified
                </p>
              </div>
              <div className="bg-slate-950/60 border border-blue-500/30 rounded-xl p-5">
                <div className="text-3xl font-bold text-blue-300 mb-2">45-60 days</div>
                <p className="text-slate-200 text-sm">
                  average break-even timeline for Full tier clients
                </p>
              </div>
              <div className="bg-slate-950/60 border border-purple-500/30 rounded-xl p-5">
                <div className="text-3xl font-bold text-purple-300 mb-2">$99K+</div>
                <p className="text-slate-200 text-sm">
                  average net profit in Year 1 for businesses missing 20 calls/week
                </p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>❓</span>
              <span>Frequently Asked Questions</span>
            </h2>
            <div className="space-y-4 text-slate-100 drop-shadow-sm">
              <div className="bg-slate-950/40 border border-slate-700/50 rounded-xl p-5">
                <p className="font-semibold text-lg mb-2">
                  What's the difference between Lead Rescue and hiring a receptionist?
                </p>
                <p className="text-slate-300 text-sm">
                  A receptionist costs $35K-$60K/year, works 40 hours/week, and still misses
                  after-hours calls. Lead Rescue costs $12,585 in Year 1, works 24/7/365, never
                  gets sick, and qualifies leads perfectly every time. Plus, if you already have
                  a receptionist, Lead Rescue upgrades them from answering stupid questions to
                  closing hot leads.
                </p>
              </div>
              <div className="bg-slate-950/40 border border-slate-700/50 rounded-xl p-5">
                <p className="font-semibold text-lg mb-2">
                  Does the AI voice agent sound robotic?
                </p>
                <p className="text-slate-300 text-sm">
                  No. We use VAPI's latest natural voice models that sound human. Most callers
                  don't realize they're talking to AI. The agent asks qualification questions,
                  collects details, and schedules callbacks just like a trained receptionist would.
                </p>
              </div>
              <div className="bg-slate-950/40 border border-slate-700/50 rounded-xl p-5">
                <p className="font-semibold text-lg mb-2">
                  How long does setup take?
                </p>
                <p className="text-slate-300 text-sm">
                  Standard Lead Rescue setup takes 2-3 weeks from kickoff to go-live. We handle
                  everything: phone number setup (or port your existing number), voice agent training,
                  SMS qualification flows, dashboard configuration, and team training. Custom enterprise
                  solutions take 4-8 weeks depending on complexity.
                </p>
              </div>
              <div className="bg-slate-950/40 border border-slate-700/50 rounded-xl p-5">
                <p className="font-semibold text-lg mb-2">
                  What if it doesn't work for my business?
                </p>
                <p className="text-slate-300 text-sm">
                  If you're missing 15+ calls/week and your average job is $300+, it will work.
                  We have clients across HVAC, plumbing, roofing, electrical, and landscaping seeing
                  60-80% capture rates. That said, if your call volume is too low or job values are
                  under $200, we'll tell you upfront that it's not a good fit.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-4 text-center space-y-6">
            <div className="bg-gradient-to-br from-blue-900/40 to-slate-900/80 border-2 border-blue-500/50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-3">Ready to Stop Losing Leads?</h3>
              <p className="text-slate-200 mb-6 max-w-2xl mx-auto">
                Book a 15-minute strategy call to see if Lead Rescue is right for your business.
                We'll review your call volume, calculate your potential ROI, and show you exactly
                how the system works.
              </p>
              <ConsultCTA>Book Free Strategy Call</ConsultCTA>
              <p className="text-slate-400 text-sm mt-4">
                No pressure, no sales pitch. Just an honest assessment of whether we can help.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
