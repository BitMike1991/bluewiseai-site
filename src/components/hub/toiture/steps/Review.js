import { formatCAD, PITCH_RATES, MATERIALS } from '@/lib/hub/toiture-data';
import s from '../toiture.module.css';

export default function Review({ state, result }) {
  if (!result) {
    return (
      <p style={{ opacity: 0.4 }}>
        Pas assez de donn&eacute;es pour calculer. Remplir mesures + mat&eacute;riaux.
      </p>
    );
  }

  const pitchLabel =
    PITCH_RATES[state.measures?.pitch_category]?.label || state.measures?.pitch_category || '—';
  const shingleLabel =
    MATERIALS[state.shingle_type]?.label || state.shingle_type || '—';

  const addr = [state.client?.address, state.client?.city].filter(Boolean).join(' ') || '—';

  return (
    <div>

      {/* ── 1. Client ── */}
      <div className={s.reviewSection}>
        <div className={s.reviewTitle}>Client</div>
        <div className={s.reviewRow}>
          <span>Nom</span>
          <span>{state.client?.name || '—'}</span>
        </div>
        <div className={s.reviewRow}>
          <span>T&eacute;l</span>
          <span>{state.client?.phone || '—'}</span>
        </div>
        <div className={s.reviewRow}>
          <span>Adresse</span>
          <span>{addr}</span>
        </div>
      </div>

      {/* ── 2. Mesures ── */}
      <div className={s.reviewSection}>
        <div className={s.reviewTitle}>Mesures</div>
        <div className={s.reviewRow}>
          <span>Surface</span>
          <span>{state.measures?.surface} pi&sup2;</span>
        </div>
        <div className={s.reviewRow}>
          <span>Pente</span>
          <span>{pitchLabel}</span>
        </div>
        <div className={s.reviewRow}>
          <span>Bardeau</span>
          <span>{shingleLabel}</span>
        </div>
      </div>

      {/* ── 3. Ventilation financi&egrave;re ── */}

      {/* Section 3a — Ce que P&Uuml;R paie (intrants) */}
      <div className={s.reviewSection}>
        <div className={s.reviewTitle}>Ce que P&Uuml;R paie (intrants)</div>
        <div className={s.reviewRow}>
          <span>Mat&eacute;riaux HT</span>
          <span>{formatCAD(result.material_cost_ht)}</span>
        </div>
        <div className={s.reviewRow}>
          <span>Frais chantier HT</span>
          <span>{formatCAD(result.fee_cost_ht)}</span>
        </div>
        <div className={s.reviewRow}>
          <span>Main-d&rsquo;&oelig;uvre</span>
          <span>{formatCAD(result.labor_cost)}</span>
        </div>
        <div className={s.reviewDivider} />
        <div className={s.reviewRow}>
          <span>Co&ucirc;t total</span>
          <span className={s.reviewRowBold}>{formatCAD(result.total_cost_ht)}</span>
        </div>
      </div>

      {/* Section 3b — Ce que le client paie */}
      <div className={s.reviewSection}>
        <div className={s.reviewTitle}>Ce que le client paie</div>
        <div className={s.reviewRow}>
          <span>Sous-total HT</span>
          <span>{formatCAD(result.revenue_ht)}</span>
        </div>
        <div className={s.reviewRow}>
          <span>+ TPS (5&nbsp;%)</span>
          <span>{formatCAD(result.tax_gst_sale)}</span>
        </div>
        <div className={s.reviewRow}>
          <span>+ TVQ (9,975&nbsp;%)</span>
          <span>{formatCAD(result.tax_qst_sale)}</span>
        </div>
        <div className={s.reviewDivider} />
        <div className={s.reviewRow}>
          <span>Total TTC client</span>
          <span className={s.reviewRowBold}>{formatCAD(result.total_client_ttc)}</span>
        </div>
      </div>

      {/* Section 3c — Cr&eacute;dits sur intrants */}
      <div className={s.reviewSection}>
        <div className={s.reviewTitle}>Cr&eacute;dits sur intrants</div>
        <div className={s.reviewRow}>
          <span>Base taxable</span>
          <span>{formatCAD(result.taxable_inputs)}</span>
        </div>
        <div className={s.reviewRow}>
          <span>CTI TPS r&eacute;cup&eacute;r&eacute;e</span>
          <span style={{ color: 'var(--green, #22c55e)' }}>{formatCAD(result.input_tax_credit_gst)}</span>
        </div>
        <div className={s.reviewRow}>
          <span>RTI TVQ r&eacute;cup&eacute;r&eacute;e</span>
          <span style={{ color: 'var(--green, #22c55e)' }}>{formatCAD(result.input_tax_credit_qst)}</span>
        </div>
        <div className={s.reviewDivider} />
        <div className={s.reviewRow}>
          <span>Total r&eacute;cup&eacute;r&eacute;</span>
          <span className={s.reviewRowBold} style={{ color: 'var(--green, #22c55e)' }}>
            {formatCAD(result.input_tax_credit)}
          </span>
        </div>
      </div>

      {/* Section 3d — Taxes nettes &agrave; remettre */}
      <div className={s.reviewSection}>
        <div className={s.reviewTitle}>Taxes nettes &agrave; remettre</div>
        <div className={s.reviewRow}>
          <span>TPS nette &rarr; Revenu Canada</span>
          <span>{formatCAD(result.tax_net_gst_payable)}</span>
        </div>
        <div className={s.reviewRow}>
          <span>TVQ nette &rarr; Revenu Qu&eacute;bec</span>
          <span>{formatCAD(result.tax_net_qst_payable)}</span>
        </div>
        <div className={s.reviewDivider} />
        <div className={s.reviewRow}>
          <span>Total taxes nettes</span>
          <span className={s.reviewRowBold}>{formatCAD(result.tax_net_payable)}</span>
        </div>
      </div>

      {/* ── 4. Profit ── */}
      <div className={s.reviewSection}>
        <div className={s.reviewTitle}>Profit P&Uuml;R</div>
        <div className={s.reviewRow}>
          <span>Revenu HT &minus; Co&ucirc;t total</span>
          <span>
            {formatCAD(result.gross_profit_ht)}
            &nbsp;({result.gross_margin_pct?.toFixed(1)}&nbsp;%)
          </span>
        </div>
        <div className={s.reviewRow}>
          <span>&minus; Taxes nettes</span>
          <span>{formatCAD(result.tax_net_payable)}</span>
        </div>
        <div className={s.reviewDivider} />
        <div className={s.reviewRow}>
          <span>PROFIT NET P&Uuml;R</span>
          <span className={s.reviewRowBold}>
            {formatCAD(result.net_profit)}
            &nbsp;({result.net_margin_pct?.toFixed(1)}&nbsp;%)
          </span>
        </div>
      </div>

      {/* ── 5. Rabais comptant (conditionnel) ── */}
      {result.cash_discount > 0 && (
        <div className={s.reviewSection}>
          <div className={s.reviewTitle}>Option comptant</div>
          <div className={s.reviewRow}>
            <span>Rabais comptant</span>
            <span>-{formatCAD(result.cash_discount)}</span>
          </div>
          <div className={s.reviewDivider} />
          <div className={s.reviewRow}>
            <span>Prix final comptant</span>
            <span className={s.reviewRowBold}>
              {formatCAD(result.total_client_ttc - result.cash_discount)}
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
