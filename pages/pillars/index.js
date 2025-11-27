// pages/pillars/index.js
import Link from "next/link";
import { pillarsEn } from "@/data/pillars_en";
import ConsultCTA from "@/components/ConsultCTA";

export default function PillarsIndex() {
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
        {/* Hidden H1 for SEO/LLM indexing */}
        <h1 className="sr-only">
          AI Automation Pillar Guides for Small Businesses
        </h1>

        <section
          className="
            max-w-5xl mx-auto space-y-10 px-6 sm:px-12 py-10
            rounded-3xl
            bg-slate-950/80
            border border-white/10
            backdrop-blur-md
            shadow-[0_0_45px_rgba(15,23,42,0.9)]
          "
        >
          {/* Header */}
          <div className="space-y-4 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-blue-300/80">
              Resources
            </p>
            <h2 className="text-3xl sm:text-4xl font-heading drop-shadow-md">
              AI Automation Playbooks
            </h2>
            <p className="text-slate-100 drop-shadow-sm max-w-3xl mx-auto">
              Deep-dive guides on how small businesses can use AI automation to
              save time, increase revenue, and choose the right tools — written
              for real-world operators, not AI hype.
            </p>
          </div>

          {/* Cards */}
          <div className="space-y-6">
            {pillarsEn.map((article) => (
              <article
                key={article.slug}
                className="
                  rounded-2xl px-5 sm:px-7 py-6
                  bg-slate-900/70
                  border border-white/10
                  hover:border-blue-400/60
                  hover:shadow-[0_0_35px_rgba(59,130,246,0.45)]
                  transition
                  space-y-3
                "
              >
                <h3 className="text-xl sm:text-2xl font-heading drop-shadow-sm">
                  <Link href={`/pillars/${article.slug}`}>
                    <span className="hover:text-blue-300 transition">
                      {article.title}
                    </span>
                  </Link>
                </h3>
                <p className="text-sm text-slate-300">
                  {article.readingTime && (
                    <span className="mr-2 text-xs uppercase tracking-wide text-blue-300/80">
                      {article.readingTime} • Guide
                    </span>
                  )}
                </p>
                <p className="text-slate-100 drop-shadow-sm">
                  {article.description}
                </p>
                <div>
                  <Link
                    href={`/pillars/${article.slug}`}
                    className="
                      inline-flex items-center gap-2 text-sm
                      text-blue-300 hover:text-blue-200
                    "
                  >
                    Read the guide
                    <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Lead CTA */}
          <div className="pt-4 text-center space-y-3">
            <p className="text-slate-100 drop-shadow-sm max-w-2xl mx-auto">
              Want help turning these ideas into a working system in your
              business? Let&apos;s design your first automation together.
            </p>
            <ConsultCTA>Free 15-Min Automation Audit</ConsultCTA>
          </div>
        </section>
      </div>
    </div>
  );
}
