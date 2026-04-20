/**
 * ItemBuilderModal — replica of the commande hub item-builder flow, mounted
 * as a modal inside DevisEditor. Uses the SAME step components and reducer
 * the commande tool uses, so every option + SVG renders identically on
 * both surfaces (Mikael rule 2026-04-20: *"les svg soient ceux de l'outils
 * de devis partout partout"*).
 *
 * Props:
 *   open       bool         — modal visibility
 *   mode       'new' | 'edit'
 *   initial    object|null  — existing line_item to rehydrate for edit mode
 *   supplier   string       — supplier tag ('royalty' | 'touchette')
 *   onSave(item) — called with the serialized line_item
 *   onClose()    — called when user cancels
 */

import { useReducer, useEffect, useState, useMemo } from 'react';
import { X, ArrowLeft, Save } from 'lucide-react';
import commandeReducer, { INITIAL_STATE, A } from '../hub/commande/commandeReducer';
import { parseFraction } from '../../../lib/hub/fraction';
import { COLLECTIONS, WINDOW_COLORS } from '../../../lib/hub/catalog-data';
import CategoryPicker from '../hub/commande/steps/CategoryPicker';
import TypePicker from '../hub/commande/steps/TypePicker';
import ConfigPicker from '../hub/commande/steps/ConfigPicker';
import OptionsForm from '../hub/commande/steps/OptionsForm';
import DimensionInputs from '../hub/commande/steps/DimensionInputs';
import { serializeCommandeItem } from '../../../lib/devis/serialize-commande-item';

// Mirror of CommandePage's PATIO_COLLECTION_INFO / PATIO_COLOR_LABELS
// (kept local so this modal stays self-contained and doesn't pull in the
// CommandePage state machine).
const PATIO_COLLECTION_INFO = {
  odyssee:             { name: 'Odyssée' },
  belle_vue_prima:     { name: 'Belle-Vue Prima' },
  belle_vue_prestige:  { name: 'Belle-Vue Prestige' },
  belle_vue_levante:   { name: 'Belle-Vue Levante' },
};
const PATIO_COLOR_LABELS = {
  blanc_k1285: 'Blanc K-1285',
  noir_k90421: 'Noir K-90421',
  anodise:     'Anodisé',
};

/**
 * Seed the commande reducer from an existing line_item so edit mode
 * rehydrates without data loss. Depends on the line_item carrying the
 * rich metadata serializeCommandeItem writes (_category, _window_type,
 * _entry_door_style, _patio_collection, _config, _form).
 */
function seedStateFromItem(initial, supplier) {
  if (!initial) return { ...INITIAL_STATE, item_supplier: supplier || 'royalty', supplier: supplier || 'royalty' };
  const form = initial._form || {};
  return {
    ...INITIAL_STATE,
    supplier: supplier || 'royalty',
    item_supplier: initial._supplier || supplier || 'royalty',
    category:         initial._category         || null,
    window_type:      initial._window_type      || null,
    entry_door_style: initial._entry_door_style || null,
    patio_collection: initial._patio_collection || null,
    config:           initial._config           || null,
    form: {
      ...INITIAL_STATE.form,
      width:  initial.dimensions?.width  ? String(initial.dimensions.width)  : '',
      height: initial.dimensions?.height ? String(initial.dimensions.height) : '',
      qty:    initial.qty || 1,
      note:   initial.note || '',
      collection:      form.collection      ?? INITIAL_STATE.form.collection,
      color:           form.color           ?? INITIAL_STATE.form.color,
      thermos:         form.thermos         ?? INITIAL_STATE.form.thermos,
      moustiquaire:    form.moustiquaire    ?? INITIAL_STATE.form.moustiquaire,
      egress:          form.egress          ?? INITIAL_STATE.form.egress,
      grille:          form.grille          ?? INITIAL_STATE.form.grille,
      frame_thickness: form.frame_thickness ?? '',
      frame_depth:     form.frame_depth     ?? INITIAL_STATE.form.frame_depth,
      door_model:      form.door_model      ?? '',
      swing:           form.swing           ?? INITIAL_STATE.form.swing,
      color_ext:       form.color_ext       ?? initial.color_ext ?? INITIAL_STATE.form.color_ext,
      color_int:       form.color_int       ?? initial.color_int ?? INITIAL_STATE.form.color_int,
      moulding:        form.moulding        ?? INITIAL_STATE.form.moulding,
      handle:          form.handle          ?? INITIAL_STATE.form.handle,
      sill:            form.sill            ?? INITIAL_STATE.form.sill,
      lock:            form.lock            ?? INITIAL_STATE.form.lock,
      glass:           form.glass           ?? '',
      hinges:          form.hinges          ?? INITIAL_STATE.form.hinges,
      frame:           form.frame           ?? '',
      glass_type:      form.glass_type      ?? INITIAL_STATE.form.glass_type,
      blinds:          form.blinds          ?? INITIAL_STATE.form.blinds,
    },
  };
}

