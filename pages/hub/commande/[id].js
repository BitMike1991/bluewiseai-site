// pages/hub/commande/[id].js
// BC detail view — renders HTML, download PDF, re-send email.
// Gate: enabled_hub_tools includes 'commande'.

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../src/components/dashboard/DashboardLayout';
import {
  ChevronLeft,
  Printer,
  Send,
  CheckCircle2,
  Clock,
  Package,
  Loader2,
  X,
  ExternalLink,
  Upload,
  AlertTriangle,
  FileText,
} from 'lucide-react';

const TOOL_ID = 'commande';

const SUPPLIER_META = {
  royalty:   { label: 'Royalty', color: '#3b82f6', bg: '#eff6ff' },
  touchette: { label: 'Touchette', color: '#8b5cf6', bg: '#f5f3ff' },
  other:     { label: 'Autre',    color: '#6b7280', bg: '#f9fafb' },
};

const STATUS_META = {
  draft:    { label: 'Brouillon', color: '#6b7280', bg: '#f3f4f6' },
  sent:     { label: 'Envoyé',    color: '#059669', bg: '#ecfdf5' },
  received: { label: 'Reçu',      color: '#2563eb', bg: '#eff6ff' },
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-medium shadow-lg flex items-center gap-2 ${
        type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
      }`}
    >
      {message}
      <button onClick={onClose} aria-label="Fermer" className="ml-2 opacity-70 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

// ── Send Modal ────────────────────────────────────────────────────────────────

function SendModal({ bc, onClose, onSent }) {
  const [email,   setEmail]   = useState('');
  const [subject, setSubject] = useState(`Bon de commande ${bc.bc_number} — PÜR Construction`);
  const [msg,     setMsg]     = useState('');
  const [sending, setSending] = useState(false);
  const [error,   setError]   = useState(null);

  async function handleSend() {
    if (!email.includes('@')) { setError('Email invalide'); return; }
    setSending(true);
    setError(null);
    try {
      const r = await fetch(`/api/bons-de-commande/${bc.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier_email: email, subject, message: msg || undefined }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Échec envoi');
      onSent(j);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-d-bg border border-d-border rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-d-text">
            Envoyer <span className="font-mono text-d-primary">{bc.bc_number}</span>
          </h2>
          <button onClick={onClose} aria-label="Fermer" className="text-d-muted hover:text-d-text">
            <X size={16} />
          </button>
        </div>

        {error && <div className="mb-4 text-xs text-rose-400 bg-rose-400/10 rounded-xl px-3 py-2">{error}</div>}

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-d-muted mb-1.5">Email destinataire *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="commandes@destinataire.com"
              autoFocus
              className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm text-d-text placeholder:text-d-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs text-d-muted mb-1.5">Sujet</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm text-d-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs text-d-muted mb-1.5">Message (optionnel)</label>
            <textarea
              value={msg}
              onChange={e => setMsg(e.target.value)}
              rows={3}
              placeholder="Message additionnel..."
              className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm text-d-text placeholder:text-d-muted/40 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-d-border text-sm text-d-muted hover:text-d-text transition">
            Annuler
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !email}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-d-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sending ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Retour soumission section ─────────────────────────────────────────────────

