import ConsultCTA from "@/components/ConsultCTA";

export default function ServicesFR() {
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
          {/* TITRE + ONE-LINER */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-heading drop-shadow-md">Services</h1>
            <p className="text-lg text-slate-100 drop-shadow-sm">
              Choisissez votre point de départ. Chaque offre est pensée pour vous
              aider à{" "}
              <span className="text-blue-300">récupérer 5–10 heures par semaine</span>{" "}
              en automatisant le travail qui vous épuise.
            </p>
            <p className="text-sm text-slate-300 drop-shadow-sm">
              Tous les tarifs sont en{" "}
              <span className="text-blue-300 font-semibold">USD</span>.
              Paiement par carte, virement bancaire et — sur demande — crypto
              (USDC, USDT, BTC, ETH).
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
                  297 – 497 $ USD
                </p>
              </div>
            </div>

            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Une automatisation ciblée, réalisée de A à Z, qui s&apos;attaque à un
              processus manuel pénible et le transforme en système simple et
              fiable.
            </p>

            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>Assistant email pour tri, résumé et priorisation.</li>
              <li>SMS après appel manqué avec suivi de base.</li>
              <li>Flux de qualification de prospects depuis un formulaire ou chatbot.</li>
              <li>Petit GPT sur mesure pour une tâche précise de votre activité.</li>
            </ul>

            <p className="text-sm text-slate-300 drop-shadow-sm">
              <span className="font-semibold text-blue-300">Idéal pour :</span>{" "}
              les entrepreneurs qui veulent un premier gain rapide et voir
              concrètement la valeur de l&apos;automatisation.
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
                <span>Système d&apos;automatisation d&apos;entreprise</span>
              </h2>
              <div className="text-right">
                <p className="text-sm uppercase tracking-wide text-slate-300">
                  Plusieurs automatisations connectées
                </p>
                <p className="text-xl font-semibold text-blue-300">
                  997 – 1 997 $ USD
                </p>
              </div>
            </div>

            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Un ensemble d&apos;automatisations reliées entre elles qui soutiennent
              vos flux clés — de la capture de prospects au suivi, jusqu&apos;à la
              livraison et l&apos;organisation interne.
            </p>

            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>
                3 à 6 flux intégrés entre email, CRM, chat ou outils internes.
              </li>
              <li>
                Capture de leads, qualification et séquences de suivi multi-étapes.
              </li>
              <li>
                Assistants internes pour vos documents, procédures et base de
                connaissances clients.
              </li>
              <li>
                Journaux ou vues légères pour visualiser ce que fait le système.
              </li>
            </ul>

            <p className="text-sm text-slate-300 drop-shadow-sm">
              <span className="font-semibold text-blue-300">Idéal pour :</span>{" "}
              les petites entreprises prêtes à réduire sérieusement le travail
              manuel et à bâtir une base d&apos;automatisation solide.
            </p>
          </div>

          {/* FORFAIT 3 – Support continu & optimisation (abonnements) */}
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
                    À partir de 149 $ / mois
                  </p>
                </div>
              </div>

              <p className="leading-relaxed text-slate-100 drop-shadow-sm">
                Gardez vos automatisations en bonne santé, à jour et en
                amélioration continue. Plutôt que &quot;on installe puis on oublie&quot;,
                vous avez un partenaire qui surveille, ajuste et fait évoluer
                vos systèmes avec vous.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Basic */}
                <div
                  className="
                    rounded-2xl p-4
                    bg-slate-950/70 border border-slate-700/70
                    shadow-[0_0_18px_rgba(15,23,42,0.8)]
                  "
                >
                  <h3 className="font-heading text-lg drop-shadow-sm">
                    Basic
                  </h3>
                  <p className="text-blue-300 font-semibold text-sm mb-2">
                    149 $ / mois
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
                    249 $ / mois
                  </p>
                  <ul className="text-sm space-y-1 text-slate-100 drop-shadow-sm">
                    <li>✅ Tout ce qu&apos;il y a dans Basic</li>
                    <li>✅ Améliorations &amp; optimisations mensuelles</li>
                    <li>✅ Petites nouvelles étapes d&apos;automatisation au fil du temps</li>
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
                    399 $ / mois
                  </p>
                  <ul className="text-sm space-y-1 text-slate-100 drop-shadow-sm">
                    <li>✅ Support prioritaire</li>
                    <li>✅ Ajustements plus rapides</li>
                    <li>✅ Input stratégique au fur et à mesure que vos systèmes grandissent</li>
                  </ul>
                </div>
              </div>

              <p className="text-sm text-slate-300 drop-shadow-sm">
                Les abonnements sont proposés après un premier projet
                d&apos;automatisation, pour commencer sur une base solide puis
                l&apos;entretenir dans le temps.
              </p>
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
              <li>On l&apos;ajuste jusqu&apos;à ce qu&apos;elle vous fasse vraiment gagner du temps.</li>
            </ol>
          </div>

          {/* CTA */}
          <div className="pt-4 text-center space-y-3">
            <p className="text-slate-100 drop-shadow-sm">
              Vous hésitez entre plusieurs options ? C&apos;est exactement ce qu&apos;on
              clarifie pendant la consultation gratuite.
            </p>
            <ConsultCTA>Réservez une consultation gratuite</ConsultCTA>
          </div>
        </section>
      </div>
    </div>
  );
}
