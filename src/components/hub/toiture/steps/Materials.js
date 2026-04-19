import { T } from '../toitureReducer';
import { MATERIALS, formatCAD } from '@/lib/hub/toiture-data';
import s from '../toiture.module.css';

const SHINGLE_TYPES = [
  {
    key: 'bardeau_standard',
    label: 'IKO Cambridge',
    desc: '32 pi²/paquet · garantie 25 ans',
    price: '41,89 $/paq',
  },
  {
    key: 'bardeau_dynasty',
    label: 'IKO Dynasty',
    desc: '32 pi²/paquet · ArmourZone',
    price: '44,59 $/paq',
  },
];

const MAT_KEYS = ['bardeau_standard', 'cap_bardeau', 'pitch', 'syntec', 'glace_eau', 'maximum', 'event', 'clou'];

export default function Materials({ state, dispatch }) {
  // Determine the active shingle key so we show it in the qty table
  const activeShingle = state.shingle_type || 'bardeau_standard';

  // Build the ordered list of keys for the table, swapping the active shingle in
  const tableKeys = MAT_KEYS.map((k) =>
    (k === 'bardeau_standard' || k === 'bardeau_dynasty') ? activeShingle : k
  ).filter((k, i, arr) => arr.indexOf(k) === i); // dedupe

  // Subtotal: sum of non-excluded lines
  const subtotal = tableKeys.reduce((acc, key) => {
    if (state.excludes[key]) return acc;
    const mat = MATERIALS[key];
    if (!mat) return acc;
    const qty = state.quantities[key] || 0;
    return acc + qty * mat.price;
  }, 0);

  return (
    <div>
      {/* Shingle type selector */}
      <div className={s.formSection}>
        <div className={s.formLabel}>Type de bardeau</div>
        <div className={s.selectorRow}>
          {SHINGLE_TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`${s.selectorCard} ${state.shingle_type === t.key ? s.selectorCardActive : ''}`}
              onClick={() => dispatch({ type: T.SET_SHINGLE, payload: t.key })}
            >
              <span style={{ fontWeight: 600 }}>{t.label}</span>
              <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2, display: 'block' }}>
                {t.desc}
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.82rem',
                  color: '#16a34a',
                  marginTop: 4,
                  display: 'block',
                }}
              >
                {t.price}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quantity table */}
      <div className={s.formSection}>
        <div className={s.formLabel}>Quantit&eacute;s</div>
        <table className={s.qtyTable}>
          <thead>
            <tr>
              <th>Mat&eacute;riau</th>
              <th>Quantit&eacute;</th>
              <th>Prix unit.</th>
              <th>Total</th>
              <th>Exclure</th>
            </tr>
          </thead>
          <tbody>
            {tableKeys.map((key) => {
              const mat = MATERIALS[key];
              if (!mat) return null;
              const qty = state.quantities[key] || 0;
              const excluded = !!state.excludes[key];
              const lineTotal = qty * mat.price;
              const rowStyle = excluded
                ? { opacity: 0.35, textDecoration: 'line-through' }
                : undefined;

              return (
                <tr key={key}>
                  <td style={rowStyle}>{mat.label || key}</td>
                  <td style={rowStyle}>
                    <div className={s.qtyStepper}>
                      <button
                        type="button"
                        className={s.qtyStepBtn}
                        onClick={() => {
                          const val = Math.max(0, qty - 1);
                          dispatch({ type: T.SET_QUANTITY, field: key, value: val });
                          dispatch({ type: T.SET_MANUAL_OVERRIDE, field: key, value: true });
                        }}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        className={s.qtyInput}
                        value={qty}
                        onChange={(e) => {
                          dispatch({ type: T.SET_QUANTITY, field: key, value: parseInt(e.target.value) || 0 });
                          dispatch({ type: T.SET_MANUAL_OVERRIDE, field: key, value: true });
                        }}
                      />
                      <button
                        type="button"
                        className={s.qtyStepBtn}
                        onClick={() => {
                          dispatch({ type: T.SET_QUANTITY, field: key, value: qty + 1 });
                          dispatch({ type: T.SET_MANUAL_OVERRIDE, field: key, value: true });
                        }}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td
                    style={{
                      ...(rowStyle || {}),
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.82rem',
                      color: '#16a34a',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatCAD(mat.price)}
                  </td>
                  <td
                    style={{
                      ...(rowStyle || {}),
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.82rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatCAD(lineTotal)}
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={excluded}
                      onChange={() => dispatch({ type: T.TOGGLE_EXCLUDE, field: key })}
                      style={{ width: 18, height: 18 }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={3}
                style={{ fontWeight: 600, textAlign: 'right', paddingRight: 8 }}
              >
                Sous-total mat&eacute;riaux
              </td>
              <td
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: '#16a34a',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatCAD(subtotal)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