// Stepper logic — drives which step's UI shows
const STEPS = ['category', 'type', 'config', 'options', 'dimensions'];

function currentStep(state) {
  if (!state.category) return 'category';
  // For windows we need window_type; entry door needs entry_door_style; patio needs patio_collection
  const hasType = (state.category === 'window' && state.window_type)
    || (state.category === 'entry_door' && state.entry_door_style)
    || (state.category === 'patio_door' && state.patio_collection);
  if (!hasType) return 'type';
  if (!state.config) return 'config';
  // Options + dimensions live on the same "details" screen after config
  return 'details';
}

const STEP_LABELS = {
  category:   '1. Catégorie',
  type:       '2. Type',
  config:     '3. Configuration',
  details:    '4. Options + dimensions',
};

export default function ItemBuilderModal({ open, mode = 'new', initial = null, supplier = 'royalty', onSave, onClose }) {
  // Seed computed once on mount (parent conditionally renders the modal
  // so each open is a fresh mount → useReducer re-seeds correctly from
  // the current `initial` prop). Don't dispatch RESTORE_STATE after
  // mount — that reducer action only restores supplier/project/items
  // and would WIPE the builder fields (category, window_type, config,
  // form) we just seeded.
  const seed = useMemo(() => seedStateFromItem(initial, supplier), [initial, supplier]);
  const [state, dispatch] = useReducer(commandeReducer, seed);
  const [error, setError] = useState(null);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const step = currentStep(state);
  const canGoBack = step !== 'category';

  function handleBack() {
    // Reducer has no explicit "back" action — approximate by clearing the
    // most recent choice. SET_CATEGORY on null resets window/door/patio.
    if (step === 'details') {
      dispatch({ type: A.SET_CONFIG, payload: null });
      return;
    }
    if (step === 'config') {
      if (state.category === 'window') dispatch({ type: A.SET_WINDOW_TYPE, payload: null });
      else if (state.category === 'entry_door') dispatch({ type: A.SET_ENTRY_DOOR_STYLE, payload: null });
      else if (state.category === 'patio_door') dispatch({ type: A.SET_PATIO_COLLECTION, payload: null });
      return;
    }
    if (step === 'type') {
      dispatch({ type: A.SET_CATEGORY, payload: null });
      return;
    }
  }

  function handleSave() {
    setError(null);
    if (!state.category || !state.config) {
      setError('Complète les étapes avant d\'enregistrer.');
      return;
    }
    const w = parseFraction(state.form.width);
    const h = parseFraction(state.form.height);
    if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(h) || h <= 0) {
      setError('Largeur et hauteur sont requises.');
      return;
    }

    // Build the same shape CommandePage.handleAdd does, then serialize.
    const qty = Number(state.form.qty) || 1;
    const note = state.form.note || '';
    const id = initial?.id || initial?.sku || Date.now();

    const commandeItem = { id, supplier: state.item_supplier, qty, note, category: state.category, width: w, height: h };

    if (state.category === 'window') {
      const isHybrid = state.form.collection === 'hybride';
      const colors = isHybrid ? WINDOW_COLORS.standard_hybride : WINDOW_COLORS.standard_upvc;
      const colorObj = colors.find(c => c.id === state.form.color) || colors[0];
      Object.assign(commandeItem, {
        window_type: state.window_type,
        config_code: state.config.code,
        config: state.config,
        ouvrant: state.config.notation || null,
        collection: state.form.collection,
        collection_info: COLLECTIONS[state.form.collection],
        color: state.form.color,
        color_name: colorObj?.name || state.form.color,
        thermos: state.form.thermos,
        moustiquaire: state.form.moustiquaire,
        egress: state.form.egress,
        grille: state.form.grille,
        frame_thickness: state.form.frame_thickness,
      });
    } else if (state.category === 'entry_door') {
      Object.assign(commandeItem, {
        entry_door_style: state.entry_door_style,
        style_info: state.config?.style,
        config: state.config,
        slab_w: state.config?.slab?.slab_w,
        frame_depth: state.form.frame_depth,
        frame_thickness: state.form.frame_thickness,
        door_model: state.form.door_model,
        swing: state.form.swing,
        color_ext: state.form.color_ext,
        color_int: state.form.color_int,
        moulding: state.form.moulding,
        handle: state.form.handle,
        sill: state.form.sill,
        lock: state.form.lock,
        glass: state.form.glass,
        hinges: state.form.hinges,
      });
    } else if (state.category === 'patio_door') {
      Object.assign(commandeItem, {
        patio_collection: state.patio_collection,
        collection_info: PATIO_COLLECTION_INFO[state.patio_collection],
        config: state.config,
        config_code: state.config.code,
        ouvrant: state.config?.panels?.join('') || null,
        frame: state.form.frame,
        frame_thickness: state.form.frame_thickness,
        color_ext: PATIO_COLOR_LABELS[state.form.color_ext] || state.form.color_ext,
        color_int: state.form.color_int,
        glass_type: state.form.glass_type,
        blinds: state.form.blinds,
        moustiquaire: state.form.moustiquaire,
        handle: state.form.handle,
        grille: state.form.grille,
      });
    }

    const lineItem = serializeCommandeItem(commandeItem, state.item_supplier);
    // Preserve DevisEditor-side fields from the existing row so we don't
    // wipe price/SKU/queue state on edit.
    if (initial) {
      lineItem.sku            = initial.sku            ?? lineItem.sku;
      lineItem.unit_price     = initial.unit_price     ?? null;
      lineItem._unit_price_full = initial._unit_price_full ?? null;
      lineItem._cost          = initial._cost          ?? null;
      lineItem._supplier_cost = initial._supplier_cost ?? null;
      lineItem._supplier_list_price = initial._supplier_list_price ?? null;
      lineItem._urethane      = initial._urethane      ?? null;
      lineItem._moulure       = initial._moulure       ?? null;
      lineItem._calking       = initial._calking       ?? null;
      lineItem._perimeter     = initial._perimeter     ?? null;
      lineItem._photos        = Array.isArray(initial._photos) ? initial._photos : null;
      lineItem._queued_for_bc = initial._queued_for_bc ?? false;
      lineItem._bc_sent_at    = initial._bc_sent_at    ?? null;
      lineItem.energy_star    = initial.energy_star    ?? undefined;
      if (initial.total != null) lineItem.total = initial.total;
    }

    onSave?.(lineItem);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Configurer l'article"
    >
      <div
        className="bg-d-bg border border-d-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92dvh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-d-border flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-d-text">
              {mode === 'edit' ? 'Modifier l\'article' : 'Nouvel article'}
            </h2>
            <span className="text-[10px] text-d-muted font-mono px-2 py-0.5 rounded bg-d-surface/70 border border-d-border/60">
              {STEP_LABELS[step] || STEP_LABELS.details}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-1 rounded hover:bg-d-surface transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body — scrollable, renders the current step */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {step === 'category' && (
            <CategoryPicker state={state} dispatch={dispatch} />
          )}
          {step === 'type' && (
            <TypePicker state={state} dispatch={dispatch} />
          )}
          {step === 'config' && (
            <ConfigPicker state={state} dispatch={dispatch} />
          )}
          {step === 'details' && (
            <>
              <DimensionInputs state={state} dispatch={dispatch} />
              <OptionsForm state={state} dispatch={dispatch} />
            </>
          )}
          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-xs text-rose-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-d-border flex-wrap">
          <button
            type="button"
            onClick={handleBack}
            disabled={!canGoBack}
            aria-label="Étape précédente"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-d-border text-xs text-d-text hover:border-d-primary/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={13} /> Retour
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs text-d-muted hover:text-d-text transition"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={step !== 'details'}
              aria-label="Enregistrer l'article"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-d-primary text-white text-xs font-semibold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/60"
            >
              <Save size={13} /> {mode === 'edit' ? 'Sauvegarder' : 'Ajouter au devis'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
