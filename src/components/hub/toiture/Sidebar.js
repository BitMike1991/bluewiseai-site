import { formatCAD } from '@/lib/hub/toiture-data';
import s from './toiture.module.css';

export default function ToitureSidebar({ result }) {
  if (!result) {
    return (
      <div className={s.sidebar}>
        <div className={s.sidebarTitle}>Sommaire</div>
        <p style={{ opacity: 0.3, fontSize: 12 }}>Remplir les mesures pour voir le calcul</p>
      </div>
    );
  }

  const margin = result.net_margin_pct || 0;
  let profitColor = '#dc2626';
  if (margin >= 25) profitColor = '#16a34a';
  else if (margin >= 15) profitColor = '#eab308';

  const hasRate = result.rate_per_sqft && result.surface_sqft;
  const subLine = hasRate
    ? `${result.surface_sqft} pi² · ${result.rate_per_sqft} $/pi²`
    : 'forfait';

  return (
    <div className={s.sidebar}>
      <div className={s.sidebarTitle}>Sommaire</div>

      {/* Big TTC price */}
      <div style={{ textAlign: 'center', margin: '12px 0 4px' }}>
        <div style={{ fontSize: 28, fontWeight: 700 }}>
          {formatCAD(result.total_client_ttc || 0)}
        </div>
        <div style={{ fontSize: 11, opacity: 0.5 }}>{subLine}</div>
      </div>

      {/* Net profit box */}
      <div
        style={{
          border: `1px solid ${profitColor}`,
          borderRadius: 6,
          padding: '8px 12px',
          margin: '10px 0 14px',
          color: profitColor,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 600 }}>Profit net</span>
        <span style={{ fontWeight: 700 }}>
          {formatCAD(result.net_profit || 0)}&nbsp;·&nbsp;{margin.toFixed(1)}%
        </span>
      </div>

      {/* Rows */}
      <div className={s.sidebarRow}>
        <span>Revenu HT</span>
        <span>{formatCAD(result.revenue_ht || 0)}</span>
      </div>
      <div className={s.sidebarRow}>
        <span>Mat&eacute;riaux</span>
        <span>{formatCAD(result.material_cost_ht || 0)}</span>
      </div>
      <div className={s.sidebarRow}>
        <span>Frais chantier</span>
        <span>{formatCAD(result.fee_cost_ht || 0)}</span>
      </div>
      <div className={s.sidebarRow}>
        <span>Main-d&apos;&oelig;uvre</span>
        <span>{formatCAD(result.labor_cost || 0)}</span>
      </div>

      <div className={s.sidebarDivider} />

      <div className={s.sidebarRow}>
        <span>Co&ucirc;t total</span>
        <span className={s.sidebarBold}>{formatCAD(result.total_cost_ht || 0)}</span>
      </div>
      <div className={`${s.sidebarRow} ${s.sidebarHighlight}`}>
        <span>Profit brut</span>
        <span className={s.sidebarBold}>{formatCAD(result.gross_profit_ht || 0)}</span>
      </div>
      <div className={s.sidebarMargin}>
        {(result.gross_margin_pct || 0).toFixed(1)}% marge brute
      </div>

      {/* Plancher min note */}
      {result.min_quote_applied && (
        <div style={{ fontSize: 11, opacity: 0.5, textAlign: 'center', marginTop: 8 }}>
          * plancher min appliqu&eacute;
        </div>
      )}
    </div>
  );
}
