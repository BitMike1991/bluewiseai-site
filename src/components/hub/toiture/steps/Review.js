import { useState } from 'react';
import { formatCAD, PITCH_RATES, MATERIALS } from '@/lib/hub/toiture-data';
import s from '../toiture.module.css';
import { Button } from '@/components/hub/ui';

export default function Review({ state, result }) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [savedJob, setSavedJob] = useState(null);

  if (!result) {
    return (
      <p style={{ opacity: 0.4 }}>
        Pas assez de donn&eacute;es pour calculer. Remplir mesures + mat&eacute;riaux.
      </p>
    );
  }

  async function handleSaveAsJob() {
    if (saving) return;
    if (!state.client?.name || !state.client?.phone) {
      setSaveError('Nom et t\u00e9l\u00e9phone du client requis.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/toiture/save-as-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: state.client,
          measures: state.measures,
          shingle_type: state.shingle_type,
          result,
          payload: state,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur lors de la sauvegarde');
      setSavedJob(json);
    } catch (err) {
      setSaveError(err.message || 'Erreur r\u00e9seau');
    } finally {
      setSaving(false);
    }
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

      {/* ── CTA: enregistrer comme projet CRM ── */}
      <div className={s.reviewSection} style={{ background: 'var(--bw-sage-light, #eef3ee)', padding: '16px', borderRadius: '12px' }}>
        <div className={s.reviewTitle} style={{ marginBottom: 10 }}>Finaliser le devis</div>
        {!savedJob ? (
          <>
            <p style={{ fontSize: 13, color: '#555', marginBottom: 12, lineHeight: 1.4 }}>
              Cr&eacute;e le projet CRM (lead + job + devis client) pour pouvoir ensuite l'envoyer au client, g&eacute;n&eacute;rer le contrat, et suivre la signature + le paiement.
            </p>
            <Button onClick={handleSaveAsJob} disabled={saving}>
              {saving ? 'Enregistrement\u2026' : 'Enregistrer comme projet'}
            </Button>
            {saveError && (
              <p style={{ color: '#c00', fontSize: 12, marginTop: 10 }}>{saveError}</p>
            )}
          </>
        ) : (
          <>
            <p style={{ fontSize: 13, color: '#1a5f1a', fontWeight: 600, marginBottom: 8 }}>
              &#x2714; Projet cr&eacute;&eacute; : {savedJob.project_ref || savedJob.job_id_human}
            </p>
            <p style={{ fontSize: 12, color: '#444', marginBottom: 12 }}>
              Lead {savedJob.lead_matched ? 'associ&eacute;' : 'nouveau'} &middot; Devis {savedJob.quote_number}
            </p>
            <a
              href={savedJob.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-block', padding: '8px 16px', background: 'var(--bw-navy, #2A2C35)',
                color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600,
              }}
            >
              Ouvrir le projet dans le CRM &rarr;
            </a>
          </>
        )}
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
