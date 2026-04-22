/**
 * PÜR Hub v2 — Commande Reducer
 *
 * State shape is 100% backwards compatible with existing commande_drafts.state_json.
 * Every action produces the same state mutations as the original inline JS.
 */

export const INITIAL_STATE = {
  supplier: 'royalty',         // 'royalty' | 'touchette' | 'both'
  item_supplier: 'royalty',    // supplier tag for current item being built
  project: {
    client: '',
    ref: '',
    address: '',
    date: '',
    urgency: 'standard',
    contact: 'Jeremy \u00b7 (514) 926-7669',
    notes: '',
  },
  items: [],
  // Builder state (not persisted to Supabase — transient)
  category: null,              // 'window' | 'entry_door' | 'patio_door'
  window_type: null,
  entry_door_style: null,
  patio_collection: null,
  config: null,
  // Form fields (controlled)
  form: {
    width: '',
    height: '',
    qty: 1,
    note: '',
    // Window options
    collection: 'pvc',
    color: 'blanc',
    thermos: 'double',
    moustiquaire: true,
    egress: 'rencontre',
    grille: 'none',
    frame_thickness: '',
    // Entry door options
    frame_depth: '1_1_4',
    door_model: '',
    swing: 'gauche',
    // Rule locked 2026-04-20: Blanc default everywhere (ext + int). Noir was
    // a legacy default that Jérémy had to override every time.
    color_ext: 'Blanc',
    color_int: 'Blanc',
    moulding: 'contemporaine',
    handle: 'fournis_client',
    sill: 'anodise_clair',
    lock: '1_trou',
    glass: '',
    hinges: 'argent',
    // Patio options
    frame: '',
    glass_type: 'double',
    blinds: 'none',
  },
  // Edit mode
  editingId: null,
  // Order number (generated once, persisted)
  orderNumber: null,
};

// ── Actions ──

export const A = {
  SET_SUPPLIER: 'SET_SUPPLIER',
  SET_ITEM_SUPPLIER: 'SET_ITEM_SUPPLIER',
  SET_CATEGORY: 'SET_CATEGORY',
  SET_WINDOW_TYPE: 'SET_WINDOW_TYPE',
  SET_ENTRY_DOOR_STYLE: 'SET_ENTRY_DOOR_STYLE',
  SET_PATIO_COLLECTION: 'SET_PATIO_COLLECTION',
  SET_CONFIG: 'SET_CONFIG',
  SET_FORM_FIELD: 'SET_FORM_FIELD',
  SET_PROJECT_FIELD: 'SET_PROJECT_FIELD',
  ADD_ITEM: 'ADD_ITEM',
  UPDATE_ITEM: 'UPDATE_ITEM',
  DELETE_ITEM: 'DELETE_ITEM',
  DUPLICATE_ITEM: 'DUPLICATE_ITEM',
  MOVE_ITEM: 'MOVE_ITEM',
  SWAP_ITEM_SUPPLIER: 'SWAP_ITEM_SUPPLIER',
  EDIT_ITEM: 'EDIT_ITEM',
  CANCEL_EDIT: 'CANCEL_EDIT',
  RESET_FORM: 'RESET_FORM',
  RESET_ALL: 'RESET_ALL',
  RESTORE_STATE: 'RESTORE_STATE',
  // P-B: prefill project fields from a CRM lead (non-destructive)
  PREFILL_FROM_LEAD: 'PREFILL_FROM_LEAD',
};

function resetFormFields() {
  return { ...INITIAL_STATE.form };
}

