/**
 * PÜR Hub v2 — Toiture Reducer
 *
 * State shape is 100% backwards compatible with existing toiture_drafts.state_json.
 */

export const INITIAL_STATE = {
  step: 0,
  client: { name: '', phone: '', email: '', address: '', city: '', postal: '', notes: '' },
  house_photo_url: '',
  measures: { surface: 0, eaves_length: 0, ridge: 0, pitch_category: null, complexity: null },
  shingle_type: 'bardeau_standard',
  quantities: { bardeau_standard: 0, cap_bardeau: 0, pitch: 0, syntec: 0, glace_eau: 0, maximum: 0, event: 0, clou: 0 },
  excludes: {},
  manual_overrides: {},
  labor: { workers: 2, days: 1, worker_rates: [50, 50], hours_per_day: 10, auto_labor: true },
  fees: { conteneur: true, essence: true, transport: true },
  fee_values: { essence: 100, transport: 75 },
  pricing: {
    mode: 'auto',
    tier: 1,
    markup_pct: 40,
    forfait_override: null,
    cash_discount: 0,
    min_quote_price: 4500,
    auto_send: true,
    surface_bucket_mode: 'graduated',
    target_margin_pct: 35,
  },
  lastResult: null,
};

export const T = {
  SET_STEP: 'SET_STEP',
  SET_CLIENT_FIELD: 'SET_CLIENT_FIELD',
  SET_MEASURES_FIELD: 'SET_MEASURES_FIELD',
  SET_PITCH: 'SET_PITCH',
  SET_COMPLEXITY: 'SET_COMPLEXITY',
  SET_SHINGLE: 'SET_SHINGLE',
  SET_QUANTITY: 'SET_QUANTITY',
  TOGGLE_EXCLUDE: 'TOGGLE_EXCLUDE',
  SET_MANUAL_OVERRIDE: 'SET_MANUAL_OVERRIDE',
  SET_LABOR_FIELD: 'SET_LABOR_FIELD',
  SET_WORKER_RATE: 'SET_WORKER_RATE',
  ADD_WORKER: 'ADD_WORKER',
  REMOVE_WORKER: 'REMOVE_WORKER',
  TOGGLE_AUTO_LABOR: 'TOGGLE_AUTO_LABOR',
  TOGGLE_FEE: 'TOGGLE_FEE',
  SET_FEE_VALUE: 'SET_FEE_VALUE',
  SET_PRICING_FIELD: 'SET_PRICING_FIELD',
  SET_PRICING_MODE: 'SET_PRICING_MODE',
  SET_TIER: 'SET_TIER',
  SET_RESULT: 'SET_RESULT',
  SET_HOUSE_PHOTO: 'SET_HOUSE_PHOTO',
  RESTORE_STATE: 'RESTORE_STATE',
  RESET_ALL: 'RESET_ALL',
};

export default function toitureReducer(state, action) {
  switch (action.type) {
    case T.SET_STEP:
      return { ...state, step: action.payload };

    case T.SET_CLIENT_FIELD:
      return { ...state, client: { ...state.client, [action.field]: action.value } };

    case T.SET_HOUSE_PHOTO:
      return { ...state, house_photo_url: action.payload || '' };

    case T.SET_MEASURES_FIELD:
      return { ...state, measures: { ...state.measures, [action.field]: action.value } };

    case T.SET_PITCH:
      return { ...state, measures: { ...state.measures, pitch_category: action.payload } };

    case T.SET_COMPLEXITY:
      return {
        ...state,
        measures: { ...state.measures, complexity: action.payload },
        pricing: { ...state.pricing, tier: action.payload },
      };

    case T.SET_SHINGLE:
      return { ...state, shingle_type: action.payload };

    case T.SET_QUANTITY:
      return { ...state, quantities: { ...state.quantities, [action.field]: action.value } };

    case T.TOGGLE_EXCLUDE:
      return { ...state, excludes: { ...state.excludes, [action.field]: !state.excludes[action.field] } };

    case T.SET_MANUAL_OVERRIDE:
      return { ...state, manual_overrides: { ...state.manual_overrides, [action.field]: action.value } };

    case T.SET_LABOR_FIELD:
      return { ...state, labor: { ...state.labor, [action.field]: action.value } };

    case T.SET_WORKER_RATE: {
      const rates = [...state.labor.worker_rates];
      rates[action.index] = action.value;
      return { ...state, labor: { ...state.labor, worker_rates: rates } };
    }

    case T.ADD_WORKER: {
      const rates = [...state.labor.worker_rates, 50];
      return { ...state, labor: { ...state.labor, workers: rates.length, worker_rates: rates } };
    }

    case T.REMOVE_WORKER: {
      if (state.labor.worker_rates.length <= 1) return state;
      const rates = state.labor.worker_rates.slice(0, -1);
      return { ...state, labor: { ...state.labor, workers: rates.length, worker_rates: rates } };
    }

    case T.TOGGLE_AUTO_LABOR:
      return { ...state, labor: { ...state.labor, auto_labor: !state.labor.auto_labor } };

    case T.TOGGLE_FEE:
      return { ...state, fees: { ...state.fees, [action.field]: !state.fees[action.field] } };

    case T.SET_FEE_VALUE:
      return { ...state, fee_values: { ...state.fee_values, [action.field]: action.value } };

    case T.SET_PRICING_FIELD:
      return { ...state, pricing: { ...state.pricing, [action.field]: action.value } };

    case T.SET_PRICING_MODE:
      return { ...state, pricing: { ...state.pricing, mode: action.payload } };

    case T.SET_TIER:
      return { ...state, pricing: { ...state.pricing, tier: action.payload } };

    case T.SET_RESULT:
      return { ...state, lastResult: action.payload };

    case T.RESTORE_STATE:
      return { ...state, ...action.payload, step: action.payload.step || 0 };

    case T.RESET_ALL:
      return { ...INITIAL_STATE };

    default:
      return state;
  }
}
