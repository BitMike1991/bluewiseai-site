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
            📬 Start Your AI Automation Journey
          </h1>

          {/* Intro message */}
          <div className="space-y-4 text-center drop-shadow-sm text-slate-100">
            <p className="text-lg">
              Ready to reclaim your time and scale smarter?
            </p>
            <p>
              Tell me a bit about your business and I&apos;ll show you exactly how
              AI automation can take the busywork off your plate. Whether
              you have a specific project in mind or just want to explore
              possibilities, let&apos;s map out your first win together.
            </p>
            <p className="text-xl font-semibold">Let&apos;s talk.</p>
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
                Message
              </label>
              <textarea
                name="message"
                rows="5"
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
              Send Message
            </button>

            {status && (
              <p className="text-sm text-slate-100 drop-shadow-sm">
                {status}
              </p>
            )}
          </form>

          {/* Other Contact Info */}
          <div className="pt-10 space-y-4 drop-shadow-sm text-slate-100">
            <h2 className="text-2xl font-heading">
              Other ways to reach me
            </h2>
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
                📅 Book a free consult:{' '}
                <a
                  href="https://calendly.com/bluewiseai/15min"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:underline"
                >
                  Calendly
                </a>
              </li>
              <li>
                🔗 Social:{' '}
                <a
                  href="https://linkedin.com/in/bluewiseai"
                  className="text-blue-300 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>{' '}
                /{' '}
                <a
                  href="https://twitter.com/bluewiseai"
                  className="text-blue-300 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  X (Twitter)
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
