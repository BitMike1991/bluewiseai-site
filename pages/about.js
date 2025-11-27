import Image from "next/image";
import ConsultCTA from "@/components/ConsultCTA";

export default function About() {
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
          {/* TITLE + ONE-LINER */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-heading drop-shadow-md">About Blue Wise&nbsp;AI</h1>
            <p className="text-lg text-slate-100 drop-shadow-sm">
              I build AI automation systems for small businesses and creators who are tired of drowning in admin.
              My mission is to free up your time — <span className="text-blue-300">5–10 hours every week</span> —
              so you can double down on the work that actually grows your business.
            </p>
          </div>

          {/* HERO ROW: PHOTO + INTRO */}
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Photo */}
            <div className="shrink-0">
              <div
                className="
                  relative h-40 w-40 md:h-48 md:w-48 rounded-full overflow-hidden
                  border border-blue-400/70
                  shadow-[0_0_40px_rgba(59,130,246,0.65)]
                  bg-slate-900
                "
              >
                <Image
                  src="/mikael-profile.jpg" // <-- put your photo in /public with this name or change the path
                  alt="Mikael, founder of BlueWise AI"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Intro copy */}
            <div className="space-y-4">
              <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
                <span>👋</span>
                <span>Who&apos;s behind Blue Wise AI?</span>
              </h2>
              <p className="leading-relaxed text-slate-100 drop-shadow-sm">
                Hi, I&apos;m Mikael — the builder behind Blue Wise AI.
              </p>
              <p className="leading-relaxed text-slate-100 drop-shadow-sm">
                I started this project to help people like me — motivated, creative,
                but without a big tech team — use AI to build smart tools that
                actually save time and unlock growth.
              </p>
              <p className="leading-relaxed text-slate-100 drop-shadow-sm">
                You don&apos;t need to be a developer or a VC-backed founder to benefit
                from AI. You just need the right guide, a bit of creativity, and a
                real problem worth solving.
              </p>
            </div>
          </div>

          {/* WHO I WORK BEST WITH (LEAD-FOCUSED) */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>🎯</span>
              <span>Who I work best with</span>
            </h2>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              I work best with small business owners, solo founders, and creators
              who are already delivering value but feel stuck doing too many manual tasks:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>You&apos;re drowning in emails, follow-ups, and admin.</li>
              <li>You know AI could help, but you don&apos;t know where to start.</li>
              <li>You prefer simple, practical systems over big, complicated software.</li>
            </ul>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              If that sounds like you, we&apos;re probably a great fit.
            </p>
          </div>

          {/* WHAT I DO */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>🧠</span>
              <span>What I do</span>
            </h2>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              I design and build small, high-impact automations:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>Email triage, summaries, and smart auto-replies.</li>
              <li>Lead capture and qualification flows.</li>
              <li>Missed-call text-back and follow-up sequences.</li>
              <li>Custom GPT tools for your specific business workflows.</li>
            </ul>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              I&apos;ve already launched AI-powered apps and internal tools and keep
              sharpening my skills daily. No fluff, no unnecessary complexity —
              just tools that work.
            </p>
          </div>

          {/* HOW I WORK */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>⚙️</span>
              <span>How I work</span>
            </h2>
            <blockquote className="border-l-4 border-blue-400 pl-4 italic text-slate-100 drop-shadow-sm">
              Clarity first. Speed second. Value always.
            </blockquote>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              We start with a short call to understand your business, your
              bottlenecks, and where automation can create quick wins. Then I
              propose a simple plan with one or two high-leverage automations
              we can build in the next 1–2 weeks.
            </p>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              I keep things lean — direct communication, fast iteration, and a
              focus on results you can feel in your calendar and your workload.
            </p>
          </div>

          {/* WHY IT MATTERS */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>🌱</span>
              <span>Why it matters</span>
            </h2>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Blue Wise AI isn’t just a business — it’s my way of living.
              I believe in working smart, not hard: using technology to create freedom and focus for ourselves and our clients.
            </p>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Tools should serve people, not the other way around. Every automation I build is designed to simplify your life and amplify your impact.
            </p>
          </div>

          {/* LEAD CTA */}
          <div className="pt-8 text-center space-y-3">
            <p className="text-slate-100 drop-shadow-sm">
              Not sure where to start? Let&apos;s map out your first automation
              together.
            </p>
            <ConsultCTA>Free 15-Min Automation Audit</ConsultCTA>
          </div>
        </section>
      </div>
    </div>
  );
}
