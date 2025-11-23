import Image from "next/image";
import ConsultCTA from "@/components/ConsultCTA";

export default function APropos() {
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
          {/* TITRE + ONE-LINER */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-heading drop-shadow-md">À propos</h1>
            <p className="text-lg text-slate-100 drop-shadow-sm">
              J&apos;aide les propriétaires de petites entreprises et les créateurs
              à automatiser les tâches répétitives pour récupérer
              <span className="text-blue-300"> 5–10 heures par semaine</span>
              et se concentrer sur ce qui fait vraiment avancer leur activité.
            </p>
          </div>

          {/* LIGNE PRINCIPALE : PHOTO + INTRO */}
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
                  src="/mikael-profile.jpg" // même image que pour la version anglaise
                  alt="Mikael, fondateur de BlueWise AI"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Texte intro */}
            <div className="space-y-4">
              <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
                <span>👋</span>
                <span>Qui est derrière Blue Wise AI ?</span>
              </h2>
              <p className="leading-relaxed text-slate-100 drop-shadow-sm">
                Bonjour, je suis Mikael — le créateur de Blue Wise AI.
              </p>
              <p className="leading-relaxed text-slate-100 drop-shadow-sm">
                J&apos;ai lancé ce projet pour aider des personnes comme moi —
                motivées, créatives, mais sans grande équipe technique —
                à utiliser l&apos;IA pour créer des outils intelligents qui font
                vraiment gagner du temps.
              </p>
              <p className="leading-relaxed text-slate-100 drop-shadow-sm">
                Vous n&apos;avez pas besoin d&apos;être développeur ou fondateur
                de startup financée pour profiter de l&apos;IA. Il vous faut le
                bon accompagnement, un peu de créativité et un problème réel
                à résoudre.
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
              Je travaille surtout avec des propriétaires de petites entreprises,
              des solopreneurs et des créateurs qui :
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>Passent trop de temps dans leurs emails et suivis.</li>
              <li>Savent que l&apos;IA peut aider, mais ne savent pas par où commencer.</li>
              <li>Préfèrent des systèmes simples et efficaces à des usines à gaz.</li>
            </ul>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Si vous vous reconnaissez, on a de bonnes chances de bien travailler ensemble.
            </p>
          </div>

          {/* CE QUE JE FAIS */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>🧠</span>
              <span>Ce que je fais</span>
            </h2>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Je conçois et je construis de petites automatisations à fort impact :
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-100 drop-shadow-sm">
              <li>Tri, résumé et réponses intelligentes aux emails.</li>
              <li>Flots de capture et qualification de prospects.</li>
              <li>SMS après appel manqué et séquences de suivi.</li>
              <li>Outils GPT personnalisés pour vos processus métier.</li>
            </ul>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              J&apos;ai déjà lancé des applications et outils internes basés sur l&apos;IA
              et j&apos;améliore mes compétences chaque jour. Pas de blabla, pas de
              complexité inutile — juste des outils qui fonctionnent.
            </p>
          </div>

          {/* COMMENT JE TRAVAILLE */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>⚙️</span>
              <span>Comment je travaille</span>
            </h2>
            <blockquote className="border-l-4 border-blue-400 pl-4 italic text-slate-100 drop-shadow-sm">
              Clarté d&apos;abord. Rapidité ensuite. Valeur toujours.
            </blockquote>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              On commence par un appel court pour comprendre votre activité, vos
              blocages et où l&apos;automatisation peut créer des gains rapides.
            </p>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Ensuite, je vous propose un plan simple avec une ou deux
              automatisations à fort levier que l&apos;on peut mettre en place
              en 1 à 2 semaines.
            </p>
          </div>

          {/* POURQUOI C&apos;EST IMPORTANT */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center gap-2 drop-shadow-sm">
              <span>🌱</span>
              <span>Pourquoi c&apos;est important</span>
            </h2>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Blue Wise AI fait partie d&apos;une mission plus large pour moi :
              vivre simplement, travailler intelligemment et aider d&apos;autres
              personnes à faire de même.
            </p>
            <p className="leading-relaxed text-slate-100 drop-shadow-sm">
              Je crois en des outils qui servent les gens — pas l&apos;inverse.
            </p>
          </div>

          {/* CTA LEAD */}
          <div className="pt-8 text-center space-y-3">
            <p className="text-slate-100 drop-shadow-sm">
              Vous ne savez pas par où commencer ?
              On peut cartographier ensemble votre première automatisation.
            </p>
            <ConsultCTA>Réservez une consultation gratuite</ConsultCTA>
          </div>
        </section>
      </div>
    </div>
  );
}
