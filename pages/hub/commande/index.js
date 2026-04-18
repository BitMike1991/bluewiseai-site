// pages/hub/commande/index.js
// P-C — Batch Bons de Commande page
// Shows pending items grouped by supplier, multi-select, generate BC per supplier.
// Gate: enabled_hub_tools includes 'commande' (PUR-only).
// Multi-tenant: all data fetched via session customer_id.

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../src/components/dashboard/DashboardLayout';
import {
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  Package,
  CheckSquare,
  Square,
  Loader2,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  X,
} from 'lucide-react';

const TOOL_ID = 'commande';

const SUPPLIER_META = {
  royalty:   { label: 'Royalty Fenestration', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  touchette:  { label: 'Touchette',            color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  other:      { label: 'Autre fournisseur',    color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildItemLabel(item) {
  const parts = [];
  if (item.type)   parts.push(item.type);
  if (item.model)  parts.push(item.model);
  if (item.ouvrant) parts.push(item.ouvrant);
  if (item.dimensions?.width && item.dimensions?.height) {
    parts.push(`${item.dimensions.width}" × ${item.dimensions.height}"`);
  }
  return parts.join(' — ') || item.description || 'Article';
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function supplierLabel(key) {
  return SUPPLIER_META[key]?.label || key;
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-medium shadow-lg flex items-center gap-2 ${
        type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
      }`}
    >
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100" aria-label="Fermer">
        <X size={14} />
      </button>
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
          <button onClick={onClose} aria-label="Fermer" className="text-d-muted hover:text-d-text transition">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mb-4 text-xs text-rose-400 bg-rose-400/10 rounded-xl px-3 py-2">{error}</div>
        )}

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
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-d-border text-sm text-d-muted hover:text-d-text transition"
          >
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

// ── Project group (collapsible) ───────────────────────────────────────────────

function ProjectGroup({ proj, supplierKey, selected, onToggle, onToggleAll }) {
  const [open, setOpen] = useState(true);
  const allSelected = proj.items.every(e => selected.has(`${e.quote_id}:${e.item_index}`));
  const someSelected = proj.items.some(e => selected.has(`${e.quote_id}:${e.item_index}`));
  const sm = SUPPLIER_META[supplierKey] || SUPPLIER_META.other;

  return (
    <div className="border border-d-border rounded-xl overflow-hidden">
      {/* Project header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-d-surface/40 cursor-pointer select-none"
           onClick={() => setOpen(v => !v)}>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onToggleAll(proj.items, !allSelected); }}
          className="flex-shrink-0 text-d-muted hover:text-d-primary transition"
          aria-label={allSelected ? 'Désélectionner le projet' : 'Sélectionner le projet'}
        >
          {allSelected
            ? <CheckSquare size={16} className="text-d-primary" />
            : someSelected
              ? <CheckSquare size={16} className="text-amber-400" />
              : <Square size={16} />}
        </button>
        <div className="flex-1 min-w-0">
          <span className="font-mono text-xs font-bold text-d-text">
            Projet {proj.job_number || proj.job_id || '—'}
          </span>
          {proj.client_name && (
            <span className="ml-2 text-xs text-d-muted">{proj.client_name}</span>
          )}
          {proj.client_address && (
            <span className="ml-2 text-xs text-d-muted/60 truncate hidden sm:inline">
              — {typeof proj.client_address === 'string'
                  ? proj.client_address
                  : [proj.client_address.street, proj.client_address.city].filter(Boolean).join(', ')}
            </span>
          )}
        </div>
        <span className="text-xs text-d-muted mr-2">{proj.items.length} article{proj.items.length > 1 ? 's' : ''}</span>
        {open ? <ChevronDown size={14} className="text-d-muted" /> : <ChevronRight size={14} className="text-d-muted" />}
      </div>

      {/* Items */}
      {open && (
        <div className="divide-y divide-d-border/50">
          {proj.items.map((entry) => {
            const key = `${entry.quote_id}:${entry.item_index}`;
            const isSelected = selected.has(key);
            const item = entry.item;

            return (
              <div
                key={key}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                  isSelected ? 'bg-d-primary/5' : 'hover:bg-d-surface/60'
                }`}
                onClick={() => onToggle(key)}
              >
                <div className="flex-shrink-0">
                  {isSelected
                    ? <CheckSquare size={15} className="text-d-primary" />
                    : <Square size={15} className="text-d-muted/60" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-d-text truncate">
                    {buildItemLabel(item)}
                  </div>
                  {item.specs && (
                    <div className="text-[10px] text-d-muted/70 truncate">{item.specs}</div>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {item.ouvrant && (
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-d-surface border border-d-border">
                      {item.ouvrant}
                    </span>
                  )}
                  <span className="font-mono text-xs font-bold text-d-text">×{item.qty || 1}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Supplier Card ─────────────────────────────────────────────────────────────

function SupplierCard({ supplierKey, data, selected, onToggle, onToggleAll, onGenerate, generating }) {
  const sm = SUPPLIER_META[supplierKey] || SUPPLIER_META.other;
  const allItems = data.projects.flatMap(p => p.items);
  const selectedCount = allItems.filter(e => selected.has(`${e.quote_id}:${e.item_index}`)).length;
  const allSelected = selectedCount === allItems.length;

  return (
    <div className="rounded-2xl border border-d-border bg-d-bg overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-d-border">
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm"
            style={{ backgroundColor: sm.bg, color: sm.color, border: `1px solid ${sm.border}` }}
          >
            {sm.label.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-semibold text-d-text">{sm.label}</div>
            <div className="text-[10px] text-d-muted">
              {data.totalItems} article{data.totalItems > 1 ? 's' : ''} — {data.totalProjects} projet{data.totalProjects > 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleAll(allItems, !allSelected)}
            className="text-xs text-d-muted hover:text-d-primary transition px-2 py-1 rounded-lg border border-d-border"
          >
            {allSelected ? 'Désélectionner tout' : 'Sélectionner tout'}
          </button>
        </div>
      </div>

      {/* Projects */}
      <div className="p-4 space-y-3">
        {data.projects.map((proj, pi) => (
          <ProjectGroup
            key={proj.job_id || pi}
            proj={proj}
            supplierKey={supplierKey}
            selected={selected}
            onToggle={onToggle}
            onToggleAll={onToggleAll}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-d-border flex items-center justify-between">
        <span className="text-xs text-d-muted">
          {selectedCount} / {allItems.length} sélectionné{selectedCount > 1 ? 's' : ''}
        </span>
        <button
          type="button"
          onClick={() => onGenerate(supplierKey)}
          disabled={selectedCount === 0 || generating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: selectedCount > 0 ? sm.color : undefined,
            color: selectedCount > 0 ? '#fff' : undefined,
            border: selectedCount === 0 ? '1px solid var(--d-border)' : 'none',
          }}
        >
          {generating
            ? <><Loader2 size={13} className="animate-spin" /> Génération...</>
            : <><Package size={13} /> Générer bon de commande</>}
        </button>
      </div>
    </div>
  );
}

// ── Sent list tab ─────────────────────────────────────────────────────────────

function SentTab({ status }) {
  const [bcs, setBcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendModal, setSendModal] = useState(null); // BC to re-send
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/bons-de-commande/list?status=${status}`)
      .then(r => r.json())
      .then(j => { setBcs(j.bcs || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [status]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-d-muted py-12 justify-center">
        <Loader2 size={16} className="animate-spin" /> Chargement...
      </div>
    );
  }

  if (bcs.length === 0) {
    return (
      <div className="text-center py-16 text-d-muted text-sm">
        Aucun bon de commande {status === 'sent' ? 'envoyé' : 'reçu'}.
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {sendModal && (
        <SendModal
          bc={sendModal}
          onClose={() => setSendModal(null)}
          onSent={() => {
            setSendModal(null);
            setToast({ msg: 'BC renvoyé', type: 'success' });
          }}
        />
      )}
      <div className="space-y-2">
        {bcs.map(bc => (
          <div
            key={bc.id}
            className="flex items-center gap-4 px-5 py-4 rounded-xl border border-d-border bg-d-bg hover:border-d-primary/30 transition"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-d-text">{bc.bc_number}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: SUPPLIER_META[bc.supplier]?.bg || '#f3f4f6',
                               color: SUPPLIER_META[bc.supplier]?.color || '#374151' }}>
                  {supplierLabel(bc.supplier)}
                </span>
                <span className="text-[10px] text-d-muted">{bc.item_count} article{bc.item_count > 1 ? 's' : ''}</span>
              </div>
              <div className="text-xs text-d-muted mt-0.5">
                {status === 'sent' ? `Envoyé le ${fmtDate(bc.sent_at)}` : `Reçu le ${fmtDate(bc.received_at)}`}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href={`/hub/commande/${bc.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-d-border text-xs text-d-muted hover:text-d-text transition"
              >
                <ExternalLink size={12} /> Voir
              </Link>
              {status === 'sent' && (
                <button
                  onClick={() => setSendModal(bc)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-d-border text-xs text-d-muted hover:text-d-primary transition"
                >
                  <Send size={12} /> Renvoyer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CommandePage() {
  const router = useRouter();
  const [tab, setTab] = useState('pending'); // 'pending' | 'sent' | 'received'

  // Pending state
  const [pendingData, setPendingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set()); // Set of "quoteId:itemIndex"
  const [generating, setGenerating] = useState(null); // supplierKey being generated
  const [generatedBc, setGeneratedBc] = useState(null); // last generated BC
  const [sendModal, setSendModal] = useState(null); // BC to send
  const [toast, setToast] = useState(null);

  const loadPending = useCallback(() => {
    setLoading(true);
    fetch('/api/bons-de-commande/pending')
      .then(r => r.json())
      .then(j => { setPendingData(j); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  function toggleItem(key) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function toggleAll(items, add) {
    setSelected(prev => {
      const next = new Set(prev);
      for (const e of items) {
        const k = `${e.quote_id}:${e.item_index}`;
        if (add) next.add(k); else next.delete(k);
      }
      return next;
    });
  }

  async function handleGenerate(supplierKey) {
    const supplierData = pendingData?.suppliers?.[supplierKey];
    if (!supplierData) return;

    const allItems = supplierData.projects.flatMap(p => p.items);
    const selectedRefs = allItems
      .filter(e => selected.has(`${e.quote_id}:${e.item_index}`))
      .map(e => ({ quote_id: e.quote_id, item_index: e.item_index }));

    if (selectedRefs.length === 0) return;

    setGenerating(supplierKey);
    try {
      const r = await fetch('/api/bons-de-commande/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier: supplierKey, item_refs: selectedRefs }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Échec génération');

      setGeneratedBc(j);
      setToast({ msg: `${j.bc_number} généré — prêt à envoyer`, type: 'success' });
      setSelected(new Set());
      loadPending(); // refresh pending list
    } catch (err) {
      setToast({ msg: `Erreur: ${err.message}`, type: 'error' });
    } finally {
      setGenerating(null);
    }
  }

  const tabs = [
    { id: 'pending',  label: 'En attente', icon: Clock },
    { id: 'sent',     label: 'Envoyés',    icon: Send },
    { id: 'received', label: 'Reçus',      icon: CheckCircle2 },
  ];

  return (
    <DashboardLayout>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {sendModal && (
        <SendModal
          bc={sendModal}
          onClose={() => setSendModal(null)}
          onSent={(result) => {
            setSendModal(null);
            setGeneratedBc(null);
            setToast({ msg: `${sendModal.bc_number} envoyé`, type: 'success' });
          }}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-d-surface border border-d-border">
              <ShoppingCart size={20} className="text-d-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-d-text">Bons de commande</h1>
              <p className="text-xs text-d-muted mt-0.5">Items en attente de commande fournisseur</p>
            </div>
          </div>
          {tab === 'pending' && (
            <button
              onClick={loadPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-d-border text-xs text-d-muted hover:text-d-text transition"
            >
              <RefreshCw size={12} /> Rafraîchir
            </button>
          )}
        </div>

        {/* Generated BC banner */}
        {generatedBc && (
          <div className="mb-5 flex items-center gap-4 px-5 py-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
            <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-d-text">{generatedBc.bc_number} généré</span>
              <span className="ml-2 text-xs text-d-muted">prêt à envoyer au fournisseur</span>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link
                href={generatedBc.preview_url}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-d-border text-xs text-d-muted hover:text-d-text transition"
              >
                <ExternalLink size={12} /> Aperçu
              </Link>
              <button
                onClick={() => setSendModal(generatedBc)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-d-primary text-white text-xs font-semibold hover:opacity-90 transition"
              >
                <Send size={12} /> Envoyer
              </button>
              <button
                onClick={() => setGeneratedBc(null)}
                className="text-d-muted hover:text-d-text p-1"
                aria-label="Fermer"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-d-surface border border-d-border w-fit mb-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === id ? 'bg-d-primary text-white' : 'text-d-muted hover:text-d-text'
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'pending' && (
          <>
            {loading ? (
              <div className="flex items-center gap-2 text-d-muted py-12 justify-center">
                <Loader2 size={16} className="animate-spin" /> Chargement...
              </div>
            ) : (
              <>
                {/* No-supplier warning */}
                {pendingData?.noSupplierCount > 0 && (
                  <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
                    <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />
                    <p className="text-xs text-amber-300">
                      <span className="font-semibold">{pendingData.noSupplierCount} item{pendingData.noSupplierCount > 1 ? 's' : ''} sans fournisseur attribué</span>
                      {' '}— assigne le fournisseur via l&apos;éditeur devis pour les inclure ici.
                    </p>
                  </div>
                )}

                {/* Supplier cards */}
                {pendingData?.suppliers && Object.keys(pendingData.suppliers).length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(pendingData.suppliers).map(([supplierKey, data]) => (
                      <SupplierCard
                        key={supplierKey}
                        supplierKey={supplierKey}
                        data={data}
                        selected={selected}
                        onToggle={toggleItem}
                        onToggleAll={toggleAll}
                        onGenerate={handleGenerate}
                        generating={generating === supplierKey}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <ShoppingCart size={40} className="mx-auto text-d-muted/30 mb-4" />
                    <p className="text-d-muted text-sm">Aucun item en attente de commande.</p>
                    <p className="text-d-muted/60 text-xs mt-1">
                      Marque des items « Ajouter au BC » depuis l&apos;éditeur devis d&apos;un projet.
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === 'sent'     && <SentTab status="sent" />}
        {tab === 'received' && <SentTab status="received" />}
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
