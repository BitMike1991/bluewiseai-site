/* eslint-disable react/no-unescaped-entities */


import ConsultCTA from "@/components/ConsultCTA";

export default function Services() {
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
          {/* TITRE + SOUS-TITRE */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-heading drop-shadow-md">Services d'automatisation&nbsp;IA</h1>
            <p className="text-lg text-slate-100 drop-shadow-sm">
              Arrêtez de vous noyer dans l’administratif. Nos assistants IA et systèmes d’automatisation prêts à l’emploi
              vous libèrent <span className="text-blue-300 font-semibold">5&nbsp;à&nbsp;10&nbsp;heures par semaine</span>
              pour vous concentrer sur ce qui compte vraiment.
            </p>
            <p className="text-sm text-slate-300 drop-shadow-sm">
              Tous les tarifs en <span className="text-blue-300 font-semibold">USD</span>.
              Paiement par carte, virement bancaire et — sur demande — crypto (USDC, USDT, BTC, ETH).
            </p>
          </div>

          {/* FORFAIT 1 – Automatisation de démarrage */}
          <div
            className="
              space-y-4 p-5 md:p-6 rounded-2xl
              bg-slate-900/80 border border-blue-500/25
              shadow-[0_0_30px_rgba(15,23,42,0.9)]
            "
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
                <span>⚡</span>
                <span>Automatisation de démarrage</span>
              </h2>
              <div className="text-right">
                <p className="text-sm uppercase tracking-wide text-slate-300">
                  Un seul flux de travail
                </p>
                <p className="text-xl font-semibold text-blue-300">
                  297 – 497&nbsp;$&nbsp;USD
                </p>
              </div>
            </div>

            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Une victoire immédiate : nous choisissons un processus manuel pénible, l’automatisons
              de bout en bout et vous rendons des heures chaque semaine.
            </p>

            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>Assistant de tri et de résumé des emails.</li>
              <li>SMS après appel manqué avec suivi basique.</li>
              <li>Flux de qualification de leads depuis un formulaire ou chatbot.</li>
              <li>Petit GPT sur mesure pour une tâche précise de votre activité.</li>
            </ul>

            <p className="text-sm text-slate-300 drop-shadow-sm">
              <span className="font-semibold text-blue-300">Idéal pour :</span>
              &nbsp;les entrepreneurs qui veulent un premier gain et voir concrètement la valeur de l’automatisation IA sans un gros projet.
            </p>
          </div>

          {/* FORFAIT 2 – Système d'automatisation d'entreprise */}
          <div
            className="
              space-y-4 p-5 md:p-6 rounded-2xl
              bg-slate-900/80 border border-blue-500/25
              shadow-[0_0_30px_rgba(15,23,42,0.9)]
            "
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
                <span>🧩</span>
                <span>Système d'automatisation d'entreprise</span>
              </h2>
              <div className="text-right">
                <p className="text-sm uppercase tracking-wide text-slate-300">
                  Plusieurs automatisations
                </p>
                <p className="text-xl font-semibold text-blue-300">
                  997 – 1&nbsp;997&nbsp;$&nbsp;USD
                </p>
              </div>
            </div>

            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Transformez vos opérations avec 3 à 6 automatisations intégrées qui capturent des leads, assurent le suivi automatique,
              propulsent la livraison et maintiennent vos opérations internes en ordre.
            </p>

            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>
                3 à 6 workflows intégrés entre email, CRM, chat ou outils internes.
              </li>
              <li>
                Capture de leads, qualification et séquences de suivi multi-étapes.
              </li>
              <li>
                Assistants internes pour vos documents, procédures et base de connaissances clients.
              </li>
              <li>
                Journaux ou vues légères pour visualiser ce que fait le système.
              </li>
            </ul>

            <p className="text-sm text-slate-300 drop-shadow-sm">
              <span className="font-semibold text-blue-300">Idéal pour :</span>
              &nbsp;les petites entreprises prêtes à réduire sérieusement le travail manuel et à bâtir une base d'automatisation solide.
            </p>
          </div>

          {/* FORFAIT 3 – Support continu & Optimisation */}
          <div
            className="
              space-y-4 p-5 md:p-6 rounded-2xl
              bg-slate-900/80 border border-blue-500/25
              shadow-[0_0_30px_rgba(15,23,42,0.9)]
            "
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
                  <span>🛠️</span>
                  <span>Support continu &amp; optimisation</span>
                </h2>
                <div className="text-right">
                  <p className="text-sm uppercase tracking-wide text-slate-300">
                    Abonnements mensuels
                  </p>
                  <p className="text-sm text-blue-300 font-semibold">
                    À partir de 149&nbsp;$&nbsp;/ mois
                  </p>
                </div>
              </div>

              <p className="leading-relaxed text-slate-100 drop-shadow-sm">
                Maintenez vos automatisations en bonne santé, à jour et en évolution.
                Au lieu de « installer et oublier », vous obtenez un partenaire qui surveille,
                ajuste et fait évoluer votre système avec vous.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Basique */}
                <div
                  className="
                    rounded-2xl p-4
                    bg-slate-950/70 border border-slate-700/70
                    shadow-[0_0_18px_rgba(15,23,42,0.8)]
                  "
                >
                  <h3 className="font-heading text-lg drop-shadow-sm">
                    Basique
                  </h3>
                  <p className="text-blue-300 font-semibold text-sm mb-2">
                    149&nbsp;$&nbsp;/ mois
                  </p>
                  <ul className="text-sm space-y-1 text-slate-100 drop-shadow-sm">
                    <li>✅ Suivi des automatisations clés</li>
                    <li>✅ Petits correctifs &amp; ajustements</li>
                    <li>✅ Support par email</li>
                  </ul>
                </div>

                {/* Standard */}
                <div
                  className="
                    rounded-2xl p-4
                    bg-slate-950/80 border border-blue-500/60
                    shadow-[0_0_24px_rgba(37,99,235,0.7)]
                  "
                >
                  <h3 className="font-heading text-lg drop-shadow-sm">
                    Standard
                  </h3>
                  <p className="text-blue-300 font-semibold text-sm mb-2">
                    249&nbsp;$&nbsp;/ mois
                  </p>
                  <ul className="text-sm space-y-1 text-slate-100 drop-shadow-sm">
                    <li>✅ Tout ce qu’il y a dans Basique</li>
                    <li>✅ Améliorations &amp; optimisations mensuelles</li>
                    <li>✅ Petites nouvelles étapes d’automatisation au fil du temps</li>
                  </ul>
                </div>

                {/* Premium */}
                <div
                  className="
                    rounded-2xl p-4
                    bg-slate-950/70 border border-amber-400/70
                    shadow-[0_0_24px_rgba(251,191,36,0.6)]
                  "
                >
                  <h3 className="font-heading text-lg drop-shadow-sm">
                    Premium
                  </h3>
                  <p className="text-blue-300 font-semibold text-sm mb-2">
                    399&nbsp;$&nbsp;/ mois
                  </p>
                  <ul className="text-sm space-y-1 text-slate-100 drop-shadow-sm">
                    <li>✅ Support prioritaire</li>
                    <li>✅ Ajustements plus rapides</li>
                    <li>✅ Input stratégique au fur et à mesure que vos systèmes grandissent</li>
                  </ul>
                </div>
              </div>

              <p className="text-sm text-slate-300 drop-shadow-sm">
                Les abonnements sont proposés après un premier projet d'automatisation,
                afin de construire d'abord une base solide puis de l’entretenir dans le temps.
              </p>
            </div>
          </div>

          {/* POUR QUI EST-CE */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>🎯</span>
              <span>Pour qui est-ce&nbsp;?</span>
            </h2>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Ces services sont conçus pour les propriétaires de petites entreprises et les fondateurs individuels
              dépassés par l’administration manuelle et la communication client,
              les prestataires de services qui doivent répondre plus rapidement,
              et les agences ou consultants qui veulent des systèmes cohérents et reproductibles.
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>Vous êtes noyé sous les courriels, relances et tâches administratives.</li>
              <li>Vous perdez des leads parce que vous ne pouvez pas répondre 24/7.</li>
              <li>Vous gaspillez des heures sur des processus routiniers plutôt que sur du travail à forte valeur ajoutée.</li>
            </ul>
          </div>

          {/* RÉSULTATS À ATTENDRE */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>🔑</span>
              <span>Ce que vous pouvez attendre</span>
            </h2>
            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>Récupérez 5 à 10 heures par semaine en automatisant les tâches répétitives.</li>
              <li>Ne manquez plus aucun lead — vos assistants travaillent 24/7.</li>
              <li>Offrez une expérience client plus rapide et plus cohérente.</li>
              <li>Construisez une base évolutive qui grandit avec votre entreprise.</li>
            </ul>
          </div>

          {/* FAQ */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>❓</span>
              <span>Questions fréquentes</span>
            </h2>
            <div className="space-y-3 text-slate-100 drop-shadow-sm">
              <div>
                <p className="font-semibold">Est-ce que ces automatisations fonctionnent vraiment pour les petites entreprises&nbsp;?</p>
                <p className="text-slate-300">Oui. Lorsqu’elles sont bien construites, elles gèrent les tâches répétitives qui vous prennent du temps afin que vous puissiez vous concentrer sur l’essentiel.</p>
              </div>
              <div>
                <p className="font-semibold">Ai-je besoin de compétences techniques&nbsp;?</p>
                <p className="text-slate-300">Non. Nous concevons et livrons tout pour vous. Vous n’avez pas besoin de toucher au code — dites-nous simplement ce qui doit se passer.</p>
              </div>
              <div>
                <p className="font-semibold">Combien de temps cela prend-il&nbsp;?</p>
                <p className="text-slate-300">Les automatisations de démarrage prennent généralement 1 à 2 semaines du début à la fin. Les systèmes plus importants prennent 2 à 4 semaines selon la complexité.</p>
              </div>
              <div>
                <p className="font-semibold">Que se passe-t-il après le lancement&nbsp;?</p>
                <p className="text-slate-300">Nous proposons des plans de support continu afin que vos systèmes restent en bonne santé, soient améliorés et évoluent au fur et à mesure que votre entreprise grandit.</p>
              </div>
            </div>
          </div>

          {/* COMMENT ON TRAVAILLE ENSEMBLE */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>📋</span>
              <span>Comment on travaille ensemble</span>
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>On commence par un appel pour comprendre votre activité et vos objectifs.</li>
              <li>On choisit ensemble le point de départ le plus impactant.</li>
              <li>Je conçois et livre une première version en environ 1–2 semaines.</li>
              <li>On l'ajuste jusqu'à ce qu'elle vous fasse vraiment gagner du temps.</li>
            </ol>
          </div>

          {/* CTA */}
          <div className="pt-4 text-center space-y-3">
            <p className="text-slate-100 drop-shadow-sm">
              Pas sûr(e) de l’option qui vous convient le mieux&nbsp;? C’est exactement ce qu’on clarifie pendant la consultation gratuite.
            </p>
            <ConsultCTA>Obtenez votre audit IA de 15 minutes — Gratuit</ConsultCTA>
          </div>
        </section>
      </div>
    </div>
  );
}