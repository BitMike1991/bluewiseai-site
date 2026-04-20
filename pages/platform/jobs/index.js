// pages/platform/jobs/index.js
// P8 — Pipeline list view for Jobs / Projets
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../src/components/dashboard/DashboardLayout';
import { getAvatarColor, getInitial } from '../../../src/lib/dashboardUtils';
import { SkeletonListRow } from '../../../src/components/ui/Skeleton';
import EmptyState from '../../../src/components/ui/EmptyState';
import StatusBadge from '../../../src/components/jobs/StatusBadge';
import {
  STATUS_META,
  STATUS_ORDER,
  STATUS_GROUPS,
  DEFAULT_ACTIVE_STATUSES,
  getStatusMeta,
} from '../../../lib/status-config';
import {
  Briefcase,
  Search,
  LayoutList,
  LayoutGrid,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ExternalLink,
} from 'lucide-react';

import { fmtMoneyOrDash as formatCurrencyQC } from '../../../lib/formatters';

// ── Helpers ──────────────────────────────────────────────────────────────────


function relativeTime(dateStr) {
  if (!dateStr) return '\u2014';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)   return "À l'instant";
  if (mins < 60)  return `il y a ${mins}\u00a0min`;
  if (hours < 24) return `il y a ${hours}\u00a0h`;
  if (days < 30)  return `il y a ${days}\u00a0jour${days > 1 ? 's' : ''}`;
  const months = Math.floor(days / 30);
  return `il y a ${months}\u00a0mois`;
}

function truncate(str, n) {
  if (!str) return '\u2014';
  return str.length > n ? str.slice(0, n) + '\u2026' : str;
}

// ── Status filter multi-select ────────────────────────────────────────────────

const GROUP_LABELS = {
  in_progress: 'En cours',
  active:      'Actifs',
  done:        'Terminés',
};

