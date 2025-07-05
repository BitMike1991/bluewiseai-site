import ConsultCTA from '@/components/ConsultCTA';

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
      {/* No dark overlay – just natural background and bright text */}
      <div className="min-h-screen py-16 px-4 backdrop-brightness-110">
        <section className="max-w-4xl mx-auto space-y-12 px-6 sm:px-12">
          
          {/* Title */}
          <h1 className="text-4xl font-heading text-center drop-shadow-md">About</h1>

          {/* Who's Behind */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center space-x-2 drop-shadow-sm">
              <span>👋</span>
              <span>Who&rsquo;s behind Blue Wise AI?</span>
            </h2>
            <p className="leading-relaxed drop-shadow-sm">
              Hi, I&rsquo;m Mikael — the builder behind Blue Wise AI.
            </p>
            <p className="leading-relaxed drop-shadow-sm">
              I started this project to help people like me — motivated, creative, but without a big tech team —
              use AI to build smart, useful tools that save time and unlock growth.
            </p>
            <p className="leading-relaxed drop-shadow-sm">
              You don&rsquo;t need to be a developer or a VC-backed startup founder to benefit from AI.
              You just need the right guide, a bit of creativity, and a real problem worth solving.
            </p>
          </div>

          {/* What I Do */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center space-x-2 drop-shadow-sm">
              <span>🧠</span>
              <span>What I Do</span>
            </h2>
            <p className="leading-relaxed drop-shadow-sm">
              I work best with ambitious, vision-driven people who want to bring ideas to life but
              aren&rsquo;t sure how to get there. Whether it&rsquo;s automating your workflow, building a custom GPT tool,
              or prototyping a SaaS idea — I can help you get there fast.
            </p>
            <p className="leading-relaxed drop-shadow-sm">
              I&rsquo;ve launched an AI-powered app already and continue to sharpen my skills daily.
              No fluff. No unnecessary complexity. Just clear, useful tools.
            </p>
          </div>

          {/* How I Work */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center space-x-2 drop-shadow-sm">
              <span>⚙️</span>
              <span>How I Work</span>
            </h2>
            <blockquote className="border-l-4 border-primary pl-4 italic drop-shadow-sm">
              Clarity first. Speed second. Value always.
            </blockquote>
            <p className="leading-relaxed drop-shadow-sm">
              I keep things lean and focused. No bloated process, no buzzwords, and no big-agency delay.
              Just you, me, and a shared goal — to build something that works and makes life easier.
            </p>
          </div>

          {/* Why It Matters */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center space-x-2 drop-shadow-sm">
              <span>🌱</span>
              <span>Why It Matters</span>
            </h2>
            <p className="leading-relaxed drop-shadow-sm">
              Blue Wise AI is part of a bigger mission for me — to live simply, work smart, and help others do the same.
            </p>
            <p className="leading-relaxed drop-shadow-sm">
              I believe in tools that serve people — not the other way around.
            </p>
          </div>

          {/* CTA */}
          <div className="pt-8 text-center">
            <ConsultCTA>Book a free consultation</ConsultCTA>
          </div>
        </section>
      </div>
    </div>
  );
}
