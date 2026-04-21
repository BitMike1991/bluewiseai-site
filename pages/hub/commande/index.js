// pages/hub/commande/index.js
// P-C — Batch Bons de Commande page
// Shows pending items grouped by supplier, multi-select, generate BC per supplier.
// Gate: enabled_hub_tools includes 'commande' (PUR-only).
// Multi-tenant: all data fetched via session customer_id.

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Upload,
  FileText,
  Zap,
  ChevronUp,
  Check,
  AlertCircle,
  ArrowRight,
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
        Aucun bon de commande {status === 'sent' ? 'envoyé' : status === 'draft' ? 'en brouillon' : 'reçu'}.
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
                {status === 'sent'
                  ? `Envoyé le ${fmtDate(bc.sent_at)}`
                  : status === 'draft'
                    ? `Créé le ${fmtDate(bc.created_at)} · pas encore envoyé`
                    : `Reçu le ${fmtDate(bc.received_at)}`}
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
              {status === 'draft' && (
                <button
                  onClick={() => setSendModal(bc)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-d-primary text-white text-xs font-semibold hover:opacity-90 transition"
                >
                  <Send size={12} /> Envoyer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Supplier Dispatcher ───────────────────────────────────────────────────────

function fmtPrice(n) {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n);
}

function ConfidenceBadge({ confidence }) {
  const map = {
    exact:       { label: 'Exact',     cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    partial:     { label: 'Partiel',   cls: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
    wide:        { label: 'Large',     cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    manual:      { label: 'Manuel',    cls: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    unmatched:   { label: 'Non matché', cls: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  };
  const m = map[confidence] || map.unmatched;
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${m.cls}`}>
      {m.label}
    </span>
  );
}

/**
 * SupplierDispatcher — global PDF upload + 3-section review card
 * Sits at top of En attente tab.
 */
function SupplierDispatcher({ onApplySuccess }) {
  const fileInputRef       = useRef(null);
  const [dragging,   setDragging]   = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [parseResult, setParseResult] = useState(null); // result from parse-global
  const [error,      setError]      = useState(null);

  // Review state: user picks from dropdowns for unmatched items
  // manualAssigns: { "quote_id:item_idx": parsed_idx | 'ignore' }
  const [manualAssigns, setManualAssigns] = useState({});
  // matchedExpanded: show/hide matched section
  const [matchedExpanded, setMatchedExpanded] = useState(false);
  const [applying,   setApplying]   = useState(false);
  const [applyResult, setApplyResult] = useState(null);

  function reset() {
    setParseResult(null);
    setError(null);
    setManualAssigns({});
    setMatchedExpanded(false);
    setApplyResult(null);
  }

  async function uploadPdf(file) {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Seuls les fichiers PDF sont acceptés.');
      return;
    }
    setUploading(true);
    setError(null);
    setParseResult(null);
    setManualAssigns({});
    setApplyResult(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/supplier-return/parse-global', { method: 'POST', body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Erreur parse');
      setParseResult(j);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function onFileInput(e) {
    const file = e.target.files?.[0];
    if (file) uploadPdf(file);
    e.target.value = '';
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadPdf(file);
  }

  async function handleApplyAll() {
    if (!parseResult) return;
    setApplying(true);
    setError(null);

    // Build confirmed matches (all auto-matches passed through)
    const confirmedMatches = parseResult.matches || [];

    // Build manual assignments from user picks (exclude 'ignore')
    const manualList = [];
    const ignoreList = [];
    for (const [key, val] of Object.entries(manualAssigns)) {
      const [quoteId, itemIdx] = key.split(':');
      if (val === 'ignore' || val === '') {
        ignoreList.push({ quote_id: parseInt(quoteId), item_idx: parseInt(itemIdx) });
      } else {
        manualList.push({ quote_id: parseInt(quoteId), item_idx: parseInt(itemIdx), parsed_idx: parseInt(val) });
      }
    }

    // Items in unmatched_quote_items that user didn't touch → auto-ignore
    for (const uqi of (parseResult.unmatched_quote_items || [])) {
      const key = `${uqi.quote_id}:${uqi.item_idx}`;
      if (!manualAssigns[key]) {
        ignoreList.push({ quote_id: uqi.quote_id, item_idx: uqi.item_idx });
      }
    }

    try {
      const r = await fetch('/api/supplier-return/apply-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matches:            confirmedMatches,
          manual_assignments: manualList,
          ignore:             ignoreList,
          parsed_payload:     parseResult,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Erreur dispatch');
      setApplyResult(j);
      if (onApplySuccess) onApplySuccess(j);
    } catch (err) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (applyResult) {
    return (
      <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 flex-shrink-0">
            <CheckCircle2 size={18} className="text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-d-text">
              {applyResult.applied_count} item{applyResult.applied_count !== 1 ? 's' : ''} pricé{applyResult.applied_count !== 1 ? 's' : ''} à travers {applyResult.breakdown?.length || 0} devis
            </p>
            <p className="text-xs text-d-muted mt-1">
              {applyResult.quotes_flipped_to_ready > 0 && (
                <span className="text-emerald-400 font-medium">
                  {applyResult.quotes_flipped_to_ready} devis passé{applyResult.quotes_flipped_to_ready > 1 ? 's' : ''} à Prêt ·{' '}
                </span>
              )}
              {fmtPrice(applyResult.total_expenses_recorded)} en dépenses enregistrées
            </p>
            {(applyResult.breakdown || []).length > 0 && (
              <div className="mt-2 space-y-1">
                {applyResult.breakdown.map(b => (
                  <div key={b.quote_id} className="text-xs text-d-muted flex items-center gap-2">
                    <span className="font-mono text-d-text">{b.quote_number}</span>
                    <span>{b.items_applied} item{b.items_applied > 1 ? 's' : ''}</span>
                    {b.all_priced && (
                      <span className="text-emerald-400 font-semibold">→ Prêt</span>
                    )}
                    <span>{fmtPrice(b.new_total_ttc)} TTC</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/platform/jobs?status=awaiting_client_approval"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 text-xs text-emerald-400 hover:bg-emerald-500/10 transition"
            >
              <ArrowRight size={12} /> Voir devis prêts
            </Link>
            <button
              onClick={reset}
              className="p-1.5 rounded-lg text-d-muted hover:text-d-text transition"
              aria-label="Fermer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Upload zone (no parse result yet) ────────────────────────────────────
  if (!parseResult) {
    return (
      <div className="mb-6 rounded-2xl border border-d-border bg-d-bg overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <div className="p-2.5 rounded-xl bg-d-primary/10 border border-d-primary/20">
            <Zap size={16} className="text-d-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-d-text">Dispatcher une soumission fournisseur</h2>
            <p className="text-xs text-d-muted mt-0.5">
              Upload le PDF — on matche automatiquement à tous tes devis en attente de prix fournisseur.
            </p>
          </div>
        </div>

        {/* Drop zone */}
        <div
          className={`mx-5 mb-5 rounded-xl border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center py-8 gap-3 ${
            dragging
              ? 'border-d-primary bg-d-primary/5 text-d-primary'
              : 'border-d-border hover:border-d-primary/40 text-d-muted'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
          aria-label="Glisser un PDF ici ou cliquer pour choisir"
          onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 size={22} className="animate-spin text-d-primary" />
          ) : (
            <Upload size={22} />
          )}
          <div className="text-center">
            <p className="text-sm font-medium">
              {uploading ? 'Analyse en cours...' : 'Glisser PDF ici ou cliquer pour choisir'}
            </p>
            <p className="text-xs mt-1 opacity-60">Soumissions Royalty uniquement · Max 10 MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            onChange={onFileInput}
            disabled={uploading}
          />
        </div>

        {error && (
          <div className="mx-5 mb-5 flex items-start gap-2 text-xs text-rose-400 bg-rose-400/10 rounded-xl px-3 py-2.5">
            <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  // ── Review UI (parse result ready) ───────────────────────────────────────
  const autoMatches          = parseResult.matches || [];
  const unmatchedQuoteItems  = parseResult.unmatched_quote_items || [];
  const unmatchedSouItems    = parseResult.unmatched_soumission_items || [];
  const parsedItems          = parseResult._parsed_items || [];

  // Filter unmatched soumission items: only those not yet assigned by user
  const assignedParsedIdxs = new Set(
    Object.entries(manualAssigns)
      .filter(([, v]) => v !== 'ignore' && v !== '')
      .map(([, v]) => parseInt(v))
  );
  const remainingSouItems = unmatchedSouItems.filter(si => !assignedParsedIdxs.has(si.parsed_idx));

  return (
    <div className="mb-6 space-y-4">
      {/* Parse summary header */}
      <div className="rounded-2xl border border-d-border bg-d-bg px-5 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-d-surface border border-d-border">
              <FileText size={15} className="text-d-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-d-text">
                {parseResult.fournisseur || 'Royalty'} — {parseResult.parsed_items_count} items parsés
              </p>
              <p className="text-xs text-d-muted mt-0.5">
                Escompte détecté: <span className="font-semibold text-d-text">{parseResult.escompte_pct || 0}%</span>
                {parseResult.soumission_number && (
                  <> · N° <span className="font-mono">{parseResult.soumission_number}</span></>
                )}
                <> · {parseResult.quotes_scanned} devis scannés</>
              </p>
            </div>
          </div>
          <button
            onClick={reset}
            className="text-d-muted hover:text-d-text p-1.5 rounded-lg transition"
            aria-label="Recommencer"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Section 1: Auto-matches (collapsible) */}
      {autoMatches.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-4 text-left"
            onClick={() => setMatchedExpanded(v => !v)}
            aria-expanded={matchedExpanded}
          >
            <div className="flex items-center gap-2">
              <Check size={15} className="text-emerald-400" />
              <span className="text-sm font-semibold text-d-text">
                {autoMatches.length} matché{autoMatches.length > 1 ? 's' : ''} automatiquement
              </span>
              <span className="text-xs text-d-muted">(clic pour voir)</span>
            </div>
            {matchedExpanded
              ? <ChevronUp size={14} className="text-d-muted" />
              : <ChevronDown size={14} className="text-d-muted" />}
          </button>
          {matchedExpanded && (
            <div className="border-t border-emerald-500/20 divide-y divide-d-border/40">
              {autoMatches.map((m, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-2.5 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-xs font-bold text-d-text">{m.quote_number}</span>
                    <span className="text-xs text-d-muted ml-2">{m.client_name}</span>
                    <span className="text-xs text-d-muted ml-2">item #{m.item_idx + 1}</span>
                    <span className="text-xs text-d-text ml-2">{m.parsed_model} {m.parsed_dims}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ConfidenceBadge confidence={m.match_confidence} />
                    <span className="text-xs font-semibold text-emerald-400">{fmtPrice(m.new_unit_price)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section 2: Unmatched quote items */}
      {unmatchedQuoteItems.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-400" />
              <span className="text-sm font-semibold text-d-text">
                {unmatchedQuoteItems.length} item{unmatchedQuoteItems.length > 1 ? 's' : ''} devis sans correspondance
              </span>
            </div>
            <p className="text-xs text-d-muted mt-1">Assigne manuellement ou ignore.</p>
          </div>
          <div className="divide-y divide-d-border/40">
            {unmatchedQuoteItems.map((uqi, i) => {
              const key = `${uqi.quote_id}:${uqi.item_idx}`;
              const currentVal = manualAssigns[key] ?? '';
              return (
                <div key={i} className="px-5 py-4">
                  <div className="mb-2">
                    <span className="font-mono text-xs font-bold text-d-text">{uqi.quote_number}</span>
                    <span className="text-xs text-d-muted ml-2">{uqi.client_name}</span>
                    <span className="text-xs text-d-muted ml-2">item #{uqi.item_idx + 1}</span>
                  </div>
                  <p className="text-sm text-d-text mb-3">
                    {uqi.item_description || `${uqi.item_type} ${uqi.item_model}`.trim()}
                    {uqi.item_dims !== '—' && (
                      <span className="text-d-muted ml-2 text-xs">{uqi.item_dims}</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={currentVal}
                      onChange={e => setManualAssigns(prev => ({ ...prev, [key]: e.target.value }))}
                      className="flex-1 min-w-0 max-w-xs px-3 py-2 rounded-xl border border-d-border bg-d-surface text-xs text-d-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
                    >
                      <option value="">— Choisir une correspondance —</option>
                      {(uqi.possible_matches || []).map(pm => (
                        <option key={pm.parsed_idx} value={pm.parsed_idx}>
                          Royalty {pm.model} {pm.dims} {fmtPrice(pm.price)}
                          {pm.dim_delta != null ? ` (+${pm.dim_delta}" diff)` : ''}
                        </option>
                      ))}
                      <option value="ignore">Ignorer — prix hors soumission</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 3: Unmatched soumission items */}
      {remainingSouItems.length > 0 && (
        <div className="rounded-2xl border border-d-border bg-d-bg overflow-hidden">
          <div className="px-5 py-4 border-b border-d-border">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-d-muted" />
              <span className="text-sm font-semibold text-d-text">
                {remainingSouItems.length} item{remainingSouItems.length > 1 ? 's' : ''} soumission non-dispatchés
              </span>
            </div>
            <p className="text-xs text-d-muted mt-1">Ces items Royalty n'ont été assignés à aucun devis.</p>
          </div>
          <div className="divide-y divide-d-border/50">
            {remainingSouItems.map((si, i) => {
              // Find an unmatched quote item key that user hasn't assigned yet
              const unassignedUqi = unmatchedQuoteItems.filter(uqi => {
                const key = `${uqi.quote_id}:${uqi.item_idx}`;
                return !manualAssigns[key] || manualAssigns[key] === '';
              });
              // Build reverse key: use a special key "sou:{parsed_idx}" for soumission items
              // pointing to a specific unmatched quote item
              const souKey = `sou:${si.parsed_idx}`;
              const currentVal = manualAssigns[souKey] ?? '';

              return (
                <div key={i} className="px-5 py-4">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-d-muted">#{si.parsed_idx + 1}</span>
                    <span className="text-sm font-semibold text-d-text">{si.model} {si.dims}</span>
                    <span className="text-xs text-d-muted">{fmtPrice(si.listPrice)}</span>
                    {si.qty && si.qty > 1 && (
                      <span className="font-mono text-xs text-d-muted">×{si.qty}</span>
                    )}
                  </div>
                  {(si.possible_targets || []).length > 0 && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <select
                        value={currentVal}
                        onChange={e => {
                          // When user assigns a soumission item to a quote item,
                          // record it as a manual assignment on the quote item side
                          const val = e.target.value;
                          if (val && val !== 'ignore') {
                            // val is "quoteId:itemIdx"
                            const [qId, iIdx] = val.split(':');
                            const manualKey = `${qId}:${iIdx}`;
                            setManualAssigns(prev => ({
                              ...prev,
                              [manualKey]: String(si.parsed_idx),
                              [souKey]: val,
                            }));
                          } else {
                            setManualAssigns(prev => ({ ...prev, [souKey]: val }));
                          }
                        }}
                        className="flex-1 min-w-0 max-w-xs px-3 py-2 rounded-xl border border-d-border bg-d-surface text-xs text-d-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
                      >
                        <option value="">— Assigner à un devis —</option>
                        {(si.possible_targets || []).map((pt, pi) => (
                          <option key={pi} value={`${pt.quote_id}:${pt.item_idx}`}>
                            {pt.quote_number} item #{pt.item_idx + 1} — {pt.item_description}
                            {pt.dims_delta != null ? ` (+${pt.dims_delta}" diff)` : ''}
                          </option>
                        ))}
                        <option value="ignore">Ignorer</option>
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-xs text-rose-400 bg-rose-400/10 rounded-xl px-3 py-2.5">
          <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Apply CTA */}
      <div className="flex items-center justify-between gap-4 flex-wrap pt-1">
        <p className="text-xs text-d-muted">
          {autoMatches.length} auto · {Object.values(manualAssigns).filter(v => v && v !== 'ignore' && !v.startsWith('sou:')).length} manuel
        </p>
        <button
          onClick={handleApplyAll}
          disabled={applying || (autoMatches.length === 0 && Object.keys(manualAssigns).length === 0)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-d-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {applying
            ? <><Loader2 size={14} className="animate-spin" /> Application...</>
            : <><Zap size={14} /> Appliquer tout + générer expenses</>}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CommandePage() {
  const router = useRouter();
  const [tab, setTab] = useState('pending'); // 'pending' | 'drafts' | 'sent' | 'received'

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
    { id: 'drafts',   label: 'Brouillons', icon: FileText },
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
            {/* Dispatcher card — always visible on pending tab */}
            <SupplierDispatcher
              onApplySuccess={(result) => {
                setToast({
                  msg: `${result.applied_count} items pricés · ${result.quotes_flipped_to_ready} devis prêts`,
                  type: 'success',
                });
                loadPending(); // refresh pending list
              }}
            />

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

        {tab === 'drafts'   && <SentTab status="draft" />}
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
