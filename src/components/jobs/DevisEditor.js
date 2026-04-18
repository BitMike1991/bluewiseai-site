/**
 * DevisEditor — split-view WYSIWYG editor for PÜR devis.
 * Left: editable form (client info, line items, install, notes, status).
 * Right: live iframe preview of the final PÜR client template.
 * Props: { job, quote, onSaved }
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Save,
  Trash2,
  Copy,
  ExternalLink,
  Send,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
} from 'lucide-react';
import { STATUS_META, STATUS_ORDER } from '../../../lib/status-config';
import { itemSketchSvg } from '../../../lib/quote-templates/pur.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtQC(n) {
  const num = parseFloat(n) || 0;
  return num.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '\u00a0$';
}

function buildDescription(item) {
  const parts = [];
  if (item.type)  parts.push(item.type);
  if (item.model) parts.push(item.model);
  if (item.ouvrant) parts.push(item.ouvrant);
  if (item.dimensions?.width && item.dimensions?.height) {
    parts.push(`${item.dimensions.width}" × ${item.dimensions.height}"`);
  }
  return parts.join(' — ') || item.description || 'Article';
}

function computeTotals(items, installCost) {
  const install = parseFloat(installCost) || 0;
  const lineSubtotal = (items || []).reduce(
    (s, it) => s + (Number(it.qty) || 0) * (Number(it.unit_price) || 0),
    0
  );
  const subtotal  = lineSubtotal + install;
  const tax_gst   = subtotal * 0.05;
  const tax_qst   = subtotal * 0.09975;
  const total_ttc = subtotal + tax_gst + tax_qst;
  return { subtotal, tax_gst, tax_qst, total_ttc };
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-medium shadow-lg transition-all ${
        type === 'error'
          ? 'bg-rose-600 text-white'
          : 'bg-emerald-600 text-white'
      }`}
    >
      {message}
    </div>
  );
}

// ── Status selector ──────────────────────────────────────────────────────────

function StatusSelector({ value, onChange }) {
  const canonical = STATUS_ORDER.filter(s => !STATUS_META[s]?.legacy);
  const meta = STATUS_META[value] || STATUS_META['draft'];
  return (
    <div className="relative inline-block">
      <select
        value={value || 'draft'}
        onChange={e => onChange(e.target.value)}
        aria-label="Changer le statut du projet"
        className="appearance-none pl-3 pr-8 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
        style={{
          color: meta.color,
          backgroundColor: meta.bg,
          borderColor: meta.color + '55',
        }}
      >
        {canonical.map(s => (
          <option key={s} value={s}>
            {STATUS_META[s]?.label || s}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
        style={{ color: meta.color }}
      />
    </div>
  );
}

// ── Line item row ─────────────────────────────────────────────────────────────

const WINDOW_TYPES = [
  'Fenêtre coulissante',
  'Fenêtre à battant',
  'Porte-fenêtre',
  "Porte d'entrée",
  'Porte patio',
  'Porte simple',
  'Fenêtre fixe',
  'Autre',
];

/**
 * Returns true if this item is a "porte simple" (entry door + optional side lites).
 * Used to show the "Nombre de side lites" dropdown.
 */
function isPorteSimple(item) {
  const text = [item.type || '', item.model || '', item.description || '']
    .join(' ')
    .toLowerCase();
  return text.includes('simple') && !text.includes('patio');
}

function LineItemRow({ item, index, onChange, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const auto = buildDescription(item);
  const total = (Number(item.qty) || 0) * (Number(item.unit_price) || 0);

  // Generate SVG sketch for this item
  const sketchSvg = itemSketchSvg(item);

  // Build header label: type + model + ouvrant badge
  const typeLabel = item.type || 'Article';
  const modelLabel = item.model ? ` ${item.model}` : '';
  const dimLabel = (item.dimensions?.width && item.dimensions?.height)
    ? `${item.dimensions.width}" × ${item.dimensions.height}"`
    : null;

  function update(field, value) {
    onChange(index, { ...item, [field]: value });
  }

  function updateDim(dim, value) {
    onChange(index, { ...item, dimensions: { ...(item.dimensions || {}), [dim]: value } });
  }

  return (
    <div className="rounded-xl border border-d-border bg-d-surface/30 overflow-hidden">
      {/* Item header with SVG preview */}
      <div className="flex gap-3 px-3 pt-3 pb-2">
        {/* SVG preview box — 60×60 */}
        <div
          className="flex-shrink-0 rounded border border-d-border/60 bg-[#F2F5F0] flex items-center justify-center overflow-hidden"
          style={{ width: 60, height: 60 }}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: sketchSvg }}
        />

        {/* Item identity */}
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[10px] font-semibold text-d-muted mb-0.5">
            Item #{index + 1}
          </div>
          <div className="text-xs font-semibold text-d-text truncate">
            {typeLabel}{modelLabel}
            {item.ouvrant && (
              <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded bg-[#E9EFE7] text-[9px] font-mono font-bold text-[#2A2C35]">
                {item.ouvrant}
              </span>
            )}
          </div>
          {dimLabel && (
            <div className="text-[10px] font-mono text-d-muted mt-0.5">{dimLabel}</div>
          )}
        </div>

        {/* Expand + delete */}
        <div className="flex items-start gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            aria-label={expanded ? 'Réduire' : 'Développer'}
            className="text-d-muted hover:text-d-text transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-d-primary/60 rounded p-0.5"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            type="button"
            onClick={() => onDelete(index)}
            aria-label={`Supprimer l'article ${index + 1}`}
            className="text-rose-400/60 hover:text-rose-400 transition flex-shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400/60 rounded p-0.5"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Inline qty/price summary — always visible */}
      <div className="flex items-center gap-2 px-3 pb-2.5">
        <label className="flex items-center gap-1 text-xs text-d-muted">
          Qté
          <input
            type="number"
            min="1"
            step="1"
            value={item.qty ?? 1}
            onChange={e => update('qty', e.target.value)}
            aria-label={`Quantité article ${index + 1}`}
            className="w-14 px-1.5 py-0.5 rounded-lg border border-d-border bg-d-surface text-d-text text-xs text-right focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-d-primary/60"
          />
        </label>
        <label className="flex items-center gap-1 text-xs text-d-muted">
          Prix
          <input
            type="number"
            min="0"
            step="0.01"
            value={item.unit_price ?? 0}
            onChange={e => update('unit_price', e.target.value)}
            aria-label={`Prix unitaire article ${index + 1}`}
            className="w-20 px-1.5 py-0.5 rounded-lg border border-d-border bg-d-surface text-d-text text-xs text-right focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-d-primary/60"
          />
        </label>
        <span className="text-xs font-semibold text-d-text ml-auto">{fmtQC(total)}</span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-d-border/50 px-3 py-3 space-y-2.5">
          {/* Type */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-d-muted mb-1">Type</label>
              <select
                value={item.type || ''}
                onChange={e => update('type', e.target.value)}
                aria-label="Type de fenêtre"
                className="w-full px-2 py-1.5 rounded-lg border border-d-border bg-d-surface text-xs text-d-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-d-primary/60"
              >
                <option value="">— Choisir —</option>
                {WINDOW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-d-muted mb-1">Modèle</label>
              <input
                type="text"
                value={item.model || ''}
                onChange={e => update('model', e.target.value)}
                placeholder="ex: C2G XO"
                aria-label="Modèle"
                className="w-full px-2 py-1.5 rounded-lg border border-d-border bg-d-surface text-xs text-d-text placeholder:text-d-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-d-primary/60"
              />
            </div>
          </div>

          {/* Ouvrant + Dimensions */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-d-muted mb-1">Ouvrant</label>
              <input
                type="text"
                value={item.ouvrant || ''}
                onChange={e => update('ouvrant', e.target.value)}
                placeholder="ex: XO"
                aria-label="Ouvrant"
                className="w-full px-2 py-1.5 rounded-lg border border-d-border bg-d-surface text-xs text-d-text placeholder:text-d-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-d-primary/60"
              />
            </div>
            <div>
              <label className="block text-[10px] text-d-muted mb-1">Larg.</label>
              <input
                type="text"
                value={item.dimensions?.width || ''}
                onChange={e => updateDim('width', e.target.value)}
                placeholder='ex: 36"'
                aria-label="Largeur"
                className="w-full px-2 py-1.5 rounded-lg border border-d-border bg-d-surface text-xs text-d-text placeholder:text-d-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-d-primary/60"
              />
            </div>
            <div>
              <label className="block text-[10px] text-d-muted mb-1">Haut.</label>
              <input
                type="text"
                value={item.dimensions?.height || ''}
                onChange={e => updateDim('height', e.target.value)}
                placeholder='ex: 48"'
                aria-label="Hauteur"
                className="w-full px-2 py-1.5 rounded-lg border border-d-border bg-d-surface text-xs text-d-text placeholder:text-d-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-d-primary/60"
              />
            </div>
          </div>

          {/* Specs */}
          <div>
            <label className="block text-[10px] text-d-muted mb-1">Spécifications (optionnel)</label>
            <textarea
              value={item.specs || ''}
              onChange={e => update('specs', e.target.value)}
              rows={2}
              placeholder="Couleur, argon, low-e, etc."
              aria-label="Spécifications"
              className="w-full px-2 py-1.5 rounded-lg border border-d-border bg-d-surface text-xs text-d-text placeholder:text-d-muted/40 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-d-primary/60"
            />
          </div>

          {/* Side lites — only shown for porte simple */}
          {isPorteSimple(item) && (
            <div>
              <label className="block text-[10px] text-d-muted mb-1">
                Nombre de side lites{' '}
                <span className="text-d-muted/60 font-normal">(750 $/côté)</span>
              </label>
              <select
                value={item.sides ?? 0}
                onChange={e => update('sides', Number(e.target.value))}
                aria-label="Nombre de side lites"
                className="w-full px-2 py-1.5 rounded-lg border border-d-border bg-d-surface text-xs text-d-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-d-primary/60"
              >
                <option value={0}>0 — porte seule</option>
                <option value={1}>1 side lite</option>
                <option value={2}>2 side lites</option>
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Send modal ────────────────────────────────────────────────────────────────

function SendModal({ quote, job, onClose, onSent }) {
  const [phone, setPhone]   = useState(job?.client_phone || '');
  const [email, setEmail]   = useState(job?.client_email || '');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    setSending(true);
    try {
      // Mark quote as sent + job as awaiting_client_approval
      await Promise.all([
        fetch(`/api/quotes/${quote.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'sent' }),
        }),
        fetch(`/api/jobs/${job.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'awaiting_client_approval' }),
        }),
      ]);
      onSent({ phone, email });
    } catch {
      // non-fatal
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-d-bg border border-d-border rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-d-text">Envoyer le devis au client</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-d-muted hover:text-d-text transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-d-primary/60 rounded"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs text-d-muted mb-1.5">SMS (Telnyx)</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+15141234567"
              aria-label="Numéro SMS"
              className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm text-d-text placeholder:text-d-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs text-d-muted mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="client@exemple.com"
              aria-label="Email client"
              className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm text-d-text placeholder:text-d-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
            />
          </div>
          <p className="text-[10px] text-amber-400">
            Envoi SMS/Email — TODO câblage Telnyx en P12. Marque quand même le statut « Envoyé ».
          </p>
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={sending || (!phone && !email)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-d-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/60"
        >
          {sending && <Loader2 size={14} className="animate-spin" />}
          {sending ? 'Envoi...' : 'Envoyer'}
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DevisEditor({ job, quote, onSaved }) {
  // Client fields
  const [clientName,    setClientName]    = useState(job?.client_name    || '');
  const [clientPhone,   setClientPhone]   = useState(job?.client_phone   || '');
  const [clientEmail,   setClientEmail]   = useState(job?.client_email   || '');
  const [clientAddress, setClientAddress] = useState(
    typeof job?.client_address === 'string'
      ? job.client_address
      : [
          job?.client_address?.street,
          job?.client_address?.city,
          job?.client_address?.province,
          job?.client_address?.postal_code,
        ].filter(Boolean).join(', ') || ''
  );
  const [jobStatus, setJobStatus] = useState(job?.status || 'draft');

  // Price display mode
  const [priceDisplayMode, setPriceDisplayMode] = useState(
    quote?.meta?.price_display_mode || 'unitaire'
  );

  // Quote fields
  const [items,       setItems]       = useState(quote?.line_items || []);
  const [installCost, setInstallCost] = useState(
    // Try to find install item in line_items
    (() => {
      if (!quote?.line_items) return '0';
      const inst = quote.line_items.find(
        it => (it.description || '').toLowerCase().includes('install') ||
              (it.type || '').toLowerCase().includes('install')
      );
      return inst ? String(inst.unit_price || 0) : '0';
    })()
  );
  const [notes,       setNotes]       = useState(quote?.notes || '');

  // UI state
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null); // { msg, type }
  const [dirty,    setDirty]    = useState(false);
  const [previewKey, setPreviewKey] = useState(Date.now());
  const [previewOpen, setPreviewOpen] = useState(false); // mobile accordion
  const [showSend,  setShowSend]  = useState(false);

  const savedRef = useRef(false);

  // Mark dirty on any field change
  function markDirty() {
    setDirty(true);
    savedRef.current = false;
  }

  // Compute totals live
  // Filter out any existing install line item from items array when computing
  const dataItems = items.filter(
    it => !(it.description || '').toLowerCase().startsWith('installation')
  );
  const { subtotal, tax_gst, tax_qst, total_ttc } = computeTotals(dataItems, installCost);

  // All line items to save = content items + install item if > 0
  function buildSaveItems() {
    const clean = dataItems.map(it => ({
      ...it,
      qty:        Number(it.qty) || 1,
      unit_price: Number(it.unit_price) || 0,
      total:      (Number(it.qty) || 0) * (Number(it.unit_price) || 0),
      description: buildDescription(it),
    }));
    const installAmt = parseFloat(installCost) || 0;
    if (installAmt > 0) {
      clean.push({
        description: 'Installation',
        qty: 1,
        unit_price: installAmt,
        total: installAmt,
        type: 'Installation',
      });
    }
    return clean;
  }

  // Save handler
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const saveItems = buildSaveItems();

      const [jobRes, quoteRes] = await Promise.all([
        fetch(`/api/jobs/${job.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_name:    clientName,
            client_phone:   clientPhone,
            client_email:   clientEmail,
            client_address: clientAddress,
            status:         jobStatus,
          }),
        }),
        fetch(`/api/quotes/${quote.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            line_items: saveItems,
            subtotal,
            tax_gst,
            tax_qst,
            total_ttc,
            notes,
            meta: { price_display_mode: priceDisplayMode },
          }),
        }),
      ]);

      if (!jobRes.ok || !quoteRes.ok) {
        throw new Error('Erreur serveur');
      }

      setDirty(false);
      savedRef.current = true;
      setPreviewKey(Date.now()); // reload iframe
      setToast({ msg: 'Enregistré', type: 'success' });
      if (onSaved) onSaved();
    } catch (err) {
      setToast({ msg: `Erreur: ${err.message}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientName, clientPhone, clientEmail, clientAddress, jobStatus, items, installCost, notes, priceDisplayMode, subtotal, tax_gst, tax_qst, total_ttc, job.id, quote.id, onSaved]);

  // Ctrl+S keyboard shortcut
  useEffect(() => {
    function onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSave]);

  // Warn on navigation if unsaved
  useEffect(() => {
    function onBeforeUnload(e) {
      if (dirty) {
        e.preventDefault();
        e.returnValue = 'Modifications non enregistrées';
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  async function handlePriceDisplayModeChange(newMode) {
    setPriceDisplayMode(newMode);
    markDirty();
    // Immediately persist meta so iframe preview reflects the change
    try {
      await fetch(`/api/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta: { price_display_mode: newMode } }),
      });
      setPreviewKey(Date.now());
    } catch {
      // non-fatal — will be saved on next full save
    }
  }

  function addItem() {
    markDirty();
    setItems(prev => [
      ...prev,
      {
        description:  '',
        qty:          1,
        unit_price:   0,
        total:        0,
        type:         'Fenêtre coulissante',
        model:        '',
        ouvrant:      '',
        dimensions:   { width: '', height: '' },
        specs:        '',
      },
    ]);
  }

  function updateItem(index, updated) {
    markDirty();
    setItems(prev => prev.map((it, i) => (i === index ? updated : it)));
  }

  function deleteItem(index) {
    markDirty();
    setItems(prev => prev.filter((_, i) => i !== index));
  }

  function handleCopyLink() {
    const url = `https://pur-construction-site.vercel.app/q/${quote.quote_number}`;
    navigator.clipboard.writeText(url).then(() => {
      setToast({ msg: 'Lien copié', type: 'success' });
    }).catch(() => {
      setToast({ msg: 'Impossible de copier — essaie manuellement', type: 'error' });
    });
  }

  function handleOpenPreview() {
    window.open(`https://pur-construction-site.vercel.app/q/${quote.quote_number}`, '_blank');
  }

  const iframeSrc = `/api/universal/devis/render-iframe?quote_number=${quote.quote_number}&t=${previewKey}`;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Toast */}
      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Send modal */}
      {showSend && (
        <SendModal
          quote={quote}
          job={{ ...job, client_phone: clientPhone, client_email: clientEmail }}
          onClose={() => setShowSend(false)}
          onSent={() => {
            setShowSend(false);
            setToast({ msg: 'Statut mis à jour — envoi SMS/email en P12', type: 'success' });
            setJobStatus('awaiting_client_approval');
          }}
        />
      )}

      {/* ── Top action bar ── */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        {/* Left: status + dirty badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatusSelector
            value={jobStatus}
            onChange={v => { setJobStatus(v); markDirty(); }}
          />
          {dirty && (
            <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
              Non enregistré
            </span>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label="Copier le lien du devis"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-d-border bg-d-surface text-xs text-d-text hover:border-d-primary/50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
          >
            <Copy size={13} /> Copier lien
          </button>
          <button
            type="button"
            onClick={handleOpenPreview}
            aria-label="Ouvrir l'aperçu dans un nouvel onglet"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-d-border bg-d-surface text-xs text-d-text hover:border-d-primary/50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
          >
            <ExternalLink size={13} /> Aperçu
          </button>
          <button
            type="button"
            onClick={() => setShowSend(true)}
            aria-label="Envoyer le devis au client"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-d-primary/50 bg-d-primary/10 text-xs text-d-primary hover:bg-d-primary/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
          >
            <Send size={13} /> Envoyer client
          </button>
        </div>
      </div>

      {/* ── Split layout ── */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">

        {/* ── LEFT PANE — form ── */}
        <div className="lg:w-[55%] flex flex-col gap-4 overflow-y-auto lg:max-h-[80vh] pr-1">

          {/* CLIENT */}
          <section className="rounded-xl border border-d-border bg-d-surface/30 p-4">
            <p className="text-[10px] font-semibold text-d-muted uppercase tracking-wider mb-3">Client</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-d-muted mb-1" htmlFor="de-client-name">Nom</label>
                <input
                  id="de-client-name"
                  type="text"
                  value={clientName}
                  onChange={e => { setClientName(e.target.value); markDirty(); }}
                  placeholder="Prénom Nom"
                  className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm text-d-text placeholder:text-d-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
                />
              </div>
              <div>
                <label className="block text-[10px] text-d-muted mb-1" htmlFor="de-client-phone">Téléphone</label>
                <input
                  id="de-client-phone"
                  type="tel"
                  value={clientPhone}
                  onChange={e => { setClientPhone(e.target.value); markDirty(); }}
                  placeholder="+15141234567"
                  className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm text-d-text placeholder:text-d-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
                />
              </div>
              <div>
                <label className="block text-[10px] text-d-muted mb-1" htmlFor="de-client-email">Email</label>
                <input
                  id="de-client-email"
                  type="email"
                  value={clientEmail}
                  onChange={e => { setClientEmail(e.target.value); markDirty(); }}
                  placeholder="client@exemple.com"
                  className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm text-d-text placeholder:text-d-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
                />
              </div>
              <div>
                <label className="block text-[10px] text-d-muted mb-1" htmlFor="de-client-address">Adresse</label>
                <input
                  id="de-client-address"
                  type="text"
                  value={clientAddress}
                  onChange={e => { setClientAddress(e.target.value); markDirty(); }}
                  placeholder="123 rue Principale, Montréal, QC"
                  className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm text-d-text placeholder:text-d-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
                />
              </div>
            </div>
          </section>

          {/* PRIX MODE */}
          <section className="rounded-xl border border-d-border bg-d-surface/30 p-4">
            <p className="text-[10px] font-semibold text-d-muted uppercase tracking-wider mb-3">Mode d&apos;affichage des prix</p>
            <div className="flex gap-1 p-1 rounded-xl bg-d-bg border border-d-border w-fit">
              {[
                { value: 'unitaire', label: 'Prix unitaire' },
                { value: 'total', label: 'Prix total' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handlePriceDisplayModeChange(value)}
                  aria-pressed={priceDisplayMode === value}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50 ${
                    priceDisplayMode === value
                      ? 'bg-d-primary text-white shadow-sm'
                      : 'text-d-muted hover:text-d-text'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-d-muted/60 mt-2">
              {priceDisplayMode === 'unitaire'
                ? 'Mention « Installation incluse » sous chaque article'
                : 'Mention « Installation incluse » une fois au total'}
            </p>
          </section>

          {/* ITEMS */}
          <section className="rounded-xl border border-d-border bg-d-surface/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold text-d-muted uppercase tracking-wider">
                Articles ({dataItems.length})
              </p>
              <button
                type="button"
                onClick={addItem}
                aria-label="Ajouter un article"
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-d-primary/40 text-d-primary text-xs hover:bg-d-primary/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
              >
                <Plus size={12} /> Ajouter
              </button>
            </div>

            {dataItems.length === 0 ? (
              <p className="text-xs text-d-muted/60 italic text-center py-4">
                Aucun article — cliquez « Ajouter » pour commencer.
              </p>
            ) : (
              <div className="space-y-2">
                {dataItems.map((item, i) => (
                  <LineItemRow
                    key={i}
                    item={item}
                    index={i}
                    onChange={updateItem}
                    onDelete={deleteItem}
                  />
                ))}
              </div>
            )}
          </section>

          {/* INSTALLATION */}
          <section className="rounded-xl border border-d-border bg-d-surface/30 p-4">
            <p className="text-[10px] font-semibold text-d-muted uppercase tracking-wider mb-3">Installation</p>
            <div className="flex items-center gap-3">
              <label className="text-xs text-d-muted" htmlFor="de-install-cost">Coût d&apos;installation ($)</label>
              <input
                id="de-install-cost"
                type="number"
                min="0"
                step="0.01"
                value={installCost}
                onChange={e => { setInstallCost(e.target.value); markDirty(); }}
                className="w-32 px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm text-d-text text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
              />
            </div>
          </section>

          {/* NOTES */}
          <section className="rounded-xl border border-d-border bg-d-surface/30 p-4">
            <p className="text-[10px] font-semibold text-d-muted uppercase tracking-wider mb-3">Notes</p>
            <textarea
              value={notes}
              onChange={e => { setNotes(e.target.value); markDirty(); }}
              rows={4}
              placeholder="Notes additionnelles pour le client..."
              aria-label="Notes du devis"
              className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm text-d-text placeholder:text-d-muted/40 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
            />
          </section>

          {/* TOTALS summary */}
          <section className="rounded-xl border border-d-border bg-d-surface/30 px-4 py-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-d-muted">Sous-total</span>
                <span className="text-d-text font-medium">{fmtQC(subtotal)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-d-muted">TPS (5 %)</span>
                <span className="text-d-text">{fmtQC(tax_gst)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-d-muted">TVQ (9,975 %)</span>
                <span className="text-d-text">{fmtQC(tax_qst)}</span>
              </div>
              <div className="flex justify-between py-1 font-semibold">
                <span className="text-d-text">Total TTC</span>
                <span className="text-d-primary">{fmtQC(total_ttc)}</span>
              </div>
            </div>
          </section>

          {/* SAVE / DELETE bar */}
          <div className="flex items-center gap-3 pb-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              aria-label="Sauvegarder le devis (Ctrl+S)"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-d-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/60"
            >
              {saving
                ? <><Loader2 size={14} className="animate-spin" /> Sauvegarde...</>
                : <><Save size={14} /> Sauvegarder</>}
            </button>
            <span className="text-xs text-d-muted/60">Ctrl+S</span>
          </div>
        </div>

        {/* ── RIGHT PANE — iframe preview ── */}
        <div className="lg:w-[45%] flex flex-col">
          {/* Mobile: accordion toggle */}
          <button
            type="button"
            onClick={() => setPreviewOpen(v => !v)}
            className="lg:hidden flex items-center justify-between w-full px-4 py-3 rounded-xl border border-d-border bg-d-surface/40 text-xs text-d-muted mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
          >
            <span className="font-semibold text-d-text">Aperçu du devis</span>
            {previewOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <div className={`flex-1 ${previewOpen ? 'block' : 'hidden'} lg:block`}>
            <div className="relative w-full" style={{ minHeight: '600px', height: '100%' }}>
              <p className="text-[10px] text-d-muted mb-1.5 hidden lg:block">
                Aperçu en temps réel — se recharge après chaque sauvegarde
              </p>
              <iframe
                key={previewKey}
                src={iframeSrc}
                title="Aperçu du devis client"
                className="w-full rounded-xl border border-d-border/60"
                style={{ height: 'calc(80vh - 60px)', minHeight: '500px' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
