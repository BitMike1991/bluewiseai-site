import HeroV2 from "../../src/components/HeroV2";
import ConsultCTA from "../../src/components/ConsultCTA";

export default function HomeFr() {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: "url('/styles/backgroundpages.png')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundAttachment: "fixed",
        backgroundColor: "#020617",
      }}
    >
      {/* H1 caché pour le SEO */}
      <h1 className="sr-only">
        Automatisation et assistants IA pour petites entreprises
      </h1>

      {/* HERO (bilingue déjà géré dans HeroV2) */}
      <HeroV2 />

      {/* SECTION 1 — Du chaos à quelque chose de gérable */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-white">
        <div className="grid gap-12 lg:grid-cols-[1.4fr,1fr] items-center">
          {/* Texte principal */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Arrête de te noyer dans la paperasse. Reprends le contrôle de ta
              business.
            </h2>
            <p className="text-lg sm:text-xl text-slate-200/90 mb-6">
              BlueWise AI met en place des automatisations clé en main qui
              répondent à tes leads, rangent ton inbox et assurent le suivi
              à ta place. On se concentre sur les petites entreprises qui ont
              besoin de vrais résultats — pas d’un autre casse-tête techno.
            </p>

            <ul className="space-y-3 text-slate-300 text-base sm:text-lg">
              <li>✅ Récupère plus de leads par téléphone, courriel et formulaires.</li>
              <li>✅ Coupe 5 à 10 heures de tâches répétitives par semaine.</li>
              <li>✅ Mets en place des systèmes simples que tu comprends et que tu contrôles.</li>
            </ul>
          </div>

          {/* Petit bloc de preuve/contexte */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-5 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.18em] text-blue-300/80 mb-2">
                Ce que tes clients veulent vraiment
              </p>
              <p className="text-slate-200 text-sm">
                <span className="font-semibold text-white">
                  Des réponses rapides, moins de jobs perdues, des suivis clairs.
                </span>{" "}
                Chaque automatisation qu’on met en place est pensée pour protéger
                ton temps et arrêter l’argent de couler par les craques de
                ton inbox et des appels manqués.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/80 px-3 py-4 text-center">
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                  Temps sauvé
                </p>
                <p className="text-xl font-bold text-blue-300">5–10 h</p>
                <p className="text-[11px] text-slate-400 mt-1">par semaine</p>
              </div>
              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/80 px-3 py-4 text-center">
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                  Réponse aux leads
                </p>
                <p className="text-xl font-bold text-blue-300">&lt; 2 min</p>
                <p className="text-[11px] text-slate-400 mt-1">avec les flows</p>
              </div>
              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/80 px-3 py-4 text-center">
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                  Disponibilité
                </p>
                <p className="text-xl font-bold text-blue-300">24/7</p>
                <p className="text-[11px] text-slate-400 mt-1">pour les nouveaux leads</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — Ce qu’on automatise pour toi */}
      <section className="max-w-6xl mx-auto px-6 pb-20 text-white">
        <h2 className="text-3xl sm:text-4xl font-bold mb-2">
          🔧 Ce qu’on automatise pour toi
        </h2>
        <p className="text-slate-300 text-base sm:text-lg mb-10 max-w-3xl">
          On ne vend pas du &quot;consulting IA&quot; flou. On met en place
          des systèmes concrets qui se branchent sur les outils que tu utilises déjà
          et qui gèrent le travail plate en arrière-plan, sans faire exploser ton équipe.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Carte 1 */}
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6 backdrop-blur">
            <h3 className="text-xl font-semibold mb-2">
              📞 Lead Rescue & textos après appels manqués
            </h3>
            <p className="text-slate-300 text-sm sm:text-base mb-3">
              Transforme tes appels manqués en conversations. Envoi automatique
              de texto, bonnes questions posées, photos ramassées et tout est
              enregistré au même endroit pour que ta gang puisse rappeler
              et closer la job.
            </p>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-300/90">
              Parfait pour : entrepreneurs, services à domicile, business locales
            </p>
          </div>

          {/* Carte 2 */}
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6 backdrop-blur">
            <h3 className="text-xl font-semibold mb-2">
              ✉️ Triage d’inbox & réponses intelligentes
            </h3>
            <p className="text-slate-300 text-sm sm:text-base mb-3">
              Des agents IA qui lisent tes courriels, trient par priorité,
              résument les longues chaînes et rédigent des réponses propres
              dans TON ton — pour que tu te concentres sur les messages
              qui comptent vraiment.
            </p>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-300/90">
              Fonctionne avec : Gmail, Outlook & plus
            </p>
          </div>

          {/* Carte 3 */}
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6 backdrop-blur">
            <h3 className="text-xl font-semibold mb-2">
              🤖 Bots d’intake & qualification de leads
            </h3>
            <p className="text-slate-300 text-sm sm:text-base mb-3">
              Bots web, SMS ou chat qui posent les bonnes questions,
              qualifient tes leads et t’envoient un résumé clair
              dans ton inbox ou ton CRM — fini les formulaires moitié remplis
              et les infos qui manquent.
            </p>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-300/90">
              Idéal pour : soumissions, rendez-vous, appels de découverte
            </p>
          </div>

          {/* Carte 4 */}
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6 backdrop-blur">
            <h3 className="text-xl font-semibold mb-2">
              📄 Soumissions, contrats & fichiers ordonnés
            </h3>
            <p className="text-slate-300 text-sm sm:text-base mb-3">
              Génère automatiquement soumissions, propositions et petits contrats
              à partir de tes modèles, puis renomme et range tout au bon endroit
              pour que ta business reste clean sans effort supplémentaire.
            </p>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-300/90">
              Garde ton opération propre & facile à retrouver
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3 — Réalisations récentes / ancre “demo” */}
      <section
        id="demo"
        className="max-w-6xl mx-auto px-6 pb-24 text-white"
      >
        <div className="grid gap-10 lg:grid-cols-[1.1fr,1fr] items-start">
          {/* Liste des automatisations récentes */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              🧠 Projets & tests récents
            </h2>
            <p className="text-slate-300 text-base sm:text-lg mb-6 max-w-3xl">
              Un mélange de projets clients et d’outils maison qu’on a bâtis
              dernièrement. Chaque automatisation commence petit, se déploie
              vite et peut évoluer avec ta business.
            </p>

            <div className="space-y-4 text-slate-200 text-base sm:text-lg">
              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
                <p className="font-semibold">
                  💼 GPT coach d’entrevue d’embauche
                </p>
                <p className="text-slate-300 text-sm sm:text-base">
                  Un GPT sur mesure qui aide les candidats à pratiquer leurs
                  entrevues avec des questions réalistes et du feedback —
                  pensé comme un mini SaaS produit.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
                <p className="font-semibold">📚 GPT créateur d’histoires</p>
                <p className="text-slate-300 text-sm sm:text-base">
                  Un assistant de storytelling qui transforme de simples idées
                  en vraies histoires pour enfants avec structure, style et
                  illustrations prêtes à devenir des livres.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
                <p className="font-semibold">
                  📆 Planificateur de contenu 30 jours
                </p>
                <p className="text-slate-300 text-sm sm:text-base">
                  Un GPT qui génère des calendriers de contenu complets dans
                  ta voix de marque — avec hooks, angles et appels à l’action.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
                <p className="font-semibold">
                  🛠 Automatisations sur mesure pour PME
                </p>
                <p className="text-slate-300 text-sm sm:text-base">
                  Des trades et services à domicile jusqu’aux business en ligne,
                  on connecte des outils comme n8n, Postgres, Telnyx, Gmail
                  et plus pour bâtir des workflows sur mesure qui travaillent
                  en arrière-plan pour toi.
                </p>
              </div>
            </div>
          </div>

          {/* “Comment ça se passe” + CTA */}
          <div className="rounded-3xl border border-slate-700/80 bg-slate-950/80 p-6 lg:p-7 xl:p-8 backdrop-blur">
            <h3 className="text-2xl font-semibold mb-4">
              C’est comment, travailler avec BlueWise AI?
            </h3>

            <ol className="space-y-4 text-slate-300 text-sm sm:text-base mb-6">
              <li>
                <span className="font-semibold text-white">1. Petit appel rapide.</span>{" "}
                On regarde où tu perds du temps et des leads en ce moment.
              </li>
              <li>
                <span className="font-semibold text-white">2. Mini game plan.</span>{" "}
                Tu repars avec un plan simple pour une ou deux automatisations
                à gros impact — sans jargon, sans bla-bla inutile.
              </li>
              <li>
                <span className="font-semibold text-white">3. On bâtit & on déploie.</span>{" "}
                On construit, on teste et on met en prod en 24 à 72 heures,
                puis on ajuste avec le vrai monde.
              </li>
            </ol>

            <p className="text-slate-300 text-sm sm:text-base mb-5">
              Si tu es curieux/curieuse mais que tu ne sais pas par où commencer,
              le plus simple c’est un appel de 15 minutes. On te montre ce qui est
              possible pour <span className="font-semibold text-white">ta</span>{" "}
              business, ici et maintenant.
            </p>

            <ConsultCTA>
              Audit d’automatisation gratuit – 15 min
            </ConsultCTA>
          </div>
        </div>
      </section>
    </div>
  );
}
