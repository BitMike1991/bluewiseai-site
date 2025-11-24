import ConsultCTA from "@/components/ConsultCTA";

export default function Portfolio() {
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
          {/* Page Title + Intro */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-heading drop-shadow-md">💼 Portfolio d’automatisation&nbsp;IA</h1>
            <p className="text-lg text-slate-100 drop-shadow-sm">
              Voici quelques outils IA et automatisations que j’ai construits — du coaching d’entretien et des systèmes de contenu aux GPT sur mesure.
              Chaque projet a commencé par une vraie douleur d’entreprise et s’est terminé par un workflow qui économise des heures chaque semaine.
            </p>
          </div>

          {/* Projects Grid */}
          <div className="space-y-8">
            {/* Project 1 */}
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
                  💼 Coach d'entretien d'embauche GPT
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
                Une application Web qui simule de véritables scénarios d’entretien et fournit
                un feedback personnalisé sur vos réponses. Construite avec Next.js,
                OpenAI GPT‑4 et hébergée sur Vercel.
              </p>

              <ul className="list-disc list-inside drop-shadow-sm space-y-1 text-slate-100 mb-4">
                <li>Génération dynamique de questions basée sur le poste visé.</li>
                <li>Enregistrement et relecture de vos réponses dans le navigateur.</li>
                <li>Score en temps réel et conseils concrets d'amélioration.</li>
              </ul>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-slate-300 drop-shadow-sm">
                  <span className="font-semibold text-blue-300">
                    Résultat :
                  </span>{" "}
                  Pratiquez des entretiens sous pression sans le stress pour arriver confiant et prêt.
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
                  Voir la démo →
                </a>
              </div>
            </article>

            {/* Project 2 */}
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
                  📚 Générateur d’histoires sur demande GPT
                </h2>
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-slate-300">
                  <span className="rounded-full border border-slate-600 px-3 py-1">
                    GPT personnalisé
                  </span>
                  <span className="rounded-full border border-slate-600 px-3 py-1">
                    Front-End Streamlit
                  </span>
                </div>
              </div>

              <p className="leading-relaxed text-slate-100 drop-shadow-sm mb-3">
                Un GPT personnalisé qui crée des histoires pour enfants en fonction de vos prompts : personnages,
                thèmes, décors et style. Déployé comme une expérience privée ChatGPT et enveloppé dans un simple front‑end Streamlit.
              </p>

              <ul className="list-disc list-inside drop-shadow-sm space-y-1 text-slate-100 mb-4">
                <li>Préconfigurations de prompt pour l’âge, le genre et le ton.</li>
                <li>Exportation PDF automatique avec illustrations.</li>
                <li>Peut être intégré à des sites web, des portails clients ou des bots Slack.</li>
              </ul>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-slate-300 drop-shadow-sm">
                  <span className="font-semibold text-blue-300">
                    Résultat :
                  </span>{" "}
                  Générez des histoires personnalisées et conformes à votre marque en quelques minutes au lieu d’heures.
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

            {/* Project 3 */}
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
                  📆 Planificateur de médias sociaux 30 jours GPT
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
                Génère un mois complet d’idées de publications et de légendes pour Instagram et TikTok,
                adaptées à votre voix de marque. Utilise GPT avec un prompt structuré et un cadre de contenu réutilisable.
              </p>

              <ul className="list-disc list-inside drop-shadow-sm space-y-1 text-slate-100 mb-4">
                <li>Exportation CSV prête pour les outils de planification.</li>
                <li>Suggestions de ton, d’accroches et de hashtags.</li>
                <li>Aperçu en masse et flux d’édition avant publication.</li>
              </ul>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-slate-300 drop-shadow-sm">
                  <span className="font-semibold text-blue-300">
                    Résultat :
                  </span>{" "}
                  Ne souffrez plus du syndrome de la page blanche — votre prochain mois de contenu est planifié d’un coup.
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

            {/* Coming Soon */}
            <article
              className="
                rounded-2xl p-6 md:p-7
                bg-slate-950/80
                border border-dashed border-slate-600
                shadow-[0_0_26px_rgba(15,23,42,0.9)]
              "
            >
              <h2 className="text-2xl font-heading drop-shadow-sm mb-2">
                🚀 À suivre…
              </h2>
              <p className="leading-relaxed text-slate-100 drop-shadow-sm mb-2">
                Je suis constamment en train d’expérimenter de nouveaux outils IA — assistants basés sur la RAG,
                bots internes pour petites entreprises, démos de vision par ordinateur et tableaux de bord d’analytique.
              </p>
              <p className="leading-relaxed text-slate-100 drop-shadow-sm">
                Si vous avez un flux de travail que vous aimeriez automatiser ou un outil que vous voudriez voir naître,
                nous pouvons en faire la prochaine étude de cas sur cette page.
              </p>
            </article>
          </div>

          {/* CTA */}
          <div className="pt-4 text-center space-y-3">
            <p className="text-slate-100 drop-shadow-sm">
              Vous voulez construire quelque chose de similaire — ou complètement nouveau — pour votre propre entreprise&nbsp;?
            </p>
            <ConsultCTA>Réserver une consultation gratuite</ConsultCTA>
          </div>
        </section>
      </div>
    </div>
  );
}