import HeroV2 from "../../src/components/HeroV2";
import Link from "next/link";

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
        Plateforme Lead Rescue - Système de gestion de prospects propulsé par IA
      </h1>

      {/* HERO */}
      <HeroV2 />

      {/* BANNIÈRE STATISTIQUES DE PRODUCTION */}
      <section className="max-w-6xl mx-auto px-6 -mt-12 relative z-30">
        <div className="rounded-3xl border-2 border-blue-500/40 bg-slate-950/95 p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(59,130,246,0.3)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-300">10 118</div>
              <div className="text-xs text-slate-400 mt-1">Opérations/semaine</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-300">97,6%</div>
              <div className="text-xs text-slate-400 mt-1">Disponibilité</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-300">24/7</div>
              <div className="text-xs text-slate-400 mt-1">Disponibilité</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-300">&lt;2 min</div>
              <div className="text-xs text-slate-400 mt-1">Temps de réponse</div>
            </div>
          </div>
          <p className="text-center text-slate-300 text-sm mt-4">
            Métriques en direct de la plateforme Lead Rescue
          </p>
        </div>
      </section>

      {/* SECTION 1 — Plateforme Lead Rescue */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-white">
        <div className="grid gap-12 lg:grid-cols-[1.4fr,1fr] items-center">
          {/* Texte principal */}
          <div>
            <div className="inline-block bg-blue-600/20 border border-blue-500/40 rounded-full px-4 py-1.5 mb-4">
              <span className="text-blue-300 text-xs uppercase tracking-widest font-semibold">
                Plateforme SaaS en production
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Plateforme Lead Rescue : Ton système de gestion de prospects 24/7
            </h2>

            <p className="text-lg sm:text-xl text-slate-200/90 mb-6">
              Une plateforme SaaS multi-tenant complète qui capture les appels manqués,
              qualifie les prospects via agents vocaux IA et SMS, gère ton inbox et
              livre le tout sur un tableau de bord en temps réel. Bâtie pour les services
              à domicile, les corps de métiers et les entreprises locales qui peuvent pas
              se permettre de manquer des opportunités.
            </p>

            <div className="space-y-3 text-slate-300 text-base sm:text-lg mb-6">
              <div className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>
                  <strong className="text-white">Appel manqué? Texto instantané.</strong>{" "}
                  Tes prospects reçoivent un texto en quelques secondes qui leur demande
                  comment tu peux les aider.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>
                  <strong className="text-white">Agent vocal IA.</strong>{" "}
                  Gère les appels de qualification 24/7, pose les bonnes questions,
                  collecte les détails et schedule les rappels.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>
                  <strong className="text-white">Moteur inbox intelligent.</strong>{" "}
                  Trie automatiquement, priorise et rédige des réponses pour tes
                  conversations courriel et SMS.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>
                  <strong className="text-white">Tableau de bord en temps réel.</strong>{" "}
                  Vois tous tes prospects, appels, messages et tâches dans une seule
                  interface clean — fini le jonglage entre les apps.
                </span>
              </div>
            </div>

            <Link
              href="/fr/lead-rescue"
              className="inline-block rounded-xl px-8 py-4 text-lg font-bold
                         bg-blue-600 hover:bg-blue-500 text-white
                         shadow-[0_0_30px_rgba(59,130,246,0.5)]
                         transition-all duration-300 hover:scale-105"
            >
              Voir comment Lead Rescue fonctionne →
            </Link>
          </div>

          {/* Tech Stack / Preuve */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-blue-500/40 bg-slate-900/80 p-6 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.18em] text-blue-300/80 mb-3">
                Architecture de production
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                <div className="bg-slate-950/60 rounded-lg px-3 py-2">
                  <span className="font-semibold text-white">Next.js 15</span>
                  <div className="text-[10px] text-slate-400">React 19</div>
                </div>
                <div className="bg-slate-950/60 rounded-lg px-3 py-2">
                  <span className="font-semibold text-white">Supabase</span>
                  <div className="text-[10px] text-slate-400">PostgreSQL</div>
                </div>
                <div className="bg-slate-950/60 rounded-lg px-3 py-2">
                  <span className="font-semibold text-white">n8n</span>
                  <div className="text-[10px] text-slate-400">Workflows</div>
                </div>
                <div className="bg-slate-950/60 rounded-lg px-3 py-2">
                  <span className="font-semibold text-white">VAPI</span>
                  <div className="text-[10px] text-slate-400">Voix IA</div>
                </div>
                <div className="bg-slate-950/60 rounded-lg px-3 py-2">
                  <span className="font-semibold text-white">Telnyx</span>
                  <div className="text-[10px] text-slate-400">SMS/Voix</div>
                </div>
                <div className="bg-slate-950/60 rounded-lg px-3 py-2">
                  <span className="font-semibold text-white">Vercel</span>
                  <div className="text-[10px] text-slate-400">Hébergement</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700/70 bg-slate-900/80 p-5 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.18em] text-emerald-300/80 mb-2">
                Résultat client réel
              </p>
              <p className="text-slate-200 text-sm mb-3">
                "On est passé de manquer 60% de nos appels à capter chaque prospect.
                L'agent vocal IA gère la qualification pendant qu'on est sur le terrain.
                C'est comme avoir une réceptionniste à temps plein qui dort jamais."
              </p>
              <p className="text-xs text-slate-400">
                — <strong className="text-slate-300">Alex D.</strong>, Ramoneur Multi-Services
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — Le problème à 72 000 $ */}
      <section className="max-w-6xl mx-auto px-6 pb-20 text-white">
        <div className="rounded-3xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-slate-900/80 p-8 md:p-12 backdrop-blur">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
              Chaque appel manqué c'est 300 $ qui te file entre les doigts
            </h2>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Le problème */}
              <div>
                <h3 className="text-xl font-semibold text-amber-300 mb-4">
                  Le calcul (conservateur)
                </h3>
                <div className="space-y-3 text-slate-200">
                  <div className="flex justify-between">
                    <span>Appels manqués par semaine:</span>
                    <strong className="text-white">20</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Valeur moyenne du contrat:</span>
                    <strong className="text-white">300 $</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Taux de conversion (si t'avais répondu):</span>
                    <strong className="text-white">60%</strong>
                  </div>
                  <div className="h-px bg-slate-600 my-3"></div>
                  <div className="flex justify-between text-lg">
                    <span className="text-amber-300">Revenus perdus par année:</span>
                    <strong className="text-amber-200 text-2xl">187 200 $</strong>
                  </div>
                </div>
              </div>

              {/* La solution */}
              <div>
                <h3 className="text-xl font-semibold text-emerald-300 mb-4">
                  Avec Lead Rescue (palier complet)
                </h3>
                <div className="space-y-3 text-slate-200">
                  <div className="flex justify-between">
                    <span>Frais d'installation:</span>
                    <strong className="text-white">2 997 $</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Support mensuel:</span>
                    <strong className="text-white">799 $/mois</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Total première année:</span>
                    <strong className="text-white">12 585 $</strong>
                  </div>
                  <div className="h-px bg-slate-600 my-3"></div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-lg">
                      <span className="text-emerald-300">Revenus récupérés:</span>
                      <strong className="text-emerald-200">112 320 $</strong>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="text-emerald-300">Profit net première année:</span>
                      <strong className="text-emerald-200 text-2xl">99 735 $</strong>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Rentabilisé en ~45 jours. Tout le reste c'est du profit pur.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/fr/lead-rescue"
                className="inline-block rounded-xl px-10 py-4 text-lg font-bold
                           bg-emerald-600 hover:bg-emerald-500 text-white
                           shadow-[0_0_30px_rgba(16,185,129,0.5)]
                           transition-all duration-300"
              >
                Voir les prix et fonctionnalités →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — Fonctionnalités de la plateforme */}
      <section className="max-w-6xl mx-auto px-6 pb-20 text-white">
        <h2 className="text-3xl sm:text-4xl font-bold mb-2">
          Système de gestion de prospects complet
        </h2>
        <p className="text-slate-300 text-base sm:text-lg mb-10 max-w-3xl">
          Lead Rescue c'est pas juste un bot SMS ou un agent vocal. C'est une
          plateforme complète qui capture, qualifie et gère chaque prospect sur
          tous les canaux — le tout qui travaille ensemble seamless.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Fonctionnalité 1: IA vocale */}
          <div className="rounded-2xl border border-blue-500/40 bg-gradient-to-br from-blue-900/30 to-slate-900/80 p-6 backdrop-blur">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-2xl">
                📞
              </div>
              <h3 className="text-xl font-semibold">Agent vocal IA</h3>
            </div>
            <p className="text-slate-300 text-sm sm:text-base mb-4">
              IA vocale propulsée par VAPI qui répond aux appels 24/7, pose des
              questions de qualification, collecte les détails du contrat, ramasse
              des photos par SMS et schedule les rappels. Sonne naturel, se fatigue
              jamais, pis apprend ta business.
            </p>
            <div className="flex gap-2 text-xs">
              <span className="bg-blue-500/20 border border-blue-500/40 rounded-full px-3 py-1 text-blue-300">
                Voix naturelle
              </span>
              <span className="bg-blue-500/20 border border-blue-500/40 rounded-full px-3 py-1 text-blue-300">
                Dispo 24/7
              </span>
            </div>
          </div>

          {/* Fonctionnalité 2: SMS */}
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-900/30 to-slate-900/80 p-6 backdrop-blur">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl">
                💬
              </div>
              <h3 className="text-xl font-semibold">Moteur SMS intelligent</h3>
            </div>
            <p className="text-slate-300 text-sm sm:text-base mb-4">
              Texto instantané sur appels manqués avec des suivis intelligents.
              Pose les questions de qualification par SMS, collecte les photos et
              détails, pis garde la conversation vivante jusqu'à ce que tu sois
              prêt à prendre le relais.
            </p>
            <div className="flex gap-2 text-xs">
              <span className="bg-emerald-500/20 border border-emerald-500/40 rounded-full px-3 py-1 text-emerald-300">
                Réponse instantanée
              </span>
              <span className="bg-emerald-500/20 border border-emerald-500/40 rounded-full px-3 py-1 text-emerald-300">
                Collection photos
              </span>
            </div>
          </div>

          {/* Fonctionnalité 3: Inbox */}
          <div className="rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-900/30 to-slate-900/80 p-6 backdrop-blur">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-2xl">
                ✉️
              </div>
              <h3 className="text-xl font-semibold">Gestion inbox</h3>
            </div>
            <p className="text-slate-300 text-sm sm:text-base mb-4">
              Inbox courriel et SMS propulsé par IA qui trie par priorité, résume
              les conversations, rédige des réponses dans ton ton, pis garde tout
              organisé. Manque plus jamais un message important ou perds du temps
              sur du spam.
            </p>
            <div className="flex gap-2 text-xs">
              <span className="bg-purple-500/20 border border-purple-500/40 rounded-full px-3 py-1 text-purple-300">
                Tri auto
              </span>
              <span className="bg-purple-500/20 border border-purple-500/40 rounded-full px-3 py-1 text-purple-300">
                Réponses intelligentes
              </span>
            </div>
          </div>

          {/* Fonctionnalité 4: Dashboard */}
          <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-900/30 to-slate-900/80 p-6 backdrop-blur">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl">
                📊
              </div>
              <h3 className="text-xl font-semibold">Tableau de bord unifié</h3>
            </div>
            <p className="text-slate-300 text-sm sm:text-base mb-4">
              Vois chaque prospect, appel, message et tâche dans une seule interface
              clean en temps réel. Filtre par statut, priorité ou source. Assigne à
              ton équipe. Track les suivis. Tout au même endroit, toujours à jour.
            </p>
            <div className="flex gap-2 text-xs">
              <span className="bg-amber-500/20 border border-amber-500/40 rounded-full px-3 py-1 text-amber-300">
                Temps réel
              </span>
              <span className="bg-amber-500/20 border border-amber-500/40 rounded-full px-3 py-1 text-amber-300">
                Multi-tenant
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — Pour qui c'est fait */}
      <section className="max-w-6xl mx-auto px-6 pb-20 text-white">
        <h2 className="text-3xl sm:text-4xl font-bold mb-10 text-center">
          Bâti pour les entreprises qui peuvent pas se permettre de manquer des appels
        </h2>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Parfait pour */}
          <div className="rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-900/20 to-slate-900/80 p-6 backdrop-blur">
            <h3 className="text-2xl font-bold text-emerald-300 mb-4">
              ✓ Parfait pour
            </h3>
            <ul className="space-y-3 text-slate-200">
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">→</span>
                <span>
                  <strong className="text-white">Services à domicile & métiers:</strong>{" "}
                  CVC, plomberie, électricité, toiture, aménagement paysager, ménage
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">→</span>
                <span>
                  <strong className="text-white">Entreprises de services:</strong>{" "}
                  Entrepreneurs, handymen, entretien de propriétés, contrôle parasitaire
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">→</span>
                <span>
                  <strong className="text-white">Pros locaux:</strong>{" "}
                  Réparation auto, remorquage, serruriers, réparation électroménagers
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">→</span>
                <span>
                  Entreprises de 1 à 20 employés trop occupés pour répondre à chaque appel
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">→</span>
                <span>
                  Compagnies où la valeur moyenne du contrat est 300 $+ et les appels
                  manqués = revenus perdus
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">→</span>
                <span>
                  <strong className="text-white">Entreprises avec réceptionnistes/assistantes:</strong>{" "}
                  Arrête de les payer 60 000 $/an pour répondre "Desservez-vous mon secteur?"
                  50 fois par jour. Lead Rescue pré-qualifie les appels pour que ton équipe
                  parle juste aux prospects chauds. T'as 4 assistantes? Garde-en 2 pour
                  du vrai travail pis sauve 120 000 $/an.
                </span>
              </li>
            </ul>
          </div>

          {/* Pas pour */}
          <div className="rounded-2xl border-2 border-red-500/50 bg-gradient-to-br from-red-900/20 to-slate-900/80 p-6 backdrop-blur">
            <h3 className="text-2xl font-bold text-red-300 mb-4">
              ✗ Pas pour
            </h3>
            <ul className="space-y-3 text-slate-200">
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-1">→</span>
                <span>
                  Entreprises où la plupart des appels sont des consultations complexes
                  qui demandent de l'expertise humaine immédiate (médical, légal, conseil financier)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-1">→</span>
                <span>
                  Entreprises où la valeur moyenne du contrat est en-dessous de 150 $
                  (le ROI justifiera pas l'investissement)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-1">→</span>
                <span>
                  Ceux qui cherchent une solution DIY cheap ou un essai gratuit —
                  c'est une plateforme premium
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-1">→</span>
                <span>
                  Compagnies pas prêtes à s'engager à améliorer leurs systèmes de
                  capture de prospects
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center">
          <p className="text-slate-300 text-lg mb-6">
            Prêt à voir si Lead Rescue est bon pour ta business?
          </p>
          <Link
            href="/fr/lead-rescue"
            className="inline-block rounded-xl px-10 py-4 text-lg font-bold
                       bg-blue-600 hover:bg-blue-500 text-white
                       shadow-[0_0_30px_rgba(59,130,246,0.5)]
                       transition-all duration-300"
          >
            Voir les prix & réserver un appel stratégique →
          </Link>
        </div>
      </section>

      {/* SECTION 5 — CTA final */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="rounded-3xl border-2 border-blue-500/50 bg-gradient-to-br from-blue-900/40 to-slate-900/90 p-8 md:p-12 text-center backdrop-blur-xl shadow-[0_0_60px_rgba(59,130,246,0.3)]">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
            Arrête de perdre 72 000 $+ par année en appels manqués
          </h2>
          <p className="text-slate-200 text-lg mb-8 max-w-2xl mx-auto">
            La plateforme Lead Rescue gère chaque appel manqué, qualifie chaque prospect
            et livre le tout sur ton tableau de bord — pour que tu puisses te concentrer
            sur le travail qui fait vraiment rentrer l'argent.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Link
              href="/fr/lead-rescue"
              className="rounded-xl px-10 py-4 text-lg font-bold
                         bg-blue-600 hover:bg-blue-500 text-white
                         shadow-[0_0_30px_rgba(59,130,246,0.6)]
                         transition-all duration-300 hover:scale-105"
            >
              Voir comment ça marche →
            </Link>
            <Link
              href="/fr/contact"
              className="rounded-xl px-10 py-4 text-lg font-semibold
                         border-2 border-slate-600 hover:border-blue-500
                         text-slate-200 hover:text-white
                         transition-all duration-300"
            >
              Réserver appel stratégique
            </Link>
          </div>

          <p className="text-slate-400 text-sm">
            À partir de 497 $ (SMS seulement) • Système complet à 2 997 $ installation + 799 $/mois
          </p>
        </div>
      </section>
    </div>
  );
}
