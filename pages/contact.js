import { useState } from 'react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending…');
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus('Message sent! Thank you.');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      console.error(err);
      setStatus('Oops! Something went wrong.');
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
          {/* Page Title */}
          <h1 className="text-4xl font-heading text-center drop-shadow-md">
            📞 Free 15-Minute Lead Rescue Strategy Call
          </h1>

          {/* Intro message */}
          <div className="space-y-4 text-center drop-shadow-sm text-slate-100">
            <p className="text-lg">
              See exactly how much revenue you're losing to missed calls—and how Lead Rescue can recover it.
            </p>
            <p>
              Tell me about your business: How many calls do you get per week? How many do you miss?
              What's your average job value? I'll calculate your exact revenue loss and show you
              which Lead Rescue tier makes sense for your business.
            </p>
            <p className="text-sm text-slate-300">
              In 15 minutes we'll:
              <br />
              • Calculate your current revenue loss from missed calls
              <br />
              • Show you how Lead Rescue captures those leads automatically
              <br />
              • Recommend the right tier (SMS, Full, or Enterprise)
              <br />
              • Map out your break-even timeline and ROI
            </p>
            <p className="text-xl font-semibold">
              No sales pitch. Just honest numbers and a clear recommendation.
            </p>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Name
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
                Email
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
                Tell me about your business
              </label>
              <textarea
                name="message"
                rows="5"
                placeholder="Example: HVAC company, get 30 calls/week, miss about 10 while on jobs, average job is $500. Looking to capture more leads without hiring another person."
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
              Book My Free Strategy Call
            </button>

            {status && (
              <p className="text-sm text-slate-100 drop-shadow-sm">
                {status}
              </p>
            )}
          </form>

          {/* Other Contact Info */}
          <div className="pt-10 space-y-4 drop-shadow-sm text-slate-100">
            <h2 className="text-2xl font-heading">Other ways to reach me</h2>
            <ul className="space-y-2 text-white/90">
              <li>
                📧 Email:{' '}
                <a
                  href="mailto:mikael@bluewiseai.com"
                  className="text-blue-300 hover:underline"
                >
                  mikael@bluewiseai.com
                </a>
              </li>
              <li>
                📅 Book directly:{' '}
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
                🔗 Instagram:{' '}
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
                🔗 Facebook:{' '}
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
                🔗 X:{' '}
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
                🔗 LinkedIn:{' '}
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
                🕐 Response time: I usually reply within 24–48h (Mon–Fri)
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
