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
  ShoppingCart,
  CheckCircle2,
  Upload,
  Info,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { STATUS_META, STATUS_ORDER } from '../../../lib/status-config';
import { itemSketchSvg } from '../../../lib/quote-templates/pur.js';
import {
  PROMO_QTY_THRESHOLD,
  computePromoDoorRebate,
  qualifiesForPromo,
  countOpenings,
} from '../../../lib/devis/promo';
import WindowConfigSVG from '../hub/commande/svg/WindowConfigSVG';
import PatioDoorSVG   from '../hub/commande/svg/PatioDoorSVG';
import EntryDoorSVG   from '../hub/commande/svg/EntryDoorSVG';

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

// Per-item fee breakdown using stored metadata (set after supplier upload)
// Field naming varies across codepaths: dispatcher writes `_supplier_cost`, legacy
// matched path writes `_cost`. Same story for list price (_supplier_list_price vs
// _list_price). Accept either.
function computeItemBreakdown(item) {
  const listPrice  = Number(item._supplier_list_price ?? item._list_price ?? 0);
  const cost       = Number(item._supplier_cost ?? item._cost ?? 0);
  const w = parseFloat(item.dimensions?.width) || 0;
  const h = parseFloat(item.dimensions?.height) || 0;
  const perimeter  = 2 * (w + h);
  const markup     = cost > 0 ? cost * 0.20 : 0;
  const linear     = perimeter * 3;
  const urethane   = Number(item._urethane) || (perimeter > 0 ? Math.ceil(perimeter / 150) * 6.75 : 0);
  const moulure    = Number(item._moulure)  || (perimeter > 0 ? perimeter * 0.04 : 0);
  const calking    = Number(item._calking)  || (perimeter > 0 ? Math.ceil(perimeter / 120) * 6.75 : 0);
  const unitPrice  = Number(item.unit_price) || 0;
  const qty        = Number(item.qty) || 1;
  return { listPrice, cost, markup, perimeter, linear, urethane, moulure, calking, unitPrice, qty };
}

function computeTotals(items, installCost, opts = {}) {
  const install = parseFloat(installCost) || 0;
  // "Petits frais" master toggle (default ON = charge client):
  //   - overhead (200$) and gaz (100$) line-items
  //   - cannettes: per-item urethane + moulure + calking that were already
  //     baked into each unit_price via the pricing formula
  // When OFF: overhead + gaz skipped, AND each item's stored _urethane/
  // _moulure/_calking×qty is subtracted from the sum — Jérémy absorbs
  // all the small fees for this particular job.
  const petitsFrais = opts.petitsFrais !== false; // default true
  const rawLineSubtotal = (items || []).reduce(
    (s, it) => s + (Number(it.qty) || 0) * (Number(it.unit_price) || 0),
    0
  );
  const cannetteCredit = petitsFrais ? 0 : (items || []).reduce((s, it) => {
    const q = Number(it.qty) || 1;
    return s + q * (Number(it._urethane || 0) + Number(it._moulure || 0) + Number(it._calking || 0));
  }, 0);
  const lineSubtotal = rawLineSubtotal - cannetteCredit;
  const overhead  = petitsFrais ? 200 : 0;
  const gaz       = petitsFrais ? 100 : 0;
  const container = opts.container ? 175 : 0;
  const subtotal  = lineSubtotal + install + overhead + gaz + container;
  const tax_gst   = subtotal * 0.05;
  const tax_qst   = subtotal * 0.09975;
  const total_ttc = subtotal + tax_gst + tax_qst;
  return { lineSubtotal, rawLineSubtotal, cannetteCredit, install, overhead, gaz, container, subtotal, tax_gst, tax_qst, total_ttc, petitsFrais };
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

/**
 * Returns true if this item qualifies for auto-ENERGY STAR (PVC fenêtre, not porte).
 * Mirrors the logic in lib/quote-templates/pur.js renderItemCard.
 */
function isPvcFenetre(item) {
  const typeText = (item.type || '').toLowerCase();
  const specsText = (Array.isArray(item.specs) ? item.specs.join(' ') : item.specs || '').toLowerCase();
  return (
    typeText.includes('fenêtre') &&
    !typeText.includes('porte') &&
    (specsText.includes('pvc') || typeText.includes('pvc') || (item.model || '').toLowerCase().includes('pvc'))
  );
}

/**
 * Returns true if the item should display the ENERGY STAR badge.
 * Respects explicit opt-out (item.energy_star === false).
 */
function showEnergyStarBadge(item) {
  if (item.energy_star === false) return false;
  if (item.energy_star === true || item.energy) return true;
  return isPvcFenetre(item);
}

function LineItemRow({ item, index, onChange, onDelete, onToggleBC }) {
  const [expanded, setExpanded] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const auto = buildDescription(item);
  const total = (Number(item.qty) || 0) * (Number(item.unit_price) || 0);
  // Show breakdown button whenever item has ANY pricing signal OR dimensions
  // (dimensions alone allow us to compute perimeter-based fees)
  const hasBreakdown = !!(item._supplier_cost || item._cost || item._supplier_list_price || item._list_price || item.unit_price || (item.dimensions?.width && item.dimensions?.height));

  // SVG sketch — prefer the rich React components from the hub commande tool
  // when we have the full `_config` object or `_entry_door_style`. Fallback
  // to the string-based itemSketchSvg for legacy items or items without
  // identifying metadata.
  const hasRichSvg = !!(
    (item._config && item._config.panels)
    || item._entry_door_style
  );
  const sketchSvg = !hasRichSvg ? itemSketchSvg(item) : null;

  function renderRichSketch() {
    const category = item._category;
    if (category === 'window' && item._window_type && item._config?.panels) {
      return <WindowConfigSVG type={item._window_type} config={item._config} width={60} height={60} />;
    }
    if (category === 'entry_door' && item._entry_door_style) {
      return <EntryDoorSVG styleKey={item._entry_door_style} width={60} height={60} />;
    }
    if (category === 'patio_door' && item._config?.panels) {
      return <PatioDoorSVG config={item._config} width={60} height={60} />;
    }
    return null;
  }

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
        {hasRichSvg ? (
          <div
            className="flex-shrink-0 rounded border border-d-border/60 bg-[#F2F5F0] flex items-center justify-center overflow-hidden p-1"
            style={{ width: 60, height: 60 }}
            aria-hidden="true"
          >
            {renderRichSketch()}
          </div>
        ) : (
          <div
            className="flex-shrink-0 rounded border border-d-border/60 bg-[#F2F5F0] flex items-center justify-center overflow-hidden"
            style={{ width: 60, height: 60 }}
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: sketchSvg }}
          />
        )}

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
          {/* ENERGY STAR badge */}
          {showEnergyStarBadge(item) && (
            <span
              className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wide"
              style={{ background: '#E9EFE7', color: '#2A2C35', border: '1px solid #2A2C35' }}
              title="Homologué ENERGY STAR"
            >
              ★ ENERGY STAR
            </span>
          )}
          {/* Wide-match warning badge */}
          {item._match_status === 'partial_wide' && (
            <div className="flex items-center gap-1 mt-1">
              <AlertTriangle size={10} className="text-amber-400 flex-shrink-0" />
              <span className="text-[9px] text-amber-400 font-medium">
                À vérifier — match large (±5&quot;)
              </span>
            </div>
          )}
        </div>

        {/* Expand + BC queue + delete */}
        <div className="flex items-start gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            aria-label={expanded ? 'Réduire' : 'Développer'}
            className="text-d-muted hover:text-d-text transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-d-primary/60 rounded p-0.5"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {/* +BC toggle — adds item to next batch bon de commande */}
          <button
            type="button"
            onClick={() => onToggleBC && onToggleBC(index)}
            aria-label={item._queued_for_bc ? 'Retirer du bon de commande' : 'Ajouter au prochain bon de commande'}
            title={item._queued_for_bc ? 'Retiré du BC' : 'Ajouter au BC'}
            className={`transition flex-shrink-0 focus-visible:outline-none focus-visible:ring-1 rounded p-0.5 ${
              item._queued_for_bc
                ? 'text-emerald-400 focus-visible:ring-emerald-400/60'
                : 'text-d-muted/50 hover:text-emerald-400 focus-visible:ring-emerald-400/60'
            }`}
          >
            {item._queued_for_bc
              ? <CheckCircle2 size={13} />
              : <ShoppingCart size={13} />}
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
        {hasBreakdown && (
          <button
            type="button"
            onClick={() => setShowCalc(v => !v)}
            aria-label="Voir le détail du calcul de prix"
            className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border border-d-primary/40 bg-d-primary/10 text-d-primary hover:bg-d-primary/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/60"
          >
            <Info size={12} aria-hidden="true" />
            {showCalc ? 'Masquer' : 'Détail'}
          </button>
        )}
      </div>

      {/* Per-item fee breakdown — collapsible */}
      {hasBreakdown && showCalc && (() => {
        const bd = computeItemBreakdown(item);
        const urethaneCans = bd.perimeter > 0 ? Math.ceil(bd.perimeter / 150) : 0;
        const calkingTubes = bd.perimeter > 0 ? Math.ceil(bd.perimeter / 120) : 0;
        return (
          <div className="mx-3 mb-3 rounded-lg border border-d-border/50 bg-[#1a1c22] p-3 text-[10px] font-mono text-d-muted space-y-0.5">
            <div className="text-[9px] uppercase tracking-wider text-d-muted/50 mb-1.5">Détail du calcul</div>
            {bd.listPrice > 0 && (
              <div className="flex justify-between">
                <span>Prix liste fournisseur</span>
                <span className="text-d-text">{fmtQC(bd.listPrice)}</span>
              </div>
            )}
            {bd.cost > 0 && (
              <div className="flex justify-between">
                <span>Coût (escompte 40%)</span>
                <span className="text-d-text">{fmtQC(bd.cost)}</span>
              </div>
            )}
            {bd.markup > 0 && (
              <div className="flex justify-between">
                <span>Markup 20%</span>
                <span className="text-emerald-400/80">+{fmtQC(bd.markup)}</span>
              </div>
            )}
            {bd.perimeter > 0 && (
              <>
                <div className="flex justify-between">
                  <span>Linéaire ({bd.perimeter.toFixed(1)}&quot; × 3,00&nbsp;$)</span>
                  <span className="text-emerald-400/80">+{fmtQC(bd.linear)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Urethane ({urethaneCans} cannette{urethaneCans > 1 ? 's' : ''})</span>
                  <span className="text-emerald-400/80">+{fmtQC(bd.urethane)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Moulure ({bd.perimeter.toFixed(1)}&quot; × 0,04&nbsp;$)</span>
                  <span className="text-emerald-400/80">+{fmtQC(bd.moulure)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Calking ({calkingTubes} tube{calkingTubes > 1 ? 's' : ''})</span>
                  <span className="text-emerald-400/80">+{fmtQC(bd.calking)}</span>
                </div>
              </>
            )}
            <div className="border-t border-d-border/40 pt-1 flex justify-between font-semibold">
              <span className="text-d-text">Prix unitaire client</span>
              <span className="text-d-primary">{fmtQC(bd.unitPrice)}</span>
            </div>
            {bd.qty > 1 && (
              <div className="flex justify-between text-d-muted/70">
                <span>× {bd.qty} unités</span>
                <span>{fmtQC(bd.unitPrice * bd.qty)}</span>
              </div>
            )}
          </div>
        );
      })()}

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

          {/* ENERGY STAR toggle — shown for PVC fenêtres or when explicitly set */}
          {(isPvcFenetre(item) || item.energy_star != null) && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showEnergyStarBadge(item)}
                onChange={e => update('energy_star', e.target.checked)}
                aria-label="Homologué ENERGY STAR"
                className="rounded border-d-border focus-visible:ring-1 focus-visible:ring-d-primary/60"
              />
              <span className="text-[10px] text-d-muted">
                Homologué ENERGY STAR
                {isPvcFenetre(item) && item.energy_star !== false && (
                  <span className="ml-1 text-d-muted/50 font-normal">(auto — PVC fenêtre)</span>
                )}
              </span>
            </label>
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
  const [sendError, setSendError] = useState(null);
  const [sendResult, setSendResult] = useState(null);

  async function handleSend() {
    setSending(true);
    setSendError(null);
    setSendResult(null);
    try {
      // Step 1: actually send SMS + email via the universal send endpoint.
      // If neither recipient is provided, skip the send and still flip status
      // (matches the old soft behavior — Jérémy might copy the link manually).
      const wantSms   = !!phone;
      const wantEmail = !!email;
      const channel = wantSms && wantEmail ? 'both' : wantSms ? 'sms' : wantEmail ? 'email' : null;

      let sendData = null;
      if (channel) {
        const sendResp = await fetch('/api/universal/devis/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quote_id: quote.id,
            channel,
            phone_override: wantSms ? phone : undefined,
            email_override: wantEmail ? email : undefined,
          }),
        });
        sendData = await sendResp.json().catch(() => null);
        if (!sendResp.ok && (!sendData || !sendData.success)) {
          // Surface the error but still give Jérémy the option to flip status manually
          throw new Error(
            sendData?.results?.sms?.error
            || sendData?.results?.email?.error
            || sendData?.error
            || `Erreur envoi (HTTP ${sendResp.status})`
          );
        }
        setSendResult(sendData);
      }

      // Step 2: flip quote + job status
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

      onSent({ phone, email, sendResult: sendData });
    } catch (err) {
      console.error('[DevisEditor.handleSend]', err);
      setSendError(err?.message || 'Erreur inconnue');
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
          {sendError && (
            <p className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
              {sendError}
            </p>
          )}
          {sendResult && (
            <div className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 space-y-0.5">
              {sendResult.results?.sms?.attempted && (
                <div>SMS : {sendResult.results.sms.success ? '✓ envoyé' : `✕ ${sendResult.results.sms.error || 'échec'}`}</div>
              )}
              {sendResult.results?.email?.attempted && (
                <div>Email : {sendResult.results.email.success ? `✓ envoyé (${sendResult.results.email.provider})` : `✕ ${sendResult.results.email.error || 'échec'}`}</div>
              )}
            </div>
          )}
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

  // Project fees toggles
  const [containerOn,     setContainerOn]     = useState(!!(quote?.meta?.container_option));
  // "Petits frais" master toggle — default true (charge client). When Jérémy
  // deems the job small/loyalty/goodwill, he can absorb: skips overhead 200 +
  // gaz 100 + per-item cannette fees (urethane/moulure/calking).
  const [petitsFraisOn, setPetitsFraisOn] = useState(
    quote?.meta?.petits_frais_on === undefined ? true : !!quote.meta.petits_frais_on
  );
  // Client discount — mode 'amount' | 'percent' (radio toggle). Value is raw
  // number interpreted by mode. Applied as a visible negative line on the
  // devis (and contract), reduces subtotal before taxes.
  const [discountMode,  setDiscountMode]  = useState(quote?.meta?.discount_mode || 'amount');
  const [discountValue, setDiscountValue] = useState(
    quote?.meta?.discount_value != null ? String(quote.meta.discount_value) : ''
  );
  const [sousTrOpen,      setSousTrOpen]      = useState(!!(quote?.meta?.sous_traitance_option));
  const [employees,       setEmployees]       = useState(
    Array.isArray(quote?.meta?.employees) ? quote.meta.employees : []
  );

  // Promo state — auto-on when eligible unless Jérémy explicitly toggled off
  const [promoEnabled, setPromoEnabled] = useState(() => {
    const meta = quote?.meta || {};
    if (meta.promo_enabled === false) return false;
    if (meta.promo_enabled === true) return true;
    return false; // recomputed after items state is set
  });

  // Supplier upload state (for AwaitingSupplierCard)
  const [supplierUploading, setSupplierUploading] = useState(false);
  const [supplierResult,    setSupplierResult]    = useState(null);
  const [supplierError,     setSupplierError]     = useState(null);

  // Defensive parse: line_items may arrive as JSON string from some write paths (backfill bug hardened)
  const parsedLineItems = (() => {
    const raw = quote?.line_items;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
    }
    return [];
  })();

  // Quote fields
  const [items,       setItems]       = useState(parsedLineItems);
  const [installCost, setInstallCost] = useState(
    // Try to find install item in line_items
    (() => {
      if (!parsedLineItems.length) return '0';
      const inst = parsedLineItems.find(
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
  const { lineSubtotal, install: installAmt, overhead, gaz, container, subtotal: rawSubtotal, tax_gst: rawTps, tax_qst: rawTvq, total_ttc: rawTtc } =
    computeTotals(dataItems, installCost, { container: containerOn, petitsFrais: petitsFraisOn });

  // Promo: "porte simple offerte" when the quote has 9+ openings and contains a porte simple.
  // Auto-initialize on first eligibility if meta didn't explicitly say no.
  const promoEligible = qualifiesForPromo(dataItems);
  const promoActive   = promoEligible && promoEnabled;
  const promoRebate   = promoActive ? computePromoDoorRebate() : 0;

  // Auto-enable the first time the quote becomes eligible (unless Jérémy toggled off)
  useEffect(() => {
    const meta = quote?.meta || {};
    if (meta.promo_enabled === false) return;        // respect explicit opt-out
    if (promoEligible && !promoEnabled) setPromoEnabled(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promoEligible]);

  // Client discount — %/$ toggle. Applied AFTER the promo rebate so a devis
  // can have both (promo = automatic volume gift; discount = manual
  // client-facing rebate).
  const discountRawValue = parseFloat(discountValue) || 0;
  const preDiscountSubtotal = Math.max(0, rawSubtotal - promoRebate);
  const clientDiscount = discountRawValue <= 0
    ? 0
    : discountMode === 'percent'
      ? Math.min(preDiscountSubtotal, preDiscountSubtotal * (discountRawValue / 100))
      : Math.min(preDiscountSubtotal, discountRawValue);

  // Apply rebate + client discount to subtotal and recompute taxes.
  const subtotal  = Math.max(0, preDiscountSubtotal - clientDiscount);
  const tax_gst   = subtotal * 0.05;
  const tax_qst   = subtotal * 0.09975;
  const total_ttc = subtotal + tax_gst + tax_qst;

  // Projected internal expenses.
  // RULE (from Mikael): overhead (200$), gaz (100$), urethane/moulure/calking per-item
  // fees are CLIENT CHARGES to cover potential costs — they are NOT Jérémy's real cash-out.
  // Jérémy logs his real gas / cannettes / overhead manually when the receipts hit.
  // Only supplier material cost, sous-traitance (if toggled), and employees count here.
  const totalPerimeter = dataItems.reduce((s, it) => {
    const w = parseFloat(it.dimensions?.width) || 0;
    const h = parseFloat(it.dimensions?.height) || 0;
    return s + 2 * (w + h);
  }, 0);
  // 1. Supplier material cost — projection of what Jérémy will pay the fournisseur
  const materialCost = dataItems.reduce((s, it) => {
    const c = Number(it._supplier_cost) || Number(it._cost) || 0;
    const q = Number(it.qty) || 1;
    return s + c * q;
  }, 0);
  // 2. Optional sous-traitance ($1.50/po of total perimeter if toggle ON)
  const sousTrCost = sousTrOpen ? totalPerimeter * 1.5 : 0;
  // 3. Optional employees (rate × hours each)
  const employeesCost = employees.reduce((s, emp) => {
    return s + (parseFloat(emp.rate) || 0) * (parseFloat(emp.hours) || 0);
  }, 0);
  const totalExpenses = materialCost + sousTrCost + employeesCost;
  const margeRevenue = total_ttc;  // TTC client — what Jérémy receives gross
  const margeBrute = margeRevenue - totalExpenses;
  const margePct = margeRevenue > 0 ? (margeBrute / margeRevenue * 100) : 0;

  // All line items to save = content items + install item if > 0
  function buildSaveItems() {
    const clean = dataItems.map(it => ({
      ...it,
      qty:        Number(it.qty) || 1,
      unit_price: Number(it.unit_price) || 0,
      total:      (Number(it.qty) || 0) * (Number(it.unit_price) || 0),
      description: buildDescription(it),
    }));
    const installAmtNum = parseFloat(installCost) || 0;
    if (installAmtNum > 0) {
      clean.push({
        description: 'Installation, finition et moulures extérieures',
        qty: 1,
        unit_price: installAmtNum,
        total: installAmtNum,
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
            quote_amount:   subtotal,
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
            meta: {
              price_display_mode:   priceDisplayMode,
              container_option:     containerOn,
              sous_traitance_option: sousTrOpen,
              employees,
              promo_enabled:        promoActive,
              promo_rebate:         promoRebate,
              petits_frais_on:      petitsFraisOn,
              discount_mode:        discountMode,
              discount_value:       discountRawValue,
              discount_amount:      Math.round(clientDiscount * 100) / 100,
            },
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
  }, [clientName, clientPhone, clientEmail, clientAddress, jobStatus, items, installCost, notes, priceDisplayMode, containerOn, petitsFraisOn, sousTrOpen, employees, promoActive, promoRebate, discountMode, discountValue, clientDiscount, subtotal, tax_gst, tax_qst, total_ttc, job.id, quote.id, onSaved]);

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
        body: JSON.stringify({
          meta: {
            price_display_mode:   newMode,
            container_option:     containerOn,
            sous_traitance_option: sousTrOpen,
            employees,
          },
        }),
      });
      setPreviewKey(Date.now());
    } catch {
      // non-fatal — will be saved on next full save
    }
  }

  // Supplier upload (used by the AwaitingSupplierCard inside Devis tab)
  async function handleSupplierFile(file) {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setSupplierError('Seuls les fichiers PDF sont acceptés.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setSupplierError('Fichier trop volumineux (max 10 MB).');
      return;
    }
    setSupplierUploading(true);
    setSupplierError(null);
    setSupplierResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/jobs/${job.id}/apply-supplier-pricing`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setSupplierError(data.error || 'Erreur serveur');
      } else {
        setSupplierResult(data);
        // Reload the editor so line items reflect new prices
        if (onSaved) onSaved();
      }
    } catch {
      setSupplierError('Erreur réseau — réessaie.');
    } finally {
      setSupplierUploading(false);
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

  // Toggle _queued_for_bc on a line item + immediately PATCH quote
  async function toggleItemBC(index) {
    const item = dataItems[index];
    if (!item) return;

    // Don't allow toggling if already dispatched to a sent BC
    if (item._bc_sent_at) return;

    const next = !item._queued_for_bc;
    const updatedItem = { ...item, _queued_for_bc: next };
    updateItem(index, updatedItem);

    // Immediate save so the pending API picks it up
    const saveItems = buildSaveItems().map((it, i) => {
      if (i === index) return { ...it, _queued_for_bc: next };
      return it;
    });

    try {
      await fetch(`/api/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_items: saveItems }),
      });
    } catch {
      // Non-fatal — item state is updated in UI, will persist on next full save
    }
  }

  function addEmployee() {
    markDirty();
    setEmployees(prev => [...prev, { name: '', rate: '', hours: '' }]);
  }
  function updateEmployee(idx, field, value) {
    markDirty();
    setEmployees(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  }
  function removeEmployee(idx) {
    markDirty();
    setEmployees(prev => prev.filter((_, i) => i !== idx));
  }

  // Build the public quote URL. Prefer the acceptance_url stamped on the quote
  // meta at creation time (that's what was actually emailed/SMSed to the
  // client). Fallback to the hub subdomain for PUR, else the current origin.
  function publicQuoteUrl() {
    const fromMeta = quote?.meta?.acceptance_url;
    if (fromMeta) return fromMeta;
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      // If we're on the BW platform side, prefer hub.purconstruction.com for PUR
      const isPur = host === 'bluewiseai.com' || host === 'www.bluewiseai.com';
      const base = isPur ? 'https://hub.purconstruction.com' : window.location.origin;
      return `${base}/q/${quote.quote_number}`;
    }
    return `/q/${quote.quote_number}`;
  }

  function handleCopyLink() {
    const url = publicQuoteUrl();
    navigator.clipboard.writeText(url).then(() => {
      setToast({ msg: 'Lien copié', type: 'success' });
    }).catch(() => {
      setToast({ msg: 'Impossible de copier — essaie manuellement', type: 'error' });
    });
  }

  function handleOpenPreview() {
    window.open(publicQuoteUrl(), '_blank');
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
          onSent={({ sendResult }) => {
            setShowSend(false);
            const smsOk   = sendResult?.results?.sms?.success;
            const emailOk = sendResult?.results?.email?.success;
            const parts = [];
            if (smsOk)   parts.push('SMS ✓');
            if (emailOk) parts.push('Email ✓');
            const msg = parts.length
              ? `Devis envoyé (${parts.join(' + ')})`
              : 'Statut mis à jour';
            setToast({ msg, type: 'success' });
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

          {/* ── SOUMISSION UPLOAD CARD — visible only when awaiting_supplier ── */}
          {quote.status === 'awaiting_supplier' && !supplierResult && (
            <section className="rounded-xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 p-4">
              <div className="flex items-start gap-3 mb-3">
                <Upload size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-d-text">
                    En attente de la soumission fournisseur
                  </p>
                  <p className="text-xs text-d-muted mt-0.5">
                    Téléverse le PDF Royalty — le parser détectera les prix et appliquera la formule automatiquement à chaque article.
                  </p>
                </div>
              </div>
              <label
                onDragOver={e => { e.preventDefault(); }}
                onDrop={e => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleSupplierFile(f);
                }}
                className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-colors
                  border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/5
                  ${supplierUploading ? 'pointer-events-none opacity-60' : ''}`}
              >
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  disabled={supplierUploading}
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleSupplierFile(f);
                    e.target.value = '';
                  }}
                />
                {supplierUploading ? (
                  <>
                    <div className="w-7 h-7 border-2 border-amber-500/40 border-t-amber-400 rounded-full animate-spin" />
                    <p className="text-xs text-amber-400">Analyse en cours...</p>
                  </>
                ) : (
                  <>
                    <Upload size={22} className="text-amber-400/70" />
                    <p className="text-sm font-medium text-d-text">Glisser la soumission Royalty ici</p>
                    <p className="text-xs text-d-muted">ou cliquer pour choisir un PDF · max 10 MB</p>
                  </>
                )}
              </label>
              {supplierError && (
                <div className="mt-2 rounded-xl bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-xs text-rose-400">
                  {supplierError}
                </div>
              )}
            </section>
          )}

          {/* ── UPLOAD RESULT SUMMARY ── */}
          {supplierResult && (
            <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <p className="text-sm font-semibold text-emerald-400 mb-2">Soumission appliquée</p>
              <div className="space-y-1 text-xs mb-3">
                <div className="flex justify-between">
                  <span className="text-d-muted">Articles matchés</span>
                  <span className="text-emerald-400 font-medium">{supplierResult.matched}</span>
                </div>
                {supplierResult.unmatched > 0 && (
                  <div className="flex justify-between">
                    <span className="text-d-muted">Sans prix</span>
                    <span className="text-amber-400 font-medium">{supplierResult.unmatched}</span>
                  </div>
                )}
                {supplierResult.partial_matches > 0 && (
                  <div className="flex justify-between">
                    <span className="text-d-muted">Matchs à vérifier</span>
                    <span className="text-amber-400 font-medium">{supplierResult.partial_matches}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-emerald-500/20 pt-1">
                  <span className="text-d-muted">Nouveau TTC</span>
                  <span className="text-d-text font-semibold">
                    {Number(supplierResult.total_ttc).toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}&nbsp;$
                  </span>
                </div>
              </div>
              {(supplierResult.unmatched > 0 || supplierResult.partial_matches > 0) && (
                <p className="text-xs text-amber-400 mb-2">
                  Vérifier les articles marqués « À vérifier » ci-dessous.
                </p>
              )}
              <button
                type="button"
                onClick={() => setSupplierResult(null)}
                className="text-xs text-d-muted hover:text-d-text transition"
              >
                Masquer
              </button>
            </section>
          )}

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
                    onToggleBC={toggleItemBC}
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

          {/* ── FRAIS PROJET ── */}
          <section className="rounded-xl border border-d-border bg-d-surface/30 p-4">
            <p className="text-[10px] font-semibold text-d-muted uppercase tracking-wider mb-3">Frais projet</p>

            {/* Master "petits frais" toggle — overhead + gaz + cannettes */}
            <div className="mb-2 pb-2 border-b border-d-border/40">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={petitsFraisOn}
                  onChange={e => { setPetitsFraisOn(e.target.checked); markDirty(); }}
                  aria-label="Inclure les petits frais"
                  className="mt-0.5 w-3.5 h-3.5 rounded accent-d-primary"
                />
                <div>
                  <div className="text-[11px] font-semibold text-d-text">Inclure les petits frais</div>
                  <div className="text-[10px] text-d-muted">Overhead 200 $ + gaz 100 $ + cannettes (urethane/moulure/calking) par item. Décoché = Jer absorbe pour ce devis.</div>
                </div>
              </label>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-d-border/30">
                <span className={petitsFraisOn ? 'text-d-muted' : 'text-d-muted/40'}>Overhead fixe</span>
                <span className={`font-mono ${petitsFraisOn ? 'text-d-text' : 'text-d-muted/40 line-through'}`}>{fmtQC(200)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-d-border/30">
                <span className={petitsFraisOn ? 'text-d-muted' : 'text-d-muted/40'}>Gaz / visite</span>
                <span className={`font-mono ${petitsFraisOn ? 'text-d-text' : 'text-d-muted/40 line-through'}`}>{fmtQC(100)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-d-border/30">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={containerOn}
                    onChange={e => { setContainerOn(e.target.checked); markDirty(); }}
                    aria-label="Activer conteneur à déchets"
                    className="w-3.5 h-3.5 rounded accent-d-primary"
                  />
                  <span className="text-d-muted">Conteneur à déchets</span>
                </label>
                <span className={`font-mono ${containerOn ? 'text-d-text' : 'text-d-muted/40'}`}>
                  {fmtQC(175)}
                </span>
              </div>
            </div>

            {/* Escompte client (%/$) */}
            <div className="mt-3 pt-3 border-t border-d-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-d-text">Escompte client</span>
                <div className="inline-flex rounded-lg overflow-hidden border border-d-border text-[10px]">
                  <button
                    type="button"
                    onClick={() => { setDiscountMode('amount'); markDirty(); }}
                    aria-pressed={discountMode === 'amount'}
                    className={`px-2.5 py-1 transition ${
                      discountMode === 'amount'
                        ? 'bg-d-primary text-white'
                        : 'bg-d-surface text-d-muted hover:text-d-text'
                    }`}
                  >$</button>
                  <button
                    type="button"
                    onClick={() => { setDiscountMode('percent'); markDirty(); }}
                    aria-pressed={discountMode === 'percent'}
                    className={`px-2.5 py-1 transition ${
                      discountMode === 'percent'
                        ? 'bg-d-primary text-white'
                        : 'bg-d-surface text-d-muted hover:text-d-text'
                    }`}
                  >%</button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step={discountMode === 'percent' ? '0.1' : '1'}
                  value={discountValue}
                  onChange={e => { setDiscountValue(e.target.value); markDirty(); }}
                  placeholder={discountMode === 'percent' ? 'Ex: 5' : 'Ex: 500'}
                  aria-label="Montant de l'escompte client"
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-d-border bg-d-surface text-xs text-d-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-d-primary/60"
                />
                <span className="text-[10px] text-d-muted w-16">
                  {discountMode === 'percent' ? '% du HT' : 'montant'}
                </span>
              </div>
              {clientDiscount > 0 && (
                <div className="mt-2 text-[10px] text-emerald-400/90 font-mono">
                  Rabais appliqué : −{fmtQC(clientDiscount)}
                </div>
              )}
            </div>

            {/* Totals breakdown */}
            <div className="mt-3 pt-3 border-t border-d-border/50 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-d-muted">Sous-total articles</span>
                <span className="text-d-text font-mono">{fmtQC(lineSubtotal + installAmt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-d-muted">+ Overhead + Gaz{containerOn ? ' + Container' : ''}</span>
                <span className="text-d-text font-mono">{fmtQC(overhead + gaz + container)}</span>
              </div>
              {promoActive && (
                <div className="flex justify-between text-emerald-400">
                  <span>− Rabais promo (porte simple offerte)</span>
                  <span className="font-mono">−{fmtQC(promoRebate)}</span>
                </div>
              )}
              {clientDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>− Escompte client{discountMode === 'percent' ? ` (${discountRawValue}%)` : ''}</span>
                  <span className="font-mono">−{fmtQC(clientDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t border-d-border/50 pt-1">
                <span className="text-d-muted">Sous-total HT</span>
                <span className="text-d-text font-mono">{fmtQC(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-d-muted">TPS (5 %)</span>
                <span className="text-d-text font-mono">{fmtQC(tax_gst)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-d-muted">TVQ (9,975 %)</span>
                <span className="text-d-text font-mono">{fmtQC(tax_qst)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-d-border/50">
                <span className="text-d-text">TOTAL TTC</span>
                <span className="text-d-primary font-mono">{fmtQC(total_ttc)}</span>
              </div>
            </div>
          </section>

          {/* ── PROMO — Porte simple offerte ── */}
          <section className={`rounded-xl border p-4 ${
            promoActive
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : promoEligible
                ? 'border-d-border bg-d-surface/30'
                : 'border-d-border/40 bg-d-surface/10 opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                promoActive ? 'text-emerald-400' : 'text-d-muted'
              }`}>
                🎁 Promo — Porte simple offerte
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={promoActive}
                  disabled={!promoEligible}
                  onChange={e => { setPromoEnabled(e.target.checked); markDirty(); }}
                  aria-label="Activer le rabais promo porte simple offerte"
                  className="w-3.5 h-3.5 rounded accent-emerald-500"
                />
                <span className="text-[11px] text-d-muted">
                  {promoActive ? 'Appliqué' : promoEligible ? 'Disponible' : 'Non éligible'}
                </span>
              </label>
            </div>
            <div className="text-[11px] text-d-muted space-y-0.5">
              <p>
                Éligibilité : 9 ouvertures ou plus + au moins une porte simple.
                {' '}
                <span className={promoEligible ? 'text-emerald-400/90' : 'text-d-muted/70'}>
                  Actuel : {countOpenings(dataItems)} ouverture(s){' '}
                  {promoEligible ? '✓' : `— ${Math.max(0, PROMO_QTY_THRESHOLD - countOpenings(dataItems))} de plus requis`}
                </span>
              </p>
              {promoActive && (
                <p className="text-emerald-400/90 font-mono pt-1">
                  Rabais appliqué : −{fmtQC(promoRebate)} (porte simple de base 800 $ cost + installation offerte)
                </p>
              )}
              {promoEligible && !promoActive && (
                <p className="text-amber-400/80">
                  Coché désactivé par Jérémy. Client paie la porte simple au prix plein.
                </p>
              )}
            </div>
          </section>

          {/* ── INTERNE (pas sur devis client) ── */}
          <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-[10px] font-semibold text-amber-400/80 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Info size={11} /> Interne — pas sur le devis client
            </p>

            {/* Sous-traitance toggle */}
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-d-muted">
                <input
                  type="checkbox"
                  checked={sousTrOpen}
                  onChange={e => { setSousTrOpen(e.target.checked); markDirty(); }}
                  aria-label="Activer coût de sous-traitance"
                  className="w-3.5 h-3.5 rounded accent-amber-500"
                />
                <span>
                  Sous-traitance
                  {totalPerimeter > 0 && (
                    <span className="ml-1 text-d-muted/60">
                      ({totalPerimeter.toFixed(0)}&quot; × 1,50&nbsp;$)
                    </span>
                  )}
                </span>
              </label>
              <span className={`text-xs font-mono ${sousTrOpen ? 'text-amber-400' : 'text-d-muted/40'}`}>
                {fmtQC(sousTrCost)}
              </span>
            </div>

            {/* Employés */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-d-muted flex items-center gap-1">
                  <Users size={11} /> Employés
                </span>
                <button
                  type="button"
                  onClick={addEmployee}
                  aria-label="Ajouter un employé"
                  className="text-[10px] text-d-primary/70 hover:text-d-primary flex items-center gap-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-d-primary/60 rounded px-1"
                >
                  <Plus size={10} /> Ajouter
                </button>
              </div>
              {employees.length === 0 ? (
                <p className="text-[10px] text-d-muted/50 italic">Aucun employé ajouté.</p>
              ) : (
                <div className="space-y-1.5">
                  {employees.map((emp, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs">
                      <input
                        type="text"
                        value={emp.name}
                        onChange={e => updateEmployee(idx, 'name', e.target.value)}
                        placeholder="Nom"
                        aria-label={`Nom employé ${idx + 1}`}
                        className="flex-1 px-2 py-1 rounded-lg border border-d-border/60 bg-d-surface text-d-text text-xs placeholder:text-d-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-d-primary/60"
                      />
                      <input
                        type="number"
                        value={emp.rate}
                        onChange={e => updateEmployee(idx, 'rate', e.target.value)}
                        placeholder="$/h"
                        aria-label={`Taux employé ${idx + 1}`}
                        min="0"
                        step="0.5"
                        className="w-16 px-2 py-1 rounded-lg border border-d-border/60 bg-d-surface text-d-text text-xs text-right placeholder:text-d-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-d-primary/60"
                      />
                      <input
                        type="number"
                        value={emp.hours}
                        onChange={e => updateEmployee(idx, 'hours', e.target.value)}
                        placeholder="h"
                        aria-label={`Heures employé ${idx + 1}`}
                        min="0"
                        step="0.5"
                        className="w-14 px-2 py-1 rounded-lg border border-d-border/60 bg-d-surface text-d-text text-xs text-right placeholder:text-d-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-d-primary/60"
                      />
                      <span className="w-20 text-right font-mono text-[10px] text-d-muted">
                        {fmtQC((parseFloat(emp.rate) || 0) * (parseFloat(emp.hours) || 0))}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeEmployee(idx)}
                        aria-label={`Supprimer employé ${idx + 1}`}
                        className="text-rose-400/60 hover:text-rose-400 flex-shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400/60 rounded p-0.5"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Marge brute summary — detailed breakdown */}
            <div className="pt-3 border-t border-amber-500/20 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-d-muted">Coût matériel fournisseur (projeté)</span>
                <span className="text-rose-400/80 font-mono">{fmtQC(materialCost)}</span>
              </div>
              {sousTrCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-d-muted">Sous-traitance</span>
                  <span className="text-rose-400/80 font-mono">{fmtQC(sousTrCost)}</span>
                </div>
              )}
              {employeesCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-d-muted">Main d&apos;œuvre interne</span>
                  <span className="text-rose-400/80 font-mono">{fmtQC(employeesCost)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1.5 border-t border-d-border/30 text-xs font-semibold">
                <span className="text-d-muted">Total dépenses</span>
                <span className="text-rose-400 font-mono">{fmtQC(totalExpenses)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1">
                <span className="text-d-text">
                  Marge brute
                  <span className="font-normal ml-1 text-d-muted/80 text-xs">
                    ({margePct >= 0 ? '+' : ''}{margePct.toFixed(1)}%)
                  </span>
                </span>
                <span className={`font-mono ${margeBrute >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {fmtQC(margeBrute)}
                </span>
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