export default function commandeReducer(state, action) {
  switch (action.type) {
    case A.SET_SUPPLIER: {
      const s = action.payload;
      let itemSup = state.item_supplier;
      if (s === 'royalty' || s === 'touchette') {
        itemSup = s;
      } else if (s === 'both') {
        if (itemSup !== 'royalty' && itemSup !== 'touchette') itemSup = 'royalty';
      }
      return {
        ...state,
        supplier: s,
        item_supplier: itemSup,
        category: null,
        window_type: null,
        entry_door_style: null,
        patio_collection: null,
        config: null,
        form: resetFormFields(),
        editingId: null,
      };
    }

    case A.SET_ITEM_SUPPLIER: {
      const s = action.payload;
      if (s !== 'royalty' && s !== 'touchette') return state;
      return {
        ...state,
        item_supplier: s,
        category: null,
        window_type: null,
        entry_door_style: null,
        patio_collection: null,
        config: null,
        form: resetFormFields(),
      };
    }

    case A.SET_CATEGORY:
      return {
        ...state,
        category: action.payload,
        window_type: null,
        entry_door_style: null,
        patio_collection: null,
        config: null,
        form: resetFormFields(),
      };

    case A.SET_WINDOW_TYPE:
      return {
        ...state,
        window_type: action.payload,
        entry_door_style: null,
        patio_collection: null,
        config: null,
      };

    case A.SET_ENTRY_DOOR_STYLE:
      return {
        ...state,
        entry_door_style: action.payload,
        window_type: null,
        patio_collection: null,
        config: null,
      };

    case A.SET_PATIO_COLLECTION:
      return {
        ...state,
        patio_collection: action.payload,
        window_type: null,
        entry_door_style: null,
        config: null,
      };

    case A.SET_CONFIG:
      return { ...state, config: action.payload };

    case A.SET_FORM_FIELD: {
      const newForm = { ...state.form, [action.field]: action.value };
      // When the window collection switches (PVC ↔ Hybride) apply the
      // default color pair per Mikael 2026-04-22:
      //   PVC     → extérieur Blanc / intérieur Blanc
      //   Hybride → extérieur Noir  / intérieur Blanc
      // User can override either side — standard or custom combos still
      // possible (e.g. Thomas Gigandet: PVC blanc ext / brun int).
      // Only reset when the user hasn't already manually overridden to a
      // non-default value this session — track via _color_user_set.
      if (action.field === 'collection' && state.category === 'window') {
        if (!newForm._color_user_set) {
          if (action.value === 'hybride') {
            newForm.color_ext = 'Noir';
            newForm.color_int = 'Blanc';
          } else {
            newForm.color_ext = 'Blanc';
            newForm.color_int = 'Blanc';
          }
        }
      }
      if (action.field === 'color_ext' || action.field === 'color_int') {
        newForm._color_user_set = true;
      }
      return { ...state, form: newForm };
    }

    case A.SET_PROJECT_FIELD:
      return {
        ...state,
        project: { ...state.project, [action.field]: action.value },
      };

    case A.ADD_ITEM: {
      const item = action.payload;
      const orderNumber = state.orderNumber || generateOrderNumber();
      return {
        ...state,
        items: [...state.items, item],
        orderNumber,
        // Keep category, window_type, entry_door_style, patio_collection,
        // supplier, item_supplier so the user can quickly add another item
        // of the same type. Only clear config + form fields.
        config: null,
        form: resetFormFields(),
        editingId: null,
      };
    }

    case A.UPDATE_ITEM: {
      const item = action.payload;
      const items = state.items.map((i) => (i.id === item.id ? item : i));
      return {
        ...state,
        items,
        // Same as ADD_ITEM: keep category/type/supplier, clear config + form.
        config: null,
        form: resetFormFields(),
        editingId: null,
      };
    }

    case A.DELETE_ITEM:
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.payload),
      };

    case A.DUPLICATE_ITEM: {
      const orig = state.items.find((i) => i.id === action.payload);
      if (!orig) return state;
      const copy = { ...orig, id: Date.now() };
      const idx = state.items.findIndex((i) => i.id === action.payload);
      const items = [...state.items];
      items.splice(idx + 1, 0, copy);
      return { ...state, items };
    }

    case A.MOVE_ITEM: {
      const { id, delta } = action.payload;
      const idx = state.items.findIndex((i) => i.id === id);
      const newIdx = idx + delta;
      if (newIdx < 0 || newIdx >= state.items.length) return state;
      const items = [...state.items];
      [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
      return { ...state, items };
    }

    case A.SWAP_ITEM_SUPPLIER: {
      const { id, newSupplier } = action.payload;
      const items = state.items.map((i) =>
        i.id === id ? { ...i, supplier: newSupplier } : i
      );
      return { ...state, items };
    }

    case A.EDIT_ITEM: {
      const item = state.items.find((i) => i.id === action.payload);
      if (!item) return state;
      // Populate builder from item
      const form = { ...state.form };
      form.width = item.width;
      form.height = item.height;
      form.qty = item.qty;
      form.note = item.note || '';

      if (item.category === 'window') {
        form.collection = item.collection || 'pvc';
        form.color = item.color || 'blanc';
        // Prefer explicit ext/int; fall back to the legacy single color_name
        // so items saved before the dual selector still edit correctly.
        const legacyName = item.color_name || '';
        form.color_ext = item.color_ext || legacyName || (form.collection === 'hybride' ? 'Noir' : 'Blanc');
        form.color_int = item.color_int || legacyName || 'Blanc';
        form._color_user_set = true; // don't overwrite during edit session
        form.thermos = item.thermos || 'double';
        form.moustiquaire = item.moustiquaire !== false;
        form.egress = item.egress || 'rencontre';
        form.grille = item.grille || 'none';
        form.frame_thickness = item.frame_thickness || '';
      } else if (item.category === 'entry_door') {
        form.frame_depth = item.frame_depth || '1_1_4';
        form.frame_thickness = item.frame_thickness || '';
        form.door_model = item.door_model || '';
        form.swing = item.swing || 'gauche';
        form.color_ext = item.color_ext || 'Blanc';
        form.color_int = item.color_int || 'Blanc';
        form.moulding = item.moulding || 'contemporaine';
        form.handle = item.handle || 'fournis_client';
        form.sill = item.sill || 'anodise_clair';
        form.lock = item.lock || '1_trou';
        form.glass = item.glass || '';
        form.hinges = item.hinges || 'argent';
      } else if (item.category === 'patio_door') {
        form.frame = item.frame || '';
        form.frame_thickness = item.frame_thickness || '';
        form.color_ext = item.color_ext || 'Blanc';
        form.color_int = item.color_int || 'Blanc';
        form.glass_type = item.glass_type || 'double';
        form.blinds = item.blinds || 'none';
        form.moustiquaire = item.moustiquaire !== false;
        form.handle = item.handle || '';
        form.grille = item.grille || 'none';
      }

      return {
        ...state,
        editingId: item.id,
        category: item.category,
        window_type: item.window_type || null,
        entry_door_style: item.entry_door_style || null,
        patio_collection: item.patio_collection || null,
        config: item.config || null,
        item_supplier: item.supplier || state.item_supplier,
        form,
      };
    }

    case A.CANCEL_EDIT:
      return {
        ...state,
        editingId: null,
        category: null,
        window_type: null,
        entry_door_style: null,
        patio_collection: null,
        config: null,
        form: resetFormFields(),
      };

    case A.RESET_FORM:
      return {
        ...state,
        category: null,
        window_type: null,
        entry_door_style: null,
        patio_collection: null,
        config: null,
        form: resetFormFields(),
        editingId: null,
      };

    case A.RESET_ALL:
      return { ...INITIAL_STATE };

    case A.RESTORE_STATE: {
      const saved = action.payload;
      return {
        ...state,
        supplier: saved.supplier || 'royalty',
        item_supplier: saved.item_supplier || 'royalty',
        project: { ...INITIAL_STATE.project, ...(saved.project || {}) },
        items: saved.items || [],
        orderNumber: saved.orderNumber || state.orderNumber,
      };
    }

    case A.PREFILL_FROM_LEAD: {
      // Non-destructive: only set fields that are currently empty/default
      const lead = action.payload; // { id, name, phone, email, address }
      const currentProject = state.project;
      return {
        ...state,
        prefillLeadId: lead.id || null,
        project: {
          ...currentProject,
          client: currentProject.client && currentProject.client !== INITIAL_STATE.project.client
            ? currentProject.client
            : (lead.name || currentProject.client),
          contact: currentProject.contact && currentProject.contact !== INITIAL_STATE.project.contact
            ? currentProject.contact
            : (lead.phone || currentProject.contact),
          address: currentProject.address || lead.address || '',
        },
        prefillEmail: lead.email || null,
      };
    }

    default:
      return state;
  }
}

function generateOrderNumber() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const rnd = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `PUR-${yy}${mm}${dd}-${rnd}`;
}
