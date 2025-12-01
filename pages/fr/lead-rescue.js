// pages/fr/lead-rescue.js
import ConsultCTA from "@/components/ConsultCTA";

export default function LeadRescueOfferFr() {
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
              Système Lead Rescue pour métiers
            </h1>
            <p className="text-lg text-slate-100 drop-shadow-sm">
              <span className="font-semibold text-blue-300">
                Chaque appel manqué, c&apos;est un job de moins.
              </span>{" "}
              Arrête de laisser de l&apos;argent sur la table. Laisse un
              assistant IA récupérer tes leads 24/7 pour ton entreprise
              de chauffage, clim, plomberie, toiture, foyers ou électricité.
            </p>
            <p className="text-sm text-slate-300 drop-shadow-sm">
              Offre spéciale pour petites entreprises de services&nbsp;:{" "}
              <span className="font-semibold text-blue-300">
                frais d&apos;installation unique de 497&nbsp;$ US
              </span>{" "}
              (au lieu de{" "}
              <span className="font-semibold">1 997–3 500&nbsp;$</span>) quand
              tu prends n&apos;importe quel plan mensuel.
            </p>
            <ConsultCTA href="/fr/onboarding-rescue">
              Activer mon système Lead Rescue
            </ConsultCTA>
          </div>

          {/* PROBLÈME + STATISTIQUES + MATH SIMPLE */}
          <div
            className="
              space-y-5 p-5 md:p-6 rounded-2xl
              bg-slate-900/80 border border-blue-500/25
              shadow-[0_0_30px_rgba(15,23,42,0.9)]
            "
          >
            <h2 className="text-2xl font-heading drop-shadow-sm flex items-center gap-2">
              <span>🚨</span>
              <span>Pourquoi les petites entreprises de services perdent en cachette des milliers</span>
            </h2>

            <p className="text-slate-100 drop-shadow-sm">
              Dans les métiers, la majorité des jobs se réservent par téléphone,
              texto ou courriel. Quand t&apos;es sur un toit, dans un sous-sol
              ou chez un client, tu peux tout simplement pas répondre à tout
              en temps réel.
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
                  <li>❌ Les appels tombent sur la boîte vocale et tu n&apos;es jamais rappelé.</li>
                  <li>❌ Les courriels s&apos;empilent jusqu&apos;à tard le soir.</li>
                  <li>❌ Les urgences arrivent trop tard… ou vont chez un compétiteur.</li>
                  <li>❌ Aucun suivi = des leads chauds qui refroidissent.</li>
                  <li>❌ Tu n&apos;as jamais une vraie vue d&apos;ensemble sur tes opportunités.</li>
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
                  <li>✅ Chaque appel manqué reçoit un texto instantané.</li>
                  <li>✅ Les courriels sont triés automatiquement (lead vs bruit).</li>
                  <li>✅ Les urgences sont détectées et mises en priorité.</li>
                  <li>✅ Les suivis sont automatisés pour rester top of mind.</li>
                  <li>✅ Un résumé quotidien te montre chaque opportunité.</li>
                </ul>
              </div>
            </div>

            {/* BLOC STATISTIQUES – VRAIES TENDANCES DU MARCHÉ */}
            <div
              className="
                mt-3 rounded-2xl p-4
                bg-slate-950/80 border border-blue-500/40
                text-sm text-slate-100
              "
            >
              <h3 className="font-semibold text-blue-300 mb-1">
                Ce que les chiffres montrent sur les appels manqués :
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Les études de suivi d&apos;appels indiquent qu&apos;environ{" "}
                  <span className="font-semibold">
                    60–62&nbsp;% des appels vers des petites entreprises ne sont pas répondus
                  </span>
                  .
                </li>
                <li>
                  Seulement environ{" "}
                  <span className="font-semibold">1 client sur 5</span> laisse
                  un message quand il tombe sur une boîte vocale — les autres
                  raccrochent et appellent quelqu&apos;un d&apos;autre.
                </li>
                <li>
                  Des rapports sur les leads montrent qu&apos;environ{" "}
                  <span className="font-semibold">
                    50&nbsp;% des clients choisissent la première entreprise qui répond
                  </span>
                  .
                </li>
                <li>
                  Répondre à un nouveau lead en{" "}
                  <span className="font-semibold">moins de 5 minutes</span>{" "}
                  augmente énormément tes chances de gagner le contrat, comparé
                  à une réponse des heures ou des jours plus tard.
                </li>
              </ul>
              <p className="mt-2 text-slate-300">
                En clair&nbsp;: si tu ne réponds pas vite, une grosse partie de
                tes leads disparaissent… souvent directement chez tes compétiteurs.
              </p>
            </div>

            {/* MATH SIMPLE & HONNÊTE */}
            <div
              className="
                mt-3 rounded-2xl p-4
                bg-slate-950/80 border border-slate-700/70
                text-sm text-slate-100
              "
            >
              <h3 className="font-semibold text-blue-300 mb-1">
                Un peu de math simple (sans bullshit) :
              </h3>
              <p>
                Si tu reçois seulement{" "}
                <span className="font-semibold">20 appels par semaine</span> et
                t&apos;en manques 8, et que seulement{" "}
                <span className="font-semibold">3 de ces appels</span> auraient
                pu devenir des jobs à{" "}
                <span className="font-semibold">200&nbsp;$</span> chacun, ça
                représente :
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  <span className="font-semibold">600&nbsp;$ par semaine</span>{" "}
                  en travail potentiel
                </li>
                <li>
                  ≈ <span className="font-semibold">2 400&nbsp;$ par mois</span>{" "}
                  en revenus manqués
                </li>
                <li>
                  ≈ <span className="font-semibold">28 800&nbsp;$ par année</span>{" "}
                  qui ne rentrent jamais
                </li>
              </ul>
              <p className="mt-2 text-slate-300">
                Récupérer juste{" "}
                <span className="font-semibold">un seul job par mois</span>{" "}
                avec un meilleur suivi paye souvent le système au complet.
              </p>
            </div>
          </div>

          {/* CE QUE LE SYSTÈME FAIT */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>🤖</span>
              <span>Concrètement, qu&apos;est-ce que Lead Rescue fait pour toi?</span>
            </h2>
            <p className="text-slate-100 drop-shadow-sm">
              Pense-le comme une{" "}
              <span className="font-semibold text-blue-300">
                réceptionniste numérique
              </span>{" "}
              qui ne dort jamais et qui oublie jamais de faire un suivi.
            </p>

            <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-100">
              <div className="rounded-2xl p-4 bg-slate-900/80 border border-slate-700/70">
                <h3 className="font-semibold mb-2 text-blue-200">
                  Inclus dans chaque installation Lead Rescue :
                </h3>
                <ul className="space-y-1">
                  <li>✅ Flow appel manqué → texto instantané</li>
                  <li>✅ Tri automatique des courriels</li>
                  <li>✅ Détection des urgences &amp; priorisation</li>
                  <li>✅ Séquence de suivis automatiques pour les leads</li>
                  <li>✅ Résumé quotidien des jobs &amp; opportunités à 8h</li>
                  <li>✅ Journal des leads et des contacts pour tout voir d&apos;un coup</li>
                </ul>
              </div>

              <div className="rounded-2xl p-4 bg-slate-900/80 border border-slate-700/70">
                <h3 className="font-semibold mb-2 text-blue-200">
                  Conçu spécifiquement pour les métiers :
                </h3>
                <ul className="space-y-1">
                  <li>✅ Chauffage, clim, plomberie, toiture, foyers, électriciens</li>
                  <li>✅ Fonctionne avec ton numéro de téléphone et ton courriel actuel</li>
                  <li>✅ Aucun nouveau CRM compliqué à apprendre</li>
                  <li>✅ Tu gardes le contrôle sur les textes et les règles</li>
                  <li>✅ Je m&apos;occupe de tout le stack technique (n8n, IA, APIs…)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* OFFRE + PRIX */}
          <div
            className="
              space-y-5 p-5 md:p-6 rounded-2xl
              bg-slate-900/80 border border-blue-500/35
              shadow-[0_0_30px_rgba(15,23,42,0.9)]
            "
          >
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>💼</span>
              <span>L&apos;offre Lead Rescue pour métiers</span>
            </h2>

            <p className="text-slate-100 drop-shadow-sm">
              Normalement, bâtir un ensemble d&apos;automatisations intégrées
              comme ça tomberait dans un{" "}
              <span className="font-semibold text-blue-300">
                projet entre 1 997 et 3 500&nbsp;$ US
              </span>
              . Pour les petites entreprises de services, je regroupe les
              morceaux essentiels dans un Lead Rescue System ciblé.
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
                    Installation unique (Lead Rescue System)
                  </p>
                  <h3 className="text-2xl font-heading drop-shadow-sm">
                    Forfait d&apos;installation Lead Rescue
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-sm line-through text-slate-400">
                    1 997 – 3 500&nbsp;$ US
                  </p>
                  <p className="text-xl font-semibold text-emerald-300">
                    497&nbsp;$ US une seule fois
                  </p>
                  <p className="text-xs text-slate-300">
                    avec n&apos;importe quel plan mensuel
                  </p>
                </div>
              </div>

              <p className="mt-3 text-sm text-slate-100">
                Ça couvre la conception, la construction, les tests et le déploiement
                de ton système Lead Rescue. Aucun tarif horaire caché. Si tu veux
                plus tard des automatisations de soumission, de rendez-vous ou
                des outils internes, on les ajoute comme projets séparés.
              </p>
            </div>

            {/* BLOC ROI */}
            <div
              className="
                rounded-2xl p-4
                bg-slate-950/80 border border-slate-700/80
                text-sm text-slate-100
              "
            >
              <h3 className="font-semibold text-blue-300 mb-1">
                Qu&apos;est-ce que ça doit récupérer pour se payer tout seul?
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Récupère{" "}
                  <span className="font-semibold">1 job par mois</span> à
                  300&nbsp;$ → ton plan mensuel est payé.
                </li>
                <li>
                  Récupère{" "}
                  <span className="font-semibold">1 job par semaine</span> à
                  250&nbsp;$ → tu es en avance d&apos;environ 700–900&nbsp;$ / mois.
                </li>
                <li>
                  Récupère{" "}
                  <span className="font-semibold">une seule urgence</span>{" "}
                  à 500&nbsp;$+ → l&apos;installation à 497&nbsp;$ est déjà payée.
                </li>
              </ul>
              <p className="mt-2 text-slate-300">
                On construit ton système pour qu&apos;il suffise de récupérer{" "}
                <span className="font-semibold">une petite partie</span> de ce que
                tu perds déjà pour que ce soit rentable.
              </p>
            </div>
          </div>

          {/* PLANS MENSUELS – ENTRETIEN & OPTIMISATION */}
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
                  <span>Entretien &amp; optimisation continue</span>
                </h2>
                <div className="text-right">
                  <p className="text-sm uppercase tracking-wide text-slate-300">
                    Plans mensuels
                  </p>
                  <p className="text-sm text-blue-300 font-semibold">
                    À partir de 249&nbsp;$ / mois
                  </p>
                </div>
              </div>

              <p className="leading-relaxed text-slate-100 drop-shadow-sm">
                Une fois que ton système Lead Rescue est en place, tu ne veux
                pas t&apos;inquiéter des outils, des clés API, des mises à jour
                ou des pannes. Les plans mensuels gardent tes automatisations
                en santé, à jour et en amélioration — et{" "}
                <span className="font-semibold">
                  regroupent les principaux outils et abonnements
                </span>{" "}
                dans un seul prix clair.
              </p>

              {/* Ce qui est inclus */}
              <div className="bg-slate-950/60 border border-blue-500/40 p-4 rounded-xl text-sm text-slate-100">
                <p className="text-blue-300 font-semibold mb-2">
                  Chaque plan mensuel inclut :
                </p>
                <ul className="space-y-1">
                  <li>• Hébergement &amp; monitoring (n8n, base de données, logs)</li>
                  <li>• Abonnements coeur (IA, infra, outils de dev)</li>
                  <li>• Setup et gestion de la messagerie via Telnyx</li>
                  <li>• Création &amp; configuration de tous les comptes nécessaires</li>
                  <li>• Debug &amp; correctifs quand les APIs ou plateformes changent</li>
                </ul>
                <p className="text-[11px] text-slate-400 mt-2">
                  La plupart des entreprises paient 120–250&nbsp;$ / mois juste
                  en outils — ici c&apos;est inclus dans ton plan.
                </p>
              </div>

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
                    249&nbsp;$ / mois
                  </p>
                  <ul className="text-sm space-y-1 text-slate-100 drop-shadow-sm">
                    <li>• Surveillance des flows Lead Rescue critiques</li>
                    <li>• Corrections &amp; petits ajustements inclus</li>
                    <li>• Rapport de santé mensuel</li>
                    <li>• Outils et infra couverts</li>
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
                    449&nbsp;$ / mois
                  </p>
                  <ul className="text-sm space-y-1 text-slate-100 drop-shadow-sm">
                    <li>• Tout du plan Basic</li>
                    <li>• 1–2 nouvelles étapes d&apos;automatisation par mois</li>
                    <li>• Ajustement continu des suivis, tags, résumés</li>
                    <li>• Priorité sur les nouvelles demandes</li>
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
                    799&nbsp;$ / mois
                  </p>
                  <ul className="text-sm space-y-1 text-slate-100 drop-shadow-sm">
                    <li>• Tout du plan Standard</li>
                    <li>• Ajustements Lead Rescue illimités (petits)</li>
                    <li>• Délai de réponse rapide &amp; support prioritaire</li>
                    <li>• Accompagnement stratégique à mesure que tes systèmes grandissent</li>
                  </ul>
                </div>
              </div>

              <p className="text-sm text-slate-300 drop-shadow-sm">
                Les{" "}
                <span className="font-semibold text-blue-300">
                  497&nbsp;$ d&apos;installation
                </span>{" "}
                sont payés une seule fois pour bâtir et lancer ton système Lead
                Rescue. Le plan mensuel garde tout ça stable, optimisé
                et aligné avec ta business.
              </p>
            </div>
          </div>

          {/* POUR QUI C&apos;EST FAIT */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>🎯</span>
              <span>Pour qui c&apos;est fait?</span>
            </h2>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Cette offre est pensée pour les{" "}
              <span className="font-semibold text-blue-300">
                propriétaires de petites entreprises de services
              </span>{" "}
              qui portent encore la ceinture à outils et gèrent le bureau
              en même temps.
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>Chauffage, climatisation, plomberie, toiture, foyers, électricité.</li>
              <li>Travailleurs solos ou petites équipes sans adjointe à temps plein.</li>
              <li>
                Propriétaires qui savent qu&apos;ils laissent filer du travail
                faute de temps pour répondre à tout.
              </li>
            </ul>
          </div>

          {/* COMMENT ÇA FONCTIONNE */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>📋</span>
              <span>Comment ça se passe, étape par étape</span>
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>
                <span className="font-semibold">Appel rapide :</span> on regarde
                comment tes appels, textos et courriels arrivent en ce moment.
              </li>
              <li>
                <span className="font-semibold">Design :</span> on définit ce
                qui est urgent, ce qu&apos;on ignore et comment les suivis
                devraient fonctionner.
              </li>
              <li>
                <span className="font-semibold">Construction :</span> je monte
                le stack d&apos;automatisation (n8n, prompts, logs, résumés).
              </li>
              <li>
                <span className="font-semibold">Tests &amp; lancement :</span>{" "}
                on teste en vrai, on ajuste les textes et on passe en live.
              </li>
              <li>
                <span className="font-semibold">Plan mensuel :</span> ton plan
                d&apos;entretien garde le tout stable, à jour et en amélioration.
              </li>
            </ol>
          </div>

          {/* CTA FINAL */}
          <div className="pt-4 text-center space-y-3">
            <p className="text-slate-100 drop-shadow-sm">
              Si t&apos;es tanné de manquer des appels et de te demander
              combien de jobs tu perds chaque semaine, c&apos;est le moment de
              mettre en place un{" "}
              <span className="font-semibold text-blue-300">
                vrai système Lead Rescue
              </span>{" "}
              une fois pour toutes.
            </p>
            <ConsultCTA href="/fr/onboarding-rescue">
              Réserver mon appel Lead Rescue
            </ConsultCTA>

            <p className="text-xs text-slate-400">
              Installation unique de 497&nbsp;$ avec n&apos;importe quel plan
              mensuel. On peut toujours ajouter d&apos;autres automatisations
              plus tard à mesure que ta business évolue.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
