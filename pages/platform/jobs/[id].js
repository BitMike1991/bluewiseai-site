// pages/platform/jobs/[id].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../src/components/dashboard/DashboardLayout';

const STATUS_COLORS = {
  draft: 'bg-slate-700/60 text-slate-100 border-slate-500/40',
  quote_sent: 'bg-violet-500/15 text-violet-300 border-violet-500/40',
  contract_sent: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  signed: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  scheduled: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40',
  in_progress: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
  completed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  cancelled: 'bg-rose-500/10 text-rose-300 border-rose-500/40',
};

const STATUS_PIPELINE = [
  'draft',
  'quote_sent',
  'contract_sent',
  'signed',
  'scheduled',
  'in_progress',
  'completed',
];

function statusBadge(status) {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border';
  const colors = STATUS_COLORS[(status || '').toLowerCase()] || STATUS_COLORS.draft;
  return `${base} ${colors}`;
}

function statusLabel(status) {
  return (status || 'draft').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
  });
}

function eventLabel(eventType) {
  const labels = {
    job_created: 'Job Created',
    quote_sent: 'Quote Sent',
    contract_generated: 'Contract Generated',
    contract_sent: 'Contract Sent',
    contract_signed: 'Contract Signed',
    payment_link_created: 'Payment Link Created',
    deposit_paid: 'Deposit Paid',
    payment_received: 'Payment Received',
    job_scheduled: 'Job Scheduled',
    job_started: 'Job Started',
    job_completed: 'Job Completed',
    job_cancelled: 'Job Cancelled',
    status_changed: 'Status Changed',
  };
  return labels[eventType] || eventType?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Event';
}

