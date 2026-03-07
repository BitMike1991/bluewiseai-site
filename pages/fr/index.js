import HeroV2 from "../../src/components/HeroV2";
import Link from "next/link";
import { PRICING } from "@/data/pricing";

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
      <h1 className="sr-only">BlueWise AI - Optimisation d&apos;entreprise propulsée par IA pour entrepreneurs</h1>

      {/* HERO */}
      <HeroV2 />

      {/* COMMENT ÇA MARCHE — 3 Étapes */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-white">
        <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-center">Comment ça marche</h2>
        <p className="text-slate-300 text-center mb-12 max-w-2xl mx-auto">
          On gère le setup, tu continues ta business. Trois étapes vers des opérations automatisées.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-2xl font-bold text-blue-300 mx-auto mb-4">1</div>
            <h3 className="text-xl font-semibold mb-2">Appel audit gratuit</h3>
            <p className="text-slate-300 text-sm">15 minutes. On analyse tes opérations actuelles et on te montre exactement où tu perds de l&apos;argent.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl font-bold text-emerald-300 mx-auto mb-4">2</div>
            <h3 className="text-xl font-semibold mb-2">On build ton système</h3>
            <p className="text-slate-300 text-sm">En 1-2 semaines, on installe ta réceptionniste IA, ton CRM, tes automatisations et ton dashboard.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl font-bold text-amber-300 mx-auto mb-4">3</div>
            <h3 className="text-xl font-semibold mb-2">On roule et optimise</h3>
            <p className="text-slate-300 text-sm">Ton système roule 24/7. On monitor, optimise et améliore chaque mois. Toi tu focus sur le terrain.</p>
          </div>
        </div>
      </section>

      {/* ROI MATH */}
      <section className="max-w-6xl mx-auto px-6 pb-20 text-white">
        <div className="rounded-3xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-slate-900/80 p-8 md:p-12 backdrop-blur">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
              Chaque appel manqué c&apos;est 300 $ qui part
            </h2>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-semibold text-amber-300 mb-4">Le calcul (conservateur)</h3>
                <div className="space-y-3 text-slate-200">
                  <div className="flex justify-between"><span>Appels manqués par semaine :</span><strong className="text-white">15</strong></div>
                  <div className="flex justify-between"><span>Valeur moyenne du contrat :</span><strong className="text-white">350 $</strong></div>
                  <div className="flex justify-between"><span>Taux de conversion :</span><strong className="text-white">50 %</strong></div>
                  <div className="h-px bg-slate-600 my-3"></div>
                  <div className="flex justify-between text-lg">
                    <span className="text-amber-300">Revenus perdus par année :</span>
                    <strong className="text-amber-200 text-2xl">136 500 $</strong>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-emerald-300 mb-4">Avec BlueWise Pro</h3>
                <div className="space-y-3 text-slate-200">
                  <div className="flex justify-between"><span>Frais d&apos;installation :</span><strong className="text-white">{PRICING.pro.setup.toLocaleString()} $</strong></div>
                  <div className="flex justify-between"><span>Mensuel :</span><strong className="text-white">{PRICING.pro.monthly.toLocaleString()} $/mois</strong></div>
                  <div className="flex justify-between"><span>Total première année :</span><strong className="text-white">{(PRICING.pro.setup + PRICING.pro.monthly * 12).toLocaleString()} $</strong></div>
                  <div className="h-px bg-slate-600 my-3"></div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-lg">
                      <span className="text-emerald-300">Revenus récupérés (70 %) :</span>
                      <strong className="text-emerald-200">95 550 $</strong>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Rentabilisé en ~90 jours. Le reste c&apos;est du profit.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link href="/fr/lead-rescue"
                className="inline-block rounded-xl px-10 py-4 text-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300">
                Calcule ton ROI
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ÉTUDE DE CAS */}
      <section className="max-w-6xl mx-auto px-6 pb-20 text-white">
        <div className="rounded-3xl border border-blue-500/30 bg-slate-900/80 p-8 md:p-12 backdrop-blur">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-block bg-emerald-600/20 border border-emerald-500/40 rounded-full px-4 py-1.5 mb-4">
                <span className="text-emerald-300 text-xs uppercase tracking-widest font-semibold">Étude de cas</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">Service Plus : 71 000 $ de pipeline en 30 jours</h2>
              <p className="text-slate-200 mb-6">
                Un entrepreneur résidentiel au Québec manquait 40 % de ses appels entrants et gérait tout
                avec papier et crayon. On a bâti toute son opération — CRM, réceptionniste IA, soumissions
                automatiques, contrats et suivi des paiements.
              </p>
              <Link href="/fr/portfolio"
                className="text-blue-300 hover:text-blue-200 font-semibold transition-colors">
                Lire l&apos;étude de cas complète &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/60 rounded-xl p-4 border border-emerald-500/30 text-center">
                <div className="text-3xl font-bold text-emerald-300">71 000 $</div>
                <div className="text-xs text-slate-400 mt-1">Pipeline en 30 jours</div>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-4 border border-blue-500/30 text-center">
                <div className="text-3xl font-bold text-blue-300">0</div>
                <div className="text-xs text-slate-400 mt-1">Leads manqués</div>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-4 border border-purple-500/30 text-center">
                <div className="text-3xl font-bold text-purple-300">24/7</div>
                <div className="text-xs text-slate-400 mt-1">Réceptionniste IA</div>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-4 border border-amber-500/30 text-center">
                <div className="text-3xl font-bold text-amber-300">100 %</div>
                <div className="text-xs text-slate-400 mt-1">Soumissions automatisées</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CE QU'ON FAIT — Features Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20 text-white">
        <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-center">Tout ce qu&apos;il te faut pour gérer ta business</h2>
        <p className="text-slate-300 text-center mb-10 max-w-2xl mx-auto">
          Du premier appel manqué au dernier paiement — on automatise tout le parcours client.
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'Réceptionniste IA', desc: 'Répond aux appels 24/7, qualifie les leads, book les jobs. Sonne humain.', color: 'blue' },
            { title: 'Moteur SMS intelligent', desc: 'Texto instantané sur appels manqués. Collecte détails et photos automatiquement.', color: 'emerald' },
            { title: 'Tableau de bord CRM', desc: 'Vois chaque lead, job et paiement au même endroit. Temps réel, mobile.', color: 'purple' },
            { title: 'Soumissions automatisées', desc: 'L\'IA génère des soumissions depuis Slack. Le client accepte en un clic.', color: 'amber' },
            { title: 'Pipeline de contrats', desc: 'Contrats numériques, e-signatures, demandes de dépôt automatiques.', color: 'blue' },
            { title: 'Suivi financier', desc: 'Enregistrement paiements, suivi dépenses, reçus auto, exports comptables.', color: 'emerald' },
          ].map((f) => (
            <div key={f.title} className={`rounded-2xl border border-${f.color}-500/40 bg-gradient-to-br from-${f.color}-900/20 to-slate-900/80 p-6 backdrop-blur`}>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-slate-300 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ — Objections d'entrepreneurs */}
      <section className="max-w-4xl mx-auto px-6 pb-20 text-white">
        <h2 className="text-3xl font-bold mb-8 text-center">Questions fréquentes</h2>
        <div className="space-y-4">
          {[
            { q: "Je suis pas tech. Faut-tu que je gère un logiciel ?", a: "Non. On setup et on gère tout. Tu utilises le dashboard pour voir tes leads et tes jobs — c'est tout. Si tu sais utiliser un cellulaire, tu sais utiliser BlueWise." },
            { q: "C'est quoi la différence avec une assistante virtuelle ?", a: "Une AV coûte 2-4K$/mois, travaille des heures limitées, fait des erreurs et appelle malade. Notre IA travaille 24/7, oublie jamais un suivi et coûte moins cher. En plus t'as le CRM complet et la plateforme d'automatisation." },
            { q: "Et si je reçois juste 10-15 appels par semaine ?", a: "C'est exactement notre sweet spot. Si tu manques même 5 appels/semaine à 350$/job, ça fait 45K$/année qui part. Le plan Starter à 799$/mois se rentabilise vite." },
            { q: "Vous travaillez avec mon industrie ?", a: "On se spécialise en services résidentiels : CVC, plomberie, toiture, électricité, aménagement paysager, ménage, ramonage. Si tu fais du service résidentiel ou commercial, on est bâti pour toi." },
          ].map((item) => (
            <details key={item.q} className="group rounded-xl bg-slate-900/80 border border-slate-700/50 p-5">
              <summary className="cursor-pointer font-semibold text-slate-100 list-none flex justify-between items-center">
                {item.q}
                <span className="text-slate-500 group-open:rotate-180 transition-transform text-sm">&#9660;</span>
              </summary>
              <p className="text-slate-300 text-sm mt-3">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="rounded-3xl border-2 border-blue-500/50 bg-gradient-to-br from-blue-900/40 to-slate-900/90 p-8 md:p-12 text-center backdrop-blur-xl shadow-[0_0_60px_rgba(59,130,246,0.3)]">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
            Arrête de perdre de l&apos;argent. Commence à automatiser.
          </h2>
          <p className="text-slate-200 text-lg mb-8 max-w-2xl mx-auto">
            Appel stratégique de 15 minutes. On te montre exactement combien de revenus tu laisses
            sur la table — et comment BlueWise règle ça.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Link href="/fr/lead-rescue"
              className="rounded-xl px-10 py-4 text-lg font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all duration-300 hover:scale-105">
              Voir les plans et prix
            </Link>
            <Link href="/fr/contact"
              className="rounded-xl px-10 py-4 text-lg font-semibold border-2 border-slate-600 hover:border-blue-500 text-slate-200 hover:text-white transition-all duration-300">
              Réserver un appel
            </Link>
          </div>

          <p className="text-slate-400 text-sm">
            {"\u00C0"} partir de {PRICING.starter.monthly} $/mois &bull; Garantie rentabilité 90 jours &bull; 3 clients/mois
          </p>
        </div>
      </section>
    </div>
  );
}
