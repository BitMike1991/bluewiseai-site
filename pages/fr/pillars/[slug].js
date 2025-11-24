/* eslint-disable react/no-unescaped-entities */

// pages/fr/pillars/[slug].js

import fs from "fs";
import path from "path";
import ConsultCTA from "@/components/ConsultCTA";
import pillarsFr from "@/data/pillars_fr";

export default function PillarFrArticle({ article, html }) {
  if (!article) {
    return <div>Article introuvable</div>;
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
          {/* Titre visible */}
          <header className="space-y-3 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-blue-300/80">
              Guide d’automatisation IA
            </p>
            <h1 className="text-3xl sm:text-4xl font-heading drop-shadow-md">
              {article.title}
            </h1>
            {article.readingTime && (
              <p className="text-xs text-slate-300">
                Environ {article.readingTime} de lecture
              </p>
            )}
          </header>

          {/* Corps de l’article */}
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

          {/* CTA bas de page */}
          <div className="pt-8 text-center space-y-3">
            <p className="text-slate-100 drop-shadow-sm max-w-2xl mx-auto">
              Prêt à appliquer ça dans votre propre activité ? On peut concevoir
              et construire une petite automatisation qui vous fait gagner 5–10
              heures par semaine.
            </p>
            <ConsultCTA>Réserver une consultation gratuite</ConsultCTA>
          </div>
        </section>
      </div>
    </div>
  );
}

export async function getStaticPaths() {
  const paths = pillarsFr.map((article) => ({
    params: { slug: article.slug },
  }));

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const article =
    pillarsFr.find((a) => a.slug === params.slug) || null;

  if (!article) {
    return { notFound: true };
  }

  const filePath = path.join(
    process.cwd(),
    "public",
    "pillars",
    "fr",
    article.filename
  );

  const html = fs.readFileSync(filePath, "utf8");

  return {
    props: {
      article,
      html,
    },
  };
}
