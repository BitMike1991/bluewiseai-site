// pages/fr/lead-rescue.js
import ConsultCTA from "@/components/ConsultCTA";

export default function LeadRescueOfferFR() {
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
          {/* HERO */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-heading drop-shadow-md">
              Lead Rescue System — Pour les Petites Entreprises de Services
            </h1>
            <p className="text-lg text-slate-100 drop-shadow-sm">
              <span className="font-semibold text-blue-300">
                Chaque appel manqué est un contrat perdu.
              </span>{" "}
              Arrêtez de laisser de l’argent sur la table. Laissez un assistant
              IA récupérer vos leads 24/7 — que vous soyez dans le HVAC, la
              plomberie, la toiture, les cheminées ou l’électricité.
            </p>
            <p className="text-sm text-slate-300 drop-shadow-sm">
              Offre spéciale petites entreprises :{" "}
              <span className="font-semibold text-blue-300">
                frais d’installation à 297$
              </span>{" "}
              (au lieu de 997$–1 997$) avec n’importe quel plan mensuel.
            </p>
            <ConsultCTA href="/fr/onboarding-rescue">Commencer mon Lead Rescue System</ConsultCTA>

          </div>

          {/* PROBLÈME + MATH SIMPLE */}
          <div
            className="
              space-y-5 p-5 md:p-6 rounded-2xl
              bg-slate-900/80 border border-blue-500/25
              shadow-[0_0_30px_rgba(15,23,42,0.9)]
            "
          >
            <h2 className="text-2xl font-heading drop-shadow-sm flex items-center gap-2">
              <span>🚨</span>
              <span>Pourquoi les petites entreprises perdent autant en silence</span>
            </h2>

            <p className="text-slate-100 drop-shadow-sm">
              La majorité des travaux en HVAC, plomberie, toiture, cheminées ou
              électricité se vendent par appel, texto ou courriel. Quand vous
              êtes dans un grenier, sous un évier ou sur un toit, vous ne pouvez
              simplement pas répondre à tout.
            </p>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div
                className="
                  rounded-2xl p-4
                  bg-slate-950/80 border border-red-500/40
                "
              >
                <h3 className="font-semibold text-red-300 mb-2">
                  Sans Lead Rescue
                </h3>
                <ul className="space-y-1 text-slate-100">
                  <li>❌ Appels manqués qui ne rappellent jamais.</li>
                  <li>❌ Courriels répondus trop tard.</li>
                  <li>❌ Urgences perdues ou prises en retard.</li>
                  <li>❌ Aucun suivi = clients qui vont ailleurs.</li>
                  <li>❌ Aucune vue d’ensemble des opportunités.</li>
                </ul>
              </div>

              <div
                className="
                  rounded-2xl p-4
                  bg-slate-950/80 border border-emerald-500/40
                "
              >
                <h3 className="font-semibold text-emerald-300 mb-2">
                  Avec Lead Rescue
                </h3>
                <ul className="space-y-1 text-slate-100">
                  <li>✅ Texto instantané après un appel manqué.</li>
                  <li>✅ Tri automatique des courriels.</li>
                  <li>✅ Urgences détectées et priorisées.</li>
                  <li>✅ Suivi automatique des leads.</li>
                  <li>✅ Résumé quotidien à 8h AM.</li>
                </ul>
              </div>
            </div>

            {/* MATH VERIFIED */}
            <div
              className="
                mt-3 rounded-2xl p-4
                bg-slate-950/80 border border-slate-700/70
                text-sm text-slate-100
              "
            >
              <h3 className="font-semibold text-blue-300 mb-1">
                Math simple et honnête (sans hype) :
              </h3>
              <p>
                Si vous recevez{" "}
                <span className="font-semibold">20 appels par semaine</span> et
                en manquez 8, et que seulement{" "}
                <span className="font-semibold">3 pourraient devenir des jobs</span>{" "}
                à un prix conservateur de{" "}
                <span className="font-semibold">200$ par job</span>, alors :
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  <span className="font-semibold">600$ / semaine</span> en
                  travail potentiel
                </li>
                <li>
                  ≈ <span className="font-semibold">2 400$ / mois</span>
                </li>
                <li>
                  ≈ <span className="font-semibold">28 800$ / an</span> perdus
                </li>
              </ul>
              <p className="mt-2 text-slate-300">
                Récupérer{" "}
                <span className="font-semibold">un seul job par mois</span>{" "}
                suffit souvent pour rentabiliser votre système.
              </p>
            </div>
          </div>

          {/* FONCTIONNALITÉS */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>🤖</span>
              <span>Ce que votre Lead Rescue System fait réellement</span>
            </h2>
            <p className="text-slate-100 drop-shadow-sm">
              Pensez-y comme à un{" "}
              <span className="font-semibold text-blue-300">
                assistant IA de bureau
              </span>{" "}
              qui ne dort jamais et ne manque aucun suivi.
            </p>

            <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-100">
              <div className="rounded-2xl p-4 bg-slate-900/80 border border-slate-700/70">
                <h3 className="font-semibold mb-2 text-blue-200">
                  Inclus dans chaque installation :
                </h3>
                <ul className="space-y-1">
                  <li>✅ Texto instantané après appels manqués</li>
                  <li>✅ Tri automatique des courriels</li>
                  <li>✅ Détection des urgences + priorisation</li>
                  <li>✅ Suivi automatique des leads</li>
                  <li>✅ Résumé quotidien à 8h AM</li>
                  <li>✅ Journal complet des leads & clients</li>
                </ul>
              </div>

              <div className="rounded-2xl p-4 bg-slate-900/80 border border-slate-700/70">
                <h3 className="font-semibold mb-2 text-blue-200">
                  Conçu pour les métiers :
                </h3>
                <ul className="space-y-1">
                  <li>✅ HVAC, plomberie, toiture, cheminée, électricité</li>
                  <li>✅ Compatible avec votre téléphone/courriel actuel</li>
                  <li>✅ Aucun nouveau CRM à apprendre</li>
                  <li>✅ Vous gardez le contrôle des approbations</li>
                  <li>✅ Je gère l’infrastructure technique (n8n, IA, API…)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* OFFRE */}
          <div
            className="
              space-y-5 p-5 md:p-6 rounded-2xl
              bg-slate-900/80 border border-blue-500/35
              shadow-[0_0_30px_rgba(15,23,42,0.9)]
            "
          >
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>💼</span>
              <span>L’Offre Lead Rescue pour les Petites Entreprises</span>
            </h2>

            <p className="text-slate-100 drop-shadow-sm">
              Normalement, créer 3 à 6 automatisations de ce type coûte{" "}
              <span className="font-semibold text-blue-300">
                entre 997$ et 1 997$
              </span>
              . Pour les petites entreprises, je regroupe les éléments essentiels
              dans un Lead Rescue System spécialisé.
            </p>

            <div
              className="
                rounded-2xl p-4 md:p-5
                bg-slate-950/80 border border-emerald-500/60
                shadow-[0_0_26px_rgba(16,185,129,0.4)]
              "
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-wide text-emerald-300">
                    Installation unique (Lead Rescue)
                  </p>
                  <h3 className="text-2xl font-heading drop-shadow-sm">
                    Installation Lead Rescue
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-sm line-through text-slate-400">
                    997$ – 1 997$ USD
                  </p>
                  <p className="text-xl font-semibold text-emerald-300">
                    297$ USD — une seule fois
                  </p>
                  <p className="text-xs text-slate-300">
                    avec n’importe quel plan mensuel
                  </p>
                </div>
              </div>

              <p className="mt-3 text-sm text-slate-100">
                Ce montant couvre la conception, la création, les tests et le
                déploiement de votre Lead Rescue System. Aucun frais caché. Si
                vous voulez ensuite ajouter d’autres automatisations (soumissions,
                prise de rendez-vous, outils internes, etc.), on pourra les ajouter
                comme projets séparés.
              </p>
            </div>

            {/* ROI */}
            <div
              className="
                rounded-2xl p-4
                bg-slate-950/80 border border-slate-700/80
                text-sm text-slate-100
              "
            >
              <h3 className="font-semibold text-blue-300 mb-1">
                Combien doit-il récupérer pour être rentable ?
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  1 job / mois à 300$ → votre plan mensuel est payé.
                </li>
                <li>
                  1 job / semaine à 250$ → +700$ à +900$ / mois.
                </li>
                <li>
                  1 urgence / mois (500$+) → installation à 297$ remboursée.
                </li>
              </ul>
              <p className="mt-2 text-slate-300">
                Votre système n’a besoin de récupérer qu’une{" "}
                <span className="font-semibold">toute petite portion</span> de vos
                leads perdus pour être extrêmement profitable.
              </p>
            </div>
          </div>

          {/* PLANS MENSUELS — CARE & OPTIMIZATION */}
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
                  <span>Entretien & Optimisation Continue</span>
                </h2>
                <div className="text-right">
                  <p className="text-sm uppercase tracking-wide text-slate-300">
                    Plans mensuels
                  </p>
                  <p className="text-sm text-blue-300 font-semibold">
                    À partir de 149$ / mois
                  </p>
                </div>
              </div>

              <p className="leading-relaxed text-slate-100 drop-shadow-sm">
                Une fois votre Lead Rescue System en place, vous ne voulez pas
                vous soucier des outils, API, mises à jour ou bris. Ces plans
                gardent vos automatisations stables, sécurisées et en
                amélioration constante.
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
                  <h3 className="font-heading text-lg drop-shadow-sm">Basic</h3>
                  <p className="text-blue-300 font-semibold text-sm mb-2">
                    149$ / mois
                  </p>
                  <ul className="text-sm space-y-1 text-slate-100 drop-shadow-sm">
                    <li>✅ Surveillance des automatisations clés</li>
                    <li>✅ Petites corrections & ajustements</li>
                    <li>✅ Support par courriel</li>
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
                    249$ / mois
                  </p>
                  <ul className="text-sm space-y-1 text-slate-100 drop-shadow-sm">
                    <li>✅ Tout dans Basic</li>
                    <li>✅ Améliorations & optimisation chaque mois</li>
                    <li>✅ Ajout de petites automatisations au fil du temps</li>
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
                    399$ / mois
                  </p>
                  <ul className="text-sm space-y-1 text-slate-100 drop-shadow-sm">
                    <li>✅ Support prioritaire</li>
                    <li>✅ Changements plus rapides</li>
                    <li>✅ Conseils stratégiques selon la croissance</li>
                  </ul>
                </div>
              </div>

              <p className="text-sm text-slate-300 drop-shadow-sm">
                Le{" "}
                <span className="font-semibold text-blue-300">297$</span>{" "}
                d’installation est payé **une seule fois** pour construire votre
                Lead Rescue System. Le plan mensuel assure son entretien et sa
                croissance.
              </p>
            </div>
          </div>

          {/* POUR QUI */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>🎯</span>
              <span>Pour qui est-ce conçu ?</span>
            </h2>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Cette offre est pensée pour les{" "}
              <span className="font-semibold text-blue-300">
                propriétaires de petites entreprises de services
              </span>{" "}
              qui portent encore le coffre à outils tout en gérant la paperasse.
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>HVAC, plombiers, couvreurs, ramoneurs, électriciens.</li>
              <li>Travailleurs autonomes et petites équipes.</li>
              <li>
                Entrepreneurs qui savent qu’ils perdent des jobs quand ils sont
                trop occupés pour répondre à tout.
              </li>
            </ul>
          </div>

          {/* PROCESSUS */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>📋</span>
              <span>Comment ça fonctionne</span>
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>
                <span className="font-semibold">Appel rapide :</span> on mappe
                vos appels, textos et courriels actuels.
              </li>
              <li>
                <span className="font-semibold">Design :</span> on définit ce
                qui est une urgence, ce qu’on ignore, et comment effectuer les
                suivis.
              </li>
              <li>
                <span className="font-semibold">Construction :</span> je
                configure la stack (n8n, IA, logs, résumés).
              </li>
              <li>
                <span className="font-semibold">Tests & lancement :</span> on
                ajuste le langage et on passe en production.
              </li>
              <li>
                <span className="font-semibold">Plan mensuel :</span> vos
                automatisations restent à jour, stables et améliorées.
              </li>
            </ol>
          </div>

          {/* CTA FINAL */}
          <div className="pt-4 text-center space-y-3">
            <p className="text-slate-100 drop-shadow-sm">
              Si vous en avez assez de manquer des appels ou de perdre des jobs
              faute de suivi, c’est le moment de mettre en place un{" "}
              <span className="font-semibold text-blue-300">
                Lead Rescue System
              </span>{" "}
              qui travaille 24/7 pour vous.
            </p>
            <ConsultCTA href="/fr/onboarding-rescue">Réserver mon appel Lead Rescue</ConsultCTA>
            <p className="text-xs text-slate-400">
              Installation unique 297$ avec n’importe quel plan mensuel.
              Automatisations additionnelles possibles selon votre croissance.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
