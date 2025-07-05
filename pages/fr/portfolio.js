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
        <section className="max-w-4xl mx-auto space-y-12 px-6 sm:px-12 bg-white/90 text-dark rounded-lg shadow-lg p-8">

          {/* Titre principal */}
          <h1 className="text-4xl font-heading text-center drop-shadow-md text-primary">
            📁 Portfolio
          </h1>

          {/* Projet 1 */}
          <div className="space-y-2 border-t border-gray-300 pt-6">
            <h2 className="text-2xl font-heading text-dark drop-shadow-sm">💼 Coach d’Entretien GPT</h2>
            <p className="leading-relaxed text-midgray">
              Une application web qui simule des entretiens d’embauche et fournit un retour personnalisé sur vos réponses.
              Conçue avec Next.js, OpenAI GPT-4 et hébergée sur Vercel.
            </p>
            <ul className="list-disc list-inside text-midgray space-y-1">
              <li>Questions dynamiques selon le poste visé</li>
              <li>Enregistrement et lecture directement dans le navigateur</li>
              <li>Score en temps réel & conseils d’amélioration</li>
            </ul>
            <a
              href="https://www.jobinterviewcoachgpt.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Voir la démo en ligne →
            </a>
          </div>

          {/* Projet 2 */}
          <div className="space-y-2 border-t border-gray-300 pt-6">
            <h2 className="text-2xl font-heading text-dark drop-shadow-sm">📚 Générateur d’Histoires sur Demande</h2>
            <p className="leading-relaxed text-midgray">
              Un GPT personnalisé pour créer des histoires pour enfants à partir de vos idées : personnages, thèmes, décors.
              Déployé comme plugin ChatGPT privé avec une interface Streamlit.
            </p>
            <ul className="list-disc list-inside text-midgray space-y-1">
              <li>Modèles de prompts selon l’âge et le style</li>
              <li>Export PDF automatique avec illustrations</li>
              <li>Facilement intégrable à un site web ou à Slack</li>
            </ul>
            <a
              href="https://chatgpt.com/g/g-685d9a9fec988191a649d0478b85dd56-storycraft-ai-custom-short-stories"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Voir le projet →
            </a>
          </div>

          {/* Projet 3 */}
          <div className="space-y-2 border-t border-gray-300 pt-6">
            <h2 className="text-2xl font-heading text-dark drop-shadow-sm">📆 Calendrier Réseaux Sociaux IA – 30 Jours</h2>
            <p className="leading-relaxed text-midgray">
              Génère un mois complet de publications et légendes pour Instagram & TikTok, selon le ton de votre marque.
              Utilise OpenAI fine-tuning + LangChain.
            </p>
            <ul className="list-disc list-inside text-midgray space-y-1">
              <li>Export CSV pour outils de planification</li>
              <li>Optimisation du ton & des hashtags</li>
              <li>Mode aperçu et édition en lot</li>
            </ul>
            <a
              href="https://chatgpt.com/g/g-685da1abb65c81919f4af829257cbabc-30-day-social-media-content-calendar-generator"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Voir le projet →
            </a>
          </div>

          {/* À venir */}
          <div className="space-y-2 border-t border-gray-300 pt-6">
