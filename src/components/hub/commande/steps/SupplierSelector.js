import { A } from '../commandeReducer';
import s from '../commande.module.css';

export default function SupplierSelector({ state, dispatch }) {
  const suppliers = [
    { key: 'royalty', label: 'R' },
    { key: 'touchette', label: 'T' },
    { key: 'both', label: 'R + T' },
  ];

  return (
    <div className={s.supplierSection}>
      <div className={s.supplierToggle}>
        {suppliers.map((sup) => (
          <button
            key={sup.key}
            type="button"
            className={`${s.supplierBtn} ${state.supplier === sup.key ? s.supplierBtnActive : ''}`}
            onClick={() => dispatch({ type: A.SET_SUPPLIER, payload: sup.key })}
          >
            {sup.label}
          </button>
        ))}
      </div>

      {state.supplier === 'both' && (
        <div className={s.itemSupplierBox}>
          <span className={s.itemSupplierLabel}>Cet article pour :</span>
          <div className={s.itemSupplierToggle}>
            <button
              type="button"
              className={`${s.supplierBtn} ${s.supplierBtnSm} ${state.item_supplier === 'royalty' ? s.supplierBtnActive : ''}`}
              onClick={() => dispatch({ type: A.SET_ITEM_SUPPLIER, payload: 'royalty' })}
            >
              R
            </button>
            <button
              type="button"
              className={`${s.supplierBtn} ${s.supplierBtnSm} ${state.item_supplier === 'touchette' ? s.supplierBtnActive : ''}`}
              onClick={() => dispatch({ type: A.SET_ITEM_SUPPLIER, payload: 'touchette' })}
            >
              T
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
