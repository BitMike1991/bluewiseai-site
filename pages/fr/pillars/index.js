/* eslint-disable react/no-unescaped-entities */

// pages/fr/pillars/index.js

import Link from "next/link";
import ConsultCTA from "@/components/ConsultCTA";
import pillarsFr from "@/data/pillars_fr";

export default function PillarsFrIndex() {
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
        {/* H1 caché pour le SEO / LLM */}
        <h1 className="sr-only">
          Guides piliers sur l’automatisation IA pour les petites entreprises
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
          {/* En-tête */}
          <div className="space-y-4 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-blue-300/80">
              Ressources
            </p>
            <h2 className="text-3xl sm:text-4xl font-heading drop-shadow-md">
              Guides d’automatisation IA
            </h2>
            <p className="text-slate-100 drop-shadow-sm max-w-3xl mx-auto">
              Articles de fond BlueWise AI en français sur l’automatisation IA
              pour les petites entreprises : guides pratiques, cas d’usage et
              stratégies concrètes pour gagner du temps et augmenter vos
              revenus.
            </p>
          </div>

          {/* Cartes d’articles */}
          <div className="space-y-6">
            {pillarsFr.map((article) => (
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
                  <Link href={`/fr/pillars/${article.slug}`}>
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
                    href={`/fr/pillars/${article.slug}`}
                    className="
                      inline-flex items-center gap-2 text-sm
                      text-blue-300 hover:text-blue-200
                    "
                  >
                    Lire l’article
                    <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* CTA lead */}
          <div className="pt-4 text-center space-y-3">
            <p className="text-slate-100 drop-shadow-sm max-w-2xl mx-auto">
              Vous voulez transformer ces idées en systèmes concrets dans votre
              entreprise ? Concevons ensemble votre première automatisation.
            </p>
            <ConsultCTA>Obtenez votre audit IA de 15 minutes — Gratuit</ConsultCTA>
          </div>
        </section>
      </div>
    </div>
  );
}
