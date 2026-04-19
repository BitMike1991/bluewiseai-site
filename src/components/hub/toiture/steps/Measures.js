import { T } from '../toitureReducer';
import { Input } from '@/components/hub/ui';
import s from '../toiture.module.css';

const PITCHES = [
  { key: 'easy', label: 'Pente facile', desc: '4/12 à 6/12 · Marche debout', price: '3,75 $/pi²' },
  { key: 'medium', label: 'Pente moyenne', desc: '7/12 à 10/12 simple · Harnais requis', price: '4,25 $/pi²' },
  { key: 'complex', label: 'Pente raide/complexe', desc: '10/12+ · Lucarnes, noues', price: '4,75 $/pi²' },
];

const COMPLEXITIES = [
  { n: 1, label: 'Simple', desc: "Toit régulier, peu d'obstacles" },
  { n: 2, label: 'Complexe', desc: 'Lucarnes, noues, obstacles, détails' },
];

export default function Measures({ state, dispatch }) {
  const setNum = (field) => (e) =>
    dispatch({ type: T.SET_MEASURES_FIELD, field, value: parseFloat(e.target.value) || 0 });

  return (
    <div>
      <div className={s.formGrid3}>
        <div>
          <Input label="Surface" type="number" value={state.measures.surface || ''} onChange={setNum('surface')} placeholder="0" suffix="pi²" />
          <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>Astuce : longueur × largeur × facteur pente (4/12=1,05 · 6/12=1,12 · 8/12=1,20)</p>
        </div>
        <div>
          <Input label="Périmètre avant-toit" type="number" value={state.measures.eaves_length || ''} onChange={setNum('eaves_length')} placeholder="0" suffix="pi" />
          <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>Longueur totale du bas de toit. Sert au calcul membrane glace &amp; eau.</p>
        </div>
        <div>
          <Input label="Faîtière" type="number" value={state.measures.ridge || ''} onChange={setNum('ridge')} placeholder="0" suffix="pi" />
          <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>Lignes de partage sur le dessus. Sert au calcul cap bardeau.</p>
        </div>
      </div>

      <div className={s.formSection} style={{ marginTop: 20 }}>
        <div className={s.formLabel}>Pente</div>
        <div className={s.selectorRow}>
          {PITCHES.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`${s.selectorCard} ${state.measures.pitch_category === p.key ? s.selectorCardActive : ''}`}
              onClick={() => dispatch({ type: T.SET_PITCH, payload: p.key })}
            >
              <strong>{p.label}</strong>
              <span style={{ display: 'block', fontSize: 12, color: '#6b7280', marginTop: 2 }}>{p.desc}</span>
              <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", color: '#16a34a', fontSize: 13, marginTop: 4 }}>{p.price}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={s.formSection}>
        <div className={s.formLabel}>Complexité</div>
        <div className={s.selectorRow}>
          {COMPLEXITIES.map((c) => (
            <button
              key={c.n}
              type="button"
              className={`${s.selectorCard} ${state.measures.complexity === c.n ? s.selectorCardActive : ''}`}
              onClick={() => dispatch({ type: T.SET_COMPLEXITY, payload: c.n })}
            >
              <strong>{c.label}</strong>
              <span style={{ display: 'block', fontSize: 12, color: '#6b7280', marginTop: 2 }}>{c.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
