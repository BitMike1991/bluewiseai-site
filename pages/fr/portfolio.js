import Link from "next/link";

export default function PortfolioFr() {
  return (
    <div className="min-h-screen bg-[url('/styles/backgroundpages.png')] bg-cover bg-center text-white">
      <div className="min-h-screen py-16 px-4 backdrop-brightness-110">
        <section className="max-w-5xl mx-auto space-y-12 px-6 sm:px-12 py-10 rounded-3xl bg-slate-950/80 border border-white/10 backdrop-blur-md shadow-[0_0_45px_rgba(15,23,42,0.9)]">

          {/* TITRE */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold">Résultats</h1>
            <p className="text-lg text-slate-200 max-w-2xl mx-auto">
              Des vrais chiffres de vraies businesses. Pas de vanity metrics — juste du revenu récupéré pis des opérations automatisées.
            </p>
          </div>

          {/* ÉTUDE DE CAS 1: SERVICE PLUS */}
          <article className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-emerald-900/20 to-slate-900/80 border-2 border-emerald-500/40">
            <div className="space-y-6">
              <div>
                <div className="inline-block bg-emerald-600/20 border border-emerald-500/40 rounded-full px-4 py-1.5 mb-3">
                  <span className="text-emerald-300 text-xs uppercase tracking-widest font-semibold">Étude de cas</span>
                </div>
                <h2 className="text-3xl font-bold">Service Plus</h2>
                <p className="text-emerald-300 font-semibold">Entrepreneur résidentiel — Québec</p>
              </div>

              {/* Métriques clés */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950/60 rounded-xl p-4 border border-emerald-500/30 text-center">
                  <div className="text-3xl font-bold text-emerald-300">71 000 $</div>
                  <div className="text-xs text-slate-400 mt-1">Pipeline en 30 jours</div>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-4 border border-blue-500/30 text-center">
                  <div className="text-3xl font-bold text-blue-300">0</div>
                  <div className="text-xs text-slate-400 mt-1">Leads manqués</div>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-4 border border-purple-500/30 text-center">
                  <div className="text-3xl font-bold text-purple-300">100%</div>
                  <div className="text-xs text-slate-400 mt-1">Soumissions auto</div>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-4 border border-amber-500/30 text-center">
                  <div className="text-3xl font-bold text-amber-300">24/7</div>
                  <div className="text-xs text-slate-400 mt-1">Réceptionniste IA</div>
                </div>
              </div>

              {/* Avant/Après */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl p-5 bg-slate-950/80 border border-red-500/30">
                  <h3 className="font-semibold text-red-300 mb-3">Avant BlueWise</h3>
                  <ul className="space-y-2 text-slate-200 text-sm">
                    <li>&#8226; Manquait 40 % des appels entrants</li>
                    <li>&#8226; Soumissions pis contrats au papier</li>
                    <li>&#8226; Pas de CRM — les leads dans un cahier</li>
                    <li>&#8226; Suivis manuels (la plupart jamais faits)</li>
                    <li>&#8226; Aucune visibilité sur la performance financière</li>
                    <li>&#8226; 3+ heures/jour sur l&apos;admin</li>
                  </ul>
                </div>
                <div className="rounded-xl p-5 bg-slate-950/80 border border-emerald-500/30">
                  <h3 className="font-semibold text-emerald-300 mb-3">Après BlueWise</h3>
                  <ul className="space-y-2 text-slate-200 text-sm">
                    <li>&#8226; Zéro leads manqués — l&apos;IA répond à chaque appel</li>
                    <li>&#8226; Soumissions générées automatiquement depuis Slack</li>
                    <li>&#8226; Contrats numériques avec signatures électroniques</li>
                    <li>&#8226; Demandes de dépôt automatiques après signature</li>
                    <li>&#8226; Dashboard financier en temps réel avec P&amp;L</li>
                    <li>&#8226; 0 heures/jour sur l&apos;admin — tout est automatisé</li>
                  </ul>
                </div>
              </div>

              {/* Ce qu'on a bâti */}
              <div>
                <h3 className="font-semibold text-white mb-3">Ce qu&apos;on a bâti</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {['Agent vocal IA (24/7)', 'Capture SMS', 'Dashboard CRM', 'Pipeline soumissions', 'Contrats numériques', 'E-signatures',
                    'Suivi paiements', 'Suivi dépenses', 'Reçus automatiques', 'Rapports financiers', 'Briefing du matin', 'Intégration Slack'].map((item) => (
                    <div key={item} className="bg-slate-900/60 rounded-lg px-3 py-2 border border-slate-700/50 text-slate-300">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          {/* ÉTUDE DE CAS 2: RAMONEUR */}
          <article className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-blue-900/20 to-slate-900/80 border border-blue-500/30">
            <div className="space-y-6">
              <div>
                <div className="inline-block bg-blue-600/20 border border-blue-500/40 rounded-full px-4 py-1.5 mb-3">
                  <span className="text-blue-300 text-xs uppercase tracking-widest font-semibold">Étude de cas</span>
                </div>
                <h2 className="text-2xl font-bold">Ramoneur Multi-Services</h2>
                <p className="text-blue-300 font-semibold">Services de ramonage — Québec</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-950/60 rounded-xl p-4 border border-blue-500/30 text-center">
                  <div className="text-3xl font-bold text-blue-300">60%→0%</div>
                  <div className="text-xs text-slate-400 mt-1">Taux d&apos;appels manqués</div>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-4 border border-emerald-500/30 text-center">
                  <div className="text-3xl font-bold text-emerald-300">24h</div>
                  <div className="text-xs text-slate-400 mt-1">Premier rappel</div>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-4 border border-purple-500/30 text-center">
                  <div className="text-3xl font-bold text-purple-300">0</div>
                  <div className="text-xs text-slate-400 mt-1">Suivis manuels</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-red-300 mb-2">Avant</h3>
                  <ul className="space-y-1 text-slate-300 text-sm">
                    <li>&#8226; 60 % des appels allaient à la boîte vocale</li>
                    <li>&#8226; 80 % des messages jamais retournés</li>
                    <li>&#8226; Les leads appelaient la compétition ensuite</li>
                    <li>&#8226; 2+ heures/jour en suivis manuels</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-300 mb-2">Après</h3>
                  <ul className="space-y-1 text-slate-300 text-sm">
                    <li>&#8226; Chaque appel répondu ou texté en moins de 2 min</li>
                    <li>&#8226; L&apos;IA qualifie les leads automatiquement</li>
                    <li>&#8226; Premiers résultats en 24 heures</li>
                    <li>&#8226; Zéro suivi manuel nécessaire</li>
                  </ul>
                </div>
              </div>

              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-700/50">
                <p className="text-slate-200 italic text-sm">
                  &quot;On a envoyé 90 messages Slybroadcast pis on a eu notre premier rappel en 24 heures.
                  L&apos;IA a tout géré automatiquement pendant que je travaillais sur le chantier.&quot;
                </p>
                <p className="text-blue-300 text-sm mt-2">— Ramoneur Multi-Services</p>
              </div>
            </div>
          </article>

          {/* CTA */}
          <div className="pt-4 text-center space-y-4">
            <h3 className="text-2xl font-bold">Tu veux des résultats comme ça ?</h3>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Réserve un call de 15 minutes. On regarde ta business pis on te dit exactement ce qu&apos;on peut automatiser.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/fr/contact"
                className="inline-block bg-blue-600 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all hover:-translate-y-0.5">
                Réserve ton appel stratégique
              </Link>
              <Link href="/fr/lead-rescue"
                className="inline-block border-2 border-slate-600 hover:border-blue-500 text-slate-200 hover:text-white font-semibold px-8 py-4 rounded-xl transition-all">
                Voir les plans et prix
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
