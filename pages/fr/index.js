import HeroV2 from "@/components/HeroV2";
import ConsultCTA from "@/components/ConsultCTA";

export default function HomeFR() {
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
      {/* HERO (bilingual HeroV2 – shows French because of /fr path) */}
      <HeroV2 />

      {/* SECTION 2 — Ce que j'automatise */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-white">
        <h2 className="text-3xl font-bold mb-6">🔥 Ce que j&apos;automatise</h2>

        <ul className="space-y-4 text-slate-300 text-lg">
          <li>⚡ Tri, résumé et réponses automatiques aux emails</li>
          <li>🤖 Bots de qualification de prospects</li>
          <li>📞 Systèmes de texto après appel manqué</li>
          <li>🔁 Séquences automatisées de suivi de prospects</li>
          <li>🧾 Générateurs de devis et de contrats</li>
          <li>📁 Classement intelligent et renommage de fichiers</li>
        </ul>
      </section>

      {/* SECTION 3 — Automatisations récentes + ancre #demo */}
      <section
        id="demo"
        className="max-w-5xl mx-auto px-6 py-20 text-white"
      >
        <h2 className="text-3xl font-bold mb-6">🧠 Automatisations récentes</h2>

        <ul className="space-y-4 text-slate-300 text-lg">
          <li>💼 Coach d&apos;entretien GPT – préparation personnalisée</li>
          <li>📚 Générateur d&apos;histoires GPT – contenu créatif à la demande</li>
          <li>📆 Planificateur de médias sociaux sur 30 jours</li>
          <li>🛠 Automatisations sur mesure pour différentes industries</li>
        </ul>

        <div className="mt-8">
          <ConsultCTA>
            Réserver une consultation gratuite
          </ConsultCTA>
        </div>
      </section>
    </div>
  );
}
