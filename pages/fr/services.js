import ConsultCTA from '@/components/ConsultCTA';

export default function ServicesFR() {
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
        <section className="max-w-4xl mx-auto space-y-12 px-6 sm:px-12">
          <h1 className="text-4xl font-heading text-center drop-shadow-md">Services</h1>

          {/* Développement IA personnalisé */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center space-x-2 drop-shadow-sm">
              <span>🔧</span>
              <span>Développement IA & GPT sur mesure</span>
            </h2>
            <p className="leading-relaxed drop-shadow-sm">
              Que vous ayez besoin d&apos;un chatbot intelligent, d&apos;un GPT spécialisé pour générer du contenu ou d&apos;un assistant IA complet, je conçois des solutions sur mesure adaptées à vos besoins :
            </p>
            <ul className="list-disc list-inside drop-shadow-sm space-y-1">
              <li>Analyse des besoins & prototypage</li>
              <li>Conception de prompts & ingénierie des instructions</li>
              <li>Intégration d&apos;API (OpenAI, Azure, Hugging Face, etc.)</li>
              <li>Déploiement et hébergement sur Streamlit, Vercel, Heroku ou votre propre stack</li>
            </ul>
          </div>

          {/* Prompt Engineering */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center space-x-2 drop-shadow-sm">
              <span>⚙️</span>
              <span>Ingénierie & optimisation de prompts</span>
            </h2>
            <p className="leading-relaxed drop-shadow-sm">
              Maximisez votre budget LLM avec des prompts précis, efficaces et alignés sur vos objectifs. J&apos;analyse vos prompts existants, les optimise et documente les bonnes pratiques.
            </p>
          </div>

          {/* Automatisation des flux */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center space-x-2 drop-shadow-sm">
              <span>🤖</span>
              <span>Automatisation des flux de travail IA</span>
            </h2>
            <p className="leading-relaxed drop-shadow-sm">
              Automatisez les tâches répétitives, les rapports et les flux de données pour vous concentrer sur l&apos;essentiel. Du no-code à Python, je vous aide à :
            </p>
            <ul className="list-disc list-inside drop-shadow-sm space-y-1">
              <li>Identifier les opportunités à fort retour sur investissement</li>
              <li>Concevoir et mettre en œuvre des workflows personnalisés</li>
              <li>S&apos;intégrer à vos outils existants (Slack, Notion, Google Sheets, etc.)</li>
            </ul>
          </div>

          {/* Conseil IA */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center space-x-2 drop-shadow-sm">
              <span>📈</span>
              <span>Conseil stratégique en IA</span>
            </h2>
            <p className="leading-relaxed drop-shadow-sm">
              Vous ne savez pas par où commencer ? Je propose des sessions stratégiques pour définir votre feuille de route IA — des gains rapides aux solutions durables et évolutives.
            </p>
          </div>

          {/* CTA */}
          <div className="pt-8 text-center space-y-2">
            <h3 className="text-xl font-heading drop-shadow-sm">Prêt à vous lancer ?</h3>
            <p className="drop-shadow-sm">
              Parlons de votre projet et trouvons ensemble la solution IA parfaite pour générer des résultats concrets.
            </p>
            <ConsultCTA>Réservez une consultation gratuite</ConsultCTA>
          </div>
        </section>
      </div>
    </div>
  );
}
