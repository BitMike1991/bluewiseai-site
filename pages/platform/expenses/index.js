// pages/platform/expenses/index.js
// Expense ledger + entry form. Lists all expenses for the current tenant,
// sorted by paid_at DESC. "+ Ajouter" opens a modal with vendor/amount/tps/tvq
// auto-calc + optional job link + MediaPicker for receipt PDF/photo.
//
// F-P6 (OCR auto-fill) wires into this same modal in a later commit.

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../src/components/dashboard/DashboardLayout';
import MediaPicker from '../../../src/components/ui/MediaPicker';
import { Plus, Receipt, Loader2, Link2 } from 'lucide-react';

function fmtMoney(n) {
  const num = Number(n) || 0;
  return num.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' $';
}
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

const CATEGORY_LABELS = {
  materiel_fournisseur: 'Matériel',
  main_oeuvre:          'Main-d\'œuvre',
  sous_traitance:       'Sous-traitance',
  gaz_carburant:        'Gaz / carburant',
  essence:              'Essence',
  overhead:             'Frais généraux',
  outillage:            'Outillage',
  bureau:               'Bureau',
  ai_tools:             'Outils IA',
  logiciel:             'Logiciel',
  telecom:              'Télécom',
  repas:                'Repas',
  assurance:            'Assurance',
  formation:            'Formation',
  autre:                'Autre',
};

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

function AddExpenseModal({ jobs, onClose, onSaved }) {
  const [total, setTotal] = useState('');
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState('materiel_fournisseur');
  const [description, setDescription] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [jobId, setJobId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('interac');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const totalNum = parseFloat(total) || 0;
  const htBase   = totalNum / 1.14975;
  const autoTps  = Math.round(htBase * 0.05 * 100) / 100;
  const autoTvq  = Math.round(htBase * 0.09975 * 100) / 100;

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (!(totalNum > 0)) { setError('Montant invalide'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total: totalNum,
          vendor: vendor.trim() || undefined,
          category,
          description: description.trim() || undefined,
          invoice_number: invoiceNumber.trim() || undefined,
          paid_at: paidAt ? new Date(paidAt).toISOString() : undefined,
          job_id: jobId || undefined,
          payment_method: paymentMethod,
          receipt_url: receiptUrl || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-d-bg border border-d-border rounded-2xl shadow-2xl w-full max-w-md p-6 my-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-d-text">Ajouter une dépense</h2>
          <button type="button" onClick={onClose} className="text-d-muted hover:text-d-text">✕</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-d-muted mb-1">Montant total TTC ($)</label>
            <input
              type="number" step="0.01" min="0" autoFocus
              value={total} onChange={(e) => setTotal(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm"
              required
            />
            {totalNum > 0 && (
              <p className="mt-1 text-[10px] text-d-muted font-mono">
                HT {fmtMoney(htBase)} · TPS {fmtMoney(autoTps)} · TVQ {fmtMoney(autoTvq)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-d-muted mb-1">Fournisseur</label>
              <input
                type="text"
                value={vendor} onChange={(e) => setVendor(e.target.value)}
                placeholder="Ex: Royalty"
                className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-d-muted mb-1">Catégorie</label>
              <select
                value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-d-muted mb-1">Date payée</label>
              <input
                type="date"
                value={paidAt} onChange={(e) => setPaidAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-d-muted mb-1">Méthode</label>
              <select
                value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm"
              >
                <option value="interac">Interac</option>
                <option value="cash">Cash</option>
                <option value="cheque">Chèque</option>
                <option value="wire">Virement</option>
                <option value="card">Carte</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-d-muted mb-1">
              <Link2 size={10} className="inline mr-1" />
              Lier à un projet (optionnel)
            </label>
            <select
              value={jobId} onChange={(e) => setJobId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm"
            >
              <option value="">— Non lié —</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.job_id} · {j.client_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-d-muted mb-1"># facture (optionnel)</label>
            <input
              type="text"
              value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-d-muted mb-1">Description (optionnel)</label>
            <textarea
              rows={2}
              value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-d-muted mb-1">Reçu / facture (photo ou PDF)</label>
            <MediaPicker
              value={receiptUrl}
              onChange={setReceiptUrl}
              bucket="receipts"
              context="expense"
              label="Prendre / ajouter"
              accept="image/*,application/pdf"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button" onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-d-border text-sm text-d-muted hover:text-d-text"
          >Annuler</button>
          <button
            type="submit" disabled={saving}
            className="flex-1 px-4 py-2 rounded-xl bg-d-primary text-white text-sm font-semibold disabled:opacity-50"
          >{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </form>
    </div>
  );
}
