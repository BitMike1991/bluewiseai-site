import Image from "next/image";
import Link from "next/link";

export default function AboutFr() {
  return (
    <div className="min-h-screen bg-[url('/styles/backgroundpages.jpg')] bg-cover bg-center text-white">
      <div className="min-h-screen py-16 px-4 backdrop-brightness-110">
        <section className="max-w-5xl mx-auto space-y-12 px-6 sm:px-12 py-10 rounded-3xl bg-slate-950/80 border border-white/10 backdrop-blur-md shadow-[0_0_45px_rgba(15,23,42,0.9)]">

          {/* TITRE */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold">À propos de BlueWise AI</h1>
            <p className="text-lg text-slate-200 max-w-2xl mx-auto">
              On build des systèmes d&apos;entreprise propulsés par IA pour les entrepreneurs trop occupés sur le terrain pour gérer leurs opérations.
            </p>
          </div>

          {/* FONDATEUR + HISTOIRE */}
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="shrink-0">
              <div className="relative h-40 w-40 md:h-48 md:w-48 rounded-full overflow-hidden border border-blue-400/70 shadow-[0_0_40px_rgba(59,130,246,0.65)] bg-slate-900">
                <Image src="/mikael-profile.jpg" alt="Mikael, fondateur de BlueWise AI" fill className="object-cover" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Bâti par un gars de terrain, pour les gars de terrain</h2>
              <p className="text-slate-200 leading-relaxed">
                Moi c&apos;est Mikael. J&apos;ai parti BlueWise après avoir bâti le système d&apos;opérations
                complet pour un entrepreneur résidentiel au Québec — de zéro. Réceptionniste IA, CRM,
                soumissions automatiques, contrats, suivi de paiements, rapports financiers. Le résultat :
                71 000 $ de pipeline en 30 jours.
              </p>
              <p className="text-slate-200 leading-relaxed">
                J&apos;ai réalisé que chaque entrepreneur a le même problème : y sont incroyables dans
                leur métier, mais y perdent de l&apos;argent sur les opérations. Appels manqués, soumissions
                manuelles, factures papier, zéro suivi. BlueWise règle tout ça.
              </p>
            </div>
          </div>

          {/* MÉTHODOLOGIE */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-blue-500/25">
            <h2 className="text-2xl font-bold">Comment on travaille</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-blue-300 mb-2">Clé en main</h3>
                <p className="text-slate-300 text-sm">
                  On te donne pas un logiciel en te disant « arrange-toi. » On build, on configure pis
                  on gère ton système au complet. Toi tu focus sur le terrain.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-emerald-300 mb-2">Vrais résultats, vrais chiffres</h3>
                <p className="text-slate-300 text-sm">
                  On te montre le ROI avant que tu signes. Si le calcul marche pas pour ta business,
                  on te le dit d&apos;avance. Pas de bullshit.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-amber-300 mb-2">Optimisation continue</h3>
                <p className="text-slate-300 text-sm">
                  Ton système s&apos;améliore chaque mois. On monitor, on tweak pis on améliore basé
                  sur de la vraie data de leads — pas du guesswork.
                </p>
              </div>
            </div>
          </div>

          {/* RÉSULTATS */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-emerald-900/20 to-slate-900/80 border border-emerald-500/30">
            <h2 className="text-2xl font-bold">Résultats prouvés</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-emerald-300 mb-3">Service Plus — Build complet de la business</h3>
                <p className="text-slate-200 text-sm mb-4">
                  On a tout bâti pour un entrepreneur résidentiel : site web, réseaux sociaux, campagnes de pubs
                  pour amener les leads, plus le système d&apos;opérations au complet — CRM, réceptionniste IA,
                  soumissions automatiques, contrats, suivi de paiements et rapports financiers.
                </p>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>&#10003; 71 000 $ de pipeline généré en 30 jours</li>
                  <li>&#10003; Zéro leads manqués depuis le déploiement</li>
                  <li>&#10003; Flow soumission-à-contrat 100 % automatisé</li>
                  <li>&#10003; Dashboard financier en temps réel</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-300 mb-3">Ramoneur Multi-Services — Lead Rescue</h3>
                <p className="text-slate-200 text-sm mb-4">
                  On a déployé le moteur SMS IA et l&apos;agent vocal pour une business de ramonage.
                  Passé de manquer 60 % des appels à capter chaque lead automatiquement.
                </p>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>&#10003; 60 % manqués → 0 % manqués</li>
                  <li>&#10003; L&apos;IA gère la qualification 24/7</li>
                  <li>&#10003; Premier rappel en 24h après le déploiement</li>
                  <li>&#10003; Zéro suivi manuel requis</li>
                </ul>
              </div>
            </div>
          </div>

          {/* CE QU'ON CROIT */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Ce qu&apos;on croit</h2>
            <blockquote className="border-l-4 border-blue-400 pl-4 italic text-slate-200">
              « Les entrepreneurs sont le backbone de l&apos;économie. Y devraient pas avoir à choisir
              entre faire de la bonne job pis runner une bonne business. L&apos;IA rend les deux possibles. »
            </blockquote>
            <p className="text-slate-300 text-sm">
              On est pas une grosse agence. On est une équipe focus qui build des vrais systèmes pour
              de vraies businesses. On se spécialise en services résidentiels parce qu&apos;on comprend
              l&apos;industrie, pis parce que c&apos;est là que l&apos;IA crée le plus de valeur.
            </p>
          </div>

          {/* CTA */}
          <div className="pt-4 text-center space-y-4">
            <h3 className="text-2xl font-bold">Prêt à voir ce que BlueWise peut faire pour toi ?</h3>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Call de 15 minutes. On regarde tes opérations pis on te dit exactement où l&apos;automatisation fit.
            </p>
            <Link href="/fr/contact"
              className="inline-block bg-blue-600 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all hover:-translate-y-0.5">
              Réserve ton appel stratégique
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
