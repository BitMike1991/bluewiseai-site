// pages/pillars/[slug].js
import fs from "fs";
import path from "path";
import { pillarsEn } from "@/data/pillars_en";
import ConsultCTA from "@/components/ConsultCTA";

export default function PillarArticle({ article, html }) {
  if (!article) {
    return <div>Article not found</div>;
  }

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
            max-w-5xl mx-auto space-y-10 px-6 sm:px-12 py-10
            rounded-3xl
            bg-slate-950/80
            border border-white/10
            backdrop-blur-md
            shadow-[0_0_45px_rgba(15,23,42,0.9)]
          "
        >
          {/* Visible title for humans */}
          <header className="space-y-3 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-blue-300/80">
              AI Automation Guide
            </p>
            <h1 className="text-3xl sm:text-4xl font-heading drop-shadow-md">
              {article.title}
            </h1>
            {article.readingTime && (
              <p className="text-xs text-slate-300">
                Approx. {article.readingTime} read
              </p>
            )}
          </header>

          {/* Article body */}
          <article
            className="
              prose prose-lg prose-invert max-w-none
              prose-headings:font-heading prose-headings:text-blue-100
              prose-h1:text-3xl sm:prose-h1:text-4xl
              prose-h2:text-2xl
              prose-strong:text-blue-200
              prose-p:text-slate-100 prose-li:text-slate-100
              prose-a:text-blue-300 hover:prose-a:text-blue-200
            "

            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* CTA at bottom */}
          <div className="pt-8 text-center space-y-3">
            <p className="text-slate-100 drop-shadow-sm max-w-2xl mx-auto">
              Ready to apply this in your own business? We can design and build
              a small automation that saves you 5–10 hours every week.
            </p>
            <ConsultCTA>Free 15-Min Automation Audit</ConsultCTA>
          </div>
        </section>
      </div>
    </div>
  );
}

export async function getStaticPaths() {
  const paths = pillarsEn.map((article) => ({
    params: { slug: article.slug },
  }));

  return {
    paths,
    fallback: false, // 404 if slug not in pillarsEn
  };
}

export async function getStaticProps({ params }) {
  const article = pillarsEn.find((a) => a.slug === params.slug) || null;

  if (!article) {
    return { notFound: true };
  }

  const filePath = path.join(
    process.cwd(),
    "public",
    "pillars",
    article.htmlFile
  );

  const html = fs.readFileSync(filePath, "utf8");

  return {
    props: {
      article,
      html,
    },
  };
}