function StatusMultiSelect({ selected, onChange }) {
  const [open, setOpen] = useState(false);

  const allActive = DEFAULT_ACTIVE_STATUSES.every((s) => selected.includes(s)) &&
    !STATUS_GROUPS.done.some((s) => selected.includes(s));
  const allStatuses = STATUS_ORDER.every((s) => selected.includes(s));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-d-border bg-d-surface text-xs text-d-text hover:border-d-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50 transition min-h-[44px] md:min-h-0"
        aria-label="Filtrer par statut"
        aria-expanded={open}
      >
        <span className="text-d-muted">Statut :</span>
        <span className="font-medium">
          {allActive ? 'Actifs' : allStatuses ? 'Tous' : `${selected.length} sélectionné${selected.length > 1 ? 's' : ''}`}
        </span>
        <ChevronDown size={12} className={`text-d-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 top-full mt-1 right-0 w-64 bg-d-surface border border-d-border rounded-xl shadow-xl shadow-black/40 py-2">
          {/* Quick selects */}
          <div className="flex gap-1 px-3 pb-2 border-b border-d-border mb-1">
            <button
              type="button"
              className="px-2 py-1 text-[10px] rounded-lg bg-d-primary/15 text-d-primary hover:bg-d-primary/25 transition"
              onClick={() => { onChange(DEFAULT_ACTIVE_STATUSES); setOpen(false); }}
            >
              Actifs
            </button>
            <button
              type="button"
              className="px-2 py-1 text-[10px] rounded-lg bg-d-surface/60 border border-d-border text-d-muted hover:border-d-primary/40 transition"
              onClick={() => { onChange(STATUS_ORDER); setOpen(false); }}
            >
              Tous
            </button>
            <button
              type="button"
              className="px-2 py-1 text-[10px] rounded-lg bg-d-surface/60 border border-d-border text-d-muted hover:border-d-primary/40 transition"
              onClick={() => { onChange([]); setOpen(false); }}
            >
              Aucun
            </button>
          </div>

          {Object.entries(STATUS_GROUPS).map(([group, statuses]) => (
            <div key={group} className="mb-1">
              <p className="px-3 py-1 text-[10px] font-semibold text-d-muted uppercase tracking-wider">
                {GROUP_LABELS[group]}
              </p>
              {statuses.map((s) => {
                const meta = STATUS_META[s];
                const checked = selected.includes(s);
                return (
                  <label
                    key={s}
                    className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-d-border/30 transition"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        if (checked) onChange(selected.filter((x) => x !== s));
                        else onChange([...selected, s]);
                      }}
                      className="rounded accent-[var(--d-primary)]"
                    />
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border"
                      style={{ color: meta.color, backgroundColor: meta.bg, borderColor: meta.color + '55' }}
                    >
                      {meta.label}
                    </span>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
      )}
    </div>
  );
}

// ── Action menu ───────────────────────────────────────────────────────────────

function JobActionMenu({ jobId, onNavigate }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="p-1.5 rounded-lg hover:bg-d-border/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
        aria-label="Actions pour ce projet"
        aria-expanded={open}
      >
        <MoreHorizontal size={14} className="text-d-muted" />
      </button>

      {open && (
        <>
          <div className="absolute z-20 top-full right-0 mt-1 w-44 bg-d-surface border border-d-border rounded-xl shadow-xl shadow-black/40 py-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(false); onNavigate(jobId); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-d-text hover:bg-d-border/30 transition"
            >
              <ExternalLink size={12} className="text-d-muted" />
              Voir détails
            </button>
            <div className="border-t border-d-border/50 my-1" />
            <button
              type="button"
              disabled
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-d-muted cursor-not-allowed opacity-50"
              title="Disponible dans P10"
            >
              Modifier le statut
            </button>
            <button
              type="button"
              disabled
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-d-muted cursor-not-allowed opacity-50"
              title="Disponible dans P10"
            >
              Envoyer devis
            </button>
          </div>
          <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpen(false); }} aria-hidden="true" />
        </>
      )}
    </div>
  );
}

// ── Pipeline progress dots ────────────────────────────────────────────────────

function PipelineDots({ status }) {
  const currentMeta = getStatusMeta(status);
  const order = currentMeta.order <= 13 ? currentMeta.order : 0;
  // Show 13 canonical stages (exclude legacy order 999)
  return (
    <div className="flex items-center gap-0.5">
      {STATUS_ORDER.map((s, i) => {
        const idx = i + 1;
        const done = order > idx;
        const current = order === idx;
        return (
          <span
            key={s}
            className={`inline-block rounded-full transition-all ${
              current ? 'w-2.5 h-2.5' : 'w-1.5 h-1.5'
            }`}
            style={{
              backgroundColor: done
                ? '#22c55e'
                : current
                ? getStatusMeta(status).color
                : '#e5e7eb',
            }}
            title={STATUS_META[s]?.label}
          />
        );
      })}
    </div>
  );
}

// ── Kanban card ───────────────────────────────────────────────────────────────

function KanbanCard({ job, onClick }) {
  const displayName = job.client_name || job.client_email || job.client_phone || 'Client inconnu';
  return (
    <button
      type="button"
      onClick={() => onClick(job.id)}
      className="w-full text-left bg-d-surface border border-d-border rounded-xl p-3 shadow-sm hover:border-d-primary/40 hover:shadow-d-primary/10 hover:shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
    >
      <p className="text-xs font-semibold text-d-text truncate">{displayName}</p>
      {job.project_type && (
        <p className="text-[10px] text-d-muted mt-0.5 truncate">
          {job.project_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </p>
      )}
      {job.latest_quote_total_ttc != null && (
        <p className="text-[10px] text-d-primary font-medium mt-1.5">
          {formatCurrencyQC(job.latest_quote_total_ttc)}
        </p>
      )}
    </button>
  );
}

// ── Kanban view ───────────────────────────────────────────────────────────────

function KanbanView({ jobs, onNavigate }) {
  // Group jobs by status (use getStatusMeta for display consistency)
  const grouped = {};
  for (const job of jobs) {
    const key = job.status || 'draft';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(job);
  }

  // Build column order from canonical + legacy keys present in data
  const dataStatuses = Object.keys(grouped);
  const orderedStatuses = [
    ...STATUS_ORDER.filter((s) => grouped[s]),
    ...dataStatuses.filter((s) => !STATUS_ORDER.includes(s)),
  ];

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {orderedStatuses.map((status) => {
          const meta = getStatusMeta(status);
          const columnJobs = grouped[status] || [];
          return (
            <div key={status} className="w-56 flex-shrink-0">
              <div
                className="flex items-center justify-between mb-2 px-2 py-1.5 rounded-lg"
                style={{ backgroundColor: meta.bg }}
              >
                <span className="text-xs font-semibold" style={{ color: meta.color }}>
                  {meta.label}
                </span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: meta.color + '22', color: meta.color }}
                >
                  {columnJobs.length}
                </span>
              </div>
              <div className="space-y-2">
                {columnJobs.map((job) => (
                  <KanbanCard key={job.id} job={job} onClick={onNavigate} />
                ))}
                {columnJobs.length === 0 && (
                  <div className="rounded-xl border border-dashed border-d-border/50 h-16 flex items-center justify-center">
                    <span className="text-[10px] text-d-muted">Aucun projet</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Sort header ───────────────────────────────────────────────────────────────

function SortableHeader({ children, field, currentSort, onSort, className = '' }) {
  const active = currentSort.field === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 text-xs font-semibold text-d-muted hover:text-d-text transition focus-visible:outline-none ${className}`}
    >
      {children}
      <span className={`text-[10px] ${active ? 'opacity-100' : 'opacity-30'}`}>
        {active && currentSort.dir === 'asc' ? '↑' : '↓'}
      </span>
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

function getInitialView() {
  if (typeof window === 'undefined') return 'list';
  return localStorage.getItem('jobs_view') || 'list';
}

export default function JobsPage() {
  const router = useRouter();

  const [jobs, setJobs]             = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState(DEFAULT_ACTIVE_STATUSES);
  const [showAllTime, setShowAllTime]   = useState(false);
  const [page, setPage]             = useState(1);
  const [sort, setSort]             = useState({ field: 'updated_at', dir: 'desc' });
  const [view, setView]             = useState('list'); // set properly on mount

  // Restore view preference from localStorage after mount
  useEffect(() => {
    setView(getInitialView());
  }, []);

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  const loadJobs = useCallback(async (overrides = {}) => {
    try {
      setLoading(true);
      setError(null);

      const currentPage      = overrides.page         ?? page;
      const currentStatus    = overrides.statusFilter  ?? statusFilter;
      const currentSearch    = overrides.search        ?? search;
      const currentShowAll   = overrides.showAllTime   ?? showAllTime;

      const q = new URLSearchParams();
      q.set('page', String(currentPage));
      q.set('pageSize', String(PAGE_SIZE));

      if (currentStatus.length > 0) {
        q.set('status', currentStatus.join(','));
      }

      if (currentSearch.trim()) {
        q.set('search', currentSearch.trim());
      }

      if (!currentShowAll) {
        const from = new Date();
        from.setDate(from.getDate() - 30);
        q.set('from', from.toISOString().split('T')[0]);
      }

      const res = await fetch(`/api/jobs?${q.toString()}`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json = await res.json();

      setJobs(json.items || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, showAllTime]);

  useEffect(() => {
    loadJobs({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Client-side sort of current page
  const sortedJobs = [...jobs].sort((a, b) => {
    let av = a[sort.field];
    let bv = b[sort.field];
    if (sort.field === 'client_name') {
      av = (av || '').toLowerCase();
      bv = (bv || '').toLowerCase();
    } else {
      av = av ?? '';
      bv = bv ?? '';
    }
    if (av < bv) return sort.dir === 'asc' ? -1 : 1;
    if (av > bv) return sort.dir === 'asc' ? 1 : -1;
    return 0;
  });

  function handleSort(field) {
    setSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { field, dir: 'desc' }
    );
  }

  function handleStatusChange(statuses) {
    setStatusFilter(statuses);
    setPage(1);
    loadJobs({ statusFilter: statuses, page: 1 });
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    loadJobs({ search, page: 1 });
  }

  function handleToggleTime() {
    const next = !showAllTime;
    setShowAllTime(next);
    setPage(1);
    loadJobs({ showAllTime: next, page: 1 });
  }

  function handleNavigate(jobId) {
    router.push(`/platform/jobs/${jobId}`);
  }

  function handlePrev() {
    if (page <= 1) return;
    const next = page - 1;
    setPage(next);
    loadJobs({ page: next });
  }

  function handleNext() {
    if (page >= totalPages) return;
    const next = page + 1;
    setPage(next);
    loadJobs({ page: next });
  }

  function handleViewChange(v) {
    setView(v);
    localStorage.setItem('jobs_view', v);
  }

  return (
    <DashboardLayout title="Projets">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-d-text">Projets</h1>
          <p className="text-sm text-d-muted">
            Pipeline de travaux — de la mesure à la livraison.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="hidden md:flex items-center border border-d-border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => handleViewChange('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50 ${
                view === 'list' ? 'bg-d-primary text-white' : 'text-d-muted hover:text-d-text hover:bg-d-surface'
              }`}
              aria-label="Vue liste"
              aria-pressed={view === 'list'}
            >
              <LayoutList size={13} />
              Liste
            </button>
            <button
              type="button"
              onClick={() => handleViewChange('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50 ${
                view === 'kanban' ? 'bg-d-primary text-white' : 'text-d-muted hover:text-d-text hover:bg-d-surface'
              }`}
              aria-label="Vue Kanban"
              aria-pressed={view === 'kanban'}
            >
              <LayoutGrid size={13} />
              Kanban
            </button>
          </div>

          {/* New project button — opens the internal hub commande tool */}
          <Link
            href="/hub"
            title="Ouvrir l'outil commande pour créer un nouveau devis"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-d-primary text-white hover:bg-d-primary/90 transition border border-d-primary/60"
          >
            + Nouveau projet
          </Link>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="flex-1 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-d-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher un client, ID projet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-d-surface border border-d-border rounded-xl pl-8 pr-3 py-2 text-sm text-d-text placeholder:text-d-text0 focus:outline-none focus:ring-2 focus:ring-d-primary/50 focus:border-d-primary/60"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-medium bg-d-primary hover:bg-d-primary/80 text-white shadow-sm shadow-d-primary/40 transition min-h-[44px] md:min-h-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
          >
            Rechercher
          </button>
        </form>

        {/* Status multi-select */}
        <StatusMultiSelect selected={statusFilter} onChange={handleStatusChange} />

        {/* Date toggle */}
        <button
          type="button"
          onClick={handleToggleTime}
          className={`px-3 py-2 rounded-xl text-xs border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50 min-h-[44px] md:min-h-0 ${
            showAllTime
              ? 'bg-d-primary/15 border-d-primary/40 text-d-primary font-medium'
              : 'bg-d-surface border-d-border text-d-muted hover:border-d-primary/40'
          }`}
        >
          {showAllTime ? 'Tout le temps' : 'Derniers 30\u00a0jours'}
        </button>

        {/* Count */}
        {!loading && (
          <span className="text-xs text-d-muted whitespace-nowrap">
            {total} projet{total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Content */}
      {view === 'kanban' && !loading ? (
        <div className="rounded-2xl border border-d-border shadow-lg p-4">
          {jobs.length === 0 ? (
            <EmptyState icon={Briefcase} title="Aucun projet" description="Aucun projet ne correspond à vos filtres." />
          ) : (
            <KanbanView jobs={sortedJobs} onNavigate={handleNavigate} />
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-d-border shadow-lg overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b border-d-border bg-d-surface/50">
            <div className="col-span-2">
              <SortableHeader field="status" currentSort={sort} onSort={handleSort}>
                Statut
              </SortableHeader>
            </div>
            <div className="col-span-3">
              <SortableHeader field="client_name" currentSort={sort} onSort={handleSort}>
                Client
              </SortableHeader>
            </div>
            <div className="col-span-3 text-xs font-semibold text-d-muted">Projet</div>
            <div className="col-span-2">
              <SortableHeader field="latest_quote_total_ttc" currentSort={sort} onSort={handleSort}>
                Devis
              </SortableHeader>
            </div>
            <div className="col-span-1">
              <SortableHeader field="updated_at" currentSort={sort} onSort={handleSort}>
                Activité
              </SortableHeader>
            </div>
            <div className="col-span-1 text-right text-xs font-semibold text-d-muted sr-only">
              Actions
            </div>
          </div>

          {/* Loading skeletons */}
          {loading && (
            <div className="px-3 py-2 space-y-1">
              {Array.from({ length: 8 }, (_, i) => <SkeletonListRow key={i} />)}
            </div>
          )}

          {/* Empty state */}
          {!loading && jobs.length === 0 && (
            <EmptyState
              icon={Briefcase}
              title="Aucun projet"
              description="Aucun projet ne correspond à vos filtres."
            />
          )}

          {/* Rows */}
          <ul className="divide-y divide-d-border">
            {sortedJobs.map((job) => {
              const displayName = job.client_name || job.client_email || job.client_phone || 'Client inconnu';
              const projectDesc = truncate(job.project_description, 60);
              const projectType = job.project_type
                ? job.project_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                : null;
              const quoteAmt = job.latest_quote_total_ttc ?? job.quote_amount;

              return (
                <li
                  key={job.id}
                  onClick={() => handleNavigate(job.id)}
                  className="cursor-pointer hover:bg-d-surface/40 transition-colors group"
                >
                  <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">

                    {/* Status */}
                    <div className="md:col-span-2 flex items-center gap-1.5">
                      <StatusBadge status={job.status} />
                    </div>

                    {/* Client */}
                    <div className="md:col-span-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${getAvatarColor(displayName)}`}>
                          {getInitial(displayName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-d-text truncate">{displayName}</p>
                          <p className="text-xs text-d-muted truncate">
                            {job.client_phone && <span>{job.client_phone}</span>}
                            {job.client_phone && job.client_email && <span> &middot; </span>}
                            {job.client_email && <span className="hidden md:inline">{job.client_email}</span>}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Project description */}
                    <div className="md:col-span-3 text-xs text-d-muted">
                      {projectType && (
                        <p className="text-d-text font-medium mb-0.5">{projectType}</p>
                      )}
                      <p className="text-d-muted">{projectDesc}</p>
                    </div>

                    {/* Devis amount */}
                    <div className="md:col-span-2 text-xs font-medium text-d-text">
                      {quoteAmt != null ? formatCurrencyQC(quoteAmt) : <span className="text-d-muted">&mdash;</span>}
                    </div>

                    {/* Last activity */}
                    <div className="md:col-span-1 text-xs text-d-muted">
                      {relativeTime(job.updated_at)}
                    </div>

                    {/* Actions */}
                    <div
                      className="md:col-span-1 flex justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <JobActionMenu jobId={job.id} onNavigate={handleNavigate} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Pagination */}
          {!loading && jobs.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-d-border text-xs text-d-muted">
              <span>
                {(page - 1) * PAGE_SIZE + 1}&ndash;{Math.min(page * PAGE_SIZE, total)} sur {total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrev}
                  disabled={page <= 1}
                  aria-label="Page précédente"
                  className="p-1.5 rounded-lg border border-d-border disabled:opacity-40 disabled:cursor-default hover:bg-d-surface/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
                >
                  <ChevronLeft size={13} />
                </button>
                <span className="px-2 text-d-text">{page} / {totalPages}</span>
                <button
                  onClick={handleNext}
                  disabled={page >= totalPages}
                  aria-label="Page suivante"
                  className="p-1.5 rounded-lg border border-d-border disabled:opacity-40 disabled:cursor-default hover:bg-d-surface/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="px-4 py-3 text-xs text-rose-400 border-t border-d-border">
              Erreur lors du chargement : {error}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
