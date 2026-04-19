// pages/platform/taxes/index.js
// TPS/TVQ quarterly report. Jérémy picks a date range (quarter preset or
// custom), sees collected − paid, and exports CSV for his accountant.

import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../../src/components/dashboard/DashboardLayout';
import { Download, Loader2, Receipt } from 'lucide-react';

function fmt(n) {
  const num = Number(n) || 0;
  return num.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' $';
}

function isoDate(d) { return d.toISOString().slice(0, 10); }

function quarterPresets() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const q = Math.floor(m / 3);
  const qStart = new Date(y, q * 3, 1);
  const qEnd   = new Date(y, q * 3 + 3, 0);
  const prevQStart = new Date(y, (q - 1) * 3, 1);
  const prevQEnd   = new Date(y, (q - 1) * 3 + 3, 0);
  const ytdStart = new Date(y, 0, 1);
  return [
    { key: 'current',  label: 'Trimestre en cours', from: isoDate(qStart),     to: isoDate(qEnd) },
    { key: 'previous', label: 'Trimestre précédent',from: isoDate(prevQStart), to: isoDate(prevQEnd) },
    { key: 'ytd',      label: 'Année en cours',      from: isoDate(ytdStart),   to: isoDate(now) },
    { key: 'last30',   label: '30 derniers jours',   from: isoDate(new Date(Date.now() - 30 * 86400000)), to: isoDate(now) },
  ];
}

const CATEGORY_LABELS = {
  materiel_fournisseur: 'Matériel',
  main_oeuvre:          'Main-d\'œuvre',
  sous_traitance:       'Sous-traitance',
  gaz_carburant:        'Gaz / carburant',
  essence:              'Essence',
  overhead:             'Frais généraux',
  outillage:            'Outillage',
  bureau:               'Bureau',
  ai_tools:             'Outils IA',
  logiciel:             'Logiciel',
  telecom:              'Télécom',
  repas:                'Repas',
  assurance:            'Assurance',
  formation:            'Formation',
  autre:                'Autre',
};

