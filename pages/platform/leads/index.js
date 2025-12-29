// pages/platform/leads/index.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../src/components/dashboard/DashboardLayout';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'active', label: 'Active / In convo' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

function statusBadgeClasses(status) {
  const base =
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  switch ((status || '').toLowerCase()) {
    case 'won':
      return `${base} bg-emerald-500/15 text-emerald-300 border border-emerald-500/40`;
    case 'lost':
    case 'dead':
      return `${base} bg-rose-500/10 text-rose-300 border border-rose-500/40`;
    case 'quoted':
      return `${base} bg-amber-500/15 text-amber-300 border border-amber-500/40`;
    case 'active':
    case 'in_convo':
      return `${base} bg-sky-500/15 text-sky-300 border border-sky-500/40`;
    default:
      return `${base} bg-slate-700/60 text-slate-100 border border-slate-500/40`;
  }
}

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadLeads(params = {}) {
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

      const searchValue = params.search ?? search;
      if (searchValue && searchValue.trim().length > 0) {
        query.set('search', searchValue.trim());
      }

      const res = await fetch(`/api/leads?${query.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load leads: ${res.status}`);
      }
      const json = await res.json();
      setLeads(json.items || []);
      setTotal(json.total || 0);
      setPage(json.page || 1);
    } catch (err) {
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

  const handleStatusChange = (e) => {
    const value = e.target.value;
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Leads</h1>
          <p className="text-sm text-slate-400">
            All leads captured by your automations (missed calls, emails, forms, cold outreach).
          </p>
        </div>
        <div className="text-xs text-slate-500">
          {total} lead{total === 1 ? '' : 's'} · Page {page} of {totalPages}
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-col md:flex-row md:items-center md:space-x-3 space-y-3 md:space-y-0 mb-4">
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 flex items-center space-x-2"
        >
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by name, email, or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/70 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500/60"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 md:py-2 rounded-xl text-xs font-medium bg-sky-500 hover:bg-sky-400 text-white shadow-sm shadow-sky-500/40 transition min-h-[44px] md:min-h-0"
          >
            Search
          </button>
        </form>

        <div className="w-full md:w-52">
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="w-full bg-slate-900/70 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/60"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leads table/card hybrid */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-lg shadow-slate-950/60 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-slate-400 border-b border-slate-800/80">
          <div className="col-span-4">Lead</div>
          <div className="col-span-2">Source</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Last contact</div>
          <div className="col-span-2 text-right pr-2">Summary</div>
        </div>

        {loading && (
          <div className="px-4 py-6 text-sm text-slate-400">
            Loading leads…
          </div>
        )}

        {!loading && leads.length === 0 && (
          <div className="px-4 py-6 text-sm text-slate-400">
            No leads found. Once your automations capture calls or emails, they’ll appear here.
          </div>
        )}

        <ul className="divide-y divide-slate-800/80">
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
              : '—';

            return (
              <li
                key={leadId}
                onClick={() => handleRowClick(leadId)}
                className="cursor-pointer hover:bg-slate-900/80 transition-colors"
              >
                <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
                  {/* Lead main info */}
                  <div className="md:col-span-4">
                    <div className="flex items-center justify-between md:block">
                      <div>
                        <p className="text-sm font-medium text-slate-50">
                          {displayName}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {lead.phone && <span>{lead.phone}</span>}
                          {lead.phone && lead.email && <span> · </span>}
                          {lead.email && <span>{lead.email}</span>}
                        </p>
                      </div>
                      {/* Mobile badge */}
                      <span
                        className={`md:hidden mt-1 ${statusBadgeClasses(
                          lead.status
                        )}`}
                      >
                        {lead.status || 'new'}
                      </span>
                    </div>
                    {lead.city && (
                      <p className="hidden md:block text-xs text-slate-500 mt-0.5">
                        {lead.city}
                      </p>
                    )}
                  </div>

                  {/* Source */}
                  <div className="md:col-span-2 text-xs text-slate-400">
                    {lead.source || 'unknown'}
                  </div>

                  {/* Status */}
                  <div className="hidden md:block md:col-span-2">
                    <span className={statusBadgeClasses(lead.status)}>
                      {lead.status || 'new'}
                    </span>
                  </div>

                  {/* Last contact */}
                  <div className="md:col-span-2 text-xs text-slate-400">
                    {lastContactLabel}
                  </div>

                  {/* Summary */}
                  <div className="md:col-span-2 text-xs text-slate-400 text-right md:text-right">
                    {lead.summary ? (
                      <span className="line-clamp-1">{lead.summary}</span>
                    ) : (
                      <span className="text-slate-600">No summary</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Pagination footer */}
        {!loading && leads.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/80 text-xs text-slate-400">
            <div>
              Showing {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, total)} of {total}
            </div>
            <div className="space-x-2">
              <button
                onClick={handlePrev}
                disabled={page <= 1}
                className="px-4 py-2 md:py-1 rounded-lg border border-slate-700/80 text-xs disabled:opacity-40 disabled:cursor-default hover:bg-slate-800/80 transition min-h-[44px] md:min-h-0"
              >
                Prev
              </button>
              <button
                onClick={handleNext}
                disabled={page >= totalPages}
                className="px-4 py-2 md:py-1 rounded-lg border border-slate-700/80 text-xs disabled:opacity-40 disabled:cursor-default hover:bg-slate-800/80 transition min-h-[44px] md:min-h-0"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 text-xs text-rose-400 border-t border-slate-800/80">
            Error loading leads: {error}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