function RetourFournisseur({ bc, bcId, onReceived }) {
  const [uploading,   setUploading]   = useState(false);
  const [dragOver,    setDragOver]    = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [result,      setResult]      = useState(null);

  async function handleFile(file) {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Seuls les fichiers PDF sont acceptés.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Fichier trop volumineux (max 10 MB).');
      return;
    }
    setUploading(true);
    setUploadError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const r = await fetch(`/api/bons-de-commande/${bcId}/apply-return`, {
        method: 'POST',
        body: form,
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Erreur serveur');
      setResult(j);
      if (onReceived) onReceived(j);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  // Already received state
  if (bc.status === 'received' && !result) {
    return (
      <div className="mt-6 rounded-xl border border-d-border bg-d-surface/30 p-5">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <h2 className="text-sm font-semibold text-d-text">Retour soumission</h2>
        </div>
        <p className="text-xs text-d-muted">
          Soumission déjà traitée le{' '}
          <span className="text-d-text">{fmtDate(bc.received_at)}</span>
        </p>
        <p className="text-xs text-d-muted mt-1">
          Les prix ont été distribués aux devis liés. Consultez chaque projet pour les détails.
        </p>
      </div>
    );
  }

  // Not sent yet
  if (bc.status !== 'sent' && bc.status !== 'received') {
    return null;
  }

  // Result summary card
  if (result) {
    const firstJobId = result.jobs_affected?.[0];
    return (
      <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <h2 className="text-sm font-semibold text-d-text">Soumission traitée</h2>
        </div>

        {/* Top-level stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="rounded-lg bg-d-surface/60 border border-d-border/50 px-3 py-2">
            <p className="text-[10px] text-d-muted mb-0.5">Articles associés</p>
            <p className="text-lg font-bold text-emerald-400">{result.matched}</p>
          </div>
          <div className="rounded-lg bg-d-surface/60 border border-d-border/50 px-3 py-2">
            <p className="text-[10px] text-d-muted mb-0.5">Sans correspondance</p>
            <p className={`text-lg font-bold ${result.unmatched > 0 ? 'text-amber-400' : 'text-d-muted'}`}>
              {result.unmatched}
            </p>
          </div>
          <div className="rounded-lg bg-d-surface/60 border border-d-border/50 px-3 py-2">
            <p className="text-[10px] text-d-muted mb-0.5">Dépenses enregistrées</p>
            <p className="text-sm font-bold text-d-text">
              {Number(result.total_expenses_recorded).toLocaleString('fr-CA', {
                minimumFractionDigits: 2, maximumFractionDigits: 2,
              })}&nbsp;$
            </p>
          </div>
          <div className="rounded-lg bg-d-surface/60 border border-d-border/50 px-3 py-2">
            <p className="text-[10px] text-d-muted mb-0.5">Escompte</p>
            <p className="text-sm font-bold text-d-text">{result.escompte_pct || 0}%</p>
          </div>
        </div>

        {/* Per-project breakdown */}
        {result.breakdown && result.breakdown.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-d-muted uppercase tracking-wider mb-2">
              Par projet
            </p>
            <div className="space-y-2">
              {result.breakdown.map((b) => (
                <div
                  key={b.quote_id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg border border-d-border/50 bg-d-surface/40 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <FileText size={12} className="text-d-muted" />
                    <span className="font-mono text-d-primary">{b.quote_number}</span>
                    {b.all_priced && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                        Prêt
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-d-muted">
                      {b.matched} ok{b.unmatched > 0 && <span className="text-amber-400"> · {b.unmatched} manquant</span>}
                    </span>
                    <span className="font-medium text-d-text">
                      {Number(b.new_total_ttc).toLocaleString('fr-CA', {
                        minimumFractionDigits: 2, maximumFractionDigits: 2,
                      })}&nbsp;$
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unmatched items needing manual entry */}
        {result.unmatched_items && result.unmatched_items.length > 0 && (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle size={13} className="text-amber-400" />
              <p className="text-xs font-semibold text-amber-400">
                {result.unmatched_items.length} article{result.unmatched_items.length > 1 ? 's' : ''} à entrer manuellement
              </p>
            </div>
            <ul className="space-y-1">
              {result.unmatched_items.map((u, i) => (
                <li key={i} className="text-xs text-d-muted">
                  <span className="font-mono text-d-text/70">{u.quote_number}</span>
                  {' '}· {u.description || `Article #${u.item_index + 1}`}
                </li>
              ))}
            </ul>
            <p className="text-xs text-d-muted mt-2">
              Ouvrez les devis correspondants pour entrer les prix manuellement.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-3 flex-wrap">
          {firstJobId && (
            <a
              href={`/platform/jobs/${firstJobId}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-d-primary text-white text-xs font-semibold hover:opacity-90 transition"
            >
              <ExternalLink size={12} /> Voir les devis mis à jour
            </a>
          )}
          <button
            type="button"
            onClick={() => setResult(null)}
            className="text-xs text-d-muted hover:text-d-text transition"
          >
            Téléverser un autre PDF
          </button>
        </div>
      </div>
    );
  }

  // Upload dropzone (bc.status === 'sent')
  return (
    <div className="mt-6 rounded-xl border border-d-border p-5">
      <div className="flex items-center gap-2 mb-1">
        <Upload size={15} className="text-d-muted" />
        <h2 className="text-sm font-semibold text-d-text">Retour soumission</h2>
      </div>
      <p className="text-xs text-d-muted mb-4">
        Téléverse la soumission PDF de Royalty pour distribuer les prix à tous les devis de ce BC.
      </p>

      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
          dragOver
            ? 'border-d-primary bg-d-primary/10'
            : 'border-d-border/60 hover:border-d-primary/50 hover:bg-d-surface/40'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={handleInputChange}
          disabled={uploading}
        />
        {uploading ? (
          <>
            <Loader2 size={28} className="text-d-primary animate-spin" />
            <p className="text-sm text-d-text font-medium">Analyse du PDF...</p>
            <p className="text-xs text-d-muted">Correspondance des articles en cours</p>
          </>
        ) : (
          <>
            <Upload size={28} className="text-d-muted/60" />
            <div className="text-center">
              <p className="text-sm text-d-text font-medium">Glisser la soumission PDF ici</p>
              <p className="text-xs text-d-muted mt-0.5">ou cliquer pour choisir un PDF · max 10 MB</p>
            </div>
          </>
        )}
      </label>

      {uploadError && (
        <div className="mt-3 rounded-xl bg-rose-500/10 border border-rose-500/30 px-3 py-2.5 text-xs text-rose-400 flex items-center gap-2">
          <AlertTriangle size={13} /> {uploadError}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BcDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [bc,        setBc]        = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [showSend,  setShowSend]  = useState(false);
  const [toast,     setToast]     = useState(null);
  const [iframeKey, setIframeKey] = useState(Date.now());
  const iframeRef = useRef(null);

  // Print only the iframe content (the BC document) — not the surrounding
  // DashboardLayout (sidebar + topnav). Same pattern as /platform/jobs/[id]
  // contract view. Bug filed 2026-04-21 by Jérémy: "print PDF fonctionne pas
  // nulle part" — root cause was dangerouslySetInnerHTML injected the BC HTML
  // into the dashboard page so window.print() captured all the dashboard
  // chrome + dark-theme CSS.
  function handlePrint() {
    const iframe = iframeRef.current;
    if (!iframe) { window.print(); return; }
    try {
      const w = iframe.contentWindow;
      if (!w) { window.print(); return; }
      w.focus();
      w.print();
    } catch {
      // Fallback: open the HTML in a new window and print from there.
      const win = window.open('', '_blank', 'width=1024,height=768');
      if (win) {
        win.document.write(bc.html_content || '');
        win.document.close();
        win.focus();
        setTimeout(() => { try { win.print(); } catch {} }, 250);
      }
    }
  }

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    // Cache-bust on the URL + send no-store header so we always re-render
    // with the latest template (BDC HTML is regenerated server-side on
    // every load — see /api/bons-de-commande/[id]/index.js).
    fetch(`/api/bons-de-commande/${id}?_=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(j => {
        setBc(j.bc || null);
        // Force a fresh iframe mount so srcDoc is re-parsed with new HTML.
        setIframeKey(Date.now());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24 text-d-muted gap-2">
          <Loader2 size={18} className="animate-spin" /> Chargement...
        </div>
      </DashboardLayout>
    );
  }

  if (!bc) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto px-6 py-12 text-center">
          <p className="text-d-muted mb-4">Bon de commande introuvable.</p>
          <Link href="/hub/commande" className="text-d-primary text-sm hover:underline">
            ← Retour aux bons de commande
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const statusMeta  = STATUS_META[bc.status]  || STATUS_META.draft;
  const supplierMeta = SUPPLIER_META[bc.supplier] || SUPPLIER_META.other;

  return (
    <DashboardLayout>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {showSend && (
        <SendModal
          bc={bc}
          onClose={() => setShowSend(false)}
          onSent={(result) => {
            setShowSend(false);
            setBc(prev => ({ ...prev, status: 'sent', sent_at: result.sent_at }));
            setToast({ msg: `${bc.bc_number} envoyé`, type: 'success' });
          }}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {/* Back + actions */}
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <Link
            href="/hub/commande"
            className="flex items-center gap-1.5 text-xs text-d-muted hover:text-d-text transition"
          >
            <ChevronLeft size={14} /> Bons de commande
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-d-border text-xs text-d-muted hover:text-d-text transition"
            >
              <Printer size={13} /> Imprimer / PDF
            </button>
            {bc.status !== 'sent' && (
              <button
                onClick={() => setShowSend(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-d-primary text-white text-xs font-semibold hover:opacity-90 transition"
              >
                <Send size={13} /> Envoyer
              </button>
            )}
            {bc.status === 'sent' && (
              <button
                onClick={() => setShowSend(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-d-border text-xs text-d-muted hover:text-d-text transition"
              >
                <Send size={13} /> Renvoyer
              </button>
            )}
          </div>
        </div>

        {/* BC metadata strip */}
        <div className="flex flex-wrap items-center gap-4 px-5 py-4 rounded-xl border border-d-border bg-d-surface/30 mb-5">
          <div>
            <div className="text-[10px] text-d-muted uppercase tracking-wider">BC</div>
            <div className="font-mono text-sm font-bold text-d-text">{bc.bc_number}</div>
          </div>
          <div>
            <div className="text-[10px] text-d-muted uppercase tracking-wider">Source</div>
            <span
              className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: supplierMeta.bg, color: supplierMeta.color }}
            >
              {supplierMeta.label}
            </span>
          </div>
          <div>
            <div className="text-[10px] text-d-muted uppercase tracking-wider">Statut</div>
            <span
              className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: statusMeta.bg, color: statusMeta.color }}
            >
              {statusMeta.label}
            </span>
          </div>
          <div>
            <div className="text-[10px] text-d-muted uppercase tracking-wider">Articles</div>
            <div className="text-sm font-semibold text-d-text">
              {Array.isArray(bc.item_refs) ? bc.item_refs.length : '—'}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-d-muted uppercase tracking-wider">Créé le</div>
            <div className="text-xs text-d-muted">{fmtDate(bc.created_at)}</div>
          </div>
          {bc.sent_at && (
            <div>
              <div className="text-[10px] text-d-muted uppercase tracking-wider">Envoyé le</div>
              <div className="text-xs text-d-muted">{fmtDate(bc.sent_at)}</div>
            </div>
          )}
        </div>

        {/* HTML render — ISOLATED iframe so window.print() from the parent
            doesn't try to print the DashboardLayout chrome. srcDoc renders
            the stored HTML in a fresh document with its own <style> and
            @media print rules. Height grows to match content after load. */}
        {bc.html_content ? (
          <div className="rounded-xl border border-d-border overflow-hidden bg-white">
            <iframe
              ref={iframeRef}
              key={iframeKey}
              title={`Bon de commande ${bc.bc_number}`}
              srcDoc={bc.html_content}
              sandbox="allow-same-origin allow-scripts allow-modals allow-popups"
              className="w-full block bg-white"
              style={{ minHeight: '800px', height: '1200px', border: 'none' }}
              onLoad={(e) => {
                // Re-measure several times: Google Fonts inside the iframe
                // load asynchronously and shift layout AFTER first onLoad.
                // Plus a ResizeObserver on the iframe document for any
                // dynamic shifts (image lazy-load, expand/collapse).
                const iframe = e.currentTarget;
                let prev = 0;
                function measure() {
                  try {
                    const doc = iframe.contentDocument;
                    if (!doc) return;
                    const h = Math.max(
                      doc.documentElement?.scrollHeight || 0,
                      doc.body?.scrollHeight || 0
                    );
                    if (h > 200 && Math.abs(h - prev) > 4) {
                      iframe.style.height = (h + 24) + 'px';
                      prev = h;
                    }
                  } catch {}
                }
                measure();
                setTimeout(measure, 250);
                setTimeout(measure, 800);
                setTimeout(measure, 2000);
                try {
                  const RO = iframe.contentWindow?.ResizeObserver || window.ResizeObserver;
                  if (RO && iframe.contentDocument?.documentElement) {
                    new RO(measure).observe(iframe.contentDocument.documentElement);
                  }
                } catch {}
              }}
            />
          </div>
        ) : (
          <div className="py-16 text-center text-d-muted">
            <Package size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun rendu HTML disponible pour ce bon de commande.</p>
          </div>
        )}

        {/* Retour soumission */}
        <RetourFournisseur
          bc={bc}
          bcId={id}
          onReceived={(result) => {
            setBc(prev => ({ ...prev, status: 'received', received_at: result.received_at || new Date().toISOString() }));
            setToast({ msg: `${result.matched} articles associés — BC marqué reçu`, type: 'success' });
          }}
        />
      </div>
    </DashboardLayout>
  );
}

// ── Server-side gate ──────────────────────────────────────────────────────────

export async function getServerSideProps(context) {
  const { getAuthContext } = await import('../../../lib/supabaseServer');
  const { supabase, customerId, user } = await getAuthContext(context.req, context.res);

  if (!user || !customerId) {
    return { redirect: { destination: '/platform/login', permanent: false } };
  }

  const { data } = await supabase
    .from('customers')
    .select('enabled_hub_tools')
    .eq('id', customerId)
    .single();

  const tools = Array.isArray(data?.enabled_hub_tools) ? data.enabled_hub_tools : [];

  if (!tools.includes(TOOL_ID)) {
    return { redirect: { destination: '/platform/overview', permanent: false } };
  }

  return { props: {} };
}
