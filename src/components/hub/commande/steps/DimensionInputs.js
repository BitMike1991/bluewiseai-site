import { useMemo } from 'react';
import { A } from '../commandeReducer';
import { Input } from '@/components/hub/ui';
import { parseFraction } from '@/lib/hub/fraction';
import s from '../commande.module.css';

export default function DimensionInputs({ state, dispatch }) {
  const set = (field) => (e) =>
    dispatch({ type: A.SET_FORM_FIELD, field, value: e.target.value });

  const setQty = (delta) => {
    const newQty = Math.max(1, (state.form.qty || 1) + delta);
    dispatch({ type: A.SET_FORM_FIELD, field: 'qty', value: newQty });
  };

  // Dimension validation
  const validation = useMemo(() => {
    if (!state.config) return { w: null, h: null };
    const w = parseFraction(state.form.width);
    const h = parseFraction(state.form.height);
    const min = state.config.min;
    const max = state.config.max;

    if (state.category === 'entry_door') {
      return {
        w: { ok: true, msg: `Cadre: ${state.config.slab?.frame_1_1_4}" ou ${state.config.slab?.frame_1_1_2}"` },
        h: { ok: true, msg: 'Hauteur 82 1/2" ou 82 3/4"' },
      };
    }

    if (!min || !max) return { w: null, h: null };

    // Tolerance for catalog max comparisons. Mikael 2026-04-21: PUR's
    // patio doors really do extend 1/16" past the listed max in the
    // catalog (manufacturer spec rounds in their favor) — flagging
    // "trop grand" stops Jeremy from entering real doors. 1/16 = 0.0625
    // is also pure rounding noise on any other category, so we apply it
    // uniformly. If a future config needs a stricter limit, set
    // `state.config.tolerance = 0` on it.
    const TOL = state.config.tolerance ?? (1 / 16);

    let wResult = null;
    if (!isNaN(w)) {
      if (w < min.w - TOL) wResult = { ok: false, msg: `Trop petit — min ${min.w}"` };
      else if (w > max.w + TOL) wResult = { ok: false, msg: `Trop grand — max ${max.w}"` };
      else wResult = { ok: true, msg: `OK (${min.w}"–${max.w}")` };
    }

    let hResult = null;
    if (!isNaN(h)) {
      if (h < min.h - TOL) hResult = { ok: false, msg: `Trop petit — min ${min.h}"` };
      else if (h > max.h + TOL) hResult = { ok: false, msg: `Trop grand — max ${max.h}"` };
      else hResult = { ok: true, msg: `OK (${min.h}"–${max.h}")` };
    }

    return { w: wResult, h: hResult };
  }, [state.config, state.form.width, state.form.height, state.category]);

  return (
    <div className={s.dimensionSection}>
      <div className={s.gridRow3}>
        <div>
          <Input
            label="Largeur"
            value={state.form.width}
            onChange={set('width')}
            placeholder='ex: 48 1/2'
            suffix='"'
          />
          {validation.w && (
            <div className={validation.w.ok ? s.dimOk : s.dimError}>{validation.w.msg}</div>
          )}
        </div>
        <div>
          <Input
            label="Hauteur"
            value={state.form.height}
            onChange={set('height')}
            placeholder='ex: 60'
            suffix='"'
          />
          {validation.h && (
            <div className={validation.h.ok ? s.dimOk : s.dimError}>{validation.h.msg}</div>
          )}
        </div>
        <div className={s.qtyField}>
          <span className={s.fieldLabelInline}>Qté</span>
          <div className={s.qtyStepper}>
            <button type="button" className={s.qtyBtn} onClick={() => setQty(-1)}>−</button>
            <span className={s.qtyValue}>{state.form.qty || 1}</span>
            <button type="button" className={s.qtyBtn} onClick={() => setQty(1)}>+</button>
          </div>
        </div>
      </div>
      <Input
        label="Note (optionnel)"
        value={state.form.note}
        onChange={set('note')}
        placeholder="Note pour cet article..."
      />
    </div>
  );
}
