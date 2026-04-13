// pages/platform/settings/index.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../src/components/dashboard/DashboardLayout';
import { useBranding } from '../../../src/components/dashboard/BrandingContext';
import { getBrandingStyles } from '../../../src/components/dashboard/brandingUtils';
import Select from '../../../src/components/ui/Select';
import { useToast } from '../../../src/components/ui/ToastContext';
import { SkeletonPulse } from '../../../src/components/ui/Skeleton';
import {
  Mail, CheckCircle, XCircle, Loader2, Unplug, Building2, Phone, Bot,
  FileText, Clock, Settings,
} from 'lucide-react';

const TIMEZONES = [
  { value: 'America/Toronto', label: 'America/Toronto (EST)' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
  { value: 'Europe/Rome', label: 'Europe/Rome (CET)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'UTC', label: 'UTC' },
];

const TABS = [
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'business', label: 'Business', icon: Building2 },
  { key: 'phone', label: 'Phone & Inbox', icon: Phone },
  { key: 'ai', label: 'AI Persona', icon: Bot },
  { key: 'templates', label: 'Templates', icon: FileText },
  { key: 'hours', label: 'Hours', icon: Clock },
];

const INPUT_CLASS = "w-full rounded-xl bg-d-surface border border-d-border px-3 py-2 text-sm text-d-text focus:outline-none focus:ring-2 focus:ring-d-primary/50";
const TEXTAREA_CLASS = "w-full rounded-xl bg-d-surface border border-d-border px-3 py-2 text-sm text-d-text focus:outline-none focus:ring-2 focus:ring-d-primary/50 resize-none";

export default function SettingsPage() {
  const router = useRouter();
  const { branding } = useBranding();
  const styles = getBrandingStyles(branding);
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('email');
  const [form, setForm] = useState({
    businessName: '', telnyxNumber: '', smsNumber: '', timezone: 'America/Toronto',
    industry: '', bookingLink: '', inboxEmail: '', serviceNiche: '', mainOffer: '',
    toneProfile: '', emailSignature: '', smsTemplate: '', afterHoursSmsTemplate: '',
    businessHoursStart: '', businessHoursEnd: '', smsEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [dirty, setDirty] = useState(new Set());

  // Gmail/Outlook OAuth state
  const [gmail, setGmail] = useState({ loading: true, connected: false, email: '' });
  const [gmailLoading, setGmailLoading] = useState(false);
  const [outlook, setOutlook] = useState({ loading: true, connected: false, email: '' });
  const [outlookLoading, setOutlookLoading] = useState(false);

  useEffect(() => {
    fetch('/api/settings/gmail-status').then(r => r.json())
      .then(data => setGmail({ loading: false, connected: data.connected, email: data.email || '' }))
      .catch(() => setGmail(g => ({ ...g, loading: false })));
    fetch('/api/settings/outlook-status').then(r => r.json())
      .then(data => setOutlook({ loading: false, connected: data.connected, email: data.email || '' }))
      .catch(() => setOutlook(g => ({ ...g, loading: false })));
  }, []);

  useEffect(() => {
    if (router.query.gmail === 'success') setGmail(g => ({ ...g, connected: true, email: router.query.email || g.email }));
    if (router.query.outlook === 'success') setOutlook(g => ({ ...g, connected: true, email: router.query.email || g.email }));
  }, [router.query]);

  async function connectGmail() {
    setGmailLoading(true);
    try {
      const res = await fetch('/api/settings/gmail-auth');
      const data = await res.json();
      if (data.authUrl) window.location.href = data.authUrl;
    } catch { setGmailLoading(false); }
  }

  async function disconnectGmail() {
    if (!confirm('Disconnect Gmail? Email processing will stop.')) return;
    setGmailLoading(true);
    try { await fetch('/api/settings/gmail-auth', { method: 'DELETE' }); setGmail({ loading: false, connected: false, email: '' }); } catch {}
    setGmailLoading(false);
  }

  async function connectOutlook() {
    setOutlookLoading(true);
    try {
      const res = await fetch('/api/settings/outlook-auth');
      const data = await res.json();
      if (data.authUrl) window.location.href = data.authUrl;
    } catch { setOutlookLoading(false); }
  }

  async function disconnectOutlook() {
    if (!confirm('Disconnect Outlook? Email processing will stop.')) return;
    setOutlookLoading(true);
    try { await fetch('/api/settings/outlook-auth', { method: 'DELETE' }); setOutlook({ loading: false, connected: false, email: '' }); } catch {}
    setOutlookLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/settings');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load');
        if (!cancelled) setForm(prev => ({ ...prev, ...json }));
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    // Mark which tab is dirty
    const tab = TABS.find(t => tabFields[t.key]?.includes(field));
    if (tab) setDirty(prev => new Set(prev).add(tab.key));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save');
      setForm(prev => ({ ...prev, ...json }));
      setDirty(new Set());
      toast.success('Settings saved');
    } catch (err) {
      setError(err.message);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  const tabFields = {
    email: [],
    business: ['businessName', 'industry', 'timezone', 'bookingLink'],
    phone: ['telnyxNumber', 'smsNumber', 'inboxEmail', 'smsEnabled'],
    ai: ['serviceNiche', 'mainOffer', 'toneProfile'],
    templates: ['emailSignature', 'smsTemplate', 'afterHoursSmsTemplate'],
    hours: ['businessHoursStart', 'businessHoursEnd'],
  };

  function renderEmailTab() {
    return (
      <div className="space-y-6">
        {/* Gmail */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-d-primary" />
            <h3 className="text-sm font-medium text-d-text">Gmail</h3>
          </div>
          {gmail.loading ? (
            <div className="flex items-center gap-2 text-d-muted"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs">Checking...</span></div>
          ) : gmail.connected ? (
            <div className="flex items-center justify-between bg-d-bg rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <div><p className="text-sm font-medium text-d-text">{gmail.email}</p><p className="text-xs text-d-muted">Connected</p></div>
              </div>
              <button type="button" onClick={disconnectGmail} disabled={gmailLoading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-50">
                <Unplug className="w-3.5 h-3.5" /> Disconnect
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-d-muted"><XCircle className="w-4 h-4" /><span className="text-xs">Not connected</span></div>
              <button type="button" onClick={connectGmail} disabled={gmailLoading} className="flex items-center gap-2 px-4 py-2 bg-d-primary hover:bg-d-primary/80 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                {gmailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} Connect Gmail
              </button>
            </div>
          )}
          {router.query.gmail === 'error' && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"><p className="text-red-400 text-xs">Connection failed: {router.query.reason || 'Unknown error'}</p></div>}
          {router.query.gmail === 'success' && <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg"><p className="text-green-400 text-xs">Gmail connected!</p></div>}
        </div>
        <div className="border-t border-d-border" />
        {/* Outlook */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-d-primary" />
            <h3 className="text-sm font-medium text-d-text">Outlook / Microsoft 365</h3>
          </div>
          {outlook.loading ? (
            <div className="flex items-center gap-2 text-d-muted"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs">Checking...</span></div>
          ) : outlook.connected ? (
            <div className="flex items-center justify-between bg-d-bg rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <div><p className="text-sm font-medium text-d-text">{outlook.email}</p><p className="text-xs text-d-muted">Connected</p></div>
              </div>
              <button type="button" onClick={disconnectOutlook} disabled={outlookLoading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-50">
                <Unplug className="w-3.5 h-3.5" /> Disconnect
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-d-muted"><XCircle className="w-4 h-4" /><span className="text-xs">Not connected</span></div>
              <button type="button" onClick={connectOutlook} disabled={outlookLoading} className="flex items-center gap-2 px-4 py-2 bg-d-primary hover:bg-d-primary/80 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                {outlookLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} Connect Outlook
              </button>
            </div>
          )}
          {router.query.outlook === 'error' && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"><p className="text-red-400 text-xs">Connection failed: {router.query.reason || 'Unknown error'}</p></div>}
          {router.query.outlook === 'success' && <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg"><p className="text-green-400 text-xs">Outlook connected!</p></div>}
        </div>
      </div>
    );
  }

  function renderBusinessTab() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-d-muted mb-1">Business name</label>
          <input type="text" value={form.businessName} onChange={e => updateField('businessName', e.target.value)} className={INPUT_CLASS} placeholder="BlueWise AI" />
        </div>
        <div>
          <label className="block text-xs text-d-muted mb-1">Industry / niche</label>
          <input type="text" value={form.industry} onChange={e => updateField('industry', e.target.value)} className={INPUT_CLASS} placeholder="Chimney, HVAC, Roofing..." />
        </div>
        <div>
          <label className="block text-xs text-d-muted mb-1">Timezone</label>
          <Select value={form.timezone} onChange={v => updateField('timezone', v)} options={TIMEZONES} />
        </div>
        <div>
          <label className="block text-xs text-d-muted mb-1">Booking link</label>
          <input type="url" value={form.bookingLink} onChange={e => updateField('bookingLink', e.target.value)} className={INPUT_CLASS} placeholder="https://calendly.com/..." />
        </div>
      </div>
    );
  }

  function renderPhoneTab() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-d-muted mb-1">Telnyx number (main DID)</label>
          <input type="text" value={form.telnyxNumber} onChange={e => updateField('telnyxNumber', e.target.value)} className={INPUT_CLASS} placeholder="+14505550123" />
        </div>
        <div>
          <label className="block text-xs text-d-muted mb-1">SMS sender number</label>
          <input type="text" value={form.smsNumber} onChange={e => updateField('smsNumber', e.target.value)} className={INPUT_CLASS} placeholder="+14505550123" />
        </div>
        <div>
          <label className="block text-xs text-d-muted mb-1">Inbox email</label>
          <input type="email" value={form.inboxEmail} onChange={e => updateField('inboxEmail', e.target.value)} className={INPUT_CLASS} placeholder="leads@yourdomain.com" />
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-7">
          <input id="smsEnabled" type="checkbox" checked={form.smsEnabled} onChange={e => updateField('smsEnabled', e.target.checked)} className="h-4 w-4 rounded border-d-border bg-d-surface text-d-primary focus:ring-d-primary" />
          <label htmlFor="smsEnabled" className="text-xs text-d-muted">Enable SMS automation</label>
        </div>
      </div>
    );
  }

  function renderAiTab() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-d-muted mb-1">Service niche</label>
          <input type="text" value={form.serviceNiche} onChange={e => updateField('serviceNiche', e.target.value)} className={INPUT_CLASS} placeholder="Chimney installs, wood stoves..." />
        </div>
        <div>
          <label className="block text-xs text-d-muted mb-1">Main offer / outcome</label>
          <input type="text" value={form.mainOffer} onChange={e => updateField('mainOffer', e.target.value)} className={INPUT_CLASS} placeholder="We install X in Y days..." />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-d-muted mb-1">Tone / language instructions</label>
          <textarea rows={4} value={form.toneProfile} onChange={e => updateField('toneProfile', e.target.value)} className={TEXTAREA_CLASS} placeholder='Ex: "friendly, direct, Québec French when possible"' />
        </div>
      </div>
    );
  }

  function renderTemplatesTab() {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-d-muted mb-1">Email signature (HTML)</label>
          <textarea rows={4} value={form.emailSignature} onChange={e => updateField('emailSignature', e.target.value)} className={`${TEXTAREA_CLASS} font-mono text-xs`} placeholder="<p>Your name<br>Company</p>" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-d-muted mb-1">SMS template (business hours)</label>
            <textarea rows={4} value={form.smsTemplate} onChange={e => updateField('smsTemplate', e.target.value)} className={`${TEXTAREA_CLASS} text-xs`} placeholder="Hey {{name}}, we just missed your call..." />
          </div>
          <div>
            <label className="block text-xs text-d-muted mb-1">After-hours SMS template</label>
            <textarea rows={4} value={form.afterHoursSmsTemplate} onChange={e => updateField('afterHoursSmsTemplate', e.target.value)} className={`${TEXTAREA_CLASS} text-xs`} placeholder="We're currently closed..." />
          </div>
        </div>
      </div>
    );
  }

  function renderHoursTab() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-xs text-d-muted mb-1">Start time</label>
          <input type="time" value={form.businessHoursStart || ''} onChange={e => updateField('businessHoursStart', e.target.value)} className={INPUT_CLASS} />
        </div>
        <div>
          <label className="block text-xs text-d-muted mb-1">End time</label>
          <input type="time" value={form.businessHoursEnd || ''} onChange={e => updateField('businessHoursEnd', e.target.value)} className={INPUT_CLASS} />
        </div>
        <p className="text-xs text-d-muted">Determines which SMS template to use (normal vs after-hours) based on your timezone.</p>
      </div>
    );
  }

  const tabRenderers = { email: renderEmailTab, business: renderBusinessTab, phone: renderPhoneTab, ai: renderAiTab, templates: renderTemplatesTab, hours: renderHoursTab };

  return (
    <DashboardLayout title="Settings">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold">Settings</h1>
          <p className="text-sm text-d-muted">Configure your automations and business profile.</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/60 bg-rose-950/40 px-4 py-3 text-xs text-rose-100">{error}</div>
      )}

      <div className="flex gap-6">
        {/* Tab nav — desktop sidebar, mobile horizontal scroll */}
        <nav className="hidden md:flex flex-col w-48 shrink-0 space-y-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            const isDirty = dirty.has(tab.key);
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors text-left ${
                  isActive ? 'bg-d-primary/10 text-d-primary font-medium border-l-2 border-d-primary' : 'text-d-muted hover:bg-d-border/20'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{tab.label}</span>
                {isDirty && <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" />}
              </button>
            );
          })}
        </nav>

        {/* Mobile tab bar */}
        <div className="md:hidden flex overflow-x-auto gap-1 -mx-4 px-4 pb-3 mb-3 border-b border-d-border shrink-0">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs whitespace-nowrap transition-colors shrink-0 ${
                  isActive ? 'bg-d-primary/15 text-d-primary font-medium' : 'text-d-muted'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border border-d-border bg-d-surface p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              {(() => { const Tab = TABS.find(t => t.key === activeTab); const Icon = Tab?.icon || Settings; return <Icon className="w-4 h-4 text-d-primary" />; })()}
              <h2 className="text-sm font-semibold text-d-text">{TABS.find(t => t.key === activeTab)?.label}</h2>
            </div>

            {loading ? (
              <div className="space-y-4">
                <SkeletonPulse className="h-10 w-full" />
                <SkeletonPulse className="h-10 w-full" />
                <SkeletonPulse className="h-10 w-2/3" />
              </div>
            ) : (
              tabRenderers[activeTab]?.()
            )}

            {/* Save button per section */}
            {activeTab !== 'email' && !loading && (
              <div className="flex justify-end mt-6 pt-4 border-t border-d-border/40">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-d-primary hover:bg-d-primary/80 text-white shadow-[0_0_18px_rgb(var(--d-primary-rgb)/0.9)] disabled:opacity-60 transition"
                >
                  {saving ? 'Saving...' : 'Save settings'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
