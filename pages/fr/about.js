import Image from "next/image";
import ConsultCTA from "@/components/ConsultCTA";

export default function About() {
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
          {/* TITRE + SOUS-TITRE */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-heading drop-shadow-md">À propos de Blue Wise&nbsp;AI</h1>
            <p className="text-lg text-slate-100 drop-shadow-sm">
              Je crée des systèmes d’automatisation IA pour les petites entreprises et les créateurs qui en ont assez de se noyer dans l’administratif.
              Ma mission est de vous libérer du temps — <span className="text-blue-300">5&nbsp;à&nbsp;10&nbsp;heures chaque semaine</span> —
              pour que vous puissiez vous concentrer sur ce qui fait vraiment croître votre entreprise.
            </p>
          </div>

          {/* HERO ROW: PHOTO + INTRO */}
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Photo */}
            <div className="shrink-0">
              <div
                className="
                  relative h-40 w-40 md:h-48 md:w-48 rounded-full overflow-hidden
                  border border-blue-400/70
                  shadow-[0_0_40px_rgba(59,130,246,0.65)]
                  bg-slate-900
                "
              >
                <Image
                  src="/mikael-profile.jpg" // <-- mettez votre photo dans /public sous ce nom ou changez le chemin
                  alt="Mikael, fondateur de BlueWise AI"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Intro copy */}
            <div className="space-y-4">
              <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
                <span>👋</span>
                <span>Qui se cache derrière Blue Wise&nbsp;AI&nbsp;?</span>
              </h2>
              <p className="leading-relaxed text-slate-100 drop-shadow-sm">
                Salut, je m’appelle Mikael — le constructeur derrière Blue Wise AI.
              </p>
              <p className="leading-relaxed text-slate-100 drop-shadow-sm">
                J’ai lancé ce projet pour aider des personnes comme moi — motivées, créatives,
                mais sans une grande équipe technique — à utiliser l’IA pour construire des outils intelligents
                qui font réellement gagner du temps et stimulent la croissance.
              </p>
              <p className="leading-relaxed text-slate-100 drop-shadow-sm">
                Vous n’avez pas besoin d’être développeur ni fondateur soutenu par du capital‑risque pour profiter de l’IA.
                Il vous faut juste le bon guide, un peu de créativité et un vrai problème à résoudre.
              </p>
            </div>
          </div>

          {/* AVEC QUI JE TRAVAILLE LE MIEUX */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>🎯</span>
              <span>Avec qui je travaille le mieux</span>
            </h2>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Je travaille le mieux avec des propriétaires de petites entreprises, des fondateurs solitaires et des créateurs
              qui offrent déjà de la valeur mais se sentent coincés sous trop de tâches manuelles&nbsp;:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>Vous êtes noyé sous les courriels, les relances et l’administration.</li>
              <li>Vous savez que l’IA pourrait aider, mais vous ne savez pas par où commencer.</li>
              <li>Vous préférez des systèmes simples et pratiques à de gros logiciels compliqués.</li>
            </ul>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Si vous vous reconnaissez là‑dedans, nous sommes probablement faits pour travailler ensemble.
            </p>
          </div>

          {/* CE QUE JE FAIS */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>🧠</span>
              <span>Ce que je fais</span>
            </h2>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Je conçois et construis de petites automatisations à fort impact&nbsp;:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>Tri des courriels, résumés et réponses intelligentes.</li>
              <li>Capture de leads et flux de qualification.</li>
              <li>SMS après appel manqué et séquences de suivi.</li>
              <li>Outils GPT sur mesure pour vos workflows spécifiques.</li>
            </ul>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              J’ai déjà lancé des applications alimentées par l’IA et des outils internes et j’affine mes compétences chaque jour.
              Pas de blabla ni de complexité inutile&nbsp;— juste des outils qui fonctionnent.
            </p>
          </div>

          {/* COMMENT JE TRAVAILLE */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>⚙️</span>
              <span>Comment je travaille</span>
            </h2>
            <blockquote className="border-l-4 border-blue-400 pl-4 italic text-slate-100 drop-shadow-sm">
              Clarté d’abord. Rapidité ensuite. Valeur toujours.
            </blockquote>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Nous commençons par un court appel pour comprendre votre entreprise, vos goulots d’étranglement
              et où l’automatisation peut créer des gains rapides. Ensuite je propose un plan simple avec une ou deux
              automatisations à fort levier que nous pouvons construire dans les 1 à 2 semaines qui suivent.
            </p>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Je garde les choses légères&nbsp;: communication directe, itération rapide et un focus sur des résultats que vous ressentez
              dans votre agenda et votre charge de travail.
            </p>
          </div>

          {/* POURQUOI C’EST IMPORTANT */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>🌱</span>
              <span>Pourquoi c’est important</span>
            </h2>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Blue Wise AI n’est pas seulement une entreprise — c’est ma façon de vivre.
              Je crois au travail intelligent plutôt que difficile&nbsp;: utiliser la technologie pour créer de la liberté et de la concentration pour nous-mêmes et nos clients.
            </p>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Les outils doivent servir les gens, pas l’inverse. Chaque automatisation que je construis vise à simplifier votre vie et à amplifier votre impact.
            </p>
          </div>

          {/* CTA */}
          <div className="pt-8 text-center space-y-3">
            <p className="text-slate-100 drop-shadow-sm">
              Pas sûr de savoir par où commencer&nbsp;? Cartographions ensemble votre première automatisation.
            </p>
            <ConsultCTA>Réserver une consultation gratuite</ConsultCTA>
          </div>
        </section>
      </div>
    </div>
  );
}