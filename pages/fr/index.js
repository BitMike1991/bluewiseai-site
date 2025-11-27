/* eslint-disable react/no-unescaped-entities */


import HeroV2 from "@/components/HeroV2";
import ConsultCTA from "@/components/ConsultCTA";


export default function Home() {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: "url('/styles/backgroundpages.png')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundAttachment: "fixed",
        backgroundColor: "#020617",
      }}
    >
      {/* Titre caché pour le SEO */}
      {/* Ajout d'un titre H1 caché qui indique clairement le sujet de la page pour les moteurs de recherche. */}
      <h1 className="sr-only">Automatisation IA pour les petites entreprises</h1>

      {/* HERO */}
      <HeroV2 />

      {/* INTRO — Pourquoi choisir l'automatisation IA */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Arrêtez de vous noyer dans l’administratif.</h2>
        <p className="text-xl text-slate-300">
          Nous construisons des assistants IA et des systèmes d'automatisation qui libèrent votre temps,
          convertissent davantage de prospects et simplifient votre entreprise. Gagnez 5 à 10 heures
          par semaine en laissant la technologie gérer le travail répétitif.
        </p>
      </section>

      {/* SECTION 2 — Ce que nous automatisons */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-white">
        <h2 className="text-3xl font-bold mb-6">🔥 Ce que nous automatisons</h2>

        <ul className="space-y-4 text-slate-300 text-lg">
          <li>⚡ Tri des emails, résumés &amp; réponses automatiques</li>
          <li>🤖 Bots de qualification de prospects</li>
          <li>📞 SMS après appel manqué avec suivi</li>
          <li>🔁 Séquences de nurturing automatisées</li>
          <li>🧾 Générateurs de devis &amp; contrats</li>
          <li>📁 Agents intelligents pour trier et nommer vos fichiers</li>
        </ul>
      </section>

      {/* SECTION 3 — Automatisations récentes / Ancre Demo */}
      <section
        id="demo"
        className="max-w-5xl mx-auto px-6 py-20 text-white"
      >
        <h2 className="text-3xl font-bold mb-6">🧠 Automatisations récentes</h2>

        <ul className="space-y-4 text-slate-300 text-lg">
          <li>💼 Coach d'entretien d'embauche GPT</li>
          <li>📚 Générateur d'histoires sur demande</li>
          <li>📆 Planificateur de médias sociaux sur 30 jours</li>
          <li>🛠 Automatisations sur mesure pour plusieurs industries</li>
        </ul>

        <div className="mt-8">
          {/* Utilise votre composant ConsultCTA, qui redirige vers /contact ou /fr/contact */}
          <ConsultCTA>
            Obtenez votre audit IA de 15 minutes — Gratuit
          </ConsultCTA>
        </div>
      </section>
    </div>
  );
}