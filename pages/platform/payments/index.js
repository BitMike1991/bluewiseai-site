// pages/platform/payments/index.js
// Cross-jobs payments ledger. Read-only rollup. For logging a new payment,
// Jérémy goes into a specific job's Paiements tab (scoped properly there).

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../../src/components/dashboard/DashboardLayout';
import { Loader2, HandCoins } from 'lucide-react';
import { fmtMoney } from '../../../lib/formatters';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finances');
      if (!res.ok) throw new Error('Erreur chargement paiements');
      const fin = await res.json();
      // finances.js returns paymentsAllTime / paymentsPending / etc — we want
      // a combined list sorted by created_at DESC.
      const all = [];
      for (const p of fin.paymentsAllTime || []) all.push({ ...p, status: 'succeeded' });
      for (const p of fin.paymentsPending || []) all.push({ ...p, status: 'pending' });
      all.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setPayments(all);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalReceived = payments
    .filter((p) => p.status === 'succeeded')
    .reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalPending = payments
    .filter((p) => p.status === 'pending')
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  return (
    <DashboardLayout title="Paiements">
      <div className="max-w-5xl mx-auto px-3 md:px-6 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-d-text">Paiements reçus</h1>
            <p className="text-xs text-d-muted">Tous les paiements à travers tous les projets. Pour en ajouter, ouvrez le projet concerné.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <p className="text-[10px] uppercase tracking-wider text-d-muted mb-1">Total reçu</p>
            <p className="text-lg font-semibold text-emerald-400 font-mono">{fmtMoney(totalReceived)}</p>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-[10px] uppercase tracking-wider text-d-muted mb-1">En attente</p>
            <p className="text-lg font-semibold text-amber-400 font-mono">{fmtMoney(totalPending)}</p>
          </div>
        </div>

        {loading && (
          <div className="py-12 text-center text-xs text-d-muted animate-pulse">
            <Loader2 size={18} className="animate-spin mx-auto mb-2" />
            Chargement…
          </div>
        )}

        {!loading && error && (
          <div className="px-4 py-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {!loading && !error && payments.length === 0 && (
          <div className="py-12 text-center border border-dashed border-d-border/60 rounded-xl">
            <HandCoins size={28} className="mx-auto mb-2 text-d-muted/40" />
            <p className="text-sm text-d-muted">Aucun paiement enregistré.</p>
          </div>
        )}

        {!loading && payments.length > 0 && (
          <div className="rounded-xl border border-d-border overflow-hidden">
            {payments.map((p) => (
              <Link
                key={p.id}
                href={p.job_id ? `/platform/jobs/${p.job_id}` : '#'}
                className="grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center px-4 py-3 border-b border-d-border/40 last:border-0 hover:bg-d-surface/40 transition"
              >
                {p.receiptUrl || p.receipt_url ? (
                  <div className="w-10 h-10 rounded-md overflow-hidden border border-d-border bg-d-surface flex-shrink-0">
                    {/\.pdf(\?|$)/i.test(p.receiptUrl || p.receipt_url) ? (
                      <div className="w-full h-full flex items-center justify-center text-[9px] text-d-muted font-semibold">PDF</div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.receiptUrl || p.receipt_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    )}
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-md border border-dashed border-d-border/60" />
                )}
                <div className="min-w-0">
                  <p className="text-sm text-d-text">
                    {(p.payment_type || 'paiement').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    {p.payment_method && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-d-muted">· {p.payment_method}</span>
                    )}
                  </p>
                  <p className="text-[10px] text-d-muted">{fmtDate(p.paid_at || p.created_at)}</p>
                </div>
                <span className={`text-xs font-semibold font-mono ${p.status === 'succeeded' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {fmtMoney(p.amount)}
                </span>
                <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${
                  p.status === 'succeeded'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}>{p.status === 'succeeded' ? 'Reçu' : 'En attente'}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
