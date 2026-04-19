import ItemRow from './ItemRow';
import s from './items.module.css';

export default function ItemsList({ items, dispatch, supplierMode }) {
  if (!items || items.length === 0) return null;

  const totalQty = items.reduce((sum, i) => sum + (i.qty || 1), 0);

  return (
    <div className={s.list}>
      <div className={s.listHeader}>
        <span className={s.listTitle}>Articles</span>
        <span className={s.listCount}>{items.length} article{items.length > 1 ? 's' : ''} &middot; {totalQty} unit&eacute;{totalQty > 1 ? 's' : ''}</span>
      </div>
      {items.map((item, i) => (
        <ItemRow
          key={item.id}
          item={item}
          index={i}
          dispatch={dispatch}
          supplierMode={supplierMode}
        />
      ))}
    </div>
  );
}
