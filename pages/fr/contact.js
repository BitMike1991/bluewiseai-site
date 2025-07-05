import { useState } from 'react';

export default function ContactFR() {
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
      setStatus('Oups ! Une erreur s&rsquo;est produite.');
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
        <section className="max-w-3xl mx-auto space-y-10 px-6 sm:px-12">

          {/* Titre */}
          <h1 className="text-4xl font-heading text-center drop-shadow-md">📬 Contact</h1>

          {/* Introduction */}
          <div className="space-y-4 text-center drop-shadow-sm">
            <p className="text-lg">
              Vous avez une idée de projet ou vous souhaitez découvrir comment l&#39;IA peut simplifier votre activité ?
            </p>
            <p>
              Je propose un accompagnement personnalisé, des prototypes rapides et des solutions concrètes, adaptées à vos besoins.
            </p>
            <p className="text-xl font-semibold">Parlons-en.</p>
          </div>

          {/* Formulaire de contact */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">Nom</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded px-4 py-2 text-black bg-white/90 border border-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium drop-shadow-sm">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded px-4 py-2 text-black bg-white/90 border border-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium drop-shadow-sm">Message</label>
              <textarea
                name="message"
                rows="5"
                value={form.message}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded px-4 py-2 text-black bg-white/90 border border-gray-300"
              />
            </div>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl shadow transition-colors duration-200"
            >
              Envoyer le message
            </button>

            {status && <p className="text-white drop-shadow-sm">{status}</p>}
          </form>

          {/* Coordonnées */}
          <div className="pt-10 space-y-4 drop-shadow-sm">
            <h2 className="text-2xl font-heading">Autres moyens de me contacter</h2>
            <ul className="space-y-2 text-white/90">
              <li>
                📧 Email :{' '}
                <a
                  href="mailto:mikael@bluewiseai.com"
                  className="text-primary hover:underline"
                >
                  mikael@bluewiseai.com
                </a>
              </li>
              <li>
                📅 Prendre rendez-vous :{' '}
                <a
                  href="https://calendly.com/bluewiseai/15min"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Calendly
                </a>
              </li>
              <li>
                🔗 Réseaux sociaux :{' '}
                <a
                  href="https://linkedin.com/in/bluewiseai"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>{' '}
                /{' '}
                <a
                  href="https://twitter.com/bluewiseai"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  X (Twitter)
                </a>
              </li>
              <li>🕐 Temps de réponse : sous 24 à 48h (du lundi au vendredi)</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
