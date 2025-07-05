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
        <section className="max-w-3xl mx-auto space-y-10 px-6 sm:px-12">
          {/* Page Title */}
          <h1 className="text-4xl font-heading text-center drop-shadow-md">📬 Contact</h1>

          {/* Intro message */}
          <div className="space-y-4 text-center drop-shadow-sm">
            <p className="text-lg">
              Have a project idea or curious about how AI can improve your workflow?
            </p>
            <p>
              I offer tailored guidance, practical prototypes, and clear next steps — whether
              you&rsquo;re just getting started or scaling up.
            </p>
            <p className="text-xl font-semibold">Let&rsquo;s talk.</p>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">Name</label>
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
              className="bg-primary text-white px-6 py-3 rounded shadow hover:bg-blue-600 transition"
            >
              Send Message
            </button>

            {status && <p className="text-white drop-shadow-sm">{status}</p>}
          </form>

          {/* Other Contact Info */}
          <div className="pt-10 space-y-4 drop-shadow-sm">
            <h2 className="text-2xl font-heading">Other ways to reach me</h2>
            <ul className="space-y-2 text-white/90">
              <li>
                📧 Email:{' '}
                <a
                  href="mailto:bluewiseai@ptoton.me"
                  className="text-primary hover:underline"
                >
                  bluewiseai@ptoton.me
                </a>
              </li>
              <li>
                📅 Book a free consult:{' '}
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
                🔗 Social:{' '}
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
              <li>🕐 Response time: I usually reply within 24–48h (Mon–Fri)</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
