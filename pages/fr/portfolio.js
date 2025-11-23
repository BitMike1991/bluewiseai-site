import ConsultCTA from "@/components/ConsultCTA";

export default function PortfolioFR() {
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
          {/* Titre + Intro */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-heading drop-shadow-md">📁 Portfolio</h1>
            <p className="text-lg text-slate-100 drop-shadow-sm">
              Voici quelques outils et automatisations IA que j&apos;ai construits —
              de la préparation d&apos;entrevue aux systèmes de contenu.
              Chaque projet est parti d&apos;un problème concret pour aboutir à un
              flux de travail qui fait gagner des heures chaque semaine.
            </p>
          </div>

          {/* Projets */}
          <div className="space-y-8">
            {/* Projet 1 */}
            <article
              className="
                rounded-2xl p-6 md:p-7
                bg-slate-900/80
                border border-slate-700/70
                shadow-[0_0_30px_rgba(15,23,42,0.9)]
                hover:shadow-[0_0_40px_rgba(37,99,235,0.7)]
                hover:border-blue-500/70
                transition-all duration-300
                hover:-translate-y-1
              "
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                <h2 className="text-2xl font-heading drop-shadow-sm">
                  💼 Coach d&apos;Entretien GPT
                </h2>
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-slate-300">
                  <span className="rounded-full border border-slate-600 px-3 py-1">
                    Next.js · Vercel
                  </span>
                  <span className="rounded-full border border-slate-600 px-3 py-1">
                    GPT-4 · Web App
                  </span>
                </div>
              </div>

              <p className="leading-relaxed text-slate-100 drop-shadow-sm mb-3">
                Une application web qui simule des entretiens d&apos;embauche et
                fournit un retour personnalisé sur vos réponses. Conçue avec
                Next.js, OpenAI GPT-4 et hébergée sur Vercel.
              </p>

              <ul className="list-disc list-inside text-slate-100 drop-shadow-sm space-y-1 mb-4">
                <li>Questions dynamiques selon le poste visé.</li>
                <li>Enregistrement et lecture directement dans le navigateur.</li>
                <li>Score en temps réel &amp; conseils d&apos;amélioration concrets.</li>
              </ul>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-slate-300 drop-shadow-sm">
                  <span className="font-semibold text-blue-300">Résultat :</span>{" "}
                  un environnement sécuritaire pour pratiquer des entrevues
                  comme en situation réelle.
                </p>
                <a
                  href="https://www.jobinterviewcoachgpt.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    inline-flex items-center gap-1
                    text-blue-300 hover:text-blue-200
                    text-sm font-medium
                    hover:underline
                  "
                >
                  Voir la démo en ligne →
                </a>
              </div>
            </article>

            {/* Projet 2 */}
            <article
              className="
                rounded-2xl p-6 md:p-7
                bg-slate-900/80
                border border-slate-700/70
                shadow-[0_0_30px_rgba(15,23,42,0.9)]
                hover:shadow-[0_0_40px_rgba(37,99,235,0.7)]
                hover:border-blue-500/70
                transition-all duration-300
                hover:-translate-y-1
              "
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                <h2 className="text-2xl font-heading drop-shadow-sm">
                  📚 Générateur d&apos;Histoires sur Demande
                </h2>
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-slate-300">
                  <span className="rounded-full border border-slate-600 px-3 py-1">
                    GPT personnalisé
                  </span>
                  <span className="rounded-full border border-slate-600 px-3 py-1">
                    Interface Streamlit
                  </span>
                </div>
              </div>

              <p className="leading-relaxed text-slate-100 drop-shadow-sm mb-3">
                Un GPT personnalisé pour créer des histoires pour enfants à
                partir de vos idées : personnages, thèmes, décors, style.
                Déployé comme expérience privée dans ChatGPT avec une interface
                Streamlit simple.
              </p>

              <ul className="list-disc list-inside text-slate-100 drop-shadow-sm space-y-1 mb-4">
                <li>Modèles de prompts selon l&apos;âge, le genre et le ton.</li>
                <li>Export PDF automatique avec illustrations.</li>
                <li>Intégrable facilement dans un site web ou un portail client.</li>
              </ul>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-slate-300 drop-shadow-sm">
                  <span className="font-semibold text-blue-300">Résultat :</span>{" "}
                  un moyen rapide de générer des histoires personnalisées pour
                  les enfants ou le contenu éducatif.
                </p>
                <a
                  href="https://chatgpt.com/g/g-685d9a9fec988191a649d0478b85dd56-storycraft-ai-custom-short-stories"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    inline-flex items-center gap-1
                    text-blue-300 hover:text-blue-200
                    text-sm font-medium
                    hover:underline
                  "
                >
                  Voir le projet →
                </a>
              </div>
            </article>

            {/* Projet 3 */}
            <article
              className="
                rounded-2xl p-6 md:p-7
                bg-slate-900/80
                border border-slate-700/70
                shadow-[0_0_30px_rgba(15,23,42,0.9)]
                hover:shadow-[0_0_40px_rgba(37,99,235,0.7)]
                hover:border-blue-500/70
                transition-all duration-300
                hover:-translate-y-1
              "
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                <h2 className="text-2xl font-heading drop-shadow-sm">
                  📆 Calendrier Réseaux Sociaux IA – 30 Jours
                </h2>
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-slate-300">
                  <span className="rounded-full border border-slate-600 px-3 py-1">
                    LangChain · GPT
                  </span>
                  <span className="rounded-full border border-slate-600 px-3 py-1">
                    Système de contenu
                  </span>
                </div>
              </div>

              <p className="leading-relaxed text-slate-100 drop-shadow-sm mb-3">
                Génère un mois complet d&apos;idées de publications et de légendes
                pour Instagram &amp; TikTok, en fonction de la voix de votre
                marque. Utilise des prompts structurés et un cadre réutilisable.
              </p>

              <ul className="list-disc list-inside text-slate-100 drop-shadow-sm space-y-1 mb-4">
                <li>Export CSV prêt pour les outils de planification.</li>
                <li>Suggestions de ton, accroches et hashtags.</li>
                <li>Mode aperçu et édition en lot avant publication.</li>
              </ul>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-slate-300 drop-shadow-sm">
                  <span className="font-semibold text-blue-300">Résultat :</span>{" "}
                  fini la page blanche au moment de publier : le mois est planifié
                  en une seule session.
                </p>
                <a
                  href="https://chatgpt.com/g/g-685da1abb65c81919f4af829257cbabc-30-day-social-media-content-calendar-generator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    inline-flex items-center gap-1
                    text-blue-300 hover:text-blue-200
                    text-sm font-medium
                    hover:underline
                  "
                >
                  Voir le projet →
                </a>
              </div>
            </article>

            {/* À venir */}
            <article
              className="
                rounded-2xl p-6 md:p-7
                bg-slate-950/80
                border border-dashed border-slate-600
                shadow-[0_0_26px_rgba(15,23,42,0.9)]
              "
            >
              <h2 className="text-2xl font-heading drop-shadow-sm mb-2">
                🚀 À venir…
              </h2>
              <p className="leading-relaxed text-slate-100 drop-shadow-sm mb-2">
                Je travaille constamment sur de nouveaux outils IA — assistants
                RAG pour petites entreprises, bots internes, d&eacute;mos de vision
                par ordinateur, tableaux de bord analytiques...
              </p>
              <p className="leading-relaxed text-slate-100 drop-shadow-sm">
                Si vous avez un flux de travail que vous aimeriez automatiser
                ou un outil que vous voulez créer, on peut en faire le prochain
                cas concret de cette page.
              </p>
            </article>
          </div>

          {/* CTA */}
          <div className="pt-4 text-center space-y-3">
            <p className="text-slate-100 drop-shadow-sm">
              Vous aimeriez un outil similaire — ou complètement différent —
              adapté à votre réalité ?
            </p>
            <ConsultCTA>Réserver une consultation gratuite</ConsultCTA>
          </div>
        </section>
      </div>
    </div>
  );
}
