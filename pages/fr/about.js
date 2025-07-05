import ConsultCTA from '@/components/ConsultCTA';

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
      {/* Light transparent card for text readability */}
      <div className="min-h-screen py-16 px-4 backdrop-brightness-110">
        <section className="max-w-4xl mx-auto space-y-12 px-6 sm:px-12">

          {/* Page Title */}
          <h1 className="text-4xl font-heading text-center drop-shadow-md">À propos</h1>

          {/* Who's behind */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center space-x-2 drop-shadow-sm">
              <span>👋</span>
              <span>Qui est derrière Blue Wise AI ?</span>
            </h2>
            <p className="leading-relaxed drop-shadow-sm">
              Bonjour, je suis Mikael — le créateur de Blue Wise AI.
            </p>
            <p className="leading-relaxed drop-shadow-sm">
              J&apos;ai lancé ce projet pour aider des personnes comme moi — motivées, créatives,
              mais sans une grande équipe technique — à utiliser l&apos;IA pour créer des
              outils intelligents et utiles qui font gagner du temps et libèrent le potentiel
              de croissance.
            </p>
            <p className="leading-relaxed drop-shadow-sm">
              Vous n&apos;avez pas besoin d&apos;être développeur ou fondateur de startup financé par
              du capital-risque pour profiter de l&apos;IA. Il vous suffit du bon guide,
              d&apos;un peu de créativité et d&apos;un vrai problème à résoudre.
            </p>
          </div>

          {/* What I Do */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center space-x-2 drop-shadow-sm">
              <span>🧠</span>
              <span>Ce que je fais</span>
            </h2>
            <p className="leading-relaxed drop-shadow-sm">
              Je collabore avec des personnes ambitieuses et visionnaires
              qui veulent concrétiser leurs idées, mais ne savent pas par où commencer.
            </p>
            <p className="leading-relaxed drop-shadow-sm">
              Que ce soit pour automatiser un flux de travail, créer un outil GPT
              personnalisé ou prototyper une idée SaaS — je peux vous aider à y arriver rapidement.
            </p>
            <p className="leading-relaxed drop-shadow-sm">
              J&apos;ai déjà lancé une application IA et je continue de perfectionner mes compétences.
              Pas de blabla. Pas de complexité inutile. Juste des outils clairs et utiles.
            </p>
          </div>

          {/* How I Work */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center space-x-2 drop-shadow-sm">
              <span>⚙️</span>
              <span>Comment je travaille</span>
            </h2>
            <blockquote className="border-l-4 border-primary pl-4 italic drop-shadow-sm">
              Clarté d&apos;abord. Rapidité ensuite. Valeur toujours.
            </blockquote>
            <p className="leading-relaxed drop-shadow-sm">
              Je garde les choses légères et efficaces. Pas de processus gonflé,
              pas de jargon et pas de délais d&apos;agence. Juste vous, moi et un objectif
              commun : construire quelque chose qui fonctionne.
            </p>
          </div>

          {/* Why It Matters */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center space-x-2 drop-shadow-sm">
              <span>🌱</span>
              <span>Pourquoi c&apos;est important</span>
            </h2>
            <p className="leading-relaxed drop-shadow-sm">
              Blue Wise AI fait partie d&apos;une mission plus large pour moi —
              vivre simplement, travailler intelligemment et aider les autres à faire de même.
            </p>
            <p className="leading-relaxed drop-shadow-sm">
              Je crois en des outils qui servent les gens — pas l&apos;inverse.
            </p>
          </div>

          {/* CTA */}
          <div className="pt-8 text-center">
            <ConsultCTA>Réservez une consultation gratuite</ConsultCTA>
          </div>
        </section>
      </div>
    </div>
  );
}
