import ConsultCTA from '@/components/ConsultCTA';
import { Brain } from 'lucide-react';

export default function HomeFR() {
  return (
    <div className="bg-white px-2 py-4">
      <div
        className="
          relative
          w-full
          max-w-5xl
          mx-auto
          bg-[url('/styles/fullpage-bg.png')]
          bg-cover bg-center
          rounded-lg
          overflow-hidden
          shadow-lg
        "
      >
        {/* Section Hero */}
        <section
          className="relative w-full h-96"
          style={{
            backgroundImage: "url('/styles/hero-bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-blue-900/50 backdrop-brightness-75" />
          <div className="relative z-10 flex flex-col items-center h-full text-center text-white px-6 py-4">
            <div className="flex items-center space-x-2 mt-6">
              <Brain className="w-10 h-10 text-primary" />
              <h1 className="text-4xl font-heading max-w-3xl">
                Des flux de travail plus intelligents. Des outils plus simples. Propulsés par l&apos;IA.
              </h1>
            </div>
            <div className="mt-auto mb-6 space-y-3">
              <p className="text-lg max-w-2xl mx-auto">
                Blue Wise AI conçoit des solutions intelligentes et simples pour automatiser et développer votre entreprise.
              </p>
              <ConsultCTA>Réserver une consultation gratuite</ConsultCTA>
            </div>
          </div>
        </section>

        {/* Section Ce que je crée */}
        <section className="px-8 py-12 space-y-6 bg-white/90 text-dark">
          <h2 className="text-2xl font-heading text-primary">💼 Ce que je crée</h2>
          <p className="text-midgray">
            De l&apos;idée à l&apos;automatisation en quelques jours — je rends l&apos;IA accessible et utile.
          </p>
          <ul className="list-disc list-inside text-midgray space-y-2">
            <li>✅ Des outils IA adaptés à votre entreprise</li>
            <li>✅ MVP prêts en quelques jours, pas en semaines</li>
            <li>✅ Accompagnement amical, du brainstorming au lancement</li>
          </ul>
        </section>

        {/* Section Projets précédents */}
        <section className="px-8 pb-12 space-y-6 bg-white/90 text-dark">
          <h2 className="text-2xl font-heading text-primary">🧠 Projets précédents</h2>
          <ul className="text-midgray space-y-2">
            <li><strong>Coach d&apos;entretien GPT</strong> – Préparation personnalisée en quelques minutes</li>
            <li><strong>Générateur d&apos;histoires GPT</strong> – Contenu créatif à la demande</li>
            <li><strong>Planificateur de médias sociaux</strong> – Calendriers IA sur 30 jours</li>
          </ul>
          <ConsultCTA>Réserver une consultation gratuite</ConsultCTA>
        </section>
      </div>
    </div>
  );
}
