// Shared "Ajouter une dépense" modal — used by the global /platform/expenses
// page and by the Finances tab on each job. When `presetJobId` is provided
// the project picker is replaced with a locked pill so the expense is always
// filed to the current job.

import { useState, useEffect, useRef } from 'react';
import MediaPicker from '../ui/MediaPicker';
import { Loader2, Link2 } from 'lucide-react';

function fmtMoney(n) {
  const num = Number(n) || 0;
  return num.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' $';
}

export const EXPENSE_CATEGORY_LABELS = {
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

export default function AddExpenseModal({ jobs = [], presetJobId = null, presetJobLabel = null, onClose, onSaved }) {
  const [total, setTotal] = useState('');
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState('materiel_fournisseur');
  const [description, setDescription] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [jobId, setJobId] = useState(presetJobId || '');
  const [paymentMethod, setPaymentMethod] = useState('interac');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractMeta, setExtractMeta] = useState(null);
  // Track the last URL we already auto-parsed so re-renders don't retrigger.
  const autoFilledUrlRef = useRef(null);

  async function handleAutoFill() {
    if (!receiptUrl) { setError('Ajoute d\'abord une photo de reçu'); return; }
    setError(null);
    setExtracting(true);
    setExtractMeta(null);
    try {
      const res = await fetch('/api/expenses/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: receiptUrl }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
      if (!total          && json.total          != null) setTotal(String(json.total));
      if (!vendor         && json.vendor)                  setVendor(json.vendor);
      if (!invoiceNumber  && json.invoice_number)          setInvoiceNumber(json.invoice_number);
      if (!description    && json.description_guess)       setDescription(json.description_guess);
      if (json.paid_at && /^\d{4}-\d{2}-\d{2}$/.test(json.paid_at)) setPaidAt(json.paid_at);
      if (json.category_guess && EXPENSE_CATEGORY_LABELS[json.category_guess]) setCategory(json.category_guess);
      setExtractMeta({ confidence: json.confidence });
    } catch (err) {
      setError(err.message);
    } finally {
      setExtracting(false);
    }
  }

  // Auto-fire the AI extractor as soon as Jérémy uploads a receipt photo —
  // no manual button press. PDFs are skipped (the extractor is vision-only).
  // Guard on autoFilledUrlRef so re-renders don't retrigger on the same URL.
  useEffect(() => {
    if (!receiptUrl) return;
    if (autoFilledUrlRef.current === receiptUrl) return;
    if (/\.pdf(\?.*)?$/i.test(receiptUrl)) return;
    autoFilledUrlRef.current = receiptUrl;
    handleAutoFill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptUrl]);

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
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 overflow-y-auto" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-d-bg border border-d-border rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 my-4 sm:my-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-d-text">Ajouter une dépense</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-d-muted hover:text-d-text -m-2 p-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50">✕</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-d-muted mb-1">Montant total TTC ($)</label>
            <input
              type="number" inputMode="decimal" step="0.01" min="0" autoFocus
              value={total} onChange={(e) => setTotal(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-d-border bg-d-surface text-base sm:text-sm"
              required
            />
            {totalNum > 0 && (
              <p className="mt-1 text-[10px] text-d-muted font-mono">
                HT {fmtMoney(htBase)} · TPS {fmtMoney(autoTps)} · TVQ {fmtMoney(autoTvq)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-d-muted mb-1">Fournisseur</label>
              <input
                type="text"
                value={vendor} onChange={(e) => setVendor(e.target.value)}
                placeholder="Ex: Royalty"
                className="w-full px-3 py-2.5 rounded-xl border border-d-border bg-d-surface text-base sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-d-muted mb-1">Catégorie</label>
              <select
                value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-d-border bg-d-surface text-base sm:text-sm"
              >
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-d-muted mb-1">Date payée</label>
              <input
                type="date"
                value={paidAt} onChange={(e) => setPaidAt(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-d-border bg-d-surface text-base sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-d-muted mb-1">Méthode</label>
              <select
                value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-d-border bg-d-surface text-base sm:text-sm"
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
              {presetJobId ? 'Projet lié' : 'Lier à un projet (optionnel)'}
            </label>
            {presetJobId ? (
              <div className="w-full px-3 py-2 rounded-xl border border-d-border/60 bg-d-surface/60 text-sm text-d-muted">
                {presetJobLabel || `Projet #${presetJobId}`}
                <span className="ml-2 text-[10px] text-d-primary/70">(verrouillé à ce projet)</span>
              </div>
            ) : (
              <select
                value={jobId} onChange={(e) => setJobId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-d-border bg-d-surface text-base sm:text-sm"
              >
                <option value="">— Non lié —</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.job_id} · {j.client_name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs text-d-muted mb-1"># facture (optionnel)</label>
            <input
              type="text"
              value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-d-border bg-d-surface text-base sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-d-muted mb-1">Description (optionnel)</label>
            <textarea
              rows={2}
              value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-d-border bg-d-surface text-base sm:text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <div>
                <label className="block text-xs text-d-muted">Reçu / facture (photo)</label>
                <span className="text-[9px] text-d-primary/70">✨ Auto-rempli à l&apos;upload · modifiable</span>
              </div>
              {receiptUrl && !/\.pdf(\?.*)?$/i.test(receiptUrl) && (
                <button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={extracting}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-d-primary/15 text-d-primary border border-d-primary/30 hover:bg-d-primary/25 disabled:opacity-50 transition"
                >
                  {extracting ? <Loader2 size={10} className="animate-spin" /> : '✨'}
                  {extracting ? 'Extraction…' : 'Relancer'}
                </button>
              )}
            </div>
            <MediaPicker
              value={receiptUrl}
              onChange={(url) => { setReceiptUrl(url); setExtractMeta(null); }}
              bucket="receipts"
              context="expense"
              label="Prendre / ajouter"
              accept="image/*,application/pdf"
            />
            {extractMeta && (
              <p className={`mt-1 text-[10px] ${extractMeta.confidence >= 0.7 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {extractMeta.confidence >= 0.7
                  ? `✓ Champs remplis (confiance ${Math.round(extractMeta.confidence * 100)}%) — vérifie avant d'enregistrer.`
                  : `⚠️ Extraction incertaine (${Math.round(extractMeta.confidence * 100)}%) — relis tous les champs.`}
              </p>
            )}
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
