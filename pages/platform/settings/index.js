// pages/platform/settings/index.js
import { useEffect, useState } from 'react';
import DashboardLayout from '../../../src/components/dashboard/DashboardLayout';

const TIMEZONES = [
  'America/Toronto',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/Rome',
  'Europe/Paris',
  'UTC',
];

export default function SettingsPage() {
  const [form, setForm] = useState({
    businessName: '',
    telnyxNumber: '',
    smsNumber: '',
    timezone: 'America/Toronto',
    industry: '',
    bookingLink: '',
    inboxEmail: '',
    serviceNiche: '',
    mainOffer: '',
    toneProfile: '',
    emailSignature: '',
    smsTemplate: '',
    afterHoursSmsTemplate: '',
    businessHoursStart: '',
    businessHoursEnd: '',
    smsEnabled: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  // Load settings on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/settings');
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || `Failed to load settings (${res.status})`);
        }
        if (!cancelled) {
          setForm((prev) => ({
            ...prev,
            ...json,
          }));
        }
      } catch (err) {
        console.error('Settings load error', err);
        if (!cancelled) {
          setError(err.message || 'Failed to load settings');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || `Failed to save settings (${res.status})`);
      }

      setForm((prev) => ({ ...prev, ...json }));
      setSavedAt(new Date().toISOString());
    } catch (err) {
      console.error('Settings save error', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  const lastSavedLabel = savedAt
    ? new Intl.DateTimeFormat('en-US', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(savedAt))
    : null;

  return (
    <DashboardLayout title="Settings">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Settings</h1>
          <p className="text-sm text-slate-400">
            Configure how Lead Rescue and Inbox Agents behave for this customer.
          </p>
        </div>
        <div className="text-xs text-slate-500 flex flex-col items-end gap-1">
          {lastSavedLabel && (
            <span>Last saved: <span className="text-slate-300">{lastSavedLabel}</span></span>
          )}
          <span className="text-[11px] text-slate-500">
            Changes apply to new leads & messages going forward.
          </span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Top error */}
        {error && (
          <div className="rounded-xl border border-rose-500/60 bg-rose-950/40 px-4 py-3 text-xs text-rose-100">
            {error}
          </div>
        )}

        {/* Business profile */}
        <section className="rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-xl shadow-black/40 p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Business profile</h2>
              <p className="text-xs text-slate-400">
                Basic info used across SMS, emails and dashboards.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Business name
              </label>
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => updateField('businessName', e.target.value)}
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/80 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                placeholder="BlueWise AI – Lead Rescue"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Industry / niche
              </label>
              <input
                type="text"
                value={form.industry}
                onChange={(e) => updateField('industry', e.target.value)}
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/80 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                placeholder="Chimney, HVAC, Roofing…"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Timezone
              </label>
              <select
                value={form.timezone}
                onChange={(e) => updateField('timezone', e.target.value)}
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/80 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Booking link (Calendly, TidyCal, etc.)
              </label>
              <input
                type="url"
                value={form.bookingLink}
                onChange={(e) => updateField('bookingLink', e.target.value)}
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/80 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                placeholder="https://calendly.com/..."
              />
            </div>
          </div>
        </section>

        {/* Phone + inbox */}
        <section className="rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-xl shadow-black/40 p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Phone & inbox routing
            </h2>
            <p className="text-xs text-slate-400">
              Numbers and emails used by your automations (Telnyx, n8n, Inbox Agents).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Telnyx number (main DID)
              </label>
              <input
                type="text"
                value={form.telnyxNumber}
                onChange={(e) => updateField('telnyxNumber', e.target.value)}
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/80 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                placeholder="+14505550123"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                SMS sender number (if different)
              </label>
              <input
                type="text"
                value={form.smsNumber}
                onChange={(e) => updateField('smsNumber', e.target.value)}
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/80 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                placeholder="+14505550123"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Inbox email (connected to n8n / Gmail)
              </label>
              <input
                type="email"
                value={form.inboxEmail}
                onChange={(e) => updateField('inboxEmail', e.target.value)}
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/80 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                placeholder="leads@yourdomain.com"
              />
            </div>

            <div className="flex items-center gap-2 mt-4 md:mt-7">
              <input
                id="smsEnabled"
                type="checkbox"
                checked={form.smsEnabled}
                onChange={(e) => updateField('smsEnabled', e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-500 focus:ring-sky-500"
              />
              <label
                htmlFor="smsEnabled"
                className="text-xs text-slate-300"
              >
                Enable SMS automation for this customer
              </label>
            </div>
          </div>
        </section>

        {/* AI persona + offer */}
        <section className="rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-xl shadow-black/40 p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">AI persona & offer</h2>
            <p className="text-xs text-slate-400">
              How your AI talks, and what it’s trying to sell or book.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Service niche
              </label>
              <input
                type="text"
                value={form.serviceNiche}
                onChange={(e) => updateField('serviceNiche', e.target.value)}
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/80 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                placeholder="Chimney installs, wood stoves, etc."
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Main offer / outcome
              </label>
              <input
                type="text"
                value={form.mainOffer}
                onChange={(e) => updateField('mainOffer', e.target.value)}
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/80 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                placeholder="We install X in Y days with Z guarantee…"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">
                Tone / language instructions (tone_profile)
              </label>
              <textarea
                rows={3}
                value={form.toneProfile}
                onChange={(e) => updateField('toneProfile', e.target.value)}
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/80 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                placeholder='Ex: "friendly, direct, Québec French when possible, no emojis, concise".'
              />
            </div>
          </div>
        </section>

        {/* Signatures & templates */}
        <section className="rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-xl shadow-black/40 p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Email & SMS templates
            </h2>
            <p className="text-xs text-slate-400">
              Base templates your automations plug into. You can keep these simple for now.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">
                Email signature (HTML allowed)
              </label>
              <textarea
                rows={4}
                value={form.emailSignature}
                onChange={(e) => updateField('emailSignature', e.target.value)}
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/80 px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                placeholder="<p>Your name<br>Company<br>Phone</p>"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Default SMS template (business hours)
              </label>
              <textarea
                rows={4}
                value={form.smsTemplate}
                onChange={(e) => updateField('smsTemplate', e.target.value)}
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/80 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                placeholder="Hey {{name}}, we just missed your call. What can we help you with?"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                After-hours SMS template
              </label>
              <textarea
                rows={4}
                value={form.afterHoursSmsTemplate}
                onChange={(e) =>
                  updateField('afterHoursSmsTemplate', e.target.value)
                }
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/80 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                placeholder="We’re currently closed, but our system captured your request. We’ll get back to you next business day."
              />
            </div>
          </div>
        </section>

        {/* Hours */}
        <section className="rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-xl shadow-black/40 p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Business hours
            </h2>
            <p className="text-xs text-slate-400">
              Used to decide when to send normal vs. after-hours replies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm items-end">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Start time
              </label>
              <input
                type="time"
                value={form.businessHoursStart || ''}
                onChange={(e) =>
                  updateField('businessHoursStart', e.target.value)
                }
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/80 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                End time
              </label>
              <input
                type="time"
                value={form.businessHoursEnd || ''}
                onChange={(e) =>
                  updateField('businessHoursEnd', e.target.value)
                }
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/80 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
              />
            </div>

            <div className="text-xs text-slate-400">
              <p>
                SMS rules will later check these hours (in your timezone) to
                decide which template to use.
              </p>
            </div>
          </div>
        </section>

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-[0_0_18px_rgba(56,189,248,0.9)] disabled:opacity-60 disabled:cursor-default transition"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>

        {loading && (
          <p className="text-xs text-slate-500 mt-2">
            Loading current settings from Supabase…
          </p>
        )}
      </form>
    </DashboardLayout>
  );
}
