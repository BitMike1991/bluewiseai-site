import { useReducer, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import commandeReducer, { INITIAL_STATE, A } from './commandeReducer';
import useCommandeDraft from '@/hooks/hub/useCommandeDraft';
import { parseFraction } from '@/lib/hub/fraction';
import { COLLECTIONS, WINDOW_COLORS } from '@/lib/hub/catalog-data';
import { Button } from '@/components/hub/ui';
import SupplierSelector from './steps/SupplierSelector';
import ProjectInfo from './steps/ProjectInfo';
import CategoryPicker from './steps/CategoryPicker';
import TypePicker from './steps/TypePicker';
import ConfigPicker from './steps/ConfigPicker';
import DimensionInputs from './steps/DimensionInputs';
import OptionsForm from './steps/OptionsForm';
import ItemsList from './items/ItemsList';
import DocumentPreview from './preview/DocumentPreview';
import ExportActions from './preview/ExportActions';
import s from './commande.module.css';

const PATIO_COLLECTION_INFO = {
  odyssee: {
    name: 'Odyssée',
    specs_default: [
      'Porte patio coulissante Portes Standard',
      'Verre Low-E avec gaz argon (std) ou Low-E Plus (RE 40 · U 1.48 · R 3.85)',
      'Intercalaire non conducteur',
      "Renforts d'acier galvanisé calibre 16",
      'Système exclusif de roulement à billes tandem',
      'Seuil tout PVC qui ne pourrit pas',
      'Cadre de bois jointé 1 3/16" (jambages + tête)',
      "Jambages et tête extrudés d'une seule pièce (pas de joint ext.)",
      'Recouvrement intérieur PVC + coupe-froid haute performance',
      'Moustiquaire aluminium extrudé + treillis fibre de verre',
      'Garantie 20 ans unité scellée · 10 ans PVC · transférable',
    ],
  },
  belle_vue_prima: {
    name: 'Belle-Vue Prima',
    specs_default: [
      'Porte patio premium tout PVC Belle-Vue Prima (Portes Standard)',
      'Volet 3 1/2" contemporain',
      'Verre Low-E Plus argon (RE 37 · U 1.48 · R 3.85)',
      'Option verre triple 2× Low-E 2× argon (RE 37 · U 1.25 · R 4.5)',
      'Poignée exclusive niveau 40 incluse — une des plus sécuritaires en AN',
      'Renforts acier galvanisé cal. 16 + roulement à billes tandem',
      'Seuil tout PVC + revêtement intérieur PVC',
      'Cadre bois jointé 1 3/16" — jambages + tête une seule pièce',
      'Option stores Eclipse intégrés entre les vitres',
      'Moustiquaire aluminium renforci + fibre de verre',
      'Garantie 20 ans unité scellée + PVC · 10 ans pièces · transférable',
    ],
  },
  belle_vue_prestige: {
    name: 'Belle-Vue Prestige',
    specs_default: [
      'Porte patio hybride Belle-Vue Prestige (Portes Standard)',
      'Aluminium extrudé extérieur + PVC intérieur',
      'Volet 3 1/2" contemporain avec volets 3 1/2" alu ext.',
      'Verre Low-E Plus argon (RE 34 · U 1.59 · R 3.57)',
      'Option verre triple 2× Low-E 2× argon (RE 35 · U 1.36 · R 4.2)',
      'Poignée exclusive niveau 40 incluse',
      'Seuil recouvert d\'aluminium anodisé',
      'Cache rainure sur glissière de tête',
      'Couleurs stock : Noir, Brun commercial, Blanc, Anodisé clair',
      'Couleurs sur mesure disponibles',
      'Option stores Eclipse intégrés',
      'Garantie 20 ans PVC · 10 ans pièces · transférable',
    ],
  },
  belle_vue_levante: {
    name: 'Belle-Vue Levante',
    specs_default: [
      'Porte à levier Belle-Vue Levante (Portes Standard)',
      'Poignée vers le haut = verrouille + étanche',
      'Poignée vers le bas = soulève + glisse facilement',
      'Disponible sur base Prima (PVC) ou Prestige (Hybride)',
      "Idéal pour mur de verre géant — grande portée jusqu'à 12 pi",
      'Verre Low-E Plus argon · option triple 2× Low-E 2× argon',
      'Poignée exclusive niveau 40 incluse',
      'Option stores Eclipse intégrés',
      'Garantie 20 ans PVC · 10 ans pièces · transférable',
    ],
  },
};

const PATIO_COLOR_LABELS = {
  blanc_k1285: 'Blanc K-1285',
  noir_k90421: 'Noir K-90421',
  anodise: 'Anodisé',
};

export default function CommandePage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(commandeReducer, INITIAL_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;

  const draft = useCommandeDraft({
    getState: () => stateRef.current,
  });

  // Auto-load draft on mount + handle ?prefill= from BW CRM
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    async function init() {
      draft.pauseSaves();
      const draftParam = router.query.draft;
      const prefillParam = router.query.prefill;

      if (draftParam) {
        const saved = await draft.loadDraft(draftParam);
        if (saved) {
          dispatch({ type: A.RESTORE_STATE, payload: saved });
          draft.resumeSaves();
          return;
        }
      }

      // P-B: ?prefill=leadId — fetch lead from BW via server-side proxy and seed project fields
      if (prefillParam && /^\d+$/.test(String(prefillParam))) {
        try {
          const res = await fetch(`/api/hub/lead-prefill?lead_id=${prefillParam}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.lead) {
              dispatch({ type: A.PREFILL_FROM_LEAD, payload: data.lead });
            }
          }
        } catch (err) {
          // Non-fatal — user can fill fields manually
          console.warn('[CommandePage] prefill fetch failed', err.message);
        }
        draft.resumeSaves();
        return;
      }

      // Fallback to localStorage
      const local = draft.loadFromLocal();
      if (local) {
        dispatch({ type: A.RESTORE_STATE, payload: local });
      }
      draft.resumeSaves();
    }

    init();
  }, []);

  // Trigger save on state change (skip transient builder state)
  const prevItems = useRef(state.items);
  const prevProject = useRef(state.project);
  useEffect(() => {
    if (
      state.items !== prevItems.current ||
      state.project !== prevProject.current
    ) {
      prevItems.current = state.items;
      prevProject.current = state.project;
      draft.triggerSave();
    }
  }, [state.items, state.project]);

  // Build item from form state
  const handleAdd = useCallback(() => {
    if (!state.category || !state.config) return;
    const w = parseFraction(state.form.width);
    const h = parseFraction(state.form.height);
    if (isNaN(w) || isNaN(h)) return;

    const qty = state.form.qty || 1;
    const note = state.form.note;

    let item = {
      id: state.editingId || Date.now(),
      supplier: state.item_supplier,
      qty,
      note,
      category: state.category,
      width: w,
      height: h,
    };

    if (state.category === 'window') {
      const isHybrid = state.form.collection === 'hybride';
      const colors = isHybrid ? WINDOW_COLORS.standard_hybride : WINDOW_COLORS.standard_upvc;
      const colorObj = colors.find((c) => c.id === state.form.color) || colors[0];
      Object.assign(item, {
        window_type: state.window_type,
        config_code: state.config.code,
        config: state.config,
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
      Object.assign(item, {
        entry_door_style: state.entry_door_style,
        style_info: state.config.style,
        config: state.config,
        slab_w: state.config.slab?.slab_w,
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
      Object.assign(item, {
        patio_collection: state.patio_collection,
        collection_info: PATIO_COLLECTION_INFO[state.patio_collection],
        config: state.config,
        config_code: state.config.code,
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

    if (state.editingId) {
      dispatch({ type: A.UPDATE_ITEM, payload: item });
    } else {
      dispatch({ type: A.ADD_ITEM, payload: item });
    }
  }, [state]);

  const canAdd = state.category && state.config;

  return (
    <div className={s.page}>
      <div className={s.builder}>
        {/* Supplier */}
        <div className={s.section}>
          <div className={s.sectionTitle}>Fournisseur</div>
          <SupplierSelector state={state} dispatch={dispatch} />
        </div>

        {/* Project Info */}
        <div className={s.section}>
          <div className={s.sectionTitle}>Projet</div>
          <ProjectInfo state={state} dispatch={dispatch} />
        </div>

        {/* Category */}
        <div className={s.section}>
          <div className={s.sectionTitle}>1. Catégorie</div>
          <CategoryPicker state={state} dispatch={dispatch} />
        </div>

        {/* Type / Style / Collection */}
        {state.category && (
          <div className={s.section}>
            <div className={s.sectionTitle}>2. Type</div>
            <TypePicker state={state} dispatch={dispatch} />
          </div>
        )}

        {/* Config */}
        {(state.window_type || state.entry_door_style || state.patio_collection) && (
          <div className={s.section}>
            <div className={s.sectionTitle}>3. Configuration</div>
            <ConfigPicker state={state} dispatch={dispatch} />
          </div>
        )}

        {/* Dimensions */}
        {state.config && (
          <div className={s.section}>
            <div className={s.sectionTitle}>4. Dimensions</div>
            <DimensionInputs state={state} dispatch={dispatch} />
          </div>
        )}

        {/* Options */}
        {state.config && (
          <div className={s.section}>
            <div className={s.sectionTitle}>5. Options</div>
            <OptionsForm state={state} dispatch={dispatch} />
          </div>
        )}

        {/* Add / Edit button */}
        <div className={s.addBtnRow}>
          <Button
            variant={state.editingId ? 'success' : 'primary'}
            fullWidth
            disabled={!canAdd}
            onClick={handleAdd}
          >
            {state.editingId ? '✓ Modifier l\'article' : '+ Ajouter au bon de commande'}
          </Button>
          {state.editingId && (
            <Button
              variant="secondary"
              onClick={() => dispatch({ type: A.CANCEL_EDIT })}
            >
              Annuler
            </Button>
          )}
        </div>

        {/* Items list */}
        {state.items.length > 0 && (
          <div className={s.section}>
            <ItemsList
              items={state.items}
              dispatch={dispatch}
              supplierMode={state.supplier}
            />
          </div>
        )}
      </div>

      {/* Preview panel */}
      <div className={s.preview}>
        <ExportActions state={state} draft={draft} />
        <div data-doc-export>
          <DocumentPreview state={state} />
        </div>
      </div>
    </div>
  );
}
