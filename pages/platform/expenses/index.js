// pages/platform/expenses/index.js
// Expense ledger + entry form. Lists all expenses for the current tenant,
// sorted by paid_at DESC. "+ Ajouter" opens a modal with vendor/amount/tps/tvq
// auto-calc + optional job link + MediaPicker for receipt PDF/photo.
//
// F-P6 (OCR auto-fill) wires into this same modal in a later commit.

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../src/components/dashboard/DashboardLayout';
import AddExpenseModal, { EXPENSE_CATEGORY_LABELS } from '../../../src/components/expenses/AddExpenseModal';
import { Plus, Receipt, Loader2 } from 'lucide-react';

function fmtMoney(n) {
  const num = Number(n) || 0;
  return num.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' $';
}
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

const CATEGORY_LABELS = EXPENSE_CATEGORY_LABELS;

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, jobsRes] = await Promise.all([
        fetch('/api/finances'),
        fetch('/api/jobs?page=1&pageSize=100'),
      ]);
      if (!expRes.ok) throw new Error('Erreur chargement dépenses');
      const fin = await expRes.json();
      setExpenses(Array.isArray(fin?.expenses) ? fin.expenses : []);
      const jobsJson = jobsRes.ok ? await jobsRes.json() : { items: [] };
      setJobs(jobsJson.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  return (
    <DashboardLayout title="Dépenses">
      <div className="max-w-5xl mx-auto px-3 md:px-6 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-d-text">Dépenses</h1>
            <p className="text-xs text-d-muted">Factures, reçus, frais logés — avec TPS/TVQ auto-séparés pour la déclaration.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-d-primary text-white hover:opacity-90 transition"
          >
            <Plus size={14} /> Ajouter
          </button>
        </div>

        {showForm && (
          <AddExpenseModal
            jobs={jobs}
            onClose={() => setShowForm(false)}
            onSaved={() => { setShowForm(false); loadAll(); }}
          />
        )}

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

        {!loading && !error && expenses.length === 0 && (
          <div className="py-12 text-center border border-dashed border-d-border/60 rounded-xl">
            <Receipt size={28} className="mx-auto mb-2 text-d-muted/40" />
            <p className="text-sm text-d-muted">Aucune dépense logée.</p>
          </div>
        )}

        {!loading && expenses.length > 0 && (
          <div className="rounded-xl border border-d-border overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-4 py-2 bg-d-surface/50 border-b border-d-border text-[10px] uppercase tracking-wider font-semibold text-d-muted">
              <span></span>
              <span>Description</span>
              <span className="text-right">TPS</span>
              <span className="text-right">TVQ</span>
              <span className="text-right">Total</span>
            </div>
            {expenses.map((e) => (
              <div key={e.id} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 items-center px-4 py-3 border-b border-d-border/40 last:border-0">
                {e.receiptUrl || e.receipt_url ? (
                  <a
                    href={e.receiptUrl || e.receipt_url}
                    target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-md overflow-hidden border border-d-border bg-d-surface flex-shrink-0"
                  >
                    {/\.pdf(\?|$)/i.test(e.receiptUrl || e.receipt_url) ? (
                      <div className="w-full h-full flex items-center justify-center text-[9px] text-d-muted font-semibold">PDF</div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.receiptUrl || e.receipt_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    )}
                  </a>
                ) : (
                  <div className="w-10 h-10 rounded-md border border-dashed border-d-border/60" />
                )}
                <div className="min-w-0">
                  <p className="text-sm text-d-text truncate">
                    {e.vendor || e.description || CATEGORY_LABELS[e.category] || 'Dépense'}
                  </p>
                  <p className="text-[10px] text-d-muted">
                    {fmtDate(e.date || e.paid_at)}
                    {e.category && <span className="ml-2">· {CATEGORY_LABELS[e.category] || e.category}</span>}
                  </p>
                </div>
                <span className="text-[11px] text-d-muted font-mono text-right">{e.tps != null ? fmtMoney(e.tps) : '—'}</span>
                <span className="text-[11px] text-d-muted font-mono text-right">{e.tvq != null ? fmtMoney(e.tvq) : '—'}</span>
                <span className="text-sm text-d-text font-medium font-mono text-right">{fmtMoney(e.amount || e.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

