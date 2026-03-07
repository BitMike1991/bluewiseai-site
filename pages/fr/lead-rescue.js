// pages/fr/lead-rescue.js
import { useState } from "react";
import ROICalculator from "@/components/ROICalculator";
import Link from "next/link";
import { TIERS, COMPARISON_FEATURES } from "@/data/pricing";

export default function LeadRescueOfferFr() {
  const [selectedTier, setSelectedTier] = useState("pro");
  const lang = "fr";

  return (
    <div className="min-h-screen bg-[url('/styles/backgroundpages.png')] bg-cover bg-center text-white">
      <div className="min-h-screen py-16 px-4 backdrop-brightness-110">
        <section className="max-w-6xl mx-auto space-y-12 px-6 sm:px-12 py-10 rounded-3xl bg-slate-950/80 border border-white/10 backdrop-blur-md shadow-[0_0_45px_rgba(15,23,42,0.9)]">

          {/* HERO */}
          <div className="text-center space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold">
              On gère ta business
              <br />
              <span className="text-blue-300">pendant que tu fais ta job</span>
            </h1>
            <p className="text-lg text-slate-200 max-w-2xl mx-auto">
              Gestion d&apos;entreprise complète propulsée par IA pour les entrepreneurs. Des appels manqués
              aux factures payées — on s&apos;occupe de tout pour que tu focus sur le terrain.
            </p>
          </div>

          {/* PRICING TIERS */}
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <h2 className="text-3xl sm:text-4xl font-bold">Choisis ton plan</h2>
              <p className="text-slate-300 text-lg max-w-3xl mx-auto">
                Tous les plans incluent l&apos;installation, l&apos;intégration et le support continu. Choisis le niveau qui fit avec ta business.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {TIERS.map((tier) => {
                const isSelected = selectedTier === tier.id;
                const isPopular = tier.popular;
                return (
                  <div key={tier.id}
                    className={`rounded-2xl p-6 border-2 transition-all duration-200 relative ${
                      isPopular
                        ? isSelected
                          ? 'border-emerald-500/70 bg-gradient-to-br from-emerald-900/20 to-slate-900/80'
                          : 'border-emerald-500/50 bg-slate-900/60'
                        : isSelected
                          ? 'border-blue-500/70 bg-slate-900/80'
                          : 'border-slate-700/50 bg-slate-900/60'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        Le plus populaire
                      </div>
                    )}

                    <div className={`space-y-4 ${isPopular ? 'mt-2' : ''}`}>
                      <div>
                        <h3 className={`text-xl font-bold ${isPopular ? 'text-slate-50' : 'text-slate-200'}`}>
                          {tier.name[lang]}
                        </h3>
                        <p className={`text-sm mt-1 ${isPopular ? 'text-emerald-300' : 'text-slate-400'}`}>
                          {tier.tagline[lang]}
                        </p>
                      </div>

                      <div className="py-4">
                        <div className={`text-4xl font-bold ${isPopular ? 'text-emerald-300' : tier.id === 'elite' ? 'text-amber-300' : 'text-blue-300'}`}>
                          {tier.setup.toLocaleString()} $
                        </div>
                        <div className="text-sm text-slate-400">Installation unique</div>
                        <div className="text-sm text-slate-300 mt-2">+ {tier.monthly.toLocaleString()} $/mois</div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {tier.features[lang].map((f, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className={`mt-0.5 ${f.included ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {f.included ? '✓' : '—'}
                            </span>
                            <span className={f.included ? 'text-slate-100' : 'text-slate-500'}>{f.text}</span>
                          </div>
                        ))}
                      </div>

                      <div className="text-xs text-slate-400 pt-2">
                        <div>Support : {tier.support[lang]}</div>
                        <div>Intégration : {tier.onboarding[lang]}</div>
                      </div>

                      <button
                        onClick={() => setSelectedTier(tier.id)}
                        className={`w-full py-3 rounded-xl font-semibold transition-all ${
                          isPopular
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                            : isSelected
                              ? tier.id === 'elite' ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {isSelected ? '✓ Sélectionné' : isPopular ? 'Choisir meilleure valeur' : 'Choisir ce plan'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center pt-4">
              <Link href="/fr/contact"
                className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5">
                Réserve ton appel stratégique gratuit
              </Link>
              <p className="text-sm text-slate-400 mt-3">
                15 minutes. On te dit exactement quel plan fait du sens pour ta business.
              </p>
            </div>
          </div>

          {/* FEATURE COMPARISON TABLE */}
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-center">Comparaison des fonctionnalités</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Fonctionnalité</th>
                    <th className="text-center py-3 px-4 text-blue-300 font-semibold">Starter</th>
                    <th className="text-center py-3 px-4 text-emerald-300 font-semibold">Pro</th>
                    <th className="text-center py-3 px-4 text-amber-300 font-semibold">Elite</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4 text-slate-300 font-semibold">Installation</td>
                    <td className="py-3 px-4 text-center text-white font-bold">2 997 $</td>
                    <td className="py-3 px-4 text-center text-white font-bold">4 997 $</td>
                    <td className="py-3 px-4 text-center text-white font-bold">7 500 $</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4 text-slate-300 font-semibold">Mensuel</td>
                    <td className="py-3 px-4 text-center text-white font-bold">799 $/mo</td>
                    <td className="py-3 px-4 text-center text-white font-bold">1 997 $/mo</td>
                    <td className="py-3 px-4 text-center text-white font-bold">3 997 $/mo</td>
                  </tr>
                  {COMPARISON_FEATURES.map((feat, i) => (
                    <tr key={i} className="border-b border-slate-800/50">
                      <td className="py-3 px-4 text-slate-200">{feat[lang]}</td>
                      {['starter', 'pro', 'elite'].map((tid) => {
                        const val = feat[tid];
                        if (typeof val === 'boolean') {
                          return (
                            <td key={tid} className="py-3 px-4 text-center">
                              {val ? <span className="text-emerald-400">✓</span> : <span className="text-slate-600">—</span>}
                            </td>
                          );
                        }
                        const display = typeof val === 'object' ? val[lang] : val;
                        return <td key={tid} className="py-3 px-4 text-center text-slate-300 text-xs">{display}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ROI CALCULATOR */}
          <ROICalculator />

          {/* WHAT YOU'RE REPLACING */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-blue-500/25">
            <h2 className="text-2xl sm:text-3xl font-bold">Ce que tu remplaces</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-red-300 text-lg">Sans BlueWise</h3>
                <div className="space-y-2 text-slate-200 text-sm">
                  <div className="flex justify-between"><span>Réceptionniste/assistante</span><strong className="text-red-300">3 500 $/mois</strong></div>
                  <div className="flex justify-between"><span>Logiciel CRM (GoHighLevel, etc.)</span><strong className="text-red-300">297 $/mois</strong></div>
                  <div className="flex justify-between"><span>Agence marketing</span><strong className="text-red-300">2 000 $/mois</strong></div>
                  <div className="flex justify-between"><span>Comptabilité/admin</span><strong className="text-red-300">1 500 $/mois</strong></div>
                  <div className="h-px bg-slate-600 my-2"></div>
                  <div className="flex justify-between text-lg"><span className="text-red-300">Total</span><strong className="text-red-200 text-xl">7 297 $/mois</strong></div>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-emerald-300 text-lg">Avec BlueWise Pro</h3>
                <div className="space-y-2 text-slate-200 text-sm">
                  <div className="flex justify-between"><span>Réceptionniste IA 24/7</span><strong className="text-emerald-300">Inclus</strong></div>
                  <div className="flex justify-between"><span>CRM complet + tableau de bord</span><strong className="text-emerald-300">Inclus</strong></div>
                  <div className="flex justify-between"><span>Capture + qualification de leads</span><strong className="text-emerald-300">Inclus</strong></div>
                  <div className="flex justify-between"><span>Contrats + facturation</span><strong className="text-emerald-300">Inclus</strong></div>
                  <div className="h-px bg-slate-600 my-2"></div>
                  <div className="flex justify-between text-lg"><span className="text-emerald-300">Total</span><strong className="text-emerald-200 text-xl">1 997 $/mois</strong></div>
                </div>
              </div>
            </div>
            <div className="text-center pt-2">
              <p className="text-emerald-300 font-semibold text-lg">Sauve 5 300 $/mois — c&apos;est 63 600 $/année de retour dans tes poches.</p>
            </div>
          </div>

          {/* 90-DAY GUARANTEE */}
          <div className="text-center p-6 md:p-8 rounded-2xl bg-gradient-to-br from-emerald-900/30 to-slate-900/80 border-2 border-emerald-500/40">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Garantie rentabilité 90 jours</h2>
            <p className="text-slate-200 max-w-2xl mx-auto">
              Si ton système génère pas assez de leads pour couvrir son coût mensuel en 90 jours,
              on continue d&apos;optimiser gratuitement jusqu&apos;à ce que ça soit le cas. Pas de frais cachés, pas d&apos;excuses.
            </p>
          </div>

          {/* FAQ */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-blue-500/25">
            <h2 className="text-2xl sm:text-3xl font-bold">Questions fréquentes</h2>

            <div className="space-y-4">
              <details className="group">
                <summary className="cursor-pointer font-semibold text-blue-300 mb-2 list-none flex justify-between items-center">
                  C&apos;est quoi la différence avec GoHighLevel ?
                  <span className="text-slate-500 group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <p className="text-slate-300 text-sm pl-0 pb-4">
                  GoHighLevel c&apos;est un outil DIY — tu dois quand même le configurer, le maintenir et deviner ce qui marche.
                  BlueWise c&apos;est un service clé en main. On build, on roule et on optimise toute ton opération de leads.
                  Tu touches pas au logiciel. Tu réponds aux leads qualifiés.
                </p>
              </details>

              <details className="group">
                <summary className="cursor-pointer font-semibold text-blue-300 mb-2 list-none flex justify-between items-center">
                  Et si j&apos;ai déjà un CRM ?
                  <span className="text-slate-500 group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <p className="text-slate-300 text-sm pl-0 pb-4">
                  On peut s&apos;intégrer avec tes outils existants ou les remplacer complètement — ce qui te sauve le plus
                  de temps et d&apos;argent. La plupart des clients lâchent leur vieux CRM en 2 semaines parce que le nôtre
                  fait plus avec zéro travail manuel.
                </p>
              </details>

              <details className="group">
                <summary className="cursor-pointer font-semibold text-blue-300 mb-2 list-none flex justify-between items-center">
                  C&apos;est-tu une arnaque ? Les chiffres ont l&apos;air trop beaux.
                  <span className="text-slate-500 group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <p className="text-slate-300 text-sm pl-0 pb-4">
                  Le calculateur ROI utilise des estimés conservateurs (70 % de capture, pas 100 %). On a bâti ce système
                  pour Service Plus, une vraie business d&apos;entrepreneur qui a généré 71 000 $ de pipeline en 30 jours.
                  On a de vrais chiffres, de vrais clients et une garantie 90 jours. Book un call — on te montre le dashboard en live.
                </p>
              </details>

              <details className="group">
                <summary className="cursor-pointer font-semibold text-blue-300 mb-2 list-none flex justify-between items-center">
                  Et si ça marche pas pour ma business ?
                  <span className="text-slate-500 group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <p className="text-slate-300 text-sm pl-0 pb-4">
                  C&apos;est pour ça le call stratégique. Si ta business fit pas (pas assez d&apos;appels, valeur de jobs trop basse),
                  on te le dit d&apos;avance. On veut pas de clients mécontents — c&apos;est mauvais pour tout le monde.
                  En plus, t&apos;es couvert par la garantie 90 jours.
                </p>
              </details>

              <details className="group">
                <summary className="cursor-pointer font-semibold text-blue-300 mb-2 list-none flex justify-between items-center">
                  Ça prend combien de temps le setup ?
                  <span className="text-slate-500 group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <p className="text-slate-300 text-sm pl-0 pb-4">
                  Starter : 1 semaine. Pro : 1-2 semaines. Elite : 2 semaines avec accompagnement complet. Tu continues
                  ta business normalement — on gère tout en arrière-plan pis on go live quand c&apos;est prêt.
                </p>
              </details>

              <details className="group">
                <summary className="cursor-pointer font-semibold text-blue-300 mb-2 list-none flex justify-between items-center">
                  Je peux upgrader plus tard ?
                  <span className="text-slate-500 group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <p className="text-slate-300 text-sm pl-0 pb-4">
                  Oui. Tu payes la différence de frais d&apos;installation pis on ajoute les nouvelles features. La plupart des
                  clients Starter upgrade au Pro en 60 jours après avoir vu le ROI.
                </p>
              </details>
            </div>
          </div>

          {/* FINAL CTA */}
          <div className="text-center space-y-6 pt-8">
            <h2 className="text-3xl sm:text-4xl font-bold">Prêt à automatiser ta business ?</h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Réserve un appel stratégique de 15 minutes. On analyse ta business et on te dit exactement
              quel plan va marcher — ou si BlueWise est pas le bon fit.
            </p>

            <Link href="/fr/contact"
              className="inline-block px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xl rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5">
              Réserve ton appel stratégique
            </Link>

            <div className="pt-6 space-y-2">
              <p className="text-sm text-slate-400">On intègre 3 nouveaux clients par mois — capacité limitée.</p>
              <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                <span>&#10003; Aucune carte de crédit requise</span>
                <span>&#10003; Garantie 90 jours</span>
                <span>&#10003; Appel stratégique gratuit</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
