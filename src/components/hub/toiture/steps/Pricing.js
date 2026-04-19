import { T } from '../toitureReducer';
import { Input } from '@/components/hub/ui';
import s from '../toiture.module.css';

const MODES = [
  { key: 'auto', label: 'Auto (tier)' },
  { key: 'markup', label: 'Markup %' },
  { key: 'forfait', label: 'Forfait' },
  { key: 'target_margin', label: 'Marge cible' },
];

export default function Pricing({ state, dispatch }) {
  return (
    <div>
      <div className={s.formSection}>
        <div className={s.formLabel}>Mode de tarification</div>
        <div className={s.selectorRow}>
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`${s.selectorCard} ${state.pricing.mode === m.key ? s.selectorCardActive : ''}`}
              onClick={() => dispatch({ type: T.SET_PRICING_MODE, payload: m.key })}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {state.pricing.mode === 'auto' && (
        <div className={s.formSection}>
          <div className={s.formLabel}>Tier</div>
          <div className={s.selectorRow}>
            {[1, 2, 3].map((t) => (
              <button
                key={t}
                type="button"
                className={`${s.selectorCard} ${state.pricing.tier === t ? s.selectorCardActive : ''}`}
                onClick={() => dispatch({ type: T.SET_TIER, payload: t })}
              >
                Tier {t}
              </button>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 12 }}>
            <input
              type="checkbox"
              checked={state.pricing.surface_bucket_mode === 'graduated'}
              onChange={(e) => dispatch({ type: T.SET_PRICING_FIELD, field: 'surface_bucket_mode', value: e.target.checked ? 'graduated' : 'flat' })}
              style={{ width: 16, height: 16 }}
            />
            Facturation gradu&eacute;e (petits jobs = plus $/pi&sup2;)
          </label>
        </div>
      )}

      {state.pricing.mode === 'markup' && (
        <div className={s.formSection}>
          <Input
            label="Markup %"
            type="number"
            value={state.pricing.markup_pct}
            onChange={(e) => dispatch({ type: T.SET_PRICING_FIELD, field: 'markup_pct', value: parseFloat(e.target.value) || 0 })}
            suffix="%"
          />
        </div>
      )}

      {state.pricing.mode === 'forfait' && (
        <div className={s.formSection}>
          <Input
            label="Prix forfaitaire HT"
            type="number"
            value={state.pricing.forfait_override || ''}
            onChange={(e) => dispatch({ type: T.SET_PRICING_FIELD, field: 'forfait_override', value: parseFloat(e.target.value) || null })}
            suffix="$"
          />
        </div>
      )}

      {state.pricing.mode === 'target_margin' && (
        <div className={s.formSection}>
          <Input
            label="Marge cible"
            type="number"
            value={state.pricing.target_margin_pct}
            onChange={(e) => dispatch({ type: T.SET_PRICING_FIELD, field: 'target_margin_pct', value: parseFloat(e.target.value) || 0 })}
            suffix="%"
          />
        </div>
      )}

      <div className={s.formGrid2} style={{ marginTop: 16 }}>
        <Input
          label="Rabais comptant"
          type="number"
          value={state.pricing.cash_discount}
          onChange={(e) => dispatch({ type: T.SET_PRICING_FIELD, field: 'cash_discount', value: parseFloat(e.target.value) || 0 })}
          suffix="$"
        />
        <Input
          label="Prix minimum soumission"
          type="number"
          value={state.pricing.min_quote_price}
          onChange={(e) => dispatch({ type: T.SET_PRICING_FIELD, field: 'min_quote_price', value: parseFloat(e.target.value) || 0 })}
          suffix="$"
        />
      </div>
    </div>
  );
}
