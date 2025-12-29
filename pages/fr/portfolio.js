/* eslint-disable react/no-unescaped-entities */

import ConsultCTA from "@/components/ConsultCTA";
import Link from "next/link";

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
            <h1 className="text-4xl sm:text-5xl font-heading drop-shadow-md">
              🚀 Systèmes IA en Production
            </h1>
            <p className="text-lg sm:text-xl text-slate-100 drop-shadow-sm max-w-3xl mx-auto">
              Je ne construis pas que des prototypes — je bâtis des systèmes IA prêts pour la production
              qui gèrent des milliers d'opérations par semaine. Voici ce que j'ai déployé.
            </p>
          </div>

          {/* FEATURED PROJECT - Lead Rescue Platform */}
          <article
            className="
              rounded-2xl p-6 md:p-8
              bg-gradient-to-br from-blue-900/40 to-slate-900/80
              border-2 border-blue-500/50
              shadow-[0_0_40px_rgba(37,99,235,0.4)]
              relative overflow-hidden
            "
          >
            {/* Featured Badge */}
            <div className="absolute top-4 right-4 bg-blue-500/90 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              ⭐ En vedette
            </div>

            <div className="space-y-6">
              {/* Header */}
              <div className="space-y-3">
                <h2 className="text-3xl sm:text-4xl font-heading drop-shadow-sm">
                  Lead Rescue Platform
                </h2>
                <p className="text-lg text-blue-200 font-semibold">
                  SaaS Full-Stack IA pour Entreprises de Services
                </p>
              </div>

              {/* Key Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 rounded-xl p-3 border border-blue-500/30">
                  <div className="text-2xl font-bold text-blue-300">10 118</div>
                  <div className="text-xs text-slate-300">Exécutions/Semaine</div>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-3 border border-emerald-500/30">
                  <div className="text-2xl font-bold text-emerald-300">97,6%</div>
                  <div className="text-xs text-slate-300">Disponibilité</div>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-3 border border-purple-500/30">
                  <div className="text-2xl font-bold text-purple-300">97</div>
                  <div className="text-xs text-slate-300">Leads Qualifiés</div>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-3 border border-amber-500/30">
                  <div className="text-2xl font-bold text-amber-300">24/7</div>
                  <div className="text-xs text-slate-300">Automatisé</div>
                </div>
              </div>

              {/* Description */}
              <p className="leading-relaxed text-slate-100 text-base">
                Une plateforme SaaS multi-tenant complète qui récupère automatiquement les leads manqués
                pour les entreprises de services (CVC, plomberie, toiture, ramonage, électricité).
                Gère les appels vocaux, SMS et courriels avec des réponses IA, qualification de leads
                et suivis automatisés.
              </p>

              {/* Tech Stack */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wider">Technologies</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-slate-950/80 border border-slate-600 px-3 py-1.5">Next.js 15</span>
                  <span className="rounded-full bg-slate-950/80 border border-slate-600 px-3 py-1.5">React 19</span>
                  <span className="rounded-full bg-slate-950/80 border border-slate-600 px-3 py-1.5">Supabase (PostgreSQL)</span>
                  <span className="rounded-full bg-slate-950/80 border border-slate-600 px-3 py-1.5">n8n Automation</span>
                  <span className="rounded-full bg-slate-950/80 border border-slate-600 px-3 py-1.5">VAPI Voice AI</span>
                  <span className="rounded-full bg-slate-950/80 border border-slate-600 px-3 py-1.5">OpenAI GPT-4</span>
                  <span className="rounded-full bg-slate-950/80 border border-slate-600 px-3 py-1.5">Telnyx (SMS/Voix)</span>
                  <span className="rounded-full bg-slate-950/80 border border-slate-600 px-3 py-1.5">Vercel</span>
                </div>
              </div>

              {/* Key Features */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wider">Fonctionnalités</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <ul className="space-y-2 text-sm text-slate-100">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span><strong>IA multi-canal :</strong> Gère appels vocaux, SMS et courriels automatiquement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span><strong>Scoring en temps réel :</strong> Qualifie les leads selon urgence, budget et timing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span><strong>Suivis automatisés :</strong> Aucun lead ne refroidit jamais</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span><strong>Tableau de bord client :</strong> Vue en temps réel de tous les leads et conversations</span>
                    </li>
                  </ul>
                  <ul className="space-y-2 text-sm text-slate-100">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span><strong>Architecture multi-tenant :</strong> Conçue pour servir des centaines d'entreprises</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span><strong>Auth entreprise :</strong> Supabase SSR avec système d'invitation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span><strong>Monitoring production :</strong> Gestion d'erreurs, vérifications, rapports quotidiens</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span><strong>Prêt pour facturation :</strong> Tarification 497$ + 249-799$/mois validée</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Case Study */}
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-700/50">
                <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wider mb-3">Impact Réel</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-red-300 font-semibold mb-2">❌ Avant Lead Rescue</div>
                    <ul className="space-y-1 text-slate-300">
                      <li>• 60% des appels vont à la messagerie</li>
                      <li>• 80% des messages vocaux ne sont jamais retournés</li>
                      <li>• 28 800$/an en revenus perdus (20 appels/semaine)</li>
                      <li>• Les suivis manuels prennent 2+ heures/jour</li>
                    </ul>
                  </div>
                  <div>
                    <div className="text-emerald-300 font-semibold mb-2">✅ Après Lead Rescue</div>
                    <ul className="space-y-1 text-slate-300">
                      <li>• Réponse automatisée 100% en moins de 5 minutes</li>
                      <li>• La qualification des leads se fait automatiquement</li>
                      <li>• Récupération de 2 400$/mois+ en revenus perdus</li>
                      <li>• Zéro suivi manuel requis</li>
                    </ul>
                  </div>
                </div>
                <p className="mt-4 text-slate-300 italic">
                  "On a envoyé 90 messages Slybroadcast et reçu notre premier rappel en 24h.
                  L'IA a tout géré automatiquement pendant que je travaillais sur chantier."
                  <span className="text-blue-300"> — Mikael, Ramoneur Multi-Services</span>
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/fr/contact"
                  className="
                    inline-flex items-center gap-2 px-5 py-3 rounded-xl
                    bg-blue-600 hover:bg-blue-500
                    text-white font-semibold
                    shadow-lg shadow-blue-500/30
                    transition-all duration-200
                    hover:-translate-y-0.5
                  "
                >
                  Réserver démo live de la plateforme →
                </Link>
                <Link
                  href="/fr/lead-rescue"
                  className="
                    inline-flex items-center gap-2 px-5 py-3 rounded-xl
                    border border-blue-500/50 hover:border-blue-400
                    text-blue-300 hover:text-blue-200
                    font-semibold
                    transition-all duration-200
                    hover:-translate-y-0.5
                  "
                >
                  Voir Tarifs & Détails
                </Link>
              </div>

              {/* Development Timeline */}
              <div className="pt-4 border-t border-slate-700/50">
                <p className="text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Développement :</span> 2 mois (oct-déc 2025) •
                  <span className="font-semibold text-slate-300"> Statut :</span> Production (intégration clients bêta en cours) •
                  <span className="font-semibold text-slate-300"> Prochain jalon :</span> 10 clients payants d'ici T1 2026
                </p>
              </div>
            </div>
          </article>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/50"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-950/80 px-4 text-sm text-slate-400 uppercase tracking-wider">
                Projets d'Apprentissage Antérieurs
              </span>
            </div>
          </div>

          {/* Other Projects - Repositioned */}
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-slate-300 text-sm max-w-2xl mx-auto">
                Avant de construire Lead Rescue, j'ai prototypé plusieurs outils IA pour comprendre la technologie.
                Ces projets m'ont aidé à apprendre ce qui fonctionne en production avant de bâtir le vrai système.
              </p>
            </div>

            <div className="space-y-6">
              {/* Project 1 */}
              <article
                className="
                  rounded-2xl p-5 md:p-6
                  bg-slate-900/60
                  border border-slate-700/50
                  shadow-[0_0_20px_rgba(15,23,42,0.6)]
                  hover:border-slate-600
                  transition-all duration-300
                "
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                  <h3 className="text-xl font-heading drop-shadow-sm">
                    💼 Coach d'Entrevue GPT
                  </h3>
                  <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-slate-400">
                    <span className="rounded-full border border-slate-600 px-2.5 py-1">
                      Next.js
                    </span>
                    <span className="rounded-full border border-slate-600 px-2.5 py-1">
                      GPT-4
                    </span>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-slate-300 mb-3">
                  Application web qui simule des scénarios d'entrevue avec feedback personnalisé.
                  M'a aidé à comprendre les interactions IA en temps réel et la gestion d'état.
                </p>

                <a
                  href="https://www.jobinterviewcoachgpt.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    inline-flex items-center gap-1
                    text-blue-400 hover:text-blue-300
                    text-sm font-medium
                    hover:underline
                  "
                >
                  Voir la démo →
                </a>
              </article>

              {/* Project 2 */}
              <article
                className="
                  rounded-2xl p-5 md:p-6
                  bg-slate-900/60
                  border border-slate-700/50
                  shadow-[0_0_20px_rgba(15,23,42,0.6)]
                  hover:border-slate-600
                  transition-all duration-300
                "
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                  <h3 className="text-xl font-heading drop-shadow-sm">
                    📚 Générateur d'Histoires GPT
                  </h3>
                  <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-slate-400">
                    <span className="rounded-full border border-slate-600 px-2.5 py-1">
                      GPT Custom
                    </span>
                    <span className="rounded-full border border-slate-600 px-2.5 py-1">
                      Streamlit
                    </span>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-slate-300 mb-3">
                  GPT personnalisé pour générer des histoires pour enfants avec export PDF automatique.
                  M'a appris l'ingénierie de prompts et les flux de génération de contenu.
                </p>

                <a
                  href="https://chatgpt.com/g/g-685d9a9fec988191a649d0478b85dd56-storycraft-ai-custom-short-stories"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    inline-flex items-center gap-1
                    text-blue-400 hover:text-blue-300
                    text-sm font-medium
                    hover:underline
                  "
                >
                  Voir le projet →
                </a>
              </article>

              {/* Project 3 */}
              <article
                className="
                  rounded-2xl p-5 md:p-6
                  bg-slate-900/60
                  border border-slate-700/50
                  shadow-[0_0_20px_rgba(15,23,42,0.6)]
                  hover:border-slate-600
                  transition-all duration-300
                "
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                  <h3 className="text-xl font-heading drop-shadow-sm">
                    📆 Calendrier Médias Sociaux 30 Jours GPT
                  </h3>
                  <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-slate-400">
                    <span className="rounded-full border border-slate-600 px-2.5 py-1">
                      LangChain
                    </span>
                    <span className="rounded-full border border-slate-600 px-2.5 py-1">
                      GPT
                    </span>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-slate-300 mb-3">
                  Génère un mois de contenu pour médias sociaux avec export CSV.
                  Expérimentation avec sorties structurées et génération en masse.
                </p>

                <a
                  href="https://chatgpt.com/g/g-685da1abb65c81919f4af829257cbabc-30-day-social-media-content-calendar-generator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    inline-flex items-center gap-1
                    text-blue-400 hover:text-blue-300
                    text-sm font-medium
                    hover:underline
                  "
                >
                  Voir le projet →
                </a>
              </article>
            </div>
          </div>

          {/* What's Next */}
          <article
            className="
              rounded-2xl p-6 md:p-7
              bg-gradient-to-br from-slate-900/60 to-slate-950/80
              border border-slate-700/50
              shadow-[0_0_26px_rgba(15,23,42,0.9)]
            "
          >
            <h2 className="text-2xl font-heading drop-shadow-sm mb-3 flex items-center gap-2">
              <span>🎯</span>
              <span>Focus Actuel : Expansion de Lead Rescue</span>
            </h2>
            <div className="space-y-3 text-slate-200">
              <p className="leading-relaxed">
                Après 2 mois de développement intensif, <strong>Lead Rescue est maintenant en production</strong> avec
                des clients bêta. La plateforme gère 10 000+ exécutions d'automation par semaine avec
                une fiabilité de 97,6%.
              </p>
              <p className="leading-relaxed">
                <strong>Prochain jalon :</strong> Intégrer 10 clients payants d'ici fin T1 2026.
                Actuellement, 5 places disponibles ce mois-ci.
              </p>
              <p className="leading-relaxed text-sm">
                <strong>Exploration future :</strong> Automation pour cabinets dentaires (prise de rendez-vous,
                calendriers multi-fournisseurs, capture d'assurance). Recherches préliminaires suggèrent
                une opportunité de 60-70k$/an en revenus récurrents.
              </p>
            </div>
          </article>

          {/* CTA */}
          <div className="pt-6 text-center space-y-4">
            <h3 className="text-2xl font-heading text-slate-100">
              Besoin d'une plateforme IA personnalisée pour votre entreprise ?
            </h3>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Je construis des systèmes prêts pour la production, pas des prototypes. Si vous avez besoin
              de quelque chose comme Lead Rescue—ou quelque chose de complètement différent—discutons-en.
            </p>
            <ConsultCTA>Réserver Appel Stratégique Gratuit 15 Min</ConsultCTA>
          </div>
        </section>
      </div>
    </div>
  );
}
