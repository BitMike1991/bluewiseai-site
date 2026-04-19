import { A } from '../commandeReducer';
import { buildItemSpecs, getCategoryLabel } from '@/lib/hub/item-specs';
import { formatDim } from '@/lib/hub/fraction';
import { Badge } from '@/components/hub/ui';
import WindowConfigSVG from '../svg/WindowConfigSVG';
import EntryDoorSVG from '../svg/EntryDoorSVG';
import PatioDoorSVG from '../svg/PatioDoorSVG';
import s from './items.module.css';

export default function ItemRow({ item, index, dispatch, supplierMode }) {
  const specs = buildItemSpecs(item);

  let sketch;
  if (item.category === 'window' && item.config) {
    sketch = <WindowConfigSVG type={item.window_type} config={item.config} width={58} height={58} />;
  } else if (item.category === 'entry_door') {
    sketch = <EntryDoorSVG styleKey={item.entry_door_style} width={48} height={58} />;
  } else if (item.category === 'patio_door' && item.config) {
    sketch = <PatioDoorSVG config={item.config} width={58} height={45} />;
  }

  return (
    <div className={s.row}>
      <div className={s.rowIndex}>{index + 1}</div>
      <div className={s.rowSketch}>{sketch}</div>
      <div className={s.rowInfo}>
        <div className={s.rowHeader}>
          <Badge color={item.supplier === 'touchette' ? 'touchette' : 'royalty'}>
            {item.supplier === 'touchette' ? 'T' : 'R'}
          </Badge>
          <Badge>{getCategoryLabel(item.category)}</Badge>
          <span className={s.rowCode}>{item.config_code || item.entry_door_style}</span>
          <span className={s.rowDims}>{formatDim(item.width)}&quot; &times; {formatDim(item.height)}&quot;</span>
          {item.qty > 1 && <Badge color="green">&times;{item.qty}</Badge>}
        </div>
        <div className={s.rowSpecs}>
          {specs.slice(0, 4).map((spec, i) => (
            <span key={i} className={s.specLine}>{spec}</span>
          ))}
          {specs.length > 4 && (
            <span className={s.specLine} style={{ opacity: 0.4 }}>+{specs.length - 4} autres</span>
          )}
        </div>
        {item.note && <div className={s.rowNote}>{item.note}</div>}
      </div>
      <div className={s.rowActions}>
        <button type="button" className={s.actionBtn} onClick={() => dispatch({ type: A.EDIT_ITEM, payload: item.id })} title="Modifier" aria-label="Modifier">&#x270E;</button>
        <button type="button" className={s.actionBtn} onClick={() => dispatch({ type: A.MOVE_ITEM, payload: { id: item.id, delta: -1 } })} title="Monter" aria-label="Monter">&uarr;</button>
        <button type="button" className={s.actionBtn} onClick={() => dispatch({ type: A.MOVE_ITEM, payload: { id: item.id, delta: 1 } })} title="Descendre" aria-label="Descendre">&darr;</button>
        <button type="button" className={s.actionBtn} onClick={() => dispatch({ type: A.DUPLICATE_ITEM, payload: item.id })} title="Dupliquer" aria-label="Dupliquer">&#x2398;</button>
        {supplierMode === 'both' && (
          <button
            type="button"
            className={s.actionBtn}
            onClick={() => dispatch({
              type: A.SWAP_ITEM_SUPPLIER,
              payload: { id: item.id, newSupplier: item.supplier === 'royalty' ? 'touchette' : 'royalty' },
            })}
            title="Changer fournisseur"
            aria-label="Changer fournisseur"
          >&#x21C4;</button>
        )}
        <button type="button" className={`${s.actionBtn} ${s.actionBtnDanger}`} onClick={() => dispatch({ type: A.DELETE_ITEM, payload: item.id })} title="Supprimer" aria-label="Supprimer">&times;</button>
      </div>
    </div>
  );
}
