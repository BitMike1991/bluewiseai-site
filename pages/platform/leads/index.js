// pages/platform/leads/index.js
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../src/components/dashboard/DashboardLayout';
import { useBranding } from '../../../src/components/dashboard/BrandingContext';
import { getBrandingStyles, getStatusBadgeStyle } from '../../../src/components/dashboard/brandingUtils';
import { getAvatarColor, getInitial } from '../../../src/lib/dashboardUtils';
import Select from '../../../src/components/ui/Select';
import { SkeletonListRow } from '../../../src/components/ui/Skeleton';
import EmptyState from '../../../src/components/ui/EmptyState';
import { Users, Plus, X } from 'lucide-react';

const SOURCE_LIST = ['manual', 'missed_call', 'cold_outreach', 'email', 'sms', 'form', 'referral', 'meta_ads', 'website'];

function AddLeadModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', city: '', source: 'manual', language: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name && !form.phone && !form.email) {
      setError('At least one of name, phone, or email is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create lead');
      onCreated(json.lead);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl border border-d-border bg-d-bg shadow-2xl shadow-black/60">
          <div className="flex items-center justify-between border-b border-d-border px-5 py-4">
            <h2 className="text-sm font-semibold text-d-text">Add Lead</h2>
            <button onClick={onClose} className="text-d-muted hover:text-d-text"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-d-muted mb-1">Name</label>
                <input value={form.name} onChange={set('name')} placeholder="John Doe" className="w-full rounded-xl border border-d-border bg-d-surface px-3 py-2 text-sm text-d-text placeholder:text-d-muted focus:outline-none focus:ring-2 focus:ring-d-primary/50" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-d-muted mb-1">Phone</label>
                <input value={form.phone} onChange={set('phone')} placeholder="+15145551234" className="w-full rounded-xl border border-d-border bg-d-surface px-3 py-2 text-sm text-d-text placeholder:text-d-muted focus:outline-none focus:ring-2 focus:ring-d-primary/50" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-d-muted mb-1">Email</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="john@example.com" className="w-full rounded-xl border border-d-border bg-d-surface px-3 py-2 text-sm text-d-text placeholder:text-d-muted focus:outline-none focus:ring-2 focus:ring-d-primary/50" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-d-muted mb-1">City</label>
                <input value={form.city} onChange={set('city')} placeholder="Montreal" className="w-full rounded-xl border border-d-border bg-d-surface px-3 py-2 text-sm text-d-text placeholder:text-d-muted focus:outline-none focus:ring-2 focus:ring-d-primary/50" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-d-muted mb-1">Source</label>
                <select value={form.source} onChange={set('source')} className="w-full rounded-xl border border-d-border bg-d-surface px-3 py-2 text-sm text-d-text focus:outline-none focus:ring-2 focus:ring-d-primary/50">
                  {SOURCE_LIST.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-d-muted mb-1">Language</label>
                <select value={form.language} onChange={set('language')} className="w-full rounded-xl border border-d-border bg-d-surface px-3 py-2 text-sm text-d-text focus:outline-none focus:ring-2 focus:ring-d-primary/50">
                  <option value="">—</option>
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-d-muted mb-1">Notes</label>
              <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Optional notes..." className="w-full rounded-xl border border-d-border bg-d-surface px-3 py-2 text-sm text-d-text placeholder:text-d-muted focus:outline-none focus:ring-2 focus:ring-d-primary/50 resize-y" />
            </div>
            {error && <p className="text-xs text-rose-500">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-d-border text-xs font-medium text-d-muted hover:text-d-text">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-d-primary text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50">
                {saving ? 'Creating...' : 'Create Lead'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'active', label: 'Active / In convo' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All sources' },
  { value: 'missed_call', label: 'Missed calls' },
  { value: 'cold_outreach', label: 'Cold outreach' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'form', label: 'Form' },
  { value: 'manual', label: 'Manual' },
  { value: 'referral', label: 'Referral' },
];

const DATE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: '1', label: 'Today' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

const SORT_OPTIONS = [
  { value: 'activity', label: 'Recent activity' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name-az', label: 'Name A\u2013Z' },
  { value: 'name-za', label: 'Name Z\u2013A' },
];

function statusBadgeClasses(status) {
  const base =
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  switch ((status || '').toLowerCase()) {
    case 'won':
      return `${base} bg-emerald-500/15 text-emerald-500 border border-emerald-500/40`;
    case 'lost':
    case 'dead':
      return `${base} bg-rose-500/10 text-rose-500 border border-rose-500/40`;
    case 'quoted':
      return `${base} bg-amber-500/15 text-amber-500 border border-amber-500/40`;
    case 'active':
    case 'in_convo':
      return `${base} bg-d-primary/15 text-d-primary border border-d-primary/40`;
    default:
      return `${base} bg-d-border/60 text-d-text border border-d-border/40`;
  }
}

export default function LeadsPage() {
  const router = useRouter();
  const { branding } = useBranding();
  const styles = getBrandingStyles(branding);
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const [addOpen, setAddOpen] = useState(false);

  // Open modal when ?create=true
  useEffect(() => {
    if (router.query.create === 'true') {
      setAddOpen(true);
      // Clean URL without reloading
      router.replace('/platform/leads', undefined, { shallow: true });
    }
  }, [router.query.create]);

  async function loadLeads(params = {}) {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams({
        page: String(params.page ?? page),
        pageSize: String(pageSize),
      });

      const statusValue = params.statusFilter ?? statusFilter;
      if (statusValue && statusValue !== 'all') {
        query.set('status', statusValue);
      }

      const sourceValue = params.sourceFilter ?? sourceFilter;
      if (sourceValue && sourceValue !== 'all') {
        query.set('source', sourceValue);
      }

      const dateValue = params.dateFilter ?? dateFilter;
      if (dateValue && dateValue !== 'all') {
        query.set('dateRange', dateValue);
      }

      const sortValue = params.sortBy ?? sortBy;
      if (sortValue) {
        query.set('sort', sortValue);
      }

      const searchValue = params.search ?? search;
      if (searchValue && searchValue.trim().length > 0) {
        query.set('search', searchValue.trim());
      }

      const res = await fetch(`/api/leads?${query.toString()}`, { signal: abortRef.current.signal });
      if (!res.ok) {
        throw new Error(`Failed to load leads: ${res.status}`);
      }
      const json = await res.json();
      setLeads(json.items || []);
      setTotal(json.total || 0);
      setPage(json.page || 1);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    loadLeads({ page: 1, statusFilter: value });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadLeads({ page: 1, search });
  };

  const handleRowClick = (leadId) => {
    if (!leadId) return;
    router.push(`/platform/leads/${leadId}`);
  };

  const handlePrev = () => {
    if (page <= 1) return;
    const newPage = page - 1;
    loadLeads({ page: newPage });
  };

  const handleNext = () => {
    if (page >= totalPages) return;
    const newPage = page + 1;
    loadLeads({ page: newPage });
  };

  return (
    <DashboardLayout title="Leads">
      <AddLeadModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(lead) => {
          setAddOpen(false);
          router.push(`/platform/leads/${lead.id}`);
        }}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold">Leads</h1>
          <p className="text-sm">
            All leads captured by your automations (missed calls, emails, forms, cold outreach).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-d-primary text-white text-xs font-medium hover:opacity-90 transition shadow-[0_0_18px_rgb(var(--d-primary-rgb)/0.55)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Lead
          </button>
          <div className="text-xs">
            {total} lead{total === 1 ? '' : 's'} · Page {page} of {totalPages}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-d-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8" strokeWidth="2"/><path strokeLinecap="round" strokeWidth="2" d="m21 21-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded-xl pl-9 pr-3 py-2 text-sm placeholder:text-d-muted focus:outline-none focus:ring-2 focus:ring-d-primary/50 bg-d-surface border-d-border text-d-text"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 md:py-2 rounded-xl text-xs font-medium transition min-h-[44px] md:min-h-0 bg-d-primary text-white hover:opacity-90"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Select value={statusFilter} onChange={(v) => { setStatusFilter(v); loadLeads({ page: 1, statusFilter: v }); }} options={STATUS_OPTIONS} />
          <Select value={sourceFilter} onChange={(v) => { setSourceFilter(v); loadLeads({ page: 1, sourceFilter: v }); }} options={SOURCE_OPTIONS} />
          <Select value={dateFilter} onChange={(v) => { setDateFilter(v); loadLeads({ page: 1, dateFilter: v }); }} options={DATE_OPTIONS} />
          <Select value={sortBy} onChange={(v) => { setSortBy(v); loadLeads({ page: 1, sortBy: v }); }} options={SORT_OPTIONS} />
        </div>
      </div>

      {/* Leads table/card hybrid */}
      <div className="rounded-2xl border shadow-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold border-b" style={{ color: styles.text.secondary, borderColor: styles.card.borderColor }}>
          <div className="col-span-4">Lead</div>
          <div className="col-span-2">Source</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Last contact</div>
          <div className="col-span-2 text-right pr-2">Summary</div>
        </div>

        {loading && (
          <div className="px-3 py-2 space-y-1">
            {Array.from({ length: 8 }, (_, i) => <SkeletonListRow key={i} />)}
          </div>
        )}

        {!loading && leads.length === 0 && (
          <EmptyState icon={Users} title="No leads found" description="Try adjusting your filters or add a new lead" action={{ label: "Add Lead", onClick: () => router.push("/platform/leads?create=true") }} />
        )}

        <ul className="divide-y divide-d-border">
          {leads.map((lead) => {
            // IDs coming from API
            const leadId = lead.lead_id ?? lead.id;

            // Safe display name, avoiding literal "null"/"undefined"
            let displayName = lead?.name;
            if (
              !displayName ||
              displayName === 'null' ||
              displayName === 'undefined'
            ) {
              displayName =
                lead.email ||
                lead.phone ||
                (leadId ? `Lead #${leadId}` : 'Unknown lead');
            }

            // Last contact fallback: last_contact_at -> last_message_at -> first_seen_at
            const lastContactRaw =
              lead.last_contact_at ||
              lead.last_message_at ||
              lead.first_seen_at ||
              null;

            const lastContactLabel = lastContactRaw
              ? new Date(lastContactRaw).toLocaleString()
              : '\u2014';

            return (
              <li
                key={leadId}
                onClick={() => handleRowClick(leadId)}
                className="cursor-pointer hover:bg-d-surface/50 transition-colors"
              >
                <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
                  {/* Lead main info */}
                  <div className="md:col-span-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${getAvatarColor(displayName)}`}>
                        {getInitial(displayName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between md:block">
                          <div>
                            <p className="text-sm font-medium">
                              {displayName}
                            </p>
                            <p className="text-xs truncate">
                              {lead.phone && <span>{lead.phone}</span>}
                              {lead.phone && lead.email && <span>{" \u00b7 "}</span>}
                              {lead.email && <span className="truncate">{lead.email}</span>}
                            </p>
                          </div>
                          {/* Mobile badge */}
                          <span
                            className="md:hidden mt-1"
                            style={getStatusBadgeStyle(lead.status)}
                          >
                            {lead.status || 'new'}
                          </span>
                        </div>
                        {(lead.city || lead.notes) && (
                          <p className="hidden md:block text-xs mt-0.5" style={{ color: styles.text.secondary }}>
                            {[lead.city, lead.notes].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Source */}
                  <div className="md:col-span-2 text-xs">
                    {lead.source || 'unknown'}
                  </div>

                  {/* Status */}
                  <div className="hidden md:block md:col-span-2">
                    <span style={getStatusBadgeStyle(lead.status)}>
                      {lead.status || 'new'}
                    </span>
                  </div>

                  {/* Last contact */}
                  <div className="md:col-span-2 text-xs">
                    {lastContactLabel}
                  </div>

                  {/* Summary */}
                  <div className="md:col-span-2 text-xs text-right md:text-right">
                    {(lead.summary || lead.notes) ? (
                      <span className="line-clamp-1">{lead.summary || lead.notes}</span>
                    ) : (
                      <span style={{ color: styles.text.secondary, opacity: 0.5 }}>No summary</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Pagination footer */}
        {!loading && leads.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-xs">
            <div>
              Showing {(page - 1) * pageSize + 1}{"\u2013"}{Math.min(page * pageSize, total)} of {total}
            </div>
            <div className="space-x-2">
              <button
                onClick={handlePrev}
                disabled={page <= 1}
                className="px-4 py-2 md:py-1 rounded-lg border text-xs disabled:opacity-40 disabled:cursor-default transition min-h-[44px] md:min-h-0"
              >
                Prev
              </button>
              <button
                onClick={handleNext}
                disabled={page >= totalPages}
                className="px-4 py-2 md:py-1 rounded-lg border text-xs disabled:opacity-40 disabled:cursor-default transition min-h-[44px] md:min-h-0"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 text-xs text-rose-400 border-t">
            Error loading leads: {error}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
