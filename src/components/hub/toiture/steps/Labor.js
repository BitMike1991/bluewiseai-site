import { T } from '../toitureReducer';
import { Input, Button } from '@/components/hub/ui';
import s from '../toiture.module.css';

export default function Labor({ state, dispatch }) {
  return (
    <div>
      <div className={s.formGrid2}>
        <Input
          label="Jours"
          type="number"
          value={state.labor.days}
          onChange={(e) => dispatch({ type: T.SET_LABOR_FIELD, field: 'days', value: parseFloat(e.target.value) || 0 })}
        />
        <Input
          label="Heures/jour"
          type="number"
          value={state.labor.hours_per_day}
          onChange={(e) => dispatch({ type: T.SET_LABOR_FIELD, field: 'hours_per_day', value: parseFloat(e.target.value) || 0 })}
        />
      </div>

      <div className={s.formSection} style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div className={s.formLabel} style={{ margin: 0 }}>Travailleurs ({state.labor.workers})</div>
          <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={state.labor.auto_labor}
              onChange={() => dispatch({ type: T.TOGGLE_AUTO_LABOR })}
              style={{ width: 16, height: 16 }}
            />
            Auto
          </label>
        </div>

        {state.labor.worker_rates.map((rate, i) => (
          <div key={i} className={s.workerRow}>
            <span className={s.workerLabel}>Travailleur {i + 1}</span>
            <Input
              type="number"
              value={rate}
              onChange={(e) => dispatch({ type: T.SET_WORKER_RATE, index: i, value: parseFloat(e.target.value) || 0 })}
              suffix="$/h"
              style={{ maxWidth: 120 }}
            />
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Button variant="secondary" size="sm" onClick={() => dispatch({ type: T.ADD_WORKER })}>+ Travailleur</Button>
          {state.labor.worker_rates.length > 1 && (
            <Button variant="secondary" size="sm" onClick={() => dispatch({ type: T.REMOVE_WORKER })}>- Retirer</Button>
          )}
        </div>
      </div>

      <div className={s.formSection} style={{ marginTop: 20 }}>
        <div className={s.formLabel}>Frais</div>
        <div className={s.selectorRow}>
          {['conteneur', 'essence', 'transport'].map((fee) => (
            <button
              key={fee}
              type="button"
              className={`${s.selectorCard} ${state.fees[fee] ? s.selectorCardActive : ''}`}
              onClick={() => dispatch({ type: T.TOGGLE_FEE, field: fee })}
            >
              {fee === 'conteneur' ? 'Conteneur' : fee === 'essence' ? 'Essence' : 'Transport'}
            </button>
          ))}
        </div>
        {state.fees.essence && (
          <div style={{ marginTop: 8 }}>
            <Input
              label="Essence ($)"
              type="number"
              value={state.fee_values.essence}
              onChange={(e) => dispatch({ type: T.SET_FEE_VALUE, field: 'essence', value: parseFloat(e.target.value) || 0 })}
            />
          </div>
        )}
        {state.fees.transport && (
          <div style={{ marginTop: 8 }}>
            <Input
              label="Transport ($)"
              type="number"
              value={state.fee_values.transport}
              onChange={(e) => dispatch({ type: T.SET_FEE_VALUE, field: 'transport', value: parseFloat(e.target.value) || 0 })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
