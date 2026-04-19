import OrderDocument from './OrderDocument';
import s from './preview.module.css';

export default function DocumentPreview({ state }) {
  const totalQty = state.items.reduce((sum, i) => sum + (i.qty || 1), 0);

  if (state.supplier === 'both') {
    return (
      <div className={s.previewWrap}>
        <div className={s.previewHeader}>
          {state.items.length} article{state.items.length !== 1 ? 's' : ''} &middot; {totalQty} unit&eacute;{totalQty !== 1 ? 's' : ''}
        </div>
        <OrderDocument state={state} supplierKey="royalty" />
        <div className={s.docSeparator} />
        <OrderDocument state={state} supplierKey="touchette" />
      </div>
    );
  }

  const supplierKey = state.supplier === 'touchette' ? 'touchette' : 'royalty';
  return (
    <div className={s.previewWrap}>
      <div className={s.previewHeader}>
        {state.items.length} article{state.items.length !== 1 ? 's' : ''} &middot; {totalQty} unit&eacute;{totalQty !== 1 ? 's' : ''}
      </div>
      <OrderDocument state={state} supplierKey={supplierKey} />
    </div>
  );
}
