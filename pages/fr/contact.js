import { useState } from 'react';

export default function ContactFr() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Envoi en cours…');
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus('Message envoyé ! Merci.');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      console.error(err);
      setStatus('Oups ! Une erreur est survenue.');
    }
  };

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
            max-w-3xl mx-auto space-y-10 px-6 sm:px-12 py-10
            rounded-3xl
            bg-slate-950/80
            border border-white/10
            backdrop-blur-md
            shadow-[0_0_45px_rgba(15,23,42,0.9)]
          "
        >
          {/* Titre de page */}
          <h1 className="text-4xl font-heading text-center drop-shadow-md">
            📞 Call stratégique Lead Rescue gratuit de 15 minutes
          </h1>

          {/* Message d'intro */}
          <div className="space-y-4 text-center drop-shadow-sm text-slate-100">
            <p className="text-lg">
              Vois exactement combien de revenus tu perds sur des appels manqués — pis comment Lead Rescue peut les récupérer.
            </p>
            <p>
              Parle-moi de ta business : Combien d'appels tu reçois par semaine ? Combien t'en manques ?
              C'est quoi ta valeur moyenne de job ? Je vais calculer ta perte de revenus exacte pis te montrer
              quel plan Lead Rescue fait du sens pour ta business.
            </p>
            <p className="text-sm text-slate-300">
              En 15 minutes on va :
              <br />
              • Calculer ta perte de revenus actuelle sur des appels manqués
              <br />
              • Te montrer comment Lead Rescue capture ces leads automatiquement
              <br />
              • Recommander le bon plan (SMS, Complet ou Entreprise)
              <br />
              • Mapper ton timeline de rentabilité pis ton ROI
            </p>
            <p className="text-xl font-semibold">
              Pas de pitch de vente. Juste des chiffres honnêtes pis une recommandation claire.
            </p>
          </div>

          {/* Formulaire de contact */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Nom
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="
                  mt-1 w-full rounded-xl px-4 py-2
                  text-slate-900
                  bg-white/95
                  border border-slate-200
                  focus:border-blue-500
                  focus:ring-2 focus:ring-blue-400/60
                  outline-none
                "
              />
            </div>

            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Courriel
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="
                  mt-1 w-full rounded-xl px-4 py-2
                  text-slate-900
                  bg-white/95
                  border border-slate-200
                  focus:border-blue-500
                  focus:ring-2 focus:ring-blue-400/60
                  outline-none
                "
              />
            </div>

            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Parle-moi de ta business
              </label>
              <textarea
                name="message"
                rows="5"
                placeholder="Exemple : Compagnie CVC, reçois 30 appels/semaine, en manque environ 10 quand j'suis sur des jobs, job moyen de 500 $. Je cherche à capturer plus de leads sans engager une autre personne."
                value={form.message}
                onChange={handleChange}
                required
                className="
                  mt-1 w-full rounded-xl px-4 py-2
                  text-slate-900
                  bg-white/95
                  border border-slate-200
                  focus:border-blue-500
                  focus:ring-2 focus:ring-blue-400/60
                  outline-none
                "
              />
            </div>

            <button
              type="submit"
              className="
                inline-flex items-center justify-center
                bg-blue-600 hover:bg-blue-500
                text-white font-semibold
                px-6 py-3 rounded-2xl
                shadow-[0_0_22px_rgba(59,130,246,0.85)]
                hover:-translate-y-0.5
                hover:shadow-[0_0_28px_rgba(59,130,246,0.95)]
                hover:saturate-150
                transition-all duration-300
              "
            >
              Réserver mon call stratégique gratuit
            </button>

            {status && (
              <p className="text-sm text-slate-100 drop-shadow-sm">
                {status}
              </p>
            )}
          </form>

          {/* Autres moyens de contact */}
          <div className="pt-10 space-y-4 drop-shadow-sm text-slate-100">
            <h2 className="text-2xl font-heading">
              Autres façons de me joindre
            </h2>
            <ul className="space-y-2 text-white/90">
              <li>
                📧 Courriel :{' '}
                <a
                  href="mailto:mikael@bluewiseai.com"
                  className="text-blue-300 hover:underline"
                >
                  mikael@bluewiseai.com
                </a>
              </li>
              <li>
                📅 Réserver directement :{' '}
                <a
                  href="https://calendly.com/mikael-bluewiseai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:underline"
                >
                  calendly.com/mikael-bluewiseai
                </a>
              </li>
              <li>
                🔗 Instagram :{' '}
                <a
                  href="https://www.instagram.com/blue_wiseai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:underline"
                >
                  @blue_wiseai
                </a>
              </li>
              <li>
                🔗 Facebook :{' '}
                <a
                  href="https://www.facebook.com/profile.php?id=61584210422105"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:underline"
                >
                  BlueWise AI
                </a>
              </li>
              <li>
                🔗 X :{' '}
                <a
                  href="https://x.com/bluewiseai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:underline"
                >
                  @bluewiseai
                </a>
              </li>
              <li>
                🔗 LinkedIn :{' '}
                <a
                  href="https://www.linkedin.com/in/mikael-levesque-55572139a/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:underline"
                >
                  Mikael Levesque
                </a>
              </li>
              <li>
                🕐 Délai de réponse : je réponds généralement en dedans de 24–48 h (lundi à vendredi).
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
