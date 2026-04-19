import { useReducer, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import toitureReducer, { INITIAL_STATE, T } from './toitureReducer';
import useToitureDraft from '@/hooks/hub/useToitureDraft';
import { calculateRoofingQuote, autoCalculateQuantities, formatCAD } from '@/lib/hub/toiture-data';
import { StepIndicator, Button, SaveStatus } from '@/components/hub/ui';
import ClientInfo from './steps/ClientInfo';
import Measures from './steps/Measures';
import Materials from './steps/Materials';
import Labor from './steps/Labor';
import Pricing from './steps/Pricing';
import Review from './steps/Review';
import Sidebar from './Sidebar';
import s from './toiture.module.css';

const STEPS = ['Client', 'Mesures', 'Matériaux', 'Main-d\'œuvre', 'Tarification', 'Révision'];

export default function ToiturePage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(toitureReducer, INITIAL_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;

  const draft = useToitureDraft({ getState: () => stateRef.current });

  // Auto-load draft
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    async function init() {
      draft.pauseSaves();
      const draftParam = router.query.draft;
      if (draftParam) {
        const saved = await draft.loadDraft(draftParam);
        if (saved) { dispatch({ type: T.RESTORE_STATE, payload: saved }); draft.resumeSaves(); return; }
      }
      const local = draft.loadFromLocal();
      if (local) dispatch({ type: T.RESTORE_STATE, payload: local });
      draft.resumeSaves();
    }
    init();
  }, []);

  // Auto-calculate quantities when measures change
  useEffect(() => {
    if (state.measures.surface > 0) {
      const auto = autoCalculateQuantities({
        surface_sqft: state.measures.surface,
        eaves_length_ft: state.measures.eaves_length,
        ridge_ft: state.measures.ridge,
        shingle_type: state.shingle_type,
      });
      // Only set non-manually-overridden quantities
      Object.entries(auto).forEach(([key, val]) => {
        if (!state.manual_overrides[key]) {
          dispatch({ type: T.SET_QUANTITY, field: key, value: val });
        }
      });
    }
  }, [state.measures.surface, state.measures.eaves_length, state.measures.ridge, state.shingle_type]);

  // Calculate result on every relevant change
  const result = useMemo(() => {
    if (!state.measures.surface || !state.measures.pitch_category) return null;
    try {
      const fees = {
        conteneur: state.fees.conteneur ? 1 : 0,
        essence: state.fees.essence ? 1 : 0,
        transport: state.fees.transport ? 1 : 0,
      };
      const fee_overrides = {
        essence: state.fee_values.essence,
        transport: state.fee_values.transport,
      };

      const input = {
        shingle_type: state.shingle_type,
        quantities: state.quantities,
        excludes: state.excludes,
        fees,
        fee_overrides,
        worker_rates: state.labor.worker_rates,
        days: state.labor.days,
        hours_per_day: state.labor.auto_labor ? null : (state.labor.hours_per_day || 10),
        auto_labor: !!state.labor.auto_labor,
        pitch_category: state.measures.pitch_category || 'easy',
        pitch_tier: state.pricing.tier,
        surface_sqft: state.measures.surface,
        surface_bucket_mode: state.pricing.surface_bucket_mode || 'flat',
        cash_discount: state.pricing.cash_discount,
        min_quote_price: state.pricing.min_quote_price,
      };

      // Mode-specific params
      if (state.pricing.mode === 'markup') {
        input.markup_pct = state.pricing.markup_pct;
      } else if (state.pricing.mode === 'forfait' && state.pricing.forfait_override) {
        input.override_subtotal_ht = state.pricing.forfait_override;
      } else if (state.pricing.mode === 'target_margin') {
        input.target_margin_pct = state.pricing.target_margin_pct;
      }

      return calculateRoofingQuote(input);
    } catch { return null; }
  }, [state.measures, state.shingle_type, state.quantities, state.excludes, state.labor, state.fees, state.fee_values, state.pricing]);

  // Save result to state for persistence
  useEffect(() => {
    if (result) dispatch({ type: T.SET_RESULT, payload: result });
  }, [result]);

  // Trigger draft save on data changes
  useEffect(() => { draft.triggerSave(); }, [state.client, state.measures, state.quantities, state.labor, state.pricing]);

  const stepComponents = [
    <ClientInfo key={0} state={state} dispatch={dispatch} />,
    <Measures key={1} state={state} dispatch={dispatch} />,
    <Materials key={2} state={state} dispatch={dispatch} />,
    <Labor key={3} state={state} dispatch={dispatch} />,
    <Pricing key={4} state={state} dispatch={dispatch} />,
    <Review key={5} state={state} dispatch={dispatch} result={result} />,
  ];

  return (
    <div className={s.page}>
      <div className={s.main}>
        <div className={s.topRow}>
          <StepIndicator
            steps={STEPS}
            current={state.step}
            onStepClick={(i) => dispatch({ type: T.SET_STEP, payload: i })}
          />
          <SaveStatus status={draft.saveStatus} />
        </div>

        <div className={s.stepContent}>
          {stepComponents[state.step]}
        </div>

        <div className={s.navRow}>
          {state.step > 0 && (
            <Button variant="secondary" onClick={() => dispatch({ type: T.SET_STEP, payload: state.step - 1 })}>
              &larr; Retour
            </Button>
          )}
          <div style={{ flex: 1 }} />
          {state.step < 5 && (
            <Button onClick={() => dispatch({ type: T.SET_STEP, payload: state.step + 1 })}>
              Suivant &rarr;
            </Button>
          )}
        </div>
      </div>

      <Sidebar result={result} />
    </div>
  );
}