export default function TaxesPage() {
  const presets = quarterPresets();
  const [from, setFrom] = useState(presets[0].from);
  const [to,   setTo]   = useState(presets[0].to);
  const [activePreset, setActivePreset] = useState('current');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/taxes/report?from=${from}&to=${to}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur chargement');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  function applyPreset(p) {
    setActivePreset(p.key);
    setFrom(p.from);
    setTo(p.to);
  }

  function exportCsv() {
    window.location.href = `/api/taxes/report?from=${from}&to=${to}&format=csv`;
  }

  return (
    <DashboardLayout title="Rapport TPS/TVQ">
      <div className="max-w-5xl mx-auto px-3 md:px-6 py-4 space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-semibold text-d-text">Rapport TPS / TVQ</h1>
            <p className="text-xs text-d-muted">TPS et TVQ perçues sur revenus moins TPS et TVQ payées sur dépenses = montant à remettre aux autorités.</p>
          </div>
          <button
            onClick={exportCsv}
            disabled={!data || loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-d-primary text-white hover:opacity-90 disabled:opacity-50 transition"
          >
            <Download size={14} /> Exporter CSV
          </button>
        </div>

        <div className="rounded-xl border border-d-border bg-d-surface/30 p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPreset(p)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition ${
                  activePreset === p.key
                    ? 'bg-d-primary text-white border-d-primary'
                    : 'bg-d-surface text-d-muted border-d-border hover:text-d-text'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-[10px] text-d-muted mb-1">Du</label>
              <input
                type="date" value={from}
                onChange={(e) => { setActivePreset('custom'); setFrom(e.target.value); }}
                className="px-3 py-1.5 rounded-lg border border-d-border bg-d-surface text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-d-muted mb-1">Au</label>
              <input
                type="date" value={to}
                onChange={(e) => { setActivePreset('custom'); setTo(e.target.value); }}
                className="px-3 py-1.5 rounded-lg border border-d-border bg-d-surface text-xs"
              />
            </div>
          </div>
        </div>

        {loading && (
          <div className="py-12 text-center text-xs text-d-muted animate-pulse">
            <Loader2 size={18} className="animate-spin mx-auto mb-2" />
            Chargement…
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {data && !loading && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="Revenu total (TTC)" value={fmt(data.revenue.total_ttc)} sub={`${data.revenue.payment_count} paiement${data.revenue.payment_count !== 1 ? 's' : ''}`} />
              <StatCard label="Dépenses totales (TTC)" value={fmt(data.expenses.total_ttc)} sub={`${data.expenses.expense_count} dépense${data.expenses.expense_count !== 1 ? 's' : ''}`} tone="rose" />
              <StatCard label="TPS à remettre" value={fmt(data.net.tps_remittance)} sub={`Perçue ${fmt(data.revenue.tps_collected)} − Payée ${fmt(data.expenses.tps_paid)}`} tone="emerald" />
              <StatCard label="TVQ à remettre" value={fmt(data.net.tvq_remittance)} sub={`Perçue ${fmt(data.revenue.tvq_collected)} − Payée ${fmt(data.expenses.tvq_paid)}`} tone="emerald" />
            </div>

            <div className="rounded-xl border border-d-primary/30 bg-d-primary/5 p-4">
              <p className="text-[10px] uppercase tracking-wider text-d-muted mb-1">Montant total à remettre ({data.period.label})</p>
              <p className="text-3xl font-semibold text-d-primary font-mono">{fmt(data.net.total_remittance)}</p>
              <p className="text-[11px] text-d-muted mt-2">
                ⚠️ Ce rapport est une estimation basée sur les données loggées. Ton comptable doit valider avant la remise finale à Revenu Québec / ARC. Il reste responsable de la conformité.
              </p>
            </div>

            {data.by_category.length > 0 && (
              <div className="rounded-xl border border-d-border overflow-hidden">
                <div className="px-4 py-2 bg-d-surface/50 border-b border-d-border">
                  <p className="text-[11px] font-semibold text-d-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt size={12} /> Dépenses par catégorie (TPS/TVQ payée = CTI/RTI récupérable)
                  </p>
                </div>
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2 bg-d-surface/30 border-b border-d-border/40 text-[10px] uppercase tracking-wider font-semibold text-d-muted">
                  <span>Catégorie</span>
                  <span className="text-right">Dépenses</span>
                  <span className="text-right">TPS payée</span>
                  <span className="text-right">TVQ payée</span>
                  <span className="text-right"># rows</span>
                </div>
                {data.by_category.map((c) => (
                  <div key={c.category} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2 border-b border-d-border/40 last:border-0 text-xs">
                    <span className="text-d-text">{CATEGORY_LABELS[c.category] || c.category}</span>
                    <span className="text-right font-mono text-d-text">{fmt(c.total)}</span>
                    <span className="text-right font-mono text-emerald-400/80">{fmt(c.tps)}</span>
                    <span className="text-right font-mono text-emerald-400/80">{fmt(c.tvq)}</span>
                    <span className="text-right text-d-muted">{c.count}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, sub, tone = 'primary' }) {
  const toneStyles = {
    primary:  'border-d-border bg-d-surface/40',
    emerald:  'border-emerald-500/25 bg-emerald-500/5',
    rose:     'border-rose-500/25 bg-rose-500/5',
  }[tone] || 'border-d-border bg-d-surface/40';
  const valueStyles = {
    primary:  'text-d-text',
    emerald:  'text-emerald-400',
    rose:     'text-rose-400',
  }[tone] || 'text-d-text';
  return (
    <div className={`rounded-xl border p-3 ${toneStyles}`}>
      <p className="text-[9px] uppercase tracking-wider text-d-muted mb-1">{label}</p>
      <p className={`text-base font-semibold font-mono ${valueStyles}`}>{value}</p>
      {sub && <p className="text-[10px] text-d-muted/80 mt-1">{sub}</p>}
    </div>
  );
}
