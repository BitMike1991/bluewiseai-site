import Image from "next/image";
import Link from "next/link";

export default function About() {
  return (
    <div className="min-h-screen bg-[url('/styles/backgroundpages.png')] bg-cover bg-center text-white">
      <div className="min-h-screen py-16 px-4 backdrop-brightness-110">
        <section className="max-w-5xl mx-auto space-y-12 px-6 sm:px-12 py-10 rounded-3xl bg-slate-950/80 border border-white/10 backdrop-blur-md shadow-[0_0_45px_rgba(15,23,42,0.9)]">

          {/* TITLE */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold">About BlueWise AI</h1>
            <p className="text-lg text-slate-200 max-w-2xl mx-auto">
              We build AI-powered business systems for contractors who are too busy working to manage their operations.
            </p>
          </div>

          {/* FOUNDER + STORY */}
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="shrink-0">
              <div className="relative h-40 w-40 md:h-48 md:w-48 rounded-full overflow-hidden border border-blue-400/70 shadow-[0_0_40px_rgba(59,130,246,0.65)] bg-slate-900">
                <Image src="/mikael-profile.jpg" alt="Mikael, founder of BlueWise AI" fill className="object-cover" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Built by a contractor, for contractors</h2>
              <p className="text-slate-200 leading-relaxed">
                I&apos;m Mikael. I started BlueWise after building the entire operations system for a
                residential contractor in Quebec — from scratch. AI receptionist, CRM, automated quotes,
                contracts, payment tracking, financial reporting. The result: a $71K pipeline in 30 days.
              </p>
              <p className="text-slate-200 leading-relaxed">
                I realized that every contractor has the same problem: they&apos;re incredible at their
                trade, but losing money on operations. Missed calls, manual quotes, paper invoices,
                zero follow-up. BlueWise fixes all of that.
              </p>
            </div>
          </div>

          {/* METHODOLOGY */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-blue-500/25">
            <h2 className="text-2xl font-bold">How We Work</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-blue-300 mb-2">Done-for-you</h3>
                <p className="text-slate-300 text-sm">
                  We don&apos;t hand you software and say &quot;figure it out.&quot; We build, configure,
                  and manage your entire system. You focus on the work.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-emerald-300 mb-2">Real results, real numbers</h3>
                <p className="text-slate-300 text-sm">
                  We show you ROI before you sign up. If the math doesn&apos;t work for your business,
                  we tell you upfront. No BS.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-amber-300 mb-2">Continuous optimization</h3>
                <p className="text-slate-300 text-sm">
                  Your system gets better every month. We monitor, tweak, and improve based on
                  actual lead data — not guesswork.
                </p>
              </div>
            </div>
          </div>

          {/* CASE STUDY HIGHLIGHT */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-emerald-900/20 to-slate-900/80 border border-emerald-500/30">
            <h2 className="text-2xl font-bold">Proven Results</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-emerald-300 mb-3">Service Plus — Full Business Build</h3>
                <p className="text-slate-200 text-sm mb-4">
                  Built everything for a residential contractor: website, social media, ad campaigns to drive leads,
                  plus the full operations system — CRM, AI receptionist, automated quotes, contracts, payment tracking,
                  and financial reporting.
                </p>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>&#10003; $71K pipeline generated in 30 days</li>
                  <li>&#10003; Zero missed leads since deployment</li>
                  <li>&#10003; 100% automated quote-to-contract flow</li>
                  <li>&#10003; Real-time financial dashboard</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-300 mb-3">Ramoneur Multi-Services — Lead Rescue</h3>
                <p className="text-slate-200 text-sm mb-4">
                  Deployed AI SMS engine and voice agent for a chimney services business. Went from
                  missing 60% of calls to capturing every lead automatically.
                </p>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>&#10003; 60% missed → 0% missed</li>
                  <li>&#10003; AI handles qualification 24/7</li>
                  <li>&#10003; First callback within 24 hours of deployment</li>
                  <li>&#10003; Zero manual follow-up required</li>
                </ul>
              </div>
            </div>
          </div>

          {/* WHAT WE BELIEVE */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">What We Believe</h2>
            <blockquote className="border-l-4 border-blue-400 pl-4 italic text-slate-200">
              &quot;Contractors are the backbone of the economy. They shouldn&apos;t have to choose between
              doing great work and running a great business. AI makes both possible.&quot;
            </blockquote>
            <p className="text-slate-300 text-sm">
              We&apos;re not a giant agency. We&apos;re a focused team that builds real systems for real
              businesses. We specialize in home services because we understand the industry, and
              because that&apos;s where AI creates the most value.
            </p>
          </div>

          {/* CTA */}
          <div className="pt-4 text-center space-y-4">
            <h3 className="text-2xl font-bold">Ready to see what BlueWise can do for you?</h3>
            <p className="text-slate-300 max-w-2xl mx-auto">
              15-minute call. We&apos;ll look at your operations and tell you exactly where automation fits.
            </p>
            <Link href="/contact"
              className="inline-block bg-blue-600 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all hover:-translate-y-0.5">
              Book Free Strategy Call
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
