// pages/hub/commande/[id].js
// BC detail view — renders HTML, download PDF, re-send email.
// Gate: enabled_hub_tools includes 'commande'.

import { useState, useEffect } from 'react';
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
} from 'lucide-react';

const TOOL_ID = 'commande';

const SUPPLIER_META = {
  royalty:   { label: 'Royalty Fenestration', color: '#3b82f6', bg: '#eff6ff' },
  touchette:  { label: 'Touchette',            color: '#8b5cf6', bg: '#f5f3ff' },
  other:      { label: 'Autre fournisseur',    color: '#6b7280', bg: '#f9fafb' },
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
            <label className="block text-xs text-d-muted mb-1.5">Email fournisseur *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="commandes@fournisseur.com"
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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BcDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [bc,        setBc]        = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [showSend,  setShowSend]  = useState(false);
  const [toast,     setToast]     = useState(null);
  const [iframeKey, setIframeKey] = useState(Date.now());

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/bons-de-commande/${id}`)
      .then(r => r.json())
      .then(j => { setBc(j.bc || null); setLoading(false); })
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
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-d-border text-xs text-d-muted hover:text-d-text transition"
            >
              <Printer size={13} /> Imprimer / PDF
            </button>
            {bc.status !== 'sent' && (
              <button
                onClick={() => setShowSend(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-d-primary text-white text-xs font-semibold hover:opacity-90 transition"
              >
                <Send size={13} /> Envoyer au fournisseur
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
            <div className="text-[10px] text-d-muted uppercase tracking-wider">Fournisseur</div>
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

        {/* HTML render */}
        {bc.html_content ? (
          <div
            className="rounded-xl border border-d-border overflow-hidden bg-white"
            style={{ minHeight: '600px' }}
            dangerouslySetInnerHTML={{ __html: bc.html_content }}
          />
        ) : (
          <div className="py-16 text-center text-d-muted">
            <Package size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun rendu HTML disponible pour ce bon de commande.</p>
          </div>
        )}
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
