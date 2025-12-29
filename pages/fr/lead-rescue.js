// pages/fr/lead-rescue.js
import { useState } from "react";
import ConsultCTA from "@/components/ConsultCTA";
import ROICalculator from "@/components/ROICalculator";
import Link from "next/link";

export default function LeadRescueOfferFr() {
  const [selectedTier, setSelectedTier] = useState("pro");

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
            max-w-6xl mx-auto space-y-12 px-6 sm:px-12 py-10
            rounded-3xl
            bg-slate-950/80
            border border-white/10
            backdrop-blur-md
            shadow-[0_0_45px_rgba(15,23,42,0.9)]
          "
        >
          {/* HERO */}
          <div className="text-center space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-heading drop-shadow-md">
              Plateforme Lead Rescue
            </h1>
            <p className="text-xl sm:text-2xl text-blue-300 font-semibold">
              Récupération de leads propulsée par IA pour les métiers
            </p>
            <p className="text-lg text-slate-200 drop-shadow-sm">
              Arrête de perdre 28 800 $/année+ sur des appels manqués. Lead Rescue répond
              automatiquement à chaque lead par SMS, voix et courriel — capture des jobs pendant
              que t'es sur le terrain.
            </p>

            {/* Production Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 max-w-3xl mx-auto">
              <div className="bg-slate-900/60 rounded-xl p-3 border border-blue-500/30">
                <div className="text-2xl font-bold text-blue-300">10 118</div>
                <div className="text-xs text-slate-300">Opérations/semaine</div>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-3 border border-emerald-500/30">
                <div className="text-2xl font-bold text-emerald-300">97,6 %</div>
                <div className="text-xs text-slate-300">Disponibilité</div>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-3 border border-purple-500/30">
                <div className="text-2xl font-bold text-purple-300">24/7</div>
                <div className="text-xs text-slate-300">Automatisé</div>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-3 border border-amber-500/30">
                <div className="text-2xl font-bold text-amber-300">97</div>
                <div className="text-xs text-slate-300">Leads qualifiés</div>
              </div>
            </div>
          </div>

          {/* PROBLEM SECTION */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-blue-500/25 shadow-[0_0_30px_rgba(15,23,42,0.9)]">
            <h2 className="text-2xl sm:text-3xl font-heading flex items-center gap-2">
              <span>🚨</span>
              <span>Le problème à 28 800 $/année que chaque entreprise de métiers a</span>
            </h2>

            <p className="text-slate-200 text-lg">
              Quand t'es sur un toit, en dessous d'un lavabo ou en face d'un client, tu peux pas
              répondre à tous les appels. Pis chaque appel manqué c'est de l'argent qui te file
              entre les doigts.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-xl p-5 bg-slate-950/80 border border-red-500/40">
                <h3 className="font-semibold text-red-300 mb-3 text-lg">❌ Sans Lead Rescue</h3>
                <ul className="space-y-2 text-slate-200">
                  <li>• 60 % des appels vont sur la boîte vocale</li>
                  <li>• 80 % des messages vocaux sont jamais retournés</li>
                  <li>• Les leads appellent tes compétiteurs ensuite</li>
                  <li>• <strong>28 800 $/année en revenus perdus</strong> (20 appels/semaine)</li>
                  <li>• Le suivi manuel prend 2+ heures/jour</li>
                </ul>
              </div>

              <div className="rounded-xl p-5 bg-slate-950/80 border border-emerald-500/40">
                <h3 className="font-semibold text-emerald-300 mb-3 text-lg">✅ Avec Lead Rescue</h3>
                <ul className="space-y-2 text-slate-200">
                  <li>• 100 % de réponse en 5 minutes (automatisé)</li>
                  <li>• L'IA qualifie les leads automatiquement</li>
                  <li>• Les urgences sont détectées pis mises en priorité</li>
                  <li>• <strong>Récupère 2 400 $+/mois</strong> en revenus perdus</li>
                  <li>• Zéro suivi manuel requis</li>
                </ul>
              </div>
            </div>

            {/* Real Testimonial */}
            <div className="mt-6 rounded-xl p-5 bg-slate-950/60 border border-slate-700/50">
              <p className="text-slate-200 italic text-sm sm:text-base">
                "On a envoyé 90 messages Slybroadcast pis on a reçu notre premier rappel en dedans
                de 24 heures. L'IA a géré ça automatiquement pendant que j'étais sur le terrain."
              </p>
              <p className="text-blue-300 text-sm mt-2">— Mikael, Ramoneur Multi-Services</p>
            </div>
          </div>

          {/* PRICING TIERS */}
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <h2 className="text-3xl sm:text-4xl font-heading">Choisis ton système Lead Rescue</h2>
              <p className="text-slate-300 text-lg max-w-3xl mx-auto">
                Tous les systèmes incluent ton dashboard personnalisé, le monitoring de production
                et le support continu. Choisis le niveau d'automatisation qui fit avec ta business.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* TIER 1: SMS LEAD RESCUE */}
              <div className={`rounded-2xl p-6 border-2 transition-all duration-200 ${selectedTier === 'starter' ? 'border-blue-500/70 bg-slate-900/80' : 'border-slate-700/50 bg-slate-900/60'}`}>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-heading text-slate-200">Lead Rescue SMS</h3>
                    <p className="text-sm text-slate-400 mt-1">Parfait pour commencer</p>
                  </div>

                  <div className="py-4">
                    <div className="text-4xl font-bold text-blue-300">497 $</div>
                    <div className="text-sm text-slate-400">Installation unique</div>
                    <div className="text-sm text-slate-300 mt-2">+ 249 $/mois support</div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-200">Appel manqué → SMS automatique</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-200">Bot SMS de qualification</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-200">Dashboard de suivi des leads</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-200">Résumés quotidiens par courriel</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-slate-500 mt-0.5">✗</span>
                      <span className="text-slate-500">Agent vocal IA</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-slate-500 mt-0.5">✗</span>
                      <span className="text-slate-500">Moteur de courriels inbox</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedTier('starter')}
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${selectedTier === 'starter' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                  >
                    {selectedTier === 'starter' ? 'Sélectionné' : 'Choisir ce plan'}
                  </button>
                </div>
              </div>

              {/* TIER 2: FULL LEAD RESCUE (RECOMMENDED) */}
              <div className={`rounded-2xl p-6 border-2 relative ${selectedTier === 'pro' ? 'border-emerald-500/70 bg-gradient-to-br from-emerald-900/20 to-slate-900/80' : 'border-emerald-500/50 bg-slate-900/60'}`}>
                {/* Most Popular Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  ⭐ Le plus populaire
                </div>

                <div className="space-y-4 mt-2">
                  <div>
                    <h3 className="text-xl font-heading text-slate-50">Lead Rescue Complet</h3>
                    <p className="text-sm text-emerald-300 mt-1">Suite d'automatisation complète</p>
                  </div>

                  <div className="py-4">
                    <div className="text-4xl font-bold text-emerald-300">2 997 $</div>
                    <div className="text-sm text-slate-400">Installation unique</div>
                    <div className="text-sm text-slate-300 mt-2">+ 799 $/mois support</div>
                    <div className="text-xs text-emerald-300 mt-1">Sauve 3 000 $ vs compétiteurs</div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-100 font-semibold">Tout du plan SMS</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-100"><strong>Agent vocal VAPI</strong> (réponse 24/7)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-100">Qualification vocale → lead</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-100">Multi-canal (voix + SMS + courriel)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-100">Scoring avancé des leads</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-100">Support prioritaire (réponse 4 heures)</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedTier('pro')}
                    className="w-full py-3 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-500/30"
                  >
                    {selectedTier === 'pro' ? '✓ Sélectionné' : 'Choisir meilleur value'}
                  </button>

                  <div className="text-xs text-center text-slate-400 pt-2">
                    ROI : Rentabilisé en 45-60 jours
                  </div>
                </div>
              </div>

              {/* TIER 3: ENTERPRISE */}
              <div className={`rounded-2xl p-6 border-2 transition-all duration-200 ${selectedTier === 'enterprise' ? 'border-amber-500/70 bg-slate-900/80' : 'border-slate-700/50 bg-slate-900/60'}`}>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-heading text-slate-200">Entreprise</h3>
                    <p className="text-sm text-slate-400 mt-1">Pour business multi-locations</p>
                  </div>

                  <div className="py-4">
                    <div className="text-4xl font-bold text-amber-300">4 997 $</div>
                    <div className="text-sm text-slate-400">Installation unique</div>
                    <div className="text-sm text-slate-300 mt-2">+ 1 200 $/mois support</div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-100 font-semibold">Tout du plan Complet</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-200"><strong>Moteur IA inbox</strong> (triage courriel)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-200">Support multi-locations</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-200">Intégrations CRM custom</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-200">Support prioritaire (réponse 2 heures)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-200">Calls stratégiques mensuels</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedTier('enterprise')}
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${selectedTier === 'enterprise' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                  >
                    {selectedTier === 'enterprise' ? 'Sélectionné' : 'Choisir ce plan'}
                  </button>
                </div>
              </div>
            </div>

            {/* CTA Below Pricing */}
            <div className="text-center pt-4">
              <Link
                href="/fr/onboarding-rescue"
                className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5"
              >
                Commencer avec Lead Rescue →
              </Link>
              <p className="text-sm text-slate-400 mt-3">
                Réserve un call de 15 minutes pour voir quel plan fit avec ta business
              </p>
            </div>
          </div>

          {/* INTERACTIVE ROI CALCULATOR */}
          <ROICalculator />

          {/* WHAT'S INCLUDED */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-blue-500/25">
            <h2 className="text-2xl sm:text-3xl font-heading flex items-center gap-2">
              <span>🤖</span>
              <span>Ce qui est inclus dans chaque système</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-blue-300 text-lg">Stack technologique</h3>
                <ul className="space-y-2 text-slate-200 text-sm">
                  <li>✓ Workflows d'automatisation n8n custom</li>
                  <li>✓ Base de données Supabase + authentification</li>
                  <li>✓ OpenAI GPT-4 pour qualification des leads</li>
                  <li>✓ Intégration SMS/Voix Telnyx</li>
                  <li>✓ Agent vocal VAPI (plans Complet & Entreprise)</li>
                  <li>✓ Monitoring de production & gestion d'erreurs</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-blue-300 text-lg">Ton dashboard</h3>
                <ul className="space-y-2 text-slate-200 text-sm">
                  <li>✓ Suivi des leads & conversations en temps réel</li>
                  <li>✓ Scoring des leads & statut de qualification</li>
                  <li>✓ Résumés quotidiens par courriel (8h)</li>
                  <li>✓ Détection de jobs urgents & alertes</li>
                  <li>✓ Historique complet des conversations</li>
                  <li>✓ Design responsive mobile</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-slate-950/60 border border-slate-700/50">
              <p className="text-sm text-slate-300">
                <strong className="text-blue-300">Toute l'infra incluse :</strong> T'as pas
                besoin de gérer des clés API, de l'hébergement ou du setup technique. On gère
                tout pour que tu puisses focus sur ta business.
              </p>
            </div>
          </div>

          {/* WHO THIS IS FOR */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-blue-500/25">
            <h2 className="text-2xl sm:text-3xl font-heading flex items-center gap-2">
              <span>🎯</span>
              <span>Est-ce que Lead Rescue est pour ta business ?</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-emerald-300 mb-3">✓ Parfait pour :</h3>
                <ul className="space-y-2 text-slate-200">
                  <li>• CVC, plomberie, toiture, électricité, ramonage</li>
                  <li>• 1-20 employés (300 k$ à 5 M$ revenus/année)</li>
                  <li>• Reçois 15-50 appels/semaine</li>
                  <li>• Manques 5-15 appels/semaine à cause du volume</li>
                  <li>• Valeur moyenne de job 300 $+</li>
                  <li>• Perds 20 k$ à 100 k$/année en opportunités manquées</li>
                  <li>• <strong>Entreprises avec réceptionnistes/assistantes :</strong> Arrête de les payer 60 k$ pour répondre "Desservez-vous mon secteur ?" 50 fois par jour. Lead Rescue pré-qualifie les appels pour que ton équipe parle juste aux prospects chauds. T'as 4 assistantes ? Garde-en 2 pour du vrai travail pis sauve 120 k$/année.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-red-300 mb-3">✗ Pas pour :</h3>
                <ul className="space-y-2 text-slate-200">
                  <li>• Business qui reçoivent moins de 10 appels/semaine</li>
                  <li>• Valeur moyenne de job en dessous de 150 $</li>
                  <li>• Consultations complexes nécessitant expertise humaine immédiate (médical, légal, conseils financiers)</li>
                  <li>• Pas prêt à investir 2 997 $+ d'avance</li>
                  <li>• Veut "essayer ça cheap" — c'est une plateforme premium</li>
                  <li>• Pas engagé à améliorer les systèmes de capture de leads</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <p className="text-slate-200">
                <strong className="text-blue-300">Évaluation honnête :</strong> Si tu perds moins
                de 10 000 $/année sur des appels manqués, le plan SMS (497 $) pourrait mieux fitter.
                Si tu perds 20 000 $+/année, le plan Complet (2 997 $) se paye tout seul en 2 mois.
              </p>
            </div>
          </div>

          {/* PROCESS */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-blue-500/25">
            <h2 className="text-2xl sm:text-3xl font-heading flex items-center gap-2">
              <span>📋</span>
              <span>Comment le processus fonctionne</span>
            </h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">1</div>
                <div>
                  <h3 className="font-semibold text-blue-300">Call stratégique (15 min)</h3>
                  <p className="text-slate-300 text-sm">On analyse ton flow de leads actuel pis on recommande le bon plan</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">2</div>
                <div>
                  <h3 className="font-semibold text-blue-300">Design custom (2-3 jours)</h3>
                  <p className="text-slate-300 text-sm">On map tes workflows, triggers d'urgence et templates de réponse</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">3</div>
                <div>
                  <h3 className="font-semibold text-blue-300">Build & Test (1-2 semaines)</h3>
                  <p className="text-slate-300 text-sm">On build tes automatisations, dashboard et scripts vocaux</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">4</div>
                <div>
                  <h3 className="font-semibold text-blue-300">Go Live (Jour 1)</h3>
                  <p className="text-slate-300 text-sm">On lance avec monitoring live pis on ajuste based sur de vrais leads</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">5</div>
                <div>
                  <h3 className="font-semibold text-blue-300">Support continu (Mensuel)</h3>
                  <p className="text-slate-300 text-sm">On monitor, optimise et améliore ton système continuellement</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-blue-500/25">
            <h2 className="text-2xl sm:text-3xl font-heading">Questions fréquentes</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-blue-300 mb-2">Pourquoi le plan Complet est 2 997 $ quand d'autres chargent 6 000 $+ ?</h3>
                <p className="text-slate-300 text-sm">
                  La plupart des compétiteurs chargent 3 k$ à 6 k$ JUSTE pour l'agent vocal. On bundle
                  voix, SMS, courriel, dashboard et monitoring dans un système parce qu'on l'a construit
                  comme plateforme, pas du code custom pour chaque client. Tu reçois des features
                  entreprise à moitié prix.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-blue-300 mb-2">Je peux upgrader du plan SMS au Complet plus tard ?</h3>
                <p className="text-slate-300 text-sm">
                  Oui ! Paye la différence (2 500 $) pis on va ajouter l'agent vocal et les features
                  avancées. La plupart des clients commencent avec SMS pour tester, pis upgrade en dedans
                  de 30 jours après avoir vu les résultats.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-blue-300 mb-2">Qu'est-ce qui est inclus dans le support mensuel ?</h3>
                <p className="text-slate-300 text-sm">
                  Tous les abonnements (n8n, OpenAI, Telnyx, hosting), monitoring, bug fixes, petits
                  ajustements et optimisation. Tu payes pas pour notre temps — tu payes pour la peace
                  of mind que ça marche tout le temps.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-blue-300 mb-2">Combien de leads le système peut gérer ?</h3>
                <p className="text-slate-300 text-sm">
                  On traite présentement 10 118 opérations/semaine à travers tous nos clients avec
                  97,6 % de disponibilité. Ton système peut gérer 100-500 leads/mois facilement. Pour
                  plus de volume, on passe au plan Entreprise.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-blue-300 mb-2">Et si ça marche pas pour ma business ?</h3>
                <p className="text-slate-300 text-sm">
                  Réponse honnête : Si tu reçois pas au moins 10-15 appels/semaine, y'a pas assez de
                  volume pour justifier le coût. C'est pourquoi on fait un call stratégique avant —
                  pour s'assurer que c'est un bon fit avant que t'investisses.
                </p>
              </div>
            </div>
          </div>

          {/* FINAL CTA */}
          <div className="text-center space-y-6 pt-8">
            <h2 className="text-3xl sm:text-4xl font-heading">Prêt à arrêter de perdre des leads ?</h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Réserve un call stratégique de 15 minutes. On va analyser ton flow de leads actuel
              pis recommander le bon plan pour ta business.
            </p>

            <Link
              href="/fr/onboarding-rescue"
              className="inline-block px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xl rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5"
            >
              Réserve ton call stratégique →
            </Link>

            <div className="pt-6 space-y-2">
              <p className="text-sm text-slate-400">
                On accepte présentement 5 nouveaux clients ce mois
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                <span>✓ Aucune carte de crédit requise</span>
                <span>✓ Call stratégique gratuit</span>
                <span>✓ Recommandations custom</span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800">
              <Link href="/fr/portfolio" className="text-blue-400 hover:text-blue-300 text-sm">
                Voir les détails complets de la plateforme & métriques de production →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
