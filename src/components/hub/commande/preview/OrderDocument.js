import { buildItemSpecs, getCategoryLabel } from '@/lib/hub/item-specs';
import { formatDim } from '@/lib/hub/fraction';
import WindowConfigSVG from '../svg/WindowConfigSVG';
import EntryDoorSVG from '../svg/EntryDoorSVG';
import PatioDoorSVG from '../svg/PatioDoorSVG';
import s from './preview.module.css';

const SUPPLIER_BADGE = { royalty: 'R', touchette: 'T' };

const URGENCY_LABELS = { standard: 'Standard', rapide: 'Rapide', urgent: 'URGENT' };

function ItemSVG({ item }) {
  if (item.category === 'window' && item.config) {
    return <WindowConfigSVG type={item.window_type} config={item.config} width={56} height={44} />;
  }
  if (item.category === 'entry_door' && item.entry_door_style) {
    return <EntryDoorSVG styleKey={item.entry_door_style} width={44} height={56} />;
  }
  if (item.category === 'patio_door' && item.config) {
    return <PatioDoorSVG config={item.config} width={64} height={44} />;
  }
  return null;
}

export default function OrderDocument({ state, supplierKey }) {
  const p = state.project;
  const items = state.items.filter((i) => (i.supplier || 'royalty') === supplierKey);
  const badge = SUPPLIER_BADGE[supplierKey] || 'R';
  const orderNum = state.orderNumber || '---';

  const today = new Date();
  const dateStr = today.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  const wantedDate = p.date
    ? new Date(p.date + 'T00:00:00').toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  // Group by category
  const byCategory = {
    window: items.filter((i) => i.category === 'window'),
    entry_door: items.filter((i) => i.category === 'entry_door'),
    patio_door: items.filter((i) => i.category === 'patio_door'),
  };

  let globalIdx = 0;

  return (
    <div className={`${s.doc} ${supplierKey === 'touchette' ? s.docTouchette : ''}`}>
      {/* Header */}
      <div className={s.docHeader}>
        <div className={s.brand}>P&Uuml;R CONSTRUCTION</div>
        <div className={s.docTitle}>
          <div className={s.docLabel}>Document</div>
          <h3>BON DE COMMANDE</h3>
          <div className={s.docNum}>{orderNum}</div>
        </div>
      </div>

      {/* Meta */}
      <div className={s.docMeta}>
        <div className={s.metaCell}>
          <div className={s.metaLabel}>&Eacute;mis le</div>
          <div>{dateStr}</div>
        </div>
        <div className={s.metaCell}>
          <div className={s.metaLabel}>Livraison souhait&eacute;e</div>
          <div>{wantedDate}</div>
        </div>
        <div className={s.metaCell}>
          <div className={s.metaLabel}>Priorit&eacute;</div>
          <div>{URGENCY_LABELS[p.urgency] || 'Standard'}</div>
        </div>
      </div>

      {/* Parties */}
      <div className={s.docSection}>
        <div className={s.sectionLabel}>Projet et livraison</div>
        <div className={s.partyGrid}>
          <div className={s.party}>
            <div className={s.partyLabel}>Commanditaire</div>
            <div className={s.partyName}>P&Uuml;R Construction &amp; R&eacute;novation Inc.</div>
            <p>366 Rue du Lac-L&eacute;gar&eacute;</p>
            <p>Saint-Colomban, QC J5K 2K4</p>
            <p>Contact : {p.contact || '—'}</p>
            <p>RBQ 5827-6668-01</p>
          </div>
          <div className={s.party}>
            <div className={s.partyLabel}>Projet &middot; Livraison</div>
            <div className={s.partyName}>{p.ref || '—'}</div>
            <p>Client final : {p.client || '—'}</p>
            <p>{p.address || '—'}</p>
          </div>
        </div>
      </div>

      {/* Items — no supplier section, just R/T badge per item */}
      <div className={s.docSection}>
        <div className={s.sectionLabel}>
          Articles &agrave; fabriquer &middot; {items.length}
        </div>
        {items.length === 0 ? (
          <p style={{ opacity: 0.4, fontSize: 12 }}>Aucun article</p>
        ) : (
          ['window', 'entry_door', 'patio_door'].map((cat) => {
            if (byCategory[cat].length === 0) return null;
            return (
              <div key={cat}>
                <div className={s.catTitle}>
                  {getCategoryLabel(cat)} &middot; {byCategory[cat].length}
                </div>
                {byCategory[cat].map((item) => {
                  globalIdx++;
                  const specs = buildItemSpecs(item);
                  return (
                    <div key={item.id} className={s.docItem}>
                      <div className={s.docItemIdx}>{globalIdx}</div>
                      <div className={s.docItemSvg}>
                        <ItemSVG item={item} />
                      </div>
                      <div className={s.docItemBody}>
                        <div className={s.docItemHeader}>
                          <span className={s.docItemBadge}>{badge}</span>
                          <span className={s.docItemCode}>{item.config_code || item.entry_door_style}</span>
                          <span>{formatDim(item.width)}&quot; &times; {formatDim(item.height)}&quot;</span>
                          {item.qty > 1 && <span className={s.docItemQty}>&times;{item.qty}</span>}
                        </div>
                        <div className={s.docItemSpecs}>
                          {specs.map((spec, i) => (
                            <div key={i}>{spec}</div>
                          ))}
                        </div>
                        {item.note && <div className={s.docItemNote}>Note : {item.note}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {/* Notes */}
      {p.notes && (
        <div className={s.docSection}>
          <div className={s.sectionLabel}>Notes</div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{p.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className={s.docFooter}>
        <p>P&Uuml;R Construction &amp; R&eacute;novation Inc. — RBQ 5827-6668-01</p>
        <p>366 Rue du Lac-L&eacute;gar&eacute;, Saint-Colomban QC J5K 2K4</p>
      </div>
    </div>
  );
}
