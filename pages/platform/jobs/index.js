// pages/platform/jobs/index.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../src/components/dashboard/DashboardLayout';
import { useBranding } from '../../../src/components/dashboard/BrandingContext';
import { getBrandingStyles, getStatusBadgeStyle } from '../../../src/components/dashboard/brandingUtils';
import { getAvatarColor, getInitial } from '../../../src/lib/dashboardUtils';
import Select from '../../../src/components/ui/Select';
import { SkeletonListRow } from '../../../src/components/ui/Skeleton';
import EmptyState from '../../../src/components/ui/EmptyState';
import { Briefcase } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'quote_sent', label: 'Quote Sent' },
  { value: 'contract_sent', label: 'Contract Sent' },
  { value: 'signed', label: 'Signed' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_COLORS = {
  draft: 'bg-d-border/60 text-d-text border-d-border/40',
  quote_sent: 'bg-violet-500/15 text-violet-500 border-violet-500/40',
  contract_sent: 'bg-amber-500/15 text-amber-500 border-amber-500/40',
  signed: 'bg-d-primary/15 text-d-primary border-d-primary/40',
  scheduled: 'bg-indigo-500/15 text-indigo-500 border-indigo-500/40',
  in_progress: 'bg-orange-500/15 text-orange-500 border-orange-500/40',
  completed: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/40',
  cancelled: 'bg-rose-500/10 text-rose-500 border-rose-500/40',
};

function statusBadge(status) {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border';
  const colors = STATUS_COLORS[(status || '').toLowerCase()] || STATUS_COLORS.draft;
  return `${base} ${colors}`;
}

function statusLabel(status) {
  const s = (status || 'draft').toLowerCase();
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return '\u2014';
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function JobsPage() {
  const router = useRouter();
  const { branding } = useBranding();
  const styles = getBrandingStyles(branding);
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadJobs(params = {}) {
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

      const res = await fetch(`/api/jobs?${query.toString()}`);
      if (!res.ok) throw new Error(`Failed to load jobs: ${res.status}`);
      const json = await res.json();
      setJobs(json.items || []);
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
    loadJobs({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    loadJobs({ page: 1, statusFilter: value });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadJobs({ page: 1, search });
  };

  const handleRowClick = (jobId) => {
    if (!jobId) return;
    router.push(`/platform/jobs/${jobId}`);
  };

  const handlePrev = () => {
    if (page <= 1) return;
    loadJobs({ page: page - 1 });
  };

  const handleNext = () => {
    if (page >= totalPages) return;
    loadJobs({ page: page + 1 });
  };

  // Pipeline summary counts
  const statusCounts = {};
  // We'll compute from current page only for display (total counts would need separate API)

  return (
    <DashboardLayout title="Jobs">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold">Jobs</h1>
          <p className="text-sm text-d-muted">
            Track all jobs from quote to completion.
          </p>
        </div>
        <div className="text-xs text-d-text0">
          {total} job{total === 1 ? '' : 's'} {"\u00b7"} Page {page} of {totalPages}
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
              placeholder="Search by name, phone, email, job ID, or project type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-d-surface border border-d-border rounded-xl px-3 py-2 text-sm text-d-text placeholder:text-d-text0 focus:outline-none focus:ring-2 focus:ring-d-primary/50 focus:border-d-primary/60"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 md:py-2 rounded-xl text-xs font-medium bg-d-primary hover:bg-d-primary/80 text-white shadow-sm shadow-d-primary/40 transition min-h-[44px] md:min-h-0"
          >
            Search
          </button>
        </form>

        <div className="w-full md:w-52">
          <Select value={statusFilter} onChange={handleStatusChange} options={STATUS_OPTIONS} />
        </div>
      </div>

      {/* Jobs table */}
      <div className="rounded-2xl border shadow-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-d-muted border-b border-d-border">
          <div className="col-span-1">Job ID</div>
          <div className="col-span-3">Client</div>
          <div className="col-span-2">Project</div>
          <div className="col-span-1">Quote</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Paid</div>
          <div className="col-span-2 text-right pr-2">Date</div>
        </div>

        {loading && (
          <div className="px-3 py-2 space-y-1">
            {Array.from({ length: 8 }, (_, i) => <SkeletonListRow key={i} />)}
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <EmptyState icon={Briefcase} title="No jobs yet" description="Jobs created from the contract pipeline will appear here" />
        )}

        <ul className="divide-y divide-d-border">
          {jobs.map((job) => {
            const jobPk = job.id;
            const displayName = job.client_name || job.client_email || job.client_phone || 'Unknown';

            return (
              <li
                key={jobPk}
                onClick={() => handleRowClick(jobPk)}
                className="cursor-pointer hover:bg-d-surface transition-colors"
              >
                <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
                  {/* Job ID */}
                  <div className="md:col-span-1">
                    <p className="text-xs font-mono text-d-primary">{job.job_id || `#${jobPk}`}</p>
                  </div>

                  {/* Client */}
                  <div className="md:col-span-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${getAvatarColor(displayName)}`}>
                        {getInitial(displayName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between md:block">
                          <div>
                            <p className="text-sm font-medium text-d-text">{displayName}</p>
                            <p className="text-xs text-d-muted truncate">
                              {job.client_phone && <span>{job.client_phone}</span>}
                              {job.client_phone && job.client_email && <span> {"\u00b7"}</span>}
                              {job.client_email && <span>{job.client_email}</span>}
                            </p>
                          </div>
                          {/* Mobile status badge */}
                          <span className={`md:hidden ${statusBadge(job.status)}`}>
                            {statusLabel(job.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Project type */}
                  <div className="md:col-span-2 text-xs text-d-muted">
                    {(job.project_type || 'N/A').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </div>

                  {/* Quote */}
                  <div className="md:col-span-1 text-xs text-d-muted font-medium">
                    {formatCurrency(job.quote_amount)}
                  </div>

                  {/* Status */}
                  <div className="hidden md:block md:col-span-2">
                    <span className={statusBadge(job.status)}>
                      {statusLabel(job.status)}
                    </span>
                    {job.contract_signed && (
                      <span className="ml-1.5 text-xs text-emerald-400" title="Contract signed">
                        {"\u2713"}
                      </span>
                    )}
                  </div>

                  {/* Paid */}
                  <div className="md:col-span-1 text-xs">
                    {job.total_paid > 0 ? (
                      <span className="text-emerald-400">{formatCurrency(job.total_paid)}</span>
                    ) : (
                      <span className="text-d-muted">{"\u2014"}</span>
                    )}
                  </div>

                  {/* Date */}
                  <div className="md:col-span-2 text-xs text-d-muted text-right">
                    {formatDate(job.created_at)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Pagination */}
        {!loading && jobs.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-d-border text-xs text-d-muted">
            <div>
              Showing {(page - 1) * pageSize + 1}{"\u2013"}{Math.min(page * pageSize, total)} of {total}
            </div>
            <div className="space-x-2">
              <button
                onClick={handlePrev}
                disabled={page <= 1}
                className="px-4 py-2 md:py-1 rounded-lg border border-d-border text-xs disabled:opacity-40 disabled:cursor-default hover:bg-d-surface/80 transition min-h-[44px] md:min-h-0"
              >
                Prev
              </button>
              <button
                onClick={handleNext}
                disabled={page >= totalPages}
                className="px-4 py-2 md:py-1 rounded-lg border border-d-border text-xs disabled:opacity-40 disabled:cursor-default hover:bg-d-surface/80 transition min-h-[44px] md:min-h-0"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 text-xs text-rose-400 border-t border-d-border">
            Error loading jobs: {error}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
