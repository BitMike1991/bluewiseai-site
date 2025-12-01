import ConsultCTA from "@/components/ConsultCTA";

export default function ServicesFr() {
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
            max-w-6xl mx-auto space-y-10 px-6 sm:px-12 py-10
            rounded-3xl
            bg-slate-950/80
            border border-white/10
            backdrop-blur-md
            shadow-[0_0_45px_rgba(15,23,42,0.9)]
          "
        >
          {/* TITLE + ONE-LINER */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-heading drop-shadow-md">
              Services d’automatisation intelligente
            </h1>
            <p className="text-lg text-slate-100 drop-shadow-sm max-w-3xl mx-auto">
              Arrête de perdre ton temps dans les suivis, les courriels et les
              tâches répétitives. Nos assistants IA clé en main te libèrent
              <span className="text-blue-300 font-semibold">
                {" "}
                5 à 10 heures par semaine
              </span>{" "}
              pour que tu puisses te concentrer sur ta vraie job : servir tes
              clients et faire grandir ta business.
            </p>
            <p className="text-sm text-slate-300 drop-shadow-sm">
              Prix en{" "}
              <span className="text-blue-300 font-semibold">USD</span>. Paiement
              par carte, virement ou — sur demande — crypto (USDC, USDT, BTC,
              ETH).
            </p>
          </div>

          {/* PACKAGE 1 – Starter Automation (one-time) */}
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
                <span>Automatisation de départ</span>
              </h2>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-slate-300">
                  Projet unique · 1 automatisation
                </p>
                <p className="text-xl font-semibold text-blue-300">
                  497 $ – 997 $ USD
                </p>
              </div>
            </div>

            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Un projet rapide et ultra ciblé pour régler{" "}
              <span className="font-semibold">un irritant majeur</span> dans ta
              business. On choisit une tâche répétitive, on l’automatise de A à
              Z et tu récupères du temps dès la première semaine. C’est un{" "}
              <span className="font-semibold">
                projet unique, pas un abonnement
              </span>
              .
            </p>

            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>Assistant IA pour trier et résumer ton inbox.</li>
              <li>Texto automatique après appel manqué (questions simples).</li>
              <li>Flow d’intake pour formulaires, SMS ou chatbot.</li>
              <li>Petit GPT personnalisé pour une seule tâche précise.</li>
            </ul>

            <p className="text-sm text-slate-300 drop-shadow-sm">
              <span className="font-semibold text-blue-300">Idéal pour :</span>{" "}
              ceux qui veulent un premier vrai « win » avant d’investir dans un
              système plus complet.
            </p>

            <p className="text-xs text-slate-400 drop-shadow-sm">
              Délai habituel : 1 à 2 semaines.
            </p>
          </div>

          {/* PACKAGE 2 – Business Automation System */}
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
                <span>Système d’automatisation d’entreprise</span>
              </h2>
              <div className="text-right">
                <p className="text-sm uppercase tracking-wide text-slate-300">
                  3–6 automatisations intégrées
                </p>
                <p className="text-xl font-semibold text-blue-300">
                  1 997 $ – 3 500 $ USD
                </p>
              </div>
            </div>

            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Une petite « machine » complète qui capte les leads, fait les
              suivis, organise l’information et soutient ton équipe. On bâtit{" "}
              <span className="font-semibold">
                3 à 6 automatisations qui travaillent ensemble
              </span>{" "}
              pour améliorer ton service, réduire l’administration et augmenter
              ta capacité.
            </p>

            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>
                Workflows connectés (courriel, SMS, CRM, chat, outils internes).
              </li>
              <li>Capture + qualification + suivis automatiques.</li>
              <li>Assistants internes pour documents, SOPs, info clients.</li>
              <li>Petits tableaux de bord / logs pour voir ce qui roule.</li>
            </ul>

            <p className="text-sm text-slate-300 drop-shadow-sm">
              <span className="font-semibold text-blue-300">Idéal pour :</span>{" "}
              les petites entreprises prêtes à automatiser sérieusement une
              partie de leurs opérations.
            </p>

            <p className="text-xs text-slate-400 drop-shadow-sm">
              Délai habituel : 2 à 4 semaines.
            </p>
          </div>

          {/* PACKAGE 3 – Ongoing Care & Optimization (Retainers) */}
          <div
            className="
              space-y-5 p-5 md:p-6 rounded-2xl
              bg-slate-900/80 border border-blue-500/25
              shadow-[0_0_30px_rgba(15,23,42,0.9)]
            "
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
                  <span>🛠️</span>
                  <span>Entretien et optimisation continue</span>
                </h2>
                <div className="text-right">
                  <p className="text-sm uppercase tracking-wide text-slate-300">
                    Plans mensuels
                  </p>
                  <p className="text-sm text-blue-300 font-semibold">
                    À partir de 249 $/mois
                  </p>
                </div>
              </div>

              <p className="leading-relaxed text-slate-100 drop-shadow-sm">
                Après ton premier projet, nos plans mensuels font de nous{" "}
                <span className="font-semibold">ton équipe d’automatisation</span>.
                On surveille, on ajuste, on améliore et on ajoute de nouvelles
                étapes au fil du temps — et surtout, on prend en charge{" "}
                <span className="font-semibold">
                  tous les outils et abonnements
                </span>{" "}
                à ta place.
              </p>

              {/* What's included in monthly plans */}
              <div className="bg-slate-950/60 border border-blue-500/40 p-4 rounded-xl">
                <p className="text-sm text-blue-300 font-semibold mb-2">
                  Ce qui est inclus dans ton plan mensuel :
                </p>
                <ul className="text-sm text-slate-200 space-y-1">
                  <li>• Hébergement n8n, base de données, logs, monitoring</li>
                  <li>• Tous les abonnements essentiels (OpenAI, outils, etc.)</li>
                  <li>• Utilisation des APIs (dans des limites raisonnables)</li>
                  <li>• Setup Telnyx et gestion de la messagerie</li>
                  <li>• On crée tous les comptes pour toi — zéro configuration</li>
                  <li>• Améliorations mensuelles + nouveaux petits modules</li>
                  <li>• Debug et ajustements quand les APIs changent</li>
                </ul>
                <p className="text-[11px] text-slate-400 mt-2">
                  Valeur habituelle des outils : 120 $ – 250 $/mois (inclus dans
                  ton plan).
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
                    249 $/mois
                  </p>
                  <ul className="text-sm space-y-1 text-slate-100 drop-shadow-sm">
                    <li>• Surveillance des automatisations critiques</li>
                    <li>• Corrections et petits ajustements</li>
                    <li>• Rapport de santé mensuel</li>
                    <li>• Tous les abonnements couverts</li>
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
                    449 $/mois
                  </p>
                  <ul className="text-sm space-y-1 text-slate-100 drop-shadow-sm">
                    <li>• Tout du plan Basic</li>
                    <li>• 1 à 2 nouvelles étapes par mois</li>
                    <li>• Revue et optimisation mensuelle</li>
                    <li>• Priorité pour les nouveaux flows et outils</li>
                    <li>• Tous les abonnements inclus</li>
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
                    799 $/mois
                  </p>
                  <ul className="text-sm space-y-1 text-slate-100 drop-shadow-sm">
                    <li>• Tout du plan Standard</li>
                    <li>• Automatisations illimitées (petites)</li>
                    <li>• Support prioritaire et plus rapide</li>
                    <li>• Accompagnement stratégique mensuel</li>
                    <li>• Gestion complète des outils et abonnements</li>
                  </ul>
                </div>
              </div>

              {/* What we handle for you */}
              <div className="mt-6 p-6 rounded-2xl bg-slate-950/70 border border-blue-500/30">
                <h3 className="text-xl font-semibold mb-3 text-white">
                  Ce qu’on gère pour toi (pour que t’aies rien à faire) :
                </h3>
                <ul className="text-slate-200 space-y-2 text-sm">
                  <li>• Création de comptes et connexion des outils</li>
                  <li>• Serveurs n8n, base de données, hébergement</li>
                  <li>• Gestion et paiement des outils essentiels</li>
                  <li>• Telnyx, OpenAI, Gmail/Workspace, CRM, etc.</li>
                  <li>• Tests réguliers pour éviter les « bugs silencieux »</li>
                  <li>• Gestion des erreurs et changements d’API</li>
                </ul>
                <p className="text-slate-300 text-sm mt-3">
                  Un seul prix par mois. On s’occupe de tout ce qui est
                  technique, plate et compliqué — toi tu continues à faire rouler
                  ta business.
                </p>
              </div>
            </div>
          </div>

          {/* WHO THIS IS FOR */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>🎯</span>
              <span>Pour qui c’est fait ?</span>
            </h2>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Pour les entrepreneurs et petites entreprises qui veulent arrêter
              de se noyer dans l’administration, les suivis et les tâches
              répétitives… et qui veulent des systèmes qui roulent tout seuls.
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>Trop de courriels, trop de suivis, pas assez de temps.</li>
              <li>Tu manques des leads parce que tu peux pas répondre 24/7.</li>
              <li>
                Tu passes tes journées sur des tâches qui ne rapportent presque
                rien.
              </li>
            </ul>
          </div>

          {/* RESULTS TO EXPECT */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>🔑</span>
              <span>Résultats que tu peux attendre</span>
            </h2>
            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>Libérer 5 à 10 heures par semaine.</li>
              <li>Ne plus manquer de leads — ta machine répond 24/7.</li>
              <li>Offrir un service plus rapide, plus pro, plus constant.</li>
              <li>Avoir une base qui grandit avec ta business.</li>
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
                <p className="font-semibold">
                  Est-ce que ça fonctionne vraiment pour les petites entreprises ?
                </p>
                <p className="text-slate-300">
                  Oui. Quand l’automatisation est bien pensée, elle enlève une
                  grosse partie des tâches répétitives et te redonne du temps
                  pour les vraies priorités.
                </p>
              </div>
              <div>
                <p className="font-semibold">
                  Est-ce que j’ai besoin de connaissances techniques ?
                </p>
                <p className="text-slate-300">
                  Non. On s’occupe de tout. Tu n’as rien à programmer ni
                  configurer — tu nous expliques ce que tu veux et on le
                  transforme en système.
                </p>
              </div>
              <div>
                <p className="font-semibold">Ça prend combien de temps ?</p>
                <p className="text-slate-300">
                  Une automatisation de départ prend 1 à 2 semaines. Un système
                  complet prend environ 2 à 4 semaines selon la complexité.
                </p>
              </div>
              <div>
                <p className="font-semibold">Qu’est-ce qui se passe après ?</p>
                <p className="text-slate-300">
                  C’est là que les plans mensuels entrent en jeu. On garde tout
                  en santé, on améliore ce qui existe et on rajoute tranquillement
                  de nouvelles briques.
                </p>
              </div>
            </div>
          </div>

          {/* HOW IT WORKS */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>📋</span>
              <span>Comment ça fonctionne</span>
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>On prend un court appel pour comprendre ta réalité.</li>
              <li>
                On choisit ensemble le point de départ le plus payant pour toi.
              </li>
              <li>
                On construit et on livre une première version en 1–2 semaines
                (ou un peu plus pour un système complet).
              </li>
              <li>
                On ajuste jusqu’à ce que ça te fasse vraiment sauver du temps au
                quotidien.
              </li>
            </ol>
          </div>

          {/* CTA */}
          <div className="pt-4 text-center space-y-3">
            <p className="text-slate-100 drop-shadow-sm">
              Pas certain du meilleur point de départ ? C’est exactement pour ça
              qu’on offre une consultation gratuite.
            </p>
            <ConsultCTA>Audit d’automatisation — 15 min</ConsultCTA>
          </div>
        </section>
      </div>
    </div>
  );
}
