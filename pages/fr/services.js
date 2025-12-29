import ConsultCTA from "@/components/ConsultCTA";
import Link from "next/link";

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
          {/* HERO SECTION */}
          <div className="text-center space-y-4">
            <div className="inline-block bg-blue-600/20 border border-blue-500/40 rounded-full px-4 py-1.5 mb-4">
              <span className="text-blue-300 text-xs uppercase tracking-widest font-semibold">
                Plateforme SaaS en production
              </span>
            </div>
            <h1 className="text-4xl font-heading drop-shadow-md">
              Plateforme Lead Rescue
            </h1>
            <p className="text-lg text-slate-100 drop-shadow-sm max-w-3xl mx-auto">
              Arrêtez de perdre 72 000 $ à 187 000 $ par année en appels manqués. Notre
              plateforme SaaS complète capture chaque prospect via agents IA vocaux et SMS,
              les qualifie 24/7 et livre tout sur un tableau de bord en temps réel.
            </p>

            {/* Production Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8">
              <div className="bg-slate-950/60 rounded-xl p-4 border border-blue-500/30">
                <div className="text-2xl font-bold text-blue-300">10 118</div>
                <div className="text-xs text-slate-400">Opérations/semaine</div>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-4 border border-emerald-500/30">
                <div className="text-2xl font-bold text-emerald-300">97,6%</div>
                <div className="text-xs text-slate-400">Disponibilité</div>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-4 border border-purple-500/30">
                <div className="text-2xl font-bold text-purple-300">24/7</div>
                <div className="text-xs text-slate-400">Disponibilité</div>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-4 border border-amber-500/30">
                <div className="text-2xl font-bold text-amber-300">&lt;2 min</div>
                <div className="text-xs text-slate-400">Temps de réponse</div>
              </div>
            </div>
          </div>

          {/* PRIMARY OFFERING - LEAD RESCUE PLATFORM */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-blue-900/40 to-slate-900/80 border-2 border-blue-500/50 shadow-[0_0_40px_rgba(37,99,235,0.4)]">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-heading flex items-center gap-2 drop-shadow-sm">
                <span>🚀</span>
                <span>Plateforme Lead Rescue</span>
              </h2>
              <div className="bg-blue-500/20 border border-blue-400/40 rounded-full px-4 py-1">
                <span className="text-blue-300 text-sm font-semibold">Offre principale</span>
              </div>
            </div>

            <p className="text-lg leading-relaxed text-slate-100 drop-shadow-sm">
              Une plateforme SaaS multi-tenant complète qui capture les appels manqués, qualifie
              les prospects via agents IA vocaux et SMS, gère votre inbox et livre tout sur un
              tableau de bord en temps réel. Conçue spécifiquement pour les services à domicile,
              les métiers et les entreprises locales qui ne peuvent pas se permettre de manquer
              des opportunités.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              {/* SMS Only Tier */}
              <div className="rounded-2xl p-5 bg-slate-950/70 border border-slate-700/70">
                <h3 className="font-heading text-xl mb-2">SMS seulement</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-blue-300">497 $</span>
                  <span className="text-slate-400 text-sm"> installation</span>
                  <div className="text-sm text-slate-300">+ 249 $/mois support</div>
                </div>
                <ul className="text-sm space-y-2 text-slate-200">
                  <li>✓ SMS instantané sur appels manqués</li>
                  <li>✓ Qualification par texto</li>
                  <li>✓ Collection de photos</li>
                  <li>✓ Tableau de bord basique</li>
                  <li className="text-slate-500">✗ Pas d'IA vocale</li>
                  <li className="text-slate-500">✗ Pas de gestion inbox</li>
                </ul>
              </div>

              {/* Full System Tier - FEATURED */}
              <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-900/30 to-slate-900/80 border-2 border-emerald-500/60 relative shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  ⭐ Plus populaire
                </div>
                <h3 className="font-heading text-xl mb-2 mt-2">Système complet</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-emerald-300">2 997 $</span>
                  <span className="text-slate-400 text-sm"> installation</span>
                  <div className="text-sm text-emerald-300">+ 799 $/mois support</div>
                  <div className="text-xs text-emerald-400 mt-1">Économisez 3 000 $ vs compétiteurs</div>
                </div>
                <ul className="text-sm space-y-2 text-slate-200">
                  <li>✓ Tout du palier SMS</li>
                  <li>✓ <strong>Agent vocal IA (VAPI)</strong></li>
                  <li>✓ <strong>Moteur inbox intelligent</strong></li>
                  <li>✓ <strong>Intégration courriel</strong></li>
                  <li>✓ Tableau de bord multi-canal</li>
                  <li>✓ Rentabilisé en 45-60 jours</li>
                </ul>
              </div>

              {/* Enterprise Tier */}
              <div className="rounded-2xl p-5 bg-slate-950/70 border border-amber-500/70">
                <h3 className="font-heading text-xl mb-2">Entreprise</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-amber-300">4 997 $</span>
                  <span className="text-slate-400 text-sm"> installation</span>
                  <div className="text-sm text-slate-300">+ 1 200 $/mois support</div>
                </div>
                <ul className="text-sm space-y-2 text-slate-200">
                  <li>✓ Tout du palier complet</li>
                  <li>✓ Support multi-succursales</li>
                  <li>✓ Intégrations CRM avancées</li>
                  <li>✓ Workflows personnalisés</li>
                  <li>✓ Gestionnaire dédié</li>
                  <li>✓ Options marque blanche</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
              <p className="text-slate-200">
                <strong className="text-blue-300">ROI réel :</strong> Entreprises manquant
                20 appels/semaine à 300 $ de valeur moyenne perdent 187 200 $/an. Lead Rescue
                coûte 12 585 $ la première année. Profit net : <strong className="text-emerald-300">99 735 $</strong>.
              </p>
            </div>

            <div className="text-center">
              <Link
                href="/fr/lead-rescue"
                className="inline-block rounded-xl px-10 py-4 text-lg font-bold
                           bg-blue-600 hover:bg-blue-500 text-white
                           shadow-[0_0_30px_rgba(59,130,246,0.5)]
                           transition-all duration-300 hover:scale-105"
              >
                Voir détails complets et calculateur ROI →
              </Link>
            </div>
          </div>

          {/* CUSTOM ENTERPRISE SOLUTIONS */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-purple-500/25 shadow-[0_0_30px_rgba(15,23,42,0.9)]">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-heading flex items-center gap-2 drop-shadow-sm">
                <span>🏢</span>
                <span>Solutions entreprise personnalisées</span>
              </h2>
              <div className="bg-purple-500/20 border border-purple-400/40 rounded-full px-4 py-1">
                <span className="text-purple-300 text-sm font-semibold">Au-delà de la plateforme</span>
              </div>
            </div>

            <p className="text-lg leading-relaxed text-slate-100 drop-shadow-sm">
              Pour les grandes organisations, franchises ou agences qui ont besoin de la
              plateforme Lead Rescue avec intégrations personnalisées, image de marque blanche
              ou workflows spécialisés au-delà de notre offre standard.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Multi-Location Deployments */}
              <div className="bg-slate-950/60 border border-purple-500/30 rounded-xl p-5">
                <h3 className="text-xl font-semibold mb-3 text-purple-300">
                  Déploiements multi-succursales
                </h3>
                <p className="text-slate-200 text-sm mb-4">
                  Déployez Lead Rescue sur 5 à 50+ emplacements avec gestion centralisée,
                  routage par emplacement et rapports consolidés.
                </p>
                <ul className="text-sm space-y-2 text-slate-300">
                  <li>• Opérations de franchise</li>
                  <li>• Entreprises de service multi-provinces</li>
                  <li>• Réseaux de bureaux régionaux</li>
                  <li>• Modèles de maître-franchise</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-slate-400 text-sm">
                    <strong className="text-purple-300">Investissement :</strong> À partir de 25 000 $ + 2 500 $/succursale/mois
                  </p>
                </div>
              </div>

              {/* White-Label & Agency Licensing */}
              <div className="bg-slate-950/60 border border-purple-500/30 rounded-xl p-5">
                <h3 className="text-xl font-semibold mb-3 text-purple-300">
                  Marque blanche et licence agence
                </h3>
                <p className="text-slate-200 text-sm mb-4">
                  Renommez la plateforme Lead Rescue sous le nom de votre agence et revendez
                  à vos clients avec votre propre structure de prix et modèle de support.
                </p>
                <ul className="text-sm space-y-2 text-slate-300">
                  <li>• Agences marketing</li>
                  <li>• MSP et consultants TI</li>
                  <li>• Coachs d'affaires</li>
                  <li>• Revendeurs spécialisés</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-slate-400 text-sm">
                    <strong className="text-purple-300">Investissement :</strong> 50 000 $ licence + modèle partage revenus
                  </p>
                </div>
              </div>

              {/* Custom Integration Projects */}
              <div className="bg-slate-950/60 border border-purple-500/30 rounded-xl p-5">
                <h3 className="text-xl font-semibold mb-3 text-purple-300">
                  Projets d'intégration personnalisés
                </h3>
                <p className="text-slate-200 text-sm mb-4">
                  Étendez Lead Rescue avec intégrations personnalisées à votre CRM, ERP,
                  systèmes de planification ou logiciels spécifiques à l'industrie existants.
                </p>
                <ul className="text-sm space-y-2 text-slate-300">
                  <li>• ServiceTitan, Housecall Pro, Jobber</li>
                  <li>• Salesforce, HubSpot, CRMs personnalisés</li>
                  <li>• QuickBooks, SAP, NetSuite</li>
                  <li>• Plateformes spécifiques à l'industrie</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-slate-400 text-sm">
                    <strong className="text-purple-300">Investissement :</strong> 10 000 $-35 000 $ selon la complexité
                  </p>
                </div>
              </div>

              {/* Strategic Consulting */}
              <div className="bg-slate-950/60 border border-purple-500/30 rounded-xl p-5">
                <h3 className="text-xl font-semibold mb-3 text-purple-300">
                  Consultation stratégique
                </h3>
                <p className="text-slate-200 text-sm mb-4">
                  Mandat de 6-12 semaines pour auditer vos systèmes de capture de prospects,
                  concevoir une stratégie d'automatisation complète et planifier votre feuille
                  de route d'implémentation Lead Rescue.
                </p>
                <ul className="text-sm space-y-2 text-slate-300">
                  <li>• Audit processus et analyse d'écarts</li>
                  <li>• Modélisation ROI et analyse de rentabilité</li>
                  <li>• Feuille de route d'implémentation</li>
                  <li>• Planification gestion du changement</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-slate-400 text-sm">
                    <strong className="text-purple-300">Investissement :</strong> 5 000 $-15 000 $ (crédité vers l'implémentation)
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5">
              <p className="text-slate-200 text-sm">
                <strong className="text-purple-300">Note :</strong> Les solutions entreprise
                personnalisées nécessitent un engagement minimum de 12 mois et débutent avec
                une phase de cadrage de 2 semaines (2 500 $, crédité vers le projet). Tous les
                prix sont en USD et excluent les licences logicielles tierces (CRM, téléphonie, etc.).
              </p>
            </div>
          </div>

          {/* WHO THIS IS FOR */}
          <div className="space-y-6 p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-blue-500/25">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>🎯</span>
              <span>Pour qui Lead Rescue est conçu</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Perfect For */}
              <div>
                <h3 className="font-semibold text-emerald-300 mb-3 text-lg">✓ Parfait pour :</h3>
                <ul className="space-y-3 text-slate-200 text-sm">
                  <li>
                    <strong className="text-white">Services à domicile et métiers :</strong> CVC,
                    plomberie, électricité, toiture, aménagement paysager, nettoyage, ramonage
                  </li>
                  <li>
                    <strong className="text-white">Entreprises de services :</strong> Entrepreneurs,
                    bricoleurs, entretien de propriétés, contrôle parasitaire, réparation auto
                  </li>
                  <li>
                    <strong className="text-white">1 à 20 employés</strong> trop occupés pour
                    répondre à tous les appels
                  </li>
                  <li>
                    Entreprises où la <strong className="text-white">valeur moyenne du contrat
                    est de 300 $+</strong> et les appels manqués = revenus perdus
                  </li>
                  <li>
                    <strong className="text-white">Entreprises avec réceptionnistes/assistantes :</strong> Arrêtez
                    de les payer 60 000 $/an pour répondre "Desservez-vous mon secteur ?" 50 fois par jour.
                    Lead Rescue pré-qualifie les appels pour que votre équipe ne parle qu'aux prospects chauds.
                    Vous avez 4 assistantes ? Gardez-en 2 pour le travail sérieux et économisez 120 000 $/an.
                  </li>
                </ul>
              </div>

              {/* Not For */}
              <div>
                <h3 className="font-semibold text-red-300 mb-3 text-lg">✗ Pas pour :</h3>
                <ul className="space-y-3 text-slate-200 text-sm">
                  <li>
                    Entreprises où la plupart des appels sont des <strong className="text-white">consultations
                    complexes nécessitant une expertise humaine immédiate</strong> (médical, juridique, conseil financier)
                  </li>
                  <li>
                    Entreprises où la <strong className="text-white">valeur moyenne du contrat est sous 150 $</strong>
                    (le ROI ne justifiera pas l'investissement)
                  </li>
                  <li>
                    Ceux qui cherchent une <strong className="text-white">solution DIY bon marché ou un essai gratuit</strong> —
                    c'est une plateforme premium
                  </li>
                  <li>
                    Entreprises <strong className="text-white">pas prêtes à s'engager</strong> à améliorer
                    leurs systèmes de capture de prospects
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* RESULTS TO EXPECT */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>📈</span>
              <span>Résultats que nos clients voient</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-slate-950/60 border border-emerald-500/30 rounded-xl p-5">
                <div className="text-3xl font-bold text-emerald-300 mb-2">60-80%</div>
                <p className="text-slate-200 text-sm">
                  des appels précédemment manqués maintenant capturés et qualifiés
                </p>
              </div>
              <div className="bg-slate-950/60 border border-blue-500/30 rounded-xl p-5">
                <div className="text-3xl font-bold text-blue-300 mb-2">45-60 jours</div>
                <p className="text-slate-200 text-sm">
                  délai moyen de rentabilité pour les clients du palier complet
                </p>
              </div>
              <div className="bg-slate-950/60 border border-purple-500/30 rounded-xl p-5">
                <div className="text-3xl font-bold text-purple-300 mb-2">99 000 $+</div>
                <p className="text-slate-200 text-sm">
                  profit net moyen année 1 pour entreprises manquant 20 appels/semaine
                </p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>❓</span>
              <span>Questions fréquentes</span>
            </h2>
            <div className="space-y-4 text-slate-100 drop-shadow-sm">
              <div className="bg-slate-950/40 border border-slate-700/50 rounded-xl p-5">
                <p className="font-semibold text-lg mb-2">
                  Quelle est la différence entre Lead Rescue et l'embauche d'une réceptionniste ?
                </p>
                <p className="text-slate-300 text-sm">
                  Une réceptionniste coûte 35 000 $-60 000 $/an, travaille 40 heures/semaine et manque
                  quand même les appels hors heures. Lead Rescue coûte 12 585 $ la première année,
                  fonctionne 24/7/365, ne tombe jamais malade et qualifie les prospects parfaitement
                  à chaque fois. De plus, si vous avez déjà une réceptionniste, Lead Rescue la fait
                  passer de répondre aux questions stupides à conclure des ventes avec prospects chauds.
                </p>
              </div>
              <div className="bg-slate-950/40 border border-slate-700/50 rounded-xl p-5">
                <p className="font-semibold text-lg mb-2">
                  L'agent vocal IA sonne-t-il robotique ?
                </p>
                <p className="text-slate-300 text-sm">
                  Non. Nous utilisons les derniers modèles de voix naturelles VAPI qui sonnent humains.
                  La plupart des appelants ne réalisent pas qu'ils parlent à une IA. L'agent pose des
                  questions de qualification, collecte des détails et planifie des rappels exactement
                  comme le ferait une réceptionniste formée.
                </p>
              </div>
              <div className="bg-slate-950/40 border border-slate-700/50 rounded-xl p-5">
                <p className="font-semibold text-lg mb-2">
                  Combien de temps prend l'installation ?
                </p>
                <p className="text-slate-300 text-sm">
                  L'installation standard de Lead Rescue prend 2-3 semaines du démarrage à la mise en
                  service. Nous gérons tout : configuration du numéro de téléphone (ou portage de votre
                  numéro existant), formation de l'agent vocal, flux de qualification SMS, configuration
                  du tableau de bord et formation de l'équipe. Les solutions entreprise personnalisées
                  prennent 4-8 semaines selon la complexité.
                </p>
              </div>
              <div className="bg-slate-950/40 border border-slate-700/50 rounded-xl p-5">
                <p className="font-semibold text-lg mb-2">
                  Et si ça ne fonctionne pas pour mon entreprise ?
                </p>
                <p className="text-slate-300 text-sm">
                  Si vous manquez 15+ appels/semaine et que votre contrat moyen est de 300 $+, ça
                  fonctionnera. Nous avons des clients en CVC, plomberie, toiture, électricité et
                  aménagement paysager voyant des taux de capture de 60-80%. Cela dit, si votre
                  volume d'appels est trop faible ou les valeurs de contrats sous 200 $, nous vous
                  le dirons d'avance que ce n'est pas un bon fit.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-4 text-center space-y-6">
            <div className="bg-gradient-to-br from-blue-900/40 to-slate-900/80 border-2 border-blue-500/50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-3">Prêt à arrêter de perdre des prospects ?</h3>
              <p className="text-slate-200 mb-6 max-w-2xl mx-auto">
                Réservez un appel stratégique de 15 minutes pour voir si Lead Rescue convient à
                votre entreprise. Nous réviserons votre volume d'appels, calculerons votre ROI
                potentiel et vous montrerons exactement comment le système fonctionne.
              </p>
              <ConsultCTA>Réserver appel stratégique gratuit</ConsultCTA>
              <p className="text-slate-400 text-sm mt-4">
                Aucune pression, aucun argumentaire de vente. Juste une évaluation honnête
                pour voir si nous pouvons vous aider.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