export default function JobDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  async function loadJob() {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/jobs/${id}`);
      if (!res.ok) throw new Error(`Failed to load job: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-sm text-slate-400 py-12 text-center">Loading job...</div>
      </DashboardLayout>
    );
  }

  if (error || !data?.job) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center">
          <p className="text-rose-400 text-sm mb-4">{error || 'Job not found'}</p>
          <Link href="/platform/jobs" className="text-sky-400 text-sm hover:underline">
            Back to Jobs
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const { job, contracts, payments, events, lead, photos } = data;

  const currentStatusIndex = STATUS_PIPELINE.indexOf((job.status || '').toLowerCase());
  const isCancelled = job.status === 'cancelled';

  const totalPaid = payments
    .filter((p) => p.status === 'paid' || p.status === 'succeeded')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const quoteAmount = parseFloat(job.quote_amount || 0);
  const remaining = quoteAmount - totalPaid;

  const address = job.client_address;
  const addressStr = address
    ? [address.street, address.city, address.province, address.postal_code].filter(Boolean).join(', ')
    : null;

  return (
    <DashboardLayout>
      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="Photo"
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl"
          >
            \u2715
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <Link
          href="/platform/jobs"
          className="text-xs text-slate-500 hover:text-slate-300 transition mb-2 inline-block"
        >
          \u2190 Back to Jobs
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-semibold text-slate-50">{job.client_name || 'Unknown'}</h1>
              <span className={statusBadge(job.status)}>{statusLabel(job.status)}</span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              <span className="font-mono text-sky-400">{job.job_id}</span>
              {job.project_type && (
                <span className="ml-2 text-slate-500">
                  \u00b7 {job.project_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-slate-50">{formatCurrency(quoteAmount)}</p>
            <p className="text-xs text-slate-500">Quote amount</p>
          </div>
        </div>
      </div>

      {/* Status Pipeline */}
      {!isCancelled && (
        <div className="mb-6 rounded-xl bg-slate-900/60 border border-slate-800/80 p-4">
          <div className="flex items-center justify-between">
            {STATUS_PIPELINE.map((step, i) => {
              const isCompleted = i <= currentStatusIndex;
              const isCurrent = i === currentStatusIndex;
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full border-2 transition ${
                        isCurrent
                          ? 'bg-sky-500 border-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]'
                          : isCompleted
                          ? 'bg-emerald-500 border-emerald-400'
                          : 'bg-slate-800 border-slate-600'
                      }`}
                    />
                    <span
                      className={`text-[10px] mt-1 hidden md:block ${
                        isCurrent ? 'text-sky-400 font-medium' : isCompleted ? 'text-emerald-400' : 'text-slate-600'
                      }`}
                    >
                      {statusLabel(step)}
                    </span>
                  </div>
                  {i < STATUS_PIPELINE.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1 ${
                        i < currentStatusIndex ? 'bg-emerald-500/60' : 'bg-slate-700/60'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main content: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Photos */}
          {photos && photos.length > 0 && (
            <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4">
              <h2 className="text-sm font-semibold text-slate-300 mb-3">
                Photos ({photos.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => setLightboxUrl(photo.file_url)}
                    className="aspect-square rounded-lg overflow-hidden border border-slate-700/60 hover:border-sky-500/60 transition group"
                  >
                    <img
                      src={photo.file_url}
                      alt="Lead photo"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Contracts */}
          <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">
              Contracts ({contracts.length})
            </h2>
            {contracts.length === 0 ? (
              <p className="text-xs text-slate-500">No contracts generated yet.</p>
            ) : (
              <div className="space-y-2">
                {contracts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/40"
                  >
                    <div>
                      <p className="text-sm text-slate-200">
                        {c.template_name || 'Contract'} {c.template_version || ''}
                      </p>
                      <p className="text-xs text-slate-500">Created {formatDate(c.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          c.signature_status === 'signed'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {c.signature_status === 'signed' ? 'Signed' : 'Pending'}
                      </span>
                      {c.signed_at && (
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(c.signed_at)}</p>
                      )}
                      {c.signer_name && (
                        <p className="text-xs text-slate-400">by {c.signer_name}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payments */}
          <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">
              Payments ({payments.length})
            </h2>
            {payments.length === 0 ? (
              <p className="text-xs text-slate-500">No payments recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/40"
                  >
                    <div>
                      <p className="text-sm text-slate-200">
                        {(p.payment_type || 'payment').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </p>
                      <p className="text-xs text-slate-500">
                        {p.paid_at ? formatDate(p.paid_at) : formatDate(p.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        p.status === 'paid' || p.status === 'succeeded' ? 'text-emerald-400' : 'text-amber-300'
                      }`}>
                        {formatCurrency(p.amount)}
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          p.status === 'paid' || p.status === 'succeeded'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {(p.status || 'pending').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div className="flex items-center justify-between px-3 py-2 mt-2 border-t border-slate-700/40">
                  <span className="text-xs text-slate-400">Total paid</span>
                  <span className="text-sm font-semibold text-emerald-400">{formatCurrency(totalPaid)}</span>
                </div>
                {remaining > 0 && (
                  <div className="flex items-center justify-between px-3 py-1">
                    <span className="text-xs text-slate-500">Remaining</span>
                    <span className="text-sm font-medium text-amber-300">{formatCurrency(remaining)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">Activity</h2>
            {events.length === 0 ? (
              <p className="text-xs text-slate-500">No activity recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {events.map((ev) => (
                  <div key={ev.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-sky-500/60 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-200">{eventLabel(ev.event_type)}</p>
                      {ev.payload && ev.payload.note && (
                        <p className="text-xs text-slate-500 mt-0.5">{ev.payload.note}</p>
                      )}
                      <p className="text-[10px] text-slate-600 mt-0.5">{formatDate(ev.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-4">
          {/* Client Info */}
          <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">Client Info</h2>
            <dl className="space-y-2 text-xs">
              <div>
                <dt className="text-slate-500">Name</dt>
                <dd className="text-slate-200">{job.client_name || '\u2014'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Phone</dt>
                <dd className="text-slate-200">{job.client_phone || '\u2014'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="text-slate-200">{job.client_email || '\u2014'}</dd>
              </div>
              {addressStr && (
                <div>
                  <dt className="text-slate-500">Address</dt>
                  <dd className="text-slate-200">{addressStr}</dd>
                </div>
              )}
              {lead && (
                <div className="pt-2 border-t border-slate-800/60">
                  <dt className="text-slate-500">Linked Lead</dt>
                  <dd>
                    <Link
                      href={`/platform/leads/${lead.id}`}
                      className="text-sky-400 hover:underline"
                    >
                      {lead.name || lead.first_name || lead.phone || `Lead #${lead.id}`}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Job Details */}
          <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">Job Details</h2>
            <dl className="space-y-2 text-xs">
              <div>
                <dt className="text-slate-500">Project Type</dt>
                <dd className="text-slate-200">
                  {(job.project_type || '\u2014').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </dd>
              </div>
              {job.project_description && (
                <div>
                  <dt className="text-slate-500">Description</dt>
                  <dd className="text-slate-200">{job.project_description}</dd>
                </div>
              )}
              <div>
                <dt className="text-slate-500">Quote</dt>
                <dd className="text-slate-200 font-medium">{formatCurrency(quoteAmount)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Deposit ({job.deposit_percentage || 25}%)</dt>
                <dd className="text-slate-200">
                  {formatCurrency(job.deposit_amount || quoteAmount * ((job.deposit_percentage || 25) / 100))}
                </dd>
              </div>
              {job.intake_source && (
                <div>
                  <dt className="text-slate-500">Source</dt>
                  <dd className="text-slate-200">{job.intake_source}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Key Dates */}
          <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">Key Dates</h2>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-slate-500">Created</dt>
                <dd className="text-slate-300">{formatDate(job.created_at)}</dd>
              </div>
              {job.quote_sent_at && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Quote Sent</dt>
                  <dd className="text-slate-300">{formatDate(job.quote_sent_at)}</dd>
                </div>
              )}
              {job.contract_sent_at && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Contract Sent</dt>
                  <dd className="text-slate-300">{formatDate(job.contract_sent_at)}</dd>
                </div>
              )}
              {job.signed_at && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Signed</dt>
                  <dd className="text-emerald-400">{formatDate(job.signed_at)}</dd>
                </div>
              )}
              {job.deposit_paid_at && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Deposit Paid</dt>
                  <dd className="text-emerald-400">{formatDate(job.deposit_paid_at)}</dd>
                </div>
              )}
              {job.scheduled_at && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Scheduled</dt>
                  <dd className="text-indigo-400">{formatDate(job.scheduled_at)}</dd>
                </div>
              )}
              {job.started_at && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Started</dt>
                  <dd className="text-orange-400">{formatDate(job.started_at)}</dd>
                </div>
              )}
              {job.completed_at && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Completed</dt>
                  <dd className="text-emerald-400">{formatDate(job.completed_at)}</dd>
                </div>
              )}
              {job.cancelled_at && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Cancelled</dt>
                  <dd className="text-rose-400">{formatDate(job.cancelled_at)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
