import ConsultCTA from '@/components/ConsultCTA';

export default function PortfolioFR() {
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
          {/* Page Title */}
          <h1 className="text-4xl font-heading text-center drop-shadow-md">Portfolio</h1>

          {/* Projet 1 */}
          <div className="space-y-2">
            <h2 className="text-2xl font-heading drop-shadow-sm">💼 Coach d’Entretien GPT</h2>
            <p className="leading-relaxed drop-shadow-sm">
              Une application web qui simule des entretiens d’embauche et fournit un retour personnalisé sur vos réponses. Conçue avec Next.js, OpenAI GPT-4 et hébergée sur Vercel.
            </p>
            <ul className="list-disc list-inside drop-shadow-sm space-y-1">
              <li>Questions dynamiques selon le poste visé</li>
              <li>Enregistrement et lecture directement dans le navigateur</li>
              <li>Score en temps réel & conseils d’amélioration</li>
            </ul>
            <a
              href="https://www.jobinterviewcoachgpt.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline drop-shadow-sm"
            >
              Voir la démo en ligne
            </a>
          </div>

          {/* Projet 2 */}
          <div className="space-y-2">
            <h2 className="text-2xl font-heading drop-shadow-sm">📚 Générateur d’Histoires sur Demande</h2>
            <p className="leading-relaxed drop-shadow-sm">
              Un GPT personnalisé pour créer des histoires pour enfants à partir de vos idées : personnages, thèmes, décors. Déployé comme plugin ChatGPT privé avec une interface Streamlit.
            </p>
            <ul className="list-disc list-inside drop-shadow-sm space-y-1">
              <li>Modèles de prompts selon l’âge et le style</li>
              <li>Export PDF automatique avec illustrations</li>
              <li>Facilement intégrable à un site web ou à Slack</li>
            </ul>
            <a
              href="https://chatgpt.com/g/g-685d9a9fec988191a649d0478b85dd56-storycraft-ai-custom-short-stories"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline drop-shadow-sm"
            >
              Voir le projet
            </a>
          </div>

          {/* Projet 3 */}
          <div className="space-y-2">
            <h2 className="text-2xl font-heading drop-shadow-sm">📆 Calendrier Réseaux Sociaux IA – 30 Jours</h2>
            <p className="leading-relaxed drop-shadow-sm">
              Génère un mois complet de publications et légendes pour Instagram & TikTok, selon le ton de votre marque. Utilise OpenAI fine-tuning + LangChain.
            </p>
            <ul className="list-disc list-inside drop-shadow-sm space-y-1">
              <li>Export CSV pour outils de planification</li>
              <li>Optimisation du ton & des hashtags</li>
              <li>Mode aperçu et édition en lot</li>
            </ul>
            <a
              href="https://chatgpt.com/g/g-685da1abb65c81919f4af829257cbabc-30-day-social-media-content-calendar-generator"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline drop-shadow-sm"
            >
              Voir le projet
            </a>
          </div>

          {/* À venir */}
          <div className="space-y-2">
            <h2 className="text-2xl font-heading drop-shadow-sm">🚀 D’autres projets arrivent…</h2>
            <p className="leading-relaxed drop-shadow-sm">
              Je continue d’explorer de nouveaux outils IA — assistants RAG, vision par ordinateur, tableaux de bord analytiques. Restez à l’écoute !
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
