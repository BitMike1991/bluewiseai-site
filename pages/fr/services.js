import Link from "next/link";
import { PRICING } from "@/data/pricing";

export default function ServicesFr() {
  return (
    <div className="min-h-screen bg-[url('/styles/backgroundpages.png')] bg-cover bg-center text-white">
      <div className="min-h-screen py-16 px-4 backdrop-brightness-110">
        <section className="max-w-6xl mx-auto space-y-12 px-6 sm:px-12 py-10 rounded-3xl bg-slate-950/80 border border-white/10 backdrop-blur-md shadow-[0_0_45px_rgba(15,23,42,0.9)]">

          {/* HERO */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold">Comment ça marche</h1>
            <p className="text-lg text-slate-200 max-w-2xl mx-auto">
              De ton premier appel à ton dixième client — voici exactement ce qui se passe quand tu travailles avec BlueWise.
            </p>
          </div>

          {/* 3 ÉTAPES */}
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-6 items-start p-6 rounded-2xl bg-slate-900/80 border border-blue-500/25">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-2xl font-bold text-blue-300">1</div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Appel audit gratuit <span className="text-slate-400 text-base font-normal">(15 minutes)</span></h2>
                <p className="text-slate-200 mb-3">
                  On saute sur un call pis on regarde ta business : combien d&apos;appels tu reçois, combien tu en manques,
                  ta valeur moyenne de job, pis quels outils tu utilises. Pas de pitch de vente — juste des vrais
                  chiffres pis une recommandation claire.
                </p>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>&#10003; On calcule tes pertes de revenus actuelles</li>
                  <li>&#10003; On identifie tes plus grosses opportunités d&apos;automatisation</li>
                  <li>&#10003; On recommande le bon plan (ou on te dit qu&apos;on est pas le bon fit)</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start p-6 rounded-2xl bg-slate-900/80 border border-emerald-500/25">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl font-bold text-emerald-300">2</div>
              <div>
                <h2 className="text-2xl font-bold mb-2">On build ton système <span className="text-slate-400 text-base font-normal">(1-2 semaines)</span></h2>
                <p className="text-slate-200 mb-3">
                  Tu continues ta business. On build tout en background : ta réceptionniste IA, ton dashboard CRM,
                  ton moteur SMS, tes workflows d&apos;automatisation, pis tout ce que ton plan inclut. Quand c&apos;est
                  prêt, on go live ensemble pis on s&apos;assure que tout marche.
                </p>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>&#10003; Numéro custom ou on porte ton numéro existant</li>
                  <li>&#10003; IA entraînée spécifiquement sur ta business et tes services</li>
                  <li>&#10003; Dashboard configuré avec ton branding</li>
                  <li>&#10003; Appels test et SMS avant le go live</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start p-6 rounded-2xl bg-slate-900/80 border border-amber-500/25">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl font-bold text-amber-300">3</div>
              <div>
                <h2 className="text-2xl font-bold mb-2">On roule pis on optimise <span className="text-slate-400 text-base font-normal">(continu)</span></h2>
                <p className="text-slate-200 mb-3">
                  Ton système roule 24/7. On monitor tout, on fix les problèmes avant que tu les remarques,
                  pis on optimise based sur de la vraie data. Chaque mois, ton système devient meilleur.
                  Toi tu focus sur le terrain.
                </p>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>&#10003; Monitoring 24/7 et gestion d&apos;erreurs</li>
                  <li>&#10003; Optimisation mensuelle basée sur tes données de leads</li>
                  <li>&#10003; Support prioritaire (temps de réponse selon ton plan)</li>
                  <li>&#10003; Pas de contrat — annule quand tu veux</li>
                </ul>
              </div>
            </div>
          </div>

          {/* CE QUE TU REMPLACES */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-950 border border-slate-700/50">
            <h2 className="text-2xl sm:text-3xl font-bold text-center">Ce que tu remplaces</h2>
            <p className="text-slate-300 text-center max-w-2xl mx-auto text-sm">
              La plupart des entrepreneurs patchent ensemble 4-5 outils pis du monde pour gérer leur business.
              BlueWise remplace tout ça dans une seule plateforme.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-300">Ce que tu payes présentement</th>
                    <th className="text-center py-3 px-4 text-red-300">Coût actuel</th>
                    <th className="text-center py-3 px-4 text-emerald-300">Avec BlueWise</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { item: 'Réceptionniste / admin', cost: '3 500 $/mois', bw: "L'IA gère ça 24/7" },
                    { item: 'Logiciel CRM (GoHighLevel, Jobber, etc.)', cost: '200-400 $/mois', bw: 'Dashboard intégré' },
                    { item: 'Agence marketing ou génération de leads', cost: '1 500-3 000 $/mois', bw: "L'IA capture & qualifie" },
                    { item: 'Comptabilité / facturation', cost: '500-1 500 $/mois', bw: 'Suivi auto & reçus' },
                    { item: 'Service de réponse téléphonique', cost: '200-500 $/mois', bw: 'Agent vocal IA inclus' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-slate-800/50">
                      <td className="py-3 px-4 text-slate-200">{row.item}</td>
                      <td className="py-3 px-4 text-center text-red-300 font-semibold">{row.cost}</td>
                      <td className="py-3 px-4 text-center text-emerald-300">{row.bw}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-600">
                    <td className="py-3 px-4 text-white font-bold">Total</td>
                    <td className="py-3 px-4 text-center text-red-200 font-bold text-lg">6 000-8 900 $/mois</td>
                    <td className="py-3 px-4 text-center text-emerald-200 font-bold text-lg">À partir de {PRICING.starter.monthly} $/mois</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* FEATURES */}
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-center">Ce qui est inclus</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: 'Agent vocal IA', desc: 'Répond aux appels 24/7, qualifie les leads, collecte les détails. Sonne humain, se fatigue jamais.', tier: 'Pro+' },
                { title: 'Moteur SMS intelligent', desc: 'Texto instantané sur appels manqués. Collecte photos, détails pis garde les leads au chaud.', tier: 'Tous' },
                { title: 'Tableau de bord CRM', desc: 'Chaque lead, job et conversation dans une seule interface en temps réel. Mobile-friendly.', tier: 'Tous' },
                { title: 'Soumissions automatisées', desc: "L'IA génère des soumissions à partir des conversations. Le client accepte en un clic.", tier: 'Pro+' },
                { title: 'Contrats numériques', desc: 'Contrats professionnels avec e-signatures. Demandes de dépôt automatiques.', tier: 'Pro+' },
                { title: 'Suivi financier', desc: 'Paiements, dépenses, reçus — tout loggé automatiquement. Exports prêts pour ton comptable.', tier: 'Pro+' },
                { title: 'Formulaires de capture', desc: 'Formulaires web qui feedent directement dans ton pipeline. Zéro entrée manuelle.', tier: 'Tous' },
                { title: 'Gestion pubs Meta', desc: 'On roule tes pubs Facebook/Instagram pis on feed les leads dans ton système.', tier: 'Elite' },
              ].map((f) => (
                <div key={f.title} className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-white">{f.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      f.tier === 'Tous' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                      f.tier === 'Elite' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>{f.tier}</span>
                  </div>
                  <p className="text-slate-300 text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="pt-4 text-center space-y-6">
            <div className="bg-gradient-to-br from-blue-900/40 to-slate-900/80 border-2 border-blue-500/50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-3">Prêt à arrêter de tout faire toi-même ?</h3>
              <p className="text-slate-200 mb-6 max-w-2xl mx-auto">
                Réserve un appel audit de 15 minutes. On te montre exactement où l&apos;automatisation peut te sauver du temps pis de l&apos;argent.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/fr/contact"
                  className="inline-block rounded-xl px-8 py-4 text-lg font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5">
                  Réserve ton appel gratuit
                </Link>
                <Link href="/fr/lead-rescue"
                  className="inline-block rounded-xl px-8 py-4 text-lg font-semibold border-2 border-slate-600 hover:border-blue-500 text-slate-200 hover:text-white transition-all">
                  Voir les plans et prix
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
