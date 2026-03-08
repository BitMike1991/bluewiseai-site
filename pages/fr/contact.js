import { useState } from 'react';

export default function ContactFr() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', industry: '', callsPerWeek: '', message: ''
  });
  const [status, setStatus] = useState('');

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Envoi en cours...');
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus('Message envoy\u00e9 ! On te revient en dedans de 4 heures.');
      setForm({ name: '', email: '', phone: '', industry: '', callsPerWeek: '', message: '' });
    } catch (err) {
      console.error(err);
      setStatus('Oups, une erreur est survenue. R\u00e9essaie.');
    }
  };

  return (
    <div className="min-h-screen bg-[url('/styles/backgroundpages.png')] bg-cover bg-center text-white">
      <div className="min-h-screen py-16 px-4 backdrop-brightness-110">
        <section className="max-w-5xl mx-auto space-y-12 px-6 sm:px-12 py-10 rounded-3xl bg-slate-950/80 border border-white/10 backdrop-blur-md shadow-[0_0_45px_rgba(15,23,42,0.9)]">

          {/* TITRE */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold">R&eacute;serve ton appel strat&eacute;gique gratuit</h1>
            <p className="text-lg text-slate-200 max-w-2xl mx-auto">
              15 minutes. On regarde ta business, on calcule tes pertes de revenus, pis on te dit exactement ce qu&apos;on peut automatiser.
            </p>
            <p className="text-emerald-300 font-semibold">On r&eacute;pond en dedans de 4 heures.</p>
          </div>

          {/* DEUX COLONNES: Calendly + Formulaire */}
          <div className="grid md:grid-cols-2 gap-8">

            {/* RÉSERVATION */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Réserve ton appel gratuit</h2>
              <div className="rounded-2xl border border-blue-500/30 bg-slate-900/60 p-8 flex flex-col items-center justify-center text-center space-y-6" style={{ minHeight: '400px' }}>
                <div className="w-20 h-20 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-4xl">
                  &#128197;
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Appel stratégique de 15 minutes</h3>
                  <p className="text-slate-300 text-sm max-w-sm">
                    On analyse tes opérations, on calcule tes pertes de revenus, pis on te montre exactement où l&apos;automatisation fit.
                  </p>
                </div>
                <ul className="text-slate-300 text-sm space-y-1 text-left">
                  <li>&#10003; Gratuit — aucun engagement</li>
                  <li>&#10003; Calcul de ROI personnalisé pour ta business</li>
                  <li>&#10003; Recommandations actionables que tu peux utiliser tout de suite</li>
                </ul>
                <a
                  href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 transition-all text-lg"
                >
                  Choisis ton moment
                </a>
                <p className="text-slate-500 text-xs">Ouvre Google Calendar — choisis le créneau qui te convient</p>
              </div>
            </div>

            {/* FORMULAIRE QUALIFIANT */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Ou parle-nous de ta business</h2>
              <p className="text-slate-300 text-sm">
                Remplis &ccedil;a pis on te revient avec une recommandation personnalis&eacute;e.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom</label>
                  <input
                    type="text" name="name" value={form.name} onChange={handleChange} required
                    className="w-full rounded-xl px-4 py-2.5 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Courriel</label>
                    <input
                      type="email" name="email" value={form.email} onChange={handleChange} required
                      className="w-full rounded-xl px-4 py-2.5 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">T&eacute;l&eacute;phone</label>
                    <input
                      type="tel" name="phone" value={form.phone} onChange={handleChange}
                      className="w-full rounded-xl px-4 py-2.5 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Industrie</label>
                    <select
                      name="industry" value={form.industry} onChange={handleChange} required
                      className="w-full rounded-xl px-4 py-2.5 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                    >
                      <option value="">S&eacute;lectionne...</option>
                      <option value="hvac">Chauffage / Climatisation</option>
                      <option value="plumbing">Plomberie</option>
                      <option value="roofing">Toiture</option>
                      <option value="electrical">&Eacute;lectricit&eacute;</option>
                      <option value="general-contractor">Entrepreneur g&eacute;n&eacute;ral</option>
                      <option value="landscaping">Am&eacute;nagement paysager</option>
                      <option value="cleaning">Entretien m&eacute;nager</option>
                      <option value="chimney">Ramonage</option>
                      <option value="other">Autre service r&eacute;sidentiel</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Appels / semaine</label>
                    <select
                      name="callsPerWeek" value={form.callsPerWeek} onChange={handleChange} required
                      className="w-full rounded-xl px-4 py-2.5 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                    >
                      <option value="">S&eacute;lectionne...</option>
                      <option value="5-10">5-10</option>
                      <option value="10-20">10-20</option>
                      <option value="20-40">20-40</option>
                      <option value="40+">40+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Parle-nous de ta business</label>
                  <textarea
                    name="message" rows="4" value={form.message} onChange={handleChange}
                    placeholder="Quels services tu offres ? C'est quoi ton plus gros mal de t&ecirc;te au niveau des op&eacute;rations ?"
                    className="w-full rounded-xl px-4 py-2.5 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 transition-all"
                >
                  Recevoir mon &eacute;valuation gratuite
                </button>

                {status && (
                  <p className="text-sm text-slate-200">{status}</p>
                )}
              </form>
            </div>
          </div>

          {/* INFO CONTACT */}
          <div className="grid md:grid-cols-3 gap-6 pt-4">
            <div className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-5 text-center">
              <div className="text-2xl mb-2">Courriel</div>
              <a href="mailto:mikael@bluewiseai.com" className="text-blue-300 hover:underline">
                mikael@bluewiseai.com
              </a>
            </div>
            <div className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-5 text-center">
              <div className="text-2xl mb-2">T&eacute;l&eacute;phone</div>
              <a href="tel:+15144184743" className="text-blue-300 hover:underline">
                (514) 418-4743
              </a>
            </div>
            <div className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-5 text-center">
              <div className="text-2xl mb-2">D&eacute;lai de r&eacute;ponse</div>
              <p className="text-emerald-300 font-semibold">En dedans de 4 heures</p>
            </div>
          </div>

        </section>
      </div>
    </div>
  );
}
