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

          {/* Titre principal */}
          <h1 className="text-4xl font-heading text-center drop-shadow-md text-primary">
            📁 Portfolio
          </h1>

          {/* Projet 1 */}
          <div className="space-y-2 border-t border-white/20 pt-6">
            <h2 className="text-2xl font-heading drop-shadow-sm">💼 Coach d&apos;Entretien GPT</h2>
            <p className="leading-relaxed text-white/90">
              Une application web qui simule des entretiens d&apos;embauche et fournit un retour personnalis&eacute; sur vos r&eacute;ponses.
              Con&ccedil;ue avec Next.js, OpenAI GPT-4 et h&eacute;berg&eacute;e sur Vercel.
            </p>
            <ul className="list-disc list-inside text-white/80 space-y-1">
              <li>Questions dynamiques selon le poste vis&eacute;</li>
              <li>Enregistrement et lecture directement dans le navigateur</li>
              <li>Score en temps r&eacute;el &amp; conseils d&apos;am&eacute;lioration</li>
            </ul>
            <a
              href="https://www.jobinterviewcoachgpt.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Voir la d&eacute;mo en ligne →
            </a>
          </div>

          {/* Projet 2 */}
          <div className="space-y-2 border-t border-white/20 pt-6">
            <h2 className="text-2xl font-heading drop-shadow-sm">📚 G&eacute;n&eacute;rateur d&apos;Histoires sur Demande</h2>
            <p className="leading-relaxed text-white/90">
              Un GPT personnalis&eacute; pour cr&eacute;er des histoires pour enfants &agrave; partir de vos id&eacute;es : personnages, th&egrave;mes, d&eacute;cors.
              D&eacute;ploy&eacute; comme plugin ChatGPT priv&eacute; avec une interface Streamlit.
            </p>
            <ul className="list-disc list-inside text-white/80 space-y-1">
              <li>Mod&egrave;les de prompts selon l&apos;&acirc;ge et le style</li>
              <li>Export PDF automatique avec illustrations</li>
              <li>Facilement int&eacute;grable &agrave; un site web ou &agrave; Slack</li>
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
          <div className="space-y-2 border-t border-white/20 pt-6">
            <h2 className="text-2xl font-heading drop-shadow-sm">📆 Calendrier R&eacute;seaux Sociaux IA – 30 Jours</h2>
            <p className="leading-relaxed text-white/90">
              G&eacute;n&egrave;re un mois complet de publications et l&eacute;gendes pour Instagram &amp; TikTok, selon le ton de votre marque.
              Utilise OpenAI fine-tuning + LangChain.
            </p>
            <ul className="list-disc list-inside text-white/80 space-y-1">
              <li>Export CSV pour outils de planification</li>
              <li>Optimisation du ton &amp; des hashtags</li>
              <li>Mode aper&ccedil;u et &eacute;dition en lot</li>
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
          <div className="space-y-2 border-t border-white/20 pt-6">
            <h2 className="text-2xl font-heading drop-shadow-sm">🚀 &Agrave; venir…</h2>
            <p className="leading-relaxed text-white/90">
              Je travaille constamment sur de nouveaux outils IA — assistants RAG, d&eacute;mos de vision par ordinateur, tableaux de bord analytiques... Restez &agrave; l&apos;&eacute;coute&nbsp;!
            </p>
          </div>

          {/* CTA */}
          <div className="pt-8 text-center">
            <ConsultCTA>R&eacute;server une consultation gratuite</ConsultCTA>
          </div>
        </section>
      </div>
    </div>
  );
}
