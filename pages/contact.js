import { useState } from 'react';

export default function Contact() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', industry: '', callsPerWeek: '', message: ''
  });
  const [status, setStatus] = useState('');

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending...');
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus('Message sent! We will get back to you within 4 hours.');
      setForm({ name: '', email: '', phone: '', industry: '', callsPerWeek: '', message: '' });
    } catch (err) {
      console.error(err);
      setStatus('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[url('/styles/backgroundpages.png')] bg-cover bg-center text-white">
      <div className="min-h-screen py-16 px-4 backdrop-brightness-110">
        <section className="max-w-5xl mx-auto space-y-12 px-6 sm:px-12 py-10 rounded-3xl bg-slate-950/80 border border-white/10 backdrop-blur-md shadow-[0_0_45px_rgba(15,23,42,0.9)]">

          {/* TITLE */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold">Book Your Free Strategy Call</h1>
            <p className="text-lg text-slate-200 max-w-2xl mx-auto">
              15 minutes. We look at your business, calculate your revenue loss, and tell you exactly what we can automate.
            </p>
            <p className="text-emerald-300 font-semibold">We respond within 4 hours.</p>
          </div>

          {/* TWO COLUMNS: Calendly + Form */}
          <div className="grid md:grid-cols-2 gap-8">

            {/* BOOKING */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Book your free call</h2>
              <div className="rounded-2xl border border-blue-500/30 bg-slate-900/60 p-8 flex flex-col items-center justify-center text-center space-y-6" style={{ minHeight: '400px' }}>
                <div className="w-20 h-20 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-4xl">
                  &#128197;
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">15-Minute Strategy Call</h3>
                  <p className="text-slate-300 text-sm max-w-sm">
                    We&apos;ll analyze your operations, calculate your revenue loss, and show you exactly where automation fits.
                  </p>
                </div>
                <ul className="text-slate-300 text-sm space-y-1 text-left">
                  <li>&#10003; Free — no commitment</li>
                  <li>&#10003; Custom ROI calculation for your business</li>
                  <li>&#10003; Actionable recommendations you can use right away</li>
                </ul>
                <a
                  href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 transition-all text-lg"
                >
                  Pick a Time
                </a>
                <p className="text-slate-500 text-xs">Opens Google Calendar — pick the slot that works for you</p>
              </div>
            </div>

            {/* QUALIFYING FORM */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Or tell us about your business</h2>
              <p className="text-slate-300 text-sm">
                Fill this out and we&apos;ll reach out with a custom recommendation.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text" name="name" value={form.name} onChange={handleChange} required
                    className="w-full rounded-xl px-4 py-2.5 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email" name="email" value={form.email} onChange={handleChange} required
                      className="w-full rounded-xl px-4 py-2.5 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel" name="phone" value={form.phone} onChange={handleChange}
                      className="w-full rounded-xl px-4 py-2.5 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Industry</label>
                    <select
                      name="industry" value={form.industry} onChange={handleChange} required
                      className="w-full rounded-xl px-4 py-2.5 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                    >
                      <option value="">Select...</option>
                      <option value="hvac">HVAC</option>
                      <option value="plumbing">Plumbing</option>
                      <option value="roofing">Roofing</option>
                      <option value="electrical">Electrical</option>
                      <option value="general-contractor">General Contractor</option>
                      <option value="landscaping">Landscaping</option>
                      <option value="cleaning">Cleaning</option>
                      <option value="chimney">Chimney Services</option>
                      <option value="other">Other Home Services</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Calls / week</label>
                    <select
                      name="callsPerWeek" value={form.callsPerWeek} onChange={handleChange} required
                      className="w-full rounded-xl px-4 py-2.5 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                    >
                      <option value="">Select...</option>
                      <option value="5-10">5-10</option>
                      <option value="10-20">10-20</option>
                      <option value="20-40">20-40</option>
                      <option value="40+">40+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tell us more about your business</label>
                  <textarea
                    name="message" rows="4" value={form.message} onChange={handleChange}
                    placeholder="What services do you offer? What's your biggest operational headache?"
                    className="w-full rounded-xl px-4 py-2.5 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 transition-all"
                >
                  Get My Free Assessment
                </button>

                {status && (
                  <p className="text-sm text-slate-200">{status}</p>
                )}
              </form>
            </div>
          </div>

          {/* CONTACT INFO */}
          <div className="grid md:grid-cols-3 gap-6 pt-4">
            <div className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-5 text-center">
              <div className="text-2xl mb-2">Email</div>
              <a href="mailto:mikael@bluewiseai.com" className="text-blue-300 hover:underline">
                mikael@bluewiseai.com
              </a>
            </div>
            <div className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-5 text-center">
              <div className="text-2xl mb-2">Phone</div>
              <a href="tel:+15144184743" className="text-blue-300 hover:underline">
                (514) 418-4743
              </a>
            </div>
            <div className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-5 text-center">
              <div className="text-2xl mb-2">Response Time</div>
              <p className="text-emerald-300 font-semibold">Within 4 hours</p>
            </div>
          </div>

        </section>
      </div>
    </div>
  );
}
