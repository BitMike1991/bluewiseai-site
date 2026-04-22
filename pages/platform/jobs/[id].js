// pages/platform/jobs/[id].js
// P8 — Job detail with 7-tab shell + read data
// P9 — Devis tab upgraded to DevisEditor (split-view WYSIWYG)
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../src/components/dashboard/DashboardLayout';
import StatusBadge from '../../../src/components/jobs/StatusBadge';
import DevisEditor from '../../../src/components/jobs/DevisEditor';
import MediaPicker from '../../../src/components/ui/MediaPicker';
import AddExpenseModal from '../../../src/components/expenses/AddExpenseModal';
import QuickExpenseCapture from '../../../src/components/expenses/QuickExpenseCapture';
import { sanitizeProjectDescription } from '../../../lib/devis/specs';
import { getStatusMeta, STATUS_ORDER } from '../../../lib/status-config';
import {
  ChevronLeft,
  Phone,
  Mail,
  MapPin,
  User,
  Briefcase,
  FileText,
  PenLine,
  CreditCard,
  CheckSquare,
  Clock,
  Package,
  AlertCircle,
  CheckCircle2,
  Circle,
  Upload,
  ExternalLink,
} from 'lucide-react';

import { fmtMoney, fmtMoneyOrDash as formatCurrencyQC } from '../../../lib/formatters';

// ── Helpers ──────────────────────────────────────────────────────────────────


function formatDate(dateStr) {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('fr-CA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(dateStr) {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('fr-CA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function relativeTime(dateStr) {
  if (!dateStr) return '\u2014';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)   return "À l'instant";
  if (mins < 60)  return `il y a ${mins}\u00a0min`;
  if (hours < 24) return `il y a ${hours}\u00a0h`;
  if (days < 30)  return `il y a ${days}\u00a0j`;
  const months = Math.floor(days / 30);
  return `il y a ${months}\u00a0mois`;
}

function eventLabel(eventType) {
  const labels = {
    job_created:          'Projet créé',
    quote_sent:           'Devis envoyé',
    quote_accepted:       'Devis accepté',
    contract_generated:   'Contrat généré',
    contract_sent:        'Contrat envoyé',
    contract_signed:      'Contrat signé',
    payment_link_created: 'Lien de paiement créé',
    deposit_paid:         'Dépôt reçu',
    payment_received:     'Paiement reçu',
    job_scheduled:        'Travaux planifiés',
    job_started:          'Travaux démarrés',
    job_completed:        'Travaux terminés',
    job_cancelled:        'Projet annulé',
    status_changed:       'Statut modifié',
    measuring:            'Mesures en cours',
    installed:            'Installation complétée',
  };
  return (
    labels[eventType] ||
    (eventType || 'Événement').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

// ── Progress dots (13-stage pipeline) ────────────────────────────────────────

function PipelineDots({ status, size = 'sm' }) {
  const meta = getStatusMeta(status);
  const order = meta.order <= 13 ? meta.order : 0;
  const dotSize = size === 'lg' ? 'w-3 h-3' : 'w-2 h-2';
  const activeDotSize = size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {STATUS_ORDER.map((s, i) => {
        const idx = i + 1;
        const done = order > idx;
        const current = order === idx;
        return (
          <span
            key={s}
            className={`inline-block rounded-full transition-all ${current ? activeDotSize : dotSize}`}
            style={{
              backgroundColor: done
                ? '#22c55e'
                : current
                ? meta.color
                : '#d1d5db',
            }}
            title={getStatusMeta(s).label}
          />
        );
      })}
    </div>
  );
}

// ── Summary cards ─────────────────────────────────────────────────────────────

function EditableProjectCard({ job, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    project_description: sanitizeProjectDescription(job.project_description) || '',
    project_type: job.project_type || '',
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_description: draft.project_description.trim() || null,
          project_type: draft.project_type.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Échec de la mise à jour');
      if (onUpdate) onUpdate(json.job);
      setEditing(false);
    } catch (e) {
      window.alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-d-primary/40 bg-d-surface p-4 shadow-sm">
        <p className="text-[10px] font-semibold text-d-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Briefcase size={11} /> Projet (édition)
        </p>
        <input
          type="text"
          value={draft.project_type}
          onChange={(e) => setDraft((d) => ({ ...d, project_type: e.target.value }))}
          placeholder="Type de projet (ex: Résidentiel)"
          className="w-full mb-2 rounded-lg border border-d-border bg-d-bg px-2 py-1 text-xs text-d-text focus:outline-none focus:ring-1 focus:ring-d-primary/50"
        />
        <textarea
          value={draft.project_description}
          onChange={(e) => setDraft((d) => ({ ...d, project_description: e.target.value }))}
          rows={3}
          placeholder="Description du projet"
          className="w-full mb-2 rounded-lg border border-d-border bg-d-bg px-2 py-1 text-xs text-d-text focus:outline-none focus:ring-1 focus:ring-d-primary/50 resize-y"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex-1 px-3 py-1.5 rounded-lg bg-d-primary text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Sauvegarde…' : 'Enregistrer'}
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft({
                project_description: sanitizeProjectDescription(job.project_description) || '',
                project_type: job.project_type || '',
              });
              setEditing(false);
            }}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg border border-d-border text-xs text-d-muted hover:text-d-text"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-d-border bg-d-surface p-4 shadow-sm group">
      <p className="text-[10px] font-semibold text-d-muted uppercase tracking-wider mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5"><Briefcase size={11} /> Projet</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="p-1 rounded text-d-muted/60 hover:text-d-primary hover:bg-d-primary/10 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Modifier le projet"
          aria-label="Modifier le titre et la description du projet"
        >
          <PenLine size={11} />
        </button>
      </p>
      {job.project_type && (
        <p className="text-sm font-semibold text-d-text mb-1">
          {job.project_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </p>
      )}
      {(() => {
        const cleaned = sanitizeProjectDescription(job.project_description);
        if (cleaned) return <p className="text-xs text-d-muted line-clamp-3">{cleaned}</p>;
        if (!job.project_type) return <p className="text-xs text-d-muted italic">Aucune description — cliquez sur ✏️ pour ajouter</p>;
        return null;
      })()}
      {job.start_date && (
        <p className="text-xs text-d-muted mt-1.5">
          Début prévu : <span className="text-d-text">{formatShortDate(job.start_date)}</span>
        </p>
      )}
    </div>
  );
}

function SummaryCards({ job, payments, finances, onJobUpdate }) {
  const address = job.client_address;
  const addressStr = address
    ? [address.street, address.city, address.province, address.postal_code].filter(Boolean).join(', ')
    : null;

  const totalPaid = finances?.totalPaid ?? (payments || [])
    .filter((p) => p.status === 'paid' || p.status === 'succeeded')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  // "Devis" shown to Jérémy = full TTC (what the client will pay), not HT subtotal.
  // Pull from finances.ttc (live quote) with fallback to legacy jobs.quote_amount.
  const quoteAmount = finances?.ttc ?? parseFloat(job.quote_amount || 0);
  const balanceDue = quoteAmount - totalPaid;
  const meta = getStatusMeta(job.status);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {/* Client */}
      <div className="rounded-xl border border-d-border bg-d-surface p-4 shadow-sm">
        <p className="text-[10px] font-semibold text-d-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <User size={11} /> Client
        </p>
        {job.client_name || job.client_email || job.client_phone ? (
          <>
            <p className="text-sm font-semibold text-d-text mb-1">
              {job.client_name || 'Aucun nom lié'}
            </p>
            {job.client_phone && (
              <a
                href={`tel:${job.client_phone}`}
                className="flex items-center gap-1 text-xs text-d-primary hover:underline mb-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-d-primary/60 rounded"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone size={10} />{job.client_phone}
              </a>
            )}
            {job.client_email && (
              <a
                href={`mailto:${job.client_email}`}
                className="flex items-center gap-1 text-xs text-d-primary hover:underline mb-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-d-primary/60 rounded"
                onClick={(e) => e.stopPropagation()}
              >
                <Mail size={10} /><span className="truncate">{job.client_email}</span>
              </a>
            )}
            {addressStr && (
              <p className="flex items-start gap-1 text-xs text-d-muted mt-0.5">
                <MapPin size={10} className="mt-0.5 flex-shrink-0" />
                <span>{addressStr}</span>
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-d-muted italic">Aucun lead lié</p>
        )}
      </div>

      {/* Projet — editable inline (Mikael 2026-04-21 PUR feedback) */}
      <EditableProjectCard job={job} onUpdate={onJobUpdate} />

      {/* Montants */}
      <div className="rounded-xl border border-d-border bg-d-surface p-4 shadow-sm">
        <p className="text-[10px] font-semibold text-d-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <CreditCard size={11} /> Montants
        </p>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-d-muted">Devis</span>
            <span className="text-d-text font-medium">{formatCurrencyQC(quoteAmount)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-d-muted">Reçu</span>
            <span className="text-emerald-400 font-medium">{formatCurrencyQC(totalPaid)}</span>
          </div>
          <div className="border-t border-d-border/50 pt-1 flex justify-between text-xs">
            <span className="text-d-muted">Balance</span>
            <span
              className={`font-semibold ${balanceDue <= 0 ? 'text-emerald-400' : 'text-amber-500'}`}
            >
              {balanceDue <= 0 ? 'Soldé' : formatCurrencyQC(balanceDue)}
            </span>
          </div>
        </div>
      </div>

      {/* Statut + pipeline dots — editable dropdown (Mikael 2026-04-21 PUR feedback) */}
      <EditableStatusCard job={job} onUpdate={onJobUpdate} />
    </div>
  );
}

function EditableStatusCard({ job, onUpdate }) {
  const [saving, setSaving] = useState(false);
  const meta = getStatusMeta(job.status);

  async function changeStatus(newStatus) {
    if (newStatus === job.status) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Échec de la mise à jour');
      if (onUpdate) onUpdate(json.job);
    } catch (e) {
      window.alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-d-border bg-d-surface p-4 shadow-sm">
      <p className="text-[10px] font-semibold text-d-muted uppercase tracking-wider mb-2">
        Statut
      </p>
      <div className="mb-3">
        <select
          value={job.status || 'draft'}
          onChange={(e) => changeStatus(e.target.value)}
          disabled={saving}
          aria-label="Changer le statut du projet"
          className="w-full rounded-lg border border-d-border bg-d-bg px-2 py-1.5 text-xs text-d-text font-medium focus:outline-none focus:ring-2 focus:ring-d-primary/40 disabled:opacity-50"
          style={{ color: meta.color }}
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{getStatusMeta(s).label}</option>
          ))}
        </select>
      </div>
      <PipelineDots status={job.status} size="sm" />
      <p className="text-[10px] text-d-muted mt-2">
        Étape {meta.order <= 13 ? meta.order : '—'} / 13
        {saving && <span className="ml-2 text-d-primary">· enregistrement…</span>}
      </p>
    </div>
  );
}

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'apercu',    label: 'Aperçu',      icon: Briefcase },
  { id: 'commande',  label: 'Commande',    icon: Package },
  { id: 'devis',     label: 'Devis',       icon: FileText },
  { id: 'contrat',   label: 'Contrat',     icon: PenLine },
  { id: 'paiements', label: 'Paiements',   icon: CreditCard },
  { id: 'finances',  label: 'Finances',    icon: CreditCard },
  { id: 'taches',    label: 'Tâches',      icon: CheckSquare },
  { id: 'timeline',  label: 'Timeline',    icon: Clock },
];

// ── Tab: Aperçu ───────────────────────────────────────────────────────────────

function TabApercu({ job, events, lead, payments }) {
  const recentEvents = (events || []).slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Lead link */}
      {lead && (
        <div className="px-4 py-3 bg-d-surface/40 border border-d-border rounded-xl text-sm">
          <span className="text-d-muted text-xs">Lead lié : </span>
          <Link
            href={`/platform/leads/${lead.id}`}
            className="text-d-primary hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-d-primary/60 rounded"
          >
            {lead.name || lead.first_name || lead.phone || `Lead #${lead.id}`}
          </Link>
        </div>
      )}
      {!lead && !job.lead_id && (
        <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400">
          Aucun lead lié à ce projet.
        </div>
      )}

      {/* Key fields */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-d-border p-3">
          <p className="text-[10px] text-d-muted mb-1">ID Projet</p>
          <p className="text-xs font-mono text-d-primary">{job.job_id || `#${job.id}`}</p>
        </div>
        <div className="rounded-xl border border-d-border p-3">
          <p className="text-[10px] text-d-muted mb-1">Créé le</p>
          <p className="text-xs text-d-text">{formatShortDate(job.created_at)}</p>
        </div>
        {job.intake_source && (
          <div className="rounded-xl border border-d-border p-3">
            <p className="text-[10px] text-d-muted mb-1">Source</p>
            <p className="text-xs text-d-text">{job.intake_source}</p>
          </div>
        )}
        {job.updated_at && (
          <div className="rounded-xl border border-d-border p-3">
            <p className="text-[10px] text-d-muted mb-1">Dernière activité</p>
            <p className="text-xs text-d-text">{relativeTime(job.updated_at)}</p>
          </div>
        )}
      </div>

      {/* Notes (read-only in P8) */}
      {job.notes && (
        <div className="rounded-xl border border-d-border p-4">
          <p className="text-xs font-semibold text-d-muted mb-2">Notes</p>
          <p className="text-sm text-d-text whitespace-pre-wrap leading-relaxed">{job.notes}</p>
        </div>
      )}

      {/* Recent timeline events */}
      <div className="rounded-xl border border-d-border p-4">
        <p className="text-xs font-semibold text-d-muted mb-3">Activité récente</p>
        {recentEvents.length === 0 ? (
          <p className="text-xs text-d-muted italic">Aucune activité enregistrée.</p>
        ) : (
          <div className="space-y-3">
            {recentEvents.map((ev) => (
              <div key={ev.id} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-d-primary/60 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-d-text">{eventLabel(ev.event_type)}</p>
                  {ev.payload?.note && (
                    <p className="text-xs text-d-muted mt-0.5">{ev.payload.note}</p>
                  )}
                  <p className="text-[10px] text-d-muted mt-0.5">{formatDate(ev.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Commande ─────────────────────────────────────────────────────────────

// Parse "24 1/2" / "24.5" / "69,5" → numeric inches for rollup math.
function parseFracInches(s) {
  if (s == null || s === '') return 0;
  const str = String(s).trim().replace(/["″]/g, '');
  if (/^\d+(\.\d+)?$/.test(str)) return parseFloat(str);
  if (/^\d+,\d+$/.test(str)) return parseFloat(str.replace(',', '.'));
  const m = str.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (m) return parseInt(m[1], 10) + parseInt(m[2], 10) / parseInt(m[3], 10);
  const f = str.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (f) return parseInt(f[1], 10) / parseInt(f[2], 10);
  return parseFloat(str.replace(',', '.')) || 0;
}

function TabCommandeToiture({ jobId, quote }) {
  const [roofQuote, setRoofQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!jobId) { setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}/roof-quote`);
        const json = await res.json();
        if (!cancelled) setRoofQuote(json?.roof_quote || null);
      } catch {
        if (!cancelled) setRoofQuote(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [jobId]);

  if (loading) {
    return <div className="py-6 text-center text-xs text-d-muted/70 italic">Chargement…</div>;
  }

  const payload = roofQuote?.payload || {};
  const result = payload.result || payload.stateRef?.result || payload;
  const materialLines = Array.isArray(result?.material_lines) ? result.material_lines : [];
  const feeLines = Array.isArray(result?.fee_lines) ? result.fee_lines : [];
  const laborLine = result?.labor_line || null;
  const surface = Number(roofQuote?.surface_sqft) || 0;
  const pitch = roofQuote?.pitch_category || payload?.measures?.pitch_category || '—';
  const shingle = roofQuote?.shingle_type || payload?.shingle_type || '—';

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-d-border p-4">
        <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-d-text">Liste de chargement — matin</p>
            <p className="text-[11px] text-d-muted mt-0.5">
              Checklist pour charger le camion avant de partir sur le chantier.
              Les quantités sont déjà arrondies pour éviter de manquer.
            </p>
          </div>
          <button
            onClick={() => setShowPrint((s) => !s)}
            className="text-xs px-3 py-1.5 rounded-lg border border-d-border hover:border-d-primary/40 transition"
          >
            {showPrint ? 'Fermer la version imprimable' : 'Version imprimable / email'}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-[11px]">
          <div className="rounded-lg bg-d-border/10 px-2 py-1.5">
            <div className="text-d-muted text-[9px] uppercase tracking-wider">Surface</div>
            <div className="font-mono text-d-text">{surface ? `${surface} pi²` : '—'}</div>
          </div>
          <div className="rounded-lg bg-d-border/10 px-2 py-1.5">
            <div className="text-d-muted text-[9px] uppercase tracking-wider">Pente</div>
            <div className="font-mono text-d-text capitalize">{pitch}</div>
          </div>
          <div className="rounded-lg bg-d-border/10 px-2 py-1.5">
            <div className="text-d-muted text-[9px] uppercase tracking-wider">Bardeaux</div>
            <div className="font-mono text-d-text truncate">{shingle}</div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-d-border p-4">
        <p className="text-sm font-semibold text-d-text mb-2">Matériaux</p>
        {materialLines.length === 0 ? (
          <div className="py-3 text-center text-xs text-d-muted/70 italic">
            Aucun matériau — le devis toiture n'a pas de ventilation détaillée.
          </div>
        ) : (
          <ul className="divide-y divide-d-border/40 -mx-4">
            {materialLines.map((line, i) => (
              <li key={`mat-${i}`} className="px-4 py-2 flex items-center gap-3">
                <input type="checkbox" className="accent-d-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-d-text truncate">{line.label || line.name || `Matériau ${i + 1}`}</div>
                  {line.unit && (
                    <div className="text-[10px] font-mono text-d-muted/70 mt-0.5">{line.unit}</div>
                  )}
                </div>
                <span className="text-[11px] font-mono text-d-muted whitespace-nowrap">
                  × {line.qty ?? line.quantity ?? '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {feeLines.length > 0 && (
        <section className="rounded-xl border border-d-border p-4">
          <p className="text-sm font-semibold text-d-text mb-2">Frais chantier</p>
          <ul className="divide-y divide-d-border/40 -mx-4">
            {feeLines.map((line, i) => (
              <li key={`fee-${i}`} className="px-4 py-2 flex items-center gap-3">
                <input type="checkbox" className="accent-d-primary shrink-0" />
                <span className="text-xs text-d-text flex-1">{line.label || line.name || 'Frais'}</span>
                <span className="text-[11px] font-mono text-d-muted">× {line.qty ?? 1}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {laborLine && (
        <section className="rounded-xl border border-d-border p-4">
          <p className="text-sm font-semibold text-d-text mb-1">Main-d'œuvre prévue</p>
          <p className="text-xs text-d-muted">
            {laborLine.crew_size ? `${laborLine.crew_size} ouvriers` : 'Équipe'}
            {laborLine.days ? ` · ${laborLine.days} jour${laborLine.days > 1 ? 's' : ''}` : ''}
            {laborLine.hours_per_day ? ` · ${laborLine.hours_per_day} h/jour` : ''}
          </p>
        </section>
      )}

      {showPrint && (
        <section className="rounded-xl border border-d-border p-4 bg-white text-black print:bg-white">
          <p className="text-sm font-bold mb-1">Chargement du camion — {roofQuote?.client_name || 'Client'}</p>
          <p className="text-xs mb-3">
            Surface {surface} pi² · Pente {pitch} · {shingle}
          </p>
          <p className="text-xs font-semibold mt-2">Matériaux</p>
          <ul className="text-xs mt-1 space-y-1">
            {materialLines.map((line, i) => (
              <li key={`p-mat-${i}`}>☐ {line.label || line.name || `Matériau ${i + 1}`} — × {line.qty ?? '—'}</li>
            ))}
          </ul>
          {feeLines.length > 0 && (
            <>
              <p className="text-xs font-semibold mt-2">Frais chantier</p>
              <ul className="text-xs mt-1 space-y-1">
                {feeLines.map((line, i) => (
                  <li key={`p-fee-${i}`}>☐ {line.label || line.name} — × {line.qty ?? 1}</li>
                ))}
              </ul>
            </>
          )}
          <p className="text-[10px] text-gray-600 mt-4 italic">
            Imprime cette page (Ctrl/Cmd+P) ou copie-colle dans un courriel vers l'entrepôt.
          </p>
        </section>
      )}
    </div>
  );
}

function TabCommande({ commandeDraft, quote, jobId, onPricingApplied }) {
  // Toiture jobs branch off to the morning-loading checklist view. Detected via
  // the quote.meta.source flag stamped by /api/toiture/save-as-job.
  if (quote?.meta?.source === 'toiture_calc') {
    return <TabCommandeToiture jobId={jobId} quote={quote} />;
  }

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null); // { matched, unmatched, partial_matches, total_ttc }
  const [uploadError, setUploadError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  // Project-scoped BCs (linked via item_refs.job_id). Sent orders + returns
  // applied so Jérémy sees "BC-2026-0004 · envoyé · reçu" at a glance.
  const [projectBcs, setProjectBcs] = useState(null);
  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/bons-de-commande/list?job_id=${jobId}`);
        const json = await res.json();
        if (!cancelled) setProjectBcs(Array.isArray(json?.bcs) ? json.bcs : []);
      } catch {
        if (!cancelled) setProjectBcs([]);
      }
    })();
    return () => { cancelled = true; };
  }, [jobId, uploadResult]); // reload after a supplier return upload

  async function handleFile(file) {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Seuls les fichiers PDF sont acceptés.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Fichier trop volumineux (max 10 MB).');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/jobs/${jobId}/apply-supplier-pricing`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || 'Erreur serveur');
      } else {
        setUploadResult(data);
        if (onPricingApplied) onPricingApplied();
      }
    } catch {
      setUploadError('Erreur réseau — réessaie.');
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  // ── Items à commander — derived from the latest quote ──────────────────────
  // Excludes the install line + items already sent on a supplier BC
  // (_bc_sent_at stamped). Keeps items awaiting dispatch so Jérémy sees the
  // shopping list in one glance.
  const quoteItemsRaw = Array.isArray(quote?.line_items)
    ? quote.line_items
    : (quote?.line_items ? [] : []);
  const orderItems = quoteItemsRaw.filter(it => {
    const isInstall = (it?.description || '').toLowerCase().startsWith('installation')
      || (it?.type || '').toLowerCase().includes('installation');
    return !isInstall && !it?._bc_sent_at;
  });

  // ── Petits matériaux rollup — ALWAYS ceil per Mikael rule ──────────────────
  // Uréthane: 1 cannette couvre 150 po linéaires → ceil(Σ perim × qty / 150)
  // Calking:  1 tube couvre 120 po linéaires     → ceil(Σ perim × qty / 120)
  // Moulure:  standard 8 pi = 96 po par pièce    → ceil(Σ perim × qty / 96)
  // Multiplies perimeter by qty so an item "3× 48×36" counts 3 perimeters.
  const totalPerimeter = orderItems.reduce((s, it) => {
    const w = parseFracInches(it?.dimensions?.width);
    const h = parseFracInches(it?.dimensions?.height);
    const q = Number(it?.qty) || 0;
    return s + 2 * (w + h) * q;
  }, 0);
  const urethaneCans = Math.ceil((totalPerimeter || 0) / 150);
  const calkingTubes = Math.ceil((totalPerimeter || 0) / 120);
  const mouluresPieces8ft = Math.ceil((totalPerimeter || 0) / 96);
  const totalPerimeterFeet = totalPerimeter > 0 ? (totalPerimeter / 12) : 0;

  // ── Derived suppliers on this project ──────────────────────────────────────
  const supplierSet = new Set(
    orderItems.map(it => (it?._supplier || it?.supplier || '').toString().trim().toLowerCase()).filter(Boolean)
  );
  const supplierLabel = supplierSet.size === 0
    ? '—'
    : (supplierSet.size === 1 ? Array.from(supplierSet)[0] : 'multiples');

  // ── BC list: separate sent (awaiting return) from received ─────────────────
  const bcs = Array.isArray(projectBcs) ? projectBcs : [];
  const bcSent     = bcs.filter(b => b.status === 'sent');
  const bcReceived = bcs.filter(b => b.status === 'received');
  const bcDraft    = bcs.filter(b => b.status === 'draft');

  function fmtDateShort(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return ''; }
  }

  return (
    <div className="space-y-4">
      {/* Items à commander */}
      <section className="rounded-xl border border-d-border p-4">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-d-text">Items à commander au fournisseur</p>
            <p className="text-[11px] text-d-muted mt-0.5">
              {orderItems.length} article{orderItems.length > 1 ? 's' : ''} · fournisseur : <span className="capitalize">{supplierLabel}</span>
            </p>
          </div>
          {totalPerimeter > 0 && (
            <span className="text-[11px] font-mono text-d-muted">
              {totalPerimeter.toFixed(0)}&quot; linéaires ({totalPerimeterFeet.toFixed(1)} pi)
            </span>
          )}
        </div>

        {!quote ? (
          <div className="py-3 text-center text-xs text-d-muted/70 italic">
            Chargement du devis…
          </div>
        ) : orderItems.length === 0 ? (
          <div className="py-3 text-center text-xs text-d-muted/70 italic">
            Aucun item à commander — soit le devis est vide, soit tout a déjà été envoyé.
          </div>
        ) : (
          <ul className="divide-y divide-d-border/40 -mx-4">
            {orderItems.map((it, i) => {
              const w = it?.dimensions?.width;
              const h = it?.dimensions?.height;
              const dims = (w && h) ? `${w}" × ${h}"` : '';
              const qty = Number(it?.qty) || 1;
              const queued = !!it?._queued_for_bc;
              return (
                <li key={it?.sku || `item-${i}`} className="px-4 py-2 flex items-center gap-3">
                  <span className="inline-block w-12 text-[10px] font-mono font-semibold text-d-primary truncate" title={it?.sku || ''}>
                    {it?.sku || String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-d-text truncate">
                      {it?.type || it?.description || 'Item'}
                      {it?.model ? <span className="ml-1.5 text-d-muted">{it.model}</span> : null}
                      {it?.ouvrant ? <span className="ml-1.5 text-d-muted font-mono">{it.ouvrant}</span> : null}
                    </div>
                    {dims && <div className="text-[10px] font-mono text-d-muted/70 mt-0.5">{dims}</div>}
                  </div>
                  <span className="text-[11px] font-mono text-d-muted whitespace-nowrap">× {qty}</span>
                  {queued && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold uppercase tracking-wider">
                      Au BC
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Petits matériaux (arrondi à la hausse) */}
      <section className="rounded-xl border border-d-border p-4">
        <p className="text-sm font-semibold text-d-text">Petits matériaux à acheter</p>
        <p className="text-[11px] text-d-muted mt-0.5 mb-3">
          Basé sur {totalPerimeter.toFixed(0)}&quot; de périmètre total · toutes les quantités sont arrondies à la hausse.
        </p>
        {totalPerimeter <= 0 ? (
          <div className="py-3 text-center text-xs text-d-muted/70 italic">
            Ajoute des items avec des dimensions pour voir la liste.
          </div>
        ) : (
          <ul className="space-y-2 text-xs">
            <li className="flex items-center justify-between py-1.5 border-b border-d-border/30">
              <span className="text-d-text">Uréthane (cannettes)</span>
              <span className="font-mono text-d-muted">
                <span className="text-d-text font-semibold">{urethaneCans}</span>
                <span className="text-d-muted/60 ml-2">({totalPerimeter.toFixed(0)}&quot; ÷ 150 ↑)</span>
              </span>
            </li>
            <li className="flex items-center justify-between py-1.5 border-b border-d-border/30">
              <span className="text-d-text">Calking (tubes)</span>
              <span className="font-mono text-d-muted">
                <span className="text-d-text font-semibold">{calkingTubes}</span>
                <span className="text-d-muted/60 ml-2">({totalPerimeter.toFixed(0)}&quot; ÷ 120 ↑)</span>
              </span>
            </li>
            <li className="flex items-center justify-between py-1.5">
              <span className="text-d-text">Moulure ext. (pièces 8 pi)</span>
              <span className="font-mono text-d-muted">
                <span className="text-d-text font-semibold">{mouluresPieces8ft}</span>
                <span className="text-d-muted/60 ml-2">({totalPerimeter.toFixed(0)}&quot; ÷ 96 ↑)</span>
              </span>
            </li>
          </ul>
        )}
      </section>

      {/* Bons de commande liés à ce projet */}
      <section className="rounded-xl border border-d-border p-4">
        <p className="text-sm font-semibold text-d-text">Bons de commande de ce projet</p>
        <p className="text-[11px] text-d-muted mt-0.5 mb-3">
          Chaque BC envoyé au fournisseur + le retour reçu apparaîtront ici.
        </p>
        {projectBcs === null ? (
          <div className="py-3 text-center text-xs text-d-muted/60 italic animate-pulse">Chargement…</div>
        ) : bcs.length === 0 ? (
          <div className="py-3 text-center text-xs text-d-muted/70 italic">
            Aucun bon de commande n&apos;inclut encore d&apos;items de ce projet.
          </div>
        ) : (
          <ul className="space-y-1.5">
            {[...bcSent, ...bcReceived, ...bcDraft].map(bc => {
              const itemCountLabel = bc.item_count_for_job != null
                ? `${bc.item_count_for_job}/${bc.item_count} items`
                : `${bc.item_count} items`;
              return (
                <li key={bc.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-d-surface/30 border border-d-border/50">
                  <span className="font-mono text-xs font-semibold text-d-text truncate flex-shrink-0">{bc.bc_number}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded capitalize font-semibold flex-shrink-0"
                        style={{
                          background: bc.status === 'received' ? 'rgba(16,185,129,0.12)' : bc.status === 'sent' ? 'rgba(245,158,11,0.12)' : 'rgba(148,163,184,0.12)',
                          color: bc.status === 'received' ? '#34d399' : bc.status === 'sent' ? '#fbbf24' : '#94a3b8',
                          border: `1px solid ${bc.status === 'received' ? 'rgba(16,185,129,0.3)' : bc.status === 'sent' ? 'rgba(245,158,11,0.3)' : 'rgba(148,163,184,0.3)'}`,
                        }}
                  >
                    {bc.status === 'received' ? 'Reçu' : bc.status === 'sent' ? 'Envoyé' : 'Brouillon'}
                  </span>
                  <span className="text-[10px] text-d-muted capitalize flex-shrink-0">{bc.supplier}</span>
                  <span className="text-[10px] text-d-muted flex-shrink-0">{itemCountLabel}</span>
                  {bc.sent_at && <span className="text-[10px] text-d-muted/70 ml-auto flex-shrink-0">envoyé {fmtDateShort(bc.sent_at)}</span>}
                  {bc.received_at && <span className="text-[10px] text-emerald-400/80 flex-shrink-0">· reçu {fmtDateShort(bc.received_at)}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </section>


      {/* Supplier soumission upload */}
      <div className="rounded-xl border border-d-border p-4">
        <p className="text-sm font-semibold text-d-text mb-1">Soumission fournisseur</p>
        <p className="text-xs text-d-muted mb-3">
          Téléverse le PDF de soumission Royalty pour distribuer les prix au devis.
        </p>

        {uploadResult ? (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4">
            <p className="text-sm font-semibold text-emerald-400 mb-2">
              Devis mis à jour
            </p>
            <div className="space-y-1 text-xs mb-3">
              <div className="flex justify-between">
                <span className="text-d-muted">Articles matchés</span>
                <span className="text-emerald-400 font-medium">{uploadResult.matched}</span>
              </div>
              {uploadResult.unmatched > 0 && (
                <div className="flex justify-between">
                  <span className="text-d-muted">Sans prix</span>
                  <span className="text-amber-400 font-medium">{uploadResult.unmatched}</span>
                </div>
              )}
              {uploadResult.partial_matches > 0 && (
                <div className="flex justify-between">
                  <span className="text-d-muted">Matchs partiels</span>
                  <span className="text-amber-400 font-medium">{uploadResult.partial_matches}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-emerald-500/20 pt-1 mt-1">
                <span className="text-d-muted">Total TTC</span>
                <span className="text-d-text font-semibold">
                  {fmtMoney(uploadResult.total_ttc)}
                </span>
              </div>
            </div>
            {(uploadResult.unmatched > 0 || uploadResult.partial_matches > 0) && (
              <p className="text-xs text-amber-400 mb-3">
                Vérifie l&apos;onglet Devis — certains articles nécessitent une révision manuelle.
              </p>
            )}
            <button
              type="button"
              onClick={() => setUploadResult(null)}
              className="text-xs text-d-muted hover:text-d-text transition"
            >
              Téléverser un autre PDF
            </button>
          </div>
        ) : (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
              dragOver
                ? 'border-d-primary bg-d-primary/10'
                : 'border-d-border/60 hover:border-d-primary/50 hover:bg-d-surface/40'
            } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={handleInputChange}
              disabled={uploading}
            />
            {uploading ? (
              <>
                <div className="w-8 h-8 border-2 border-d-primary/40 border-t-d-primary rounded-full animate-spin" />
                <p className="text-xs text-d-muted">Analyse en cours...</p>
              </>
            ) : (
              <>
                <Upload size={24} className="text-d-muted/60" />
                <div className="text-center">
                  <p className="text-sm text-d-text font-medium">Déposer le PDF de soumission</p>
                  <p className="text-xs text-d-muted mt-0.5">ou cliquer pour choisir · PDF uniquement · max 10 MB</p>
                </div>
              </>
            )}
          </label>
        )}

        {uploadError && (
          <div className="mt-3 rounded-xl bg-rose-500/10 border border-rose-500/30 px-3 py-2.5 text-xs text-rose-400">
            {uploadError}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Devis ────────────────────────────────────────────────────────────────

function TabDevis({ quotes }) {
  const [expanded, setExpanded] = useState(null);

  if (!quotes || quotes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-d-border/60 p-8 text-center">
        <FileText size={28} className="mx-auto mb-3 text-d-muted/40" />
        <p className="text-sm text-d-muted">Aucun devis généré</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {quotes.map((q) => {
        const isExpanded = expanded === q.id;
        return (
          <div key={q.id} className="rounded-xl border border-d-border overflow-hidden">
            <button
              type="button"
              onClick={() => setExpanded(isExpanded ? null : q.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-d-surface/40 transition text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-d-primary">{q.project_ref || q.quote_number}</span>
                <span className="text-xs text-d-muted">v{q.version}</span>
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border"
                  style={{
                    color: q.status === 'ready' ? '#166534' : '#6b7280',
                    backgroundColor: q.status === 'ready' ? '#dcfce7' : '#f3f4f6',
                    borderColor: q.status === 'ready' ? '#166534' + '55' : '#6b7280' + '55',
                  }}
                >
                  {q.status === 'ready' ? 'Prêt' : q.status === 'superseded' ? 'Remplacé' : q.status || 'brouillon'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-d-text">{formatCurrencyQC(q.total_ttc)}</span>
                <span className="text-xs text-d-muted">{formatShortDate(q.created_at)}</span>
                <span className="text-d-muted text-xs">{isExpanded ? '▲' : '▼'}</span>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-d-border px-4 py-3 bg-d-surface/30">
                {/* Tax breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-xs">
                  <div>
                    <p className="text-d-muted mb-0.5">Sous-total</p>
                    <p className="text-d-text font-medium">{formatCurrencyQC(q.subtotal)}</p>
                  </div>
                  <div>
                    <p className="text-d-muted mb-0.5">TPS 5%</p>
                    <p className="text-d-text">{formatCurrencyQC(q.tax_gst)}</p>
                  </div>
                  <div>
                    <p className="text-d-muted mb-0.5">TVQ 9,975%</p>
                    <p className="text-d-text">{formatCurrencyQC(q.tax_qst)}</p>
                  </div>
                  <div>
                    <p className="text-d-muted mb-0.5">Total TTC</p>
                    <p className="text-d-text font-semibold">{formatCurrencyQC(q.total_ttc)}</p>
                  </div>
                </div>

                {/* Line items */}
                {q.line_items && q.line_items.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-d-muted uppercase tracking-wider mb-2">
                      Postes
                    </p>
                    <div className="space-y-1">
                      {q.line_items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs py-1 border-b border-d-border/40 last:border-0"
                        >
                          <span className="text-d-text flex-1 pr-2">{item.description}</span>
                          <span className="text-d-muted mr-3">{item.qty || ''}</span>
                          <span className="text-d-text font-medium">{formatCurrencyQC(item.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {q.valid_until && (
                  <p className="text-[10px] text-d-muted mt-3">
                    Valide jusqu&apos;au {formatShortDate(q.valid_until)}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Tab: Contrat ──────────────────────────────────────────────────────────────

function TabContrat({ contracts }) {
  if (!contracts || contracts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-d-border/60 p-8 text-center">
        <PenLine size={28} className="mx-auto mb-3 text-d-muted/40" />
        <p className="text-sm text-d-muted">Aucun contrat généré</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {contracts.map((c) => {
        const signed = c.signature_status === 'signed';
        return (
          <div key={c.id} className="rounded-xl border border-d-border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-d-text">
                  {c.template_name || 'Contrat'} {c.template_version || ''}
                </p>
                <p className="text-xs text-d-muted mt-0.5">Créé le {formatDate(c.created_at)}</p>
                {c.signer_name && (
                  <p className="text-xs text-d-muted mt-0.5">Signataire : {c.signer_name}</p>
                )}
                {c.signed_at && (
                  <p className="text-xs text-emerald-400 mt-0.5">Signé le {formatDate(c.signed_at)}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                    signed
                      ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/40'
                      : 'bg-amber-500/15 text-amber-500 border-amber-500/40'
                  }`}
                >
                  {signed ? 'Signé' : 'En attente'}
                </span>
                {/* View contract — show button if html_content exists */}
                {c.html_content && (
                  <button
                    type="button"
                    onClick={() => {
                      const win = window.open('', '_blank');
                      if (win) { win.document.write(c.html_content); win.document.close(); }
                    }}
                    className="text-xs text-d-primary hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-d-primary/60 rounded"
                  >
                    Voir contrat signé
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Tab: Paiements ────────────────────────────────────────────────────────────

function TabPaiements({ payments, quoteAmount, jobId, onPaymentAdded, finances }) {
  // Prefer the authoritative TTC from finances (which reads live quote totals).
  // Fall back to quote_amount * 1.14975 only if finances isn't loaded.
  const totalFacture = Number(finances?.ttc ?? (parseFloat(quoteAmount || 0) * 1.14975));
  const totalRecu = (payments || [])
    .filter((p) => p.status === 'paid' || p.status === 'succeeded')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const balance = totalFacture - totalRecu;

  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="space-y-2">
      {/* Add payment button */}
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-d-primary/50 bg-d-primary/10 text-d-primary hover:bg-d-primary/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
        >
          <CreditCard size={12} /> + Ajouter un paiement
        </button>
      </div>

      {addOpen && (
        <AddPaymentModal
          jobId={jobId}
          suggestedDepositAmount={Math.round(totalFacture * 0.35 * 100) / 100}
          onClose={() => setAddOpen(false)}
          onSaved={() => { setAddOpen(false); onPaymentAdded && onPaymentAdded(); }}
        />
      )}

      {(!payments || payments.length === 0) ? (
        <div className="rounded-xl border border-dashed border-d-border/60 p-8 text-center">
          <CreditCard size={28} className="mx-auto mb-3 text-d-muted/40" />
          <p className="text-sm text-d-muted">Aucun paiement enregistré</p>
          <p className="text-[11px] text-d-muted/60 mt-1">Utilise « + Ajouter un paiement » pour logger cash, chèque ou Interac confirmé manuellement.</p>
        </div>
      ) : (
        <>
          {payments.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-d-border bg-d-surface/30"
            >
              {p.receiptUrl || p.receipt_url ? (
                <a
                  href={p.receiptUrl || p.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-d-border bg-d-surface block"
                  aria-label="Voir la preuve de paiement"
                >
                  {/\.pdf(\?.*)?$/i.test(p.receiptUrl || p.receipt_url) ? (
                    <div className="w-full h-full flex items-center justify-center text-d-muted text-[9px] font-semibold">PDF</div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.receiptUrl || p.receipt_url} alt="Reçu" className="w-full h-full object-cover" loading="lazy" />
                  )}
                </a>
              ) : null}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-d-text">
                  {(p.payment_type || 'paiement').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  {p.method && (
                    <span className="ml-2 text-[10px] uppercase tracking-wider text-d-muted">
                      · {p.method}
                    </span>
                  )}
                </p>
                <p className="text-xs text-d-muted">{p.paid_at ? formatDate(p.paid_at) : formatDate(p.created_at)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-medium ${
                  p.status === 'paid' || p.status === 'succeeded' ? 'text-emerald-400' : 'text-amber-500'
                }`}>
                  {formatCurrencyQC(p.amount)}
                </p>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${
                  p.status === 'paid' || p.status === 'succeeded'
                    ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/40'
                    : 'bg-amber-500/15 text-amber-500 border-amber-500/40'
                }`}>
                  {(p.status || 'en attente').replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              </div>
            </div>
          ))}

          {/* Totals row */}
          <div className="rounded-xl border border-d-border px-4 py-3 bg-d-surface/60 mt-2">
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-d-muted mb-0.5">Total reçu</p>
                <p className="text-emerald-400 font-semibold">{formatCurrencyQC(totalRecu)}</p>
              </div>
              <div>
                <p className="text-d-muted mb-0.5">Total facturé</p>
                <p className="text-d-text font-semibold">{formatCurrencyQC(totalFacture)}</p>
              </div>
              <div>
                <p className="text-d-muted mb-0.5">Balance</p>
                <p className={`font-semibold ${balance <= 0 ? 'text-emerald-400' : 'text-amber-500'}`}>
                  {balance <= 0 ? 'Soldé' : formatCurrencyQC(balance)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AddPaymentModal({ jobId, suggestedDepositAmount, onClose, onSaved }) {
  const [amount, setAmount] = useState(suggestedDepositAmount ? String(suggestedDepositAmount) : '');
  const [method, setMethod] = useState('interac');
  const [paymentType, setPaymentType] = useState('deposit');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [note, setNote] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [receiptUrl, setReceiptUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError('Montant invalide');
      return;
    }
    // Auto-split TPS/TVQ on the payment row (assumes the amount IS the TTC
    // reçu, standard for Quebec construction revenue). Same reverse-calc the
    // finances API uses but stored once at insert time so future audits can
    // reconcile without recomputation drift.
    const htBase = amt / 1.14975;
    const computedTps = Math.round(htBase * 0.05 * 100) / 100;
    const computedTvq = Math.round(htBase * 0.09975 * 100) / 100;
    const computedSubtotal = Math.round(htBase * 100) / 100;

    setSaving(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          amount: amt,
          method,
          payment_type: paymentType,
          reference_number: referenceNumber.trim() || undefined,
          paid_at: paidAt ? new Date(paidAt).toISOString() : undefined,
          note: note.trim() || undefined,
          receipt_url: receiptUrl || undefined,
          subtotal: computedSubtotal,
          tps: computedTps,
          tvq: computedTvq,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-d-bg border border-d-border rounded-2xl shadow-2xl w-full max-w-sm p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-d-text">Ajouter un paiement</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-d-muted hover:text-d-text">
            ✕
          </button>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs text-d-muted mb-1.5">Montant ($)</label>
            <input
              type="number" step="0.01" min="0"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm text-d-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
              required
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-d-muted mb-1.5">Méthode</label>
              <select
                value={method} onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm text-d-text"
              >
                <option value="interac">Interac</option>
                <option value="cash">Cash</option>
                <option value="cheque">Chèque</option>
                <option value="wire">Virement</option>
                <option value="stripe">Stripe</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-d-muted mb-1.5">Type</label>
              <select
                value={paymentType} onChange={(e) => setPaymentType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm text-d-text"
              >
                <option value="deposit">Acompte (dépôt)</option>
                <option value="balance">Balance finale</option>
                <option value="partial">Paiement partiel</option>
                <option value="installment">Versement</option>
                <option value="refund">Remboursement</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-d-muted mb-1.5"># de référence (optionnel)</label>
            <input
              type="text"
              value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Ex: Interac ref, # chèque"
              className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm text-d-text placeholder:text-d-muted/40"
            />
          </div>
          <div>
            <label className="block text-xs text-d-muted mb-1.5">Date du paiement</label>
            <input
              type="date"
              value={paidAt} onChange={(e) => setPaidAt(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm text-d-text"
            />
          </div>
          <div>
            <label className="block text-xs text-d-muted mb-1.5">Note (optionnel)</label>
            <textarea
              rows={2} value={note} onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm text-d-text placeholder:text-d-muted/40"
            />
          </div>
          <div>
            <label className="block text-xs text-d-muted mb-1.5">Preuve de paiement (optionnel)</label>
            <MediaPicker
              value={receiptUrl}
              onChange={setReceiptUrl}
              bucket="receipts"
              context="receipt"
              jobId={jobId}
              label="Ajouter capture"
              accept="image/*,application/pdf"
            />
          </div>
          {error && (
            <p className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button" onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-d-border text-sm text-d-muted hover:text-d-text transition"
          >
            Annuler
          </button>
          <button
            type="submit" disabled={saving}
            className="flex-1 px-4 py-2 rounded-xl bg-d-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Tab: Finances ─────────────────────────────────────────────────────────────

const EXPENSE_CATEGORY_LABELS = {
  materiel_fournisseur: 'Matériel fournisseur',
  main_oeuvre:          'Main-d\'œuvre',
  'main-oeuvre':        'Main-d\'œuvre',
  sous_traitance:       'Sous-traitance',
  'sous-traitance':     'Sous-traitance',
  autre:                'Autre',
};

function TabFinances({ finances, quoteAmount, jobId, jobLabel, onExpenseAdded }) {
  const [addOpen, setAddOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  if (!finances) {
    return (
      <div className="rounded-xl border border-dashed border-d-border/60 p-8 text-center">
        <CreditCard size={28} className="mx-auto mb-3 text-d-muted/40" />
        <p className="text-sm text-d-muted">Données financières non disponibles.</p>
      </div>
    );
  }

  const expenses = finances.expenses || [];
  // Revenue = live TTC from quote (what the client pays), not HT subtotal
  const revenue = parseFloat(finances.ttc ?? quoteAmount ?? 0);
  const totalExpenses = parseFloat(finances.totalExpenses || 0);
  const estimatedMaterialCost = parseFloat(finances.estimatedMaterialCost || 0);
  // Projected margin = TTC - estimated material cost - logged expenses
  // (Jérémy's realistic net before he adds his own labor/sous-tr costs)
  const margeB = revenue - estimatedMaterialCost - totalExpenses;
  const margePct = revenue > 0 ? (margeB / revenue) * 100 : 0;

  // Group expenses by category
  const grouped = {};
  for (const exp of expenses) {
    const cat = exp.category || 'autre';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(exp);
  }

  return (
    <div className="space-y-4">
      {/* Revenue vs Cost summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-d-border bg-d-surface/40 p-3">
          <p className="text-[10px] text-d-muted mb-1">Revenu (TTC client)</p>
          <p className="text-sm font-semibold text-d-text">{formatCurrencyQC(revenue)}</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="text-[10px] text-d-muted mb-1" title="Somme des _cost × qty des items — projection de ce que Jérémy paiera au fournisseur">
            Coût matière estimé
          </p>
          <p className="text-sm font-semibold text-amber-300/90">{formatCurrencyQC(estimatedMaterialCost)}</p>
        </div>
        <div className="rounded-xl border border-d-border bg-d-surface/40 p-3">
          <p className="text-[10px] text-d-muted mb-1" title="Dépenses réelles loggées par Jérémy (factures payées, gaz, sous-traitance, etc.)">
            Dépenses réelles
          </p>
          <p className="text-sm font-semibold text-rose-400">{formatCurrencyQC(totalExpenses)}</p>
        </div>
        <div className="rounded-xl border border-d-border bg-d-surface/40 p-3">
          <p className="text-[10px] text-d-muted mb-1">Marge projetée</p>
          <p className={`text-sm font-semibold ${margeB >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrencyQC(margeB)}
          </p>
        </div>
        <div className="rounded-xl border border-d-border bg-d-surface/40 p-3">
          <p className="text-[10px] text-d-muted mb-1">Marge %</p>
          <p className={`text-sm font-semibold ${margePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {margePct.toFixed(1)}&nbsp;%
          </p>
        </div>
      </div>

      {/* Add expense buttons — pre-linked to this job */}
      {jobId && (
        <div className="flex justify-end gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setQuickOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-d-primary text-white hover:opacity-90 transition"
          >
            📸 Photo rapide
          </button>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
          >
            <CreditCard size={12} /> + Manuel
          </button>
        </div>
      )}

      {addOpen && (
        <AddExpenseModal
          jobs={[]}
          presetJobId={jobId}
          presetJobLabel={jobLabel}
          onClose={() => setAddOpen(false)}
          onSaved={() => { setAddOpen(false); onExpenseAdded && onExpenseAdded(); }}
        />
      )}

      {quickOpen && (
        <QuickExpenseCapture
          presetJobId={jobId}
          presetJobLabel={jobLabel}
          onClose={() => setQuickOpen(false)}
          onSaved={() => { onExpenseAdded && onExpenseAdded(); }}
        />
      )}

      {/* Expenses table */}
      {expenses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-d-border/60 p-8 text-center">
          <CreditCard size={22} className="mx-auto mb-2 text-d-muted/40" />
          <p className="text-sm text-d-muted">Aucune dépense réelle loggée pour ce projet.</p>
          <p className="text-xs text-d-muted/60 mt-1">
            Logge tes achats au fur et à mesure (facture Royalty, gaz, cannettes, sous-traitance).
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-d-border overflow-hidden">
          <div className="px-4 py-3 border-b border-d-border bg-d-surface/30">
            <p className="text-xs font-semibold text-d-muted">
              Dépenses ({expenses.length})
            </p>
          </div>

          {/* Per-category sections */}
          {Object.entries(grouped).map(([cat, rows]) => {
            const catTotal = rows.reduce((s, e) => s + Number(e.amount || 0), 0);
            const catLabel = EXPENSE_CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ');
            return (
              <div key={cat}>
                <div className="px-4 py-2 bg-d-surface/50 border-b border-d-border/40 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-d-muted uppercase tracking-wider">{catLabel}</span>
                  <span className="text-xs font-medium text-d-text">{formatCurrencyQC(catTotal)}</span>
                </div>
                {rows.map((exp, i) => (
                  <div
                    key={exp.id || i}
                    className="flex items-center justify-between px-4 py-2.5 border-b border-d-border/30 last:border-0 text-xs"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-d-text truncate">{exp.description}</p>
                      {exp.vendor && (
                        <p className="text-[10px] text-d-muted mt-0.5">{exp.vendor}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 text-right">
                      <span className="text-d-muted hidden sm:block">{exp.date ? formatShortDate(exp.date) : '—'}</span>
                      <span className="font-medium text-d-text">{formatCurrencyQC(exp.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {/* Footer total */}
          <div className="px-4 py-3 border-t border-d-border bg-d-surface/50 flex items-center justify-between">
            <span className="text-xs font-semibold text-d-muted">Total dépenses</span>
            <span className="text-sm font-bold text-rose-400">{formatCurrencyQC(totalExpenses)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Tâches ───────────────────────────────────────────────────────────────

function TabTaches({ jobId, tasks, onTaskToggle }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-d-border/60 p-8 text-center">
        <CheckSquare size={28} className="mx-auto mb-3 text-d-muted/40" />
        <p className="text-sm text-d-muted">Aucune tâche pour ce projet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const done = task.status === 'completed';
        return (
          <div
            key={task.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-d-border hover:border-d-primary/30 transition"
          >
            <button
              type="button"
              onClick={() => onTaskToggle(task)}
              aria-label={done ? 'Marquer comme non complétée' : 'Marquer comme complétée'}
              className="flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50 rounded"
            >
              {done ? (
                <CheckCircle2 size={18} className="text-emerald-400" />
              ) : (
                <Circle size={18} className="text-d-muted/60 hover:text-d-primary transition" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${done ? 'line-through text-d-muted' : 'text-d-text'}`}>
                {task.title || task.type || 'Tâche'}
              </p>
              {task.description && (
                <p className="text-xs text-d-muted truncate mt-0.5">{task.description}</p>
              )}
            </div>
            <div className="flex-shrink-0 text-right">
              {task.due_at && (
                <p className={`text-xs ${new Date(task.due_at) < new Date() && !done ? 'text-rose-400' : 'text-d-muted'}`}>
                  {formatShortDate(task.due_at)}
                </p>
              )}
              {task.priority && task.priority !== 'normal' && (
                <span className={`text-[10px] ${
                  task.priority === 'high' || task.priority === 'urgent'
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}>
                  {task.priority}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Tab: Timeline ─────────────────────────────────────────────────────────────

function TabTimeline({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-d-border/60 p-8 text-center">
        <Clock size={28} className="mx-auto mb-3 text-d-muted/40" />
        <p className="text-sm text-d-muted">Aucun événement enregistré</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {events.map((ev, i) => (
        <div key={ev.id} className="flex items-start gap-3 py-2.5">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-d-primary/70 flex-shrink-0 mt-0.5" />
            {i < events.length - 1 && (
              <div className="w-px flex-1 bg-d-border/60 mt-1 min-h-[20px]" />
            )}
          </div>

          <div className="flex-1 min-w-0 pb-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-medium text-d-text">
                {eventLabel(ev.event_type)}
              </span>
              <span className="text-[10px] text-d-muted whitespace-nowrap">
                {relativeTime(ev.created_at)}
              </span>
            </div>
            {ev.payload && Object.keys(ev.payload).length > 0 && (
              <p className="text-[10px] text-d-muted mt-0.5 break-all">
                {ev.payload.note
                  ? ev.payload.note
                  : JSON.stringify(ev.payload).slice(0, 120) + (JSON.stringify(ev.payload).length > 120 ? '…' : '')}
              </p>
            )}
            <p className="text-[10px] text-d-muted/60 mt-0.5">{formatDate(ev.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main detail page ──────────────────────────────────────────────────────────

export default function JobDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [finances, setFinances]     = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // Tab state — persisted per-job in sessionStorage so navigating away and
  // back (common on iPad) restores the same tab.
  const [activeTab, _setActiveTab] = useState('apercu');
  const setActiveTab = useCallback((tab) => {
    _setActiveTab(tab);
    try {
      if (typeof window !== 'undefined' && id) {
        window.sessionStorage.setItem(`jobs-${id}-tab`, tab);
      }
    } catch { /* sessionStorage blocked — ignore */ }
  }, [id]);

  // Restore tab on mount / id change
  useEffect(() => {
    if (!id || typeof window === 'undefined') return;
    try {
      const saved = window.sessionStorage.getItem(`jobs-${id}-tab`);
      if (saved) _setActiveTab(saved);
    } catch { /* ignore */ }
  }, [id]);
  // Per-tab data cache (lazy-loaded on first visit)
  const [tabData, setTabData]       = useState({});
  const [tabLoading, setTabLoading] = useState({});

  // Load base data (job + contracts + payments + events + lead + photos)
  // silent=true suppresses the top-level loading spinner so refreshes (e.g.
  // triggered by devis autosave → onSaved) don't unmount the tab tree mid-edit.
  async function loadJob(silent = false) {
    if (!id) return;
    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await fetch(`/api/jobs/${id}`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  // Lazy-load per-tab data
  const loadTabData = useCallback(async (tab) => {
    if (!id) return;
    if (tabData[tab] !== undefined) return; // already loaded
    if (tabLoading[tab]) return;

    const expandMap = {
      devis:    'quotes',
      commande: 'commande_drafts',
      taches:   'tasks',
    };
    const expandKey = expandMap[tab];
    if (!expandKey) return;

    setTabLoading((prev) => ({ ...prev, [tab]: true }));
    try {
      const res = await fetch(`/api/jobs/${id}?expand=${expandKey}`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json = await res.json();
      setTabData((prev) => ({
        ...prev,
        [tab]: json[expandKey === 'commande_drafts' ? 'commande_draft' : expandKey] ?? null,
      }));
    } catch (err) {
      console.error(`Tab ${tab} load error:`, err);
      setTabData((prev) => ({ ...prev, [tab]: null }));
    } finally {
      setTabLoading((prev) => ({ ...prev, [tab]: false }));
    }
  }, [id, tabData, tabLoading]);

  // Load finances (for the existing financial summary card)
  const [financesError, setFinancesError] = useState(null);
  async function loadFinances() {
    if (!id) return;
    try {
      const res = await fetch(`/api/jobs/${id}/finances`);
      if (!res.ok) {
        setFinancesError(`Finances indisponibles (HTTP ${res.status})`);
        return;
      }
      const json = await res.json();
      setFinances(json);
      setFinancesError(null);
    } catch (err) {
      console.warn('[loadFinances]', err?.message);
      setFinancesError('Erreur réseau — recharge la page');
    }
  }

  useEffect(() => {
    loadJob();
    loadFinances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Load tab data on tab switch
  useEffect(() => {
    loadTabData(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id]);

  // Task toggle handler
  async function handleTaskToggle(task) {
    const targetStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const res = await fetch(`/api/tasks/${task.id}/complete`, { method: 'POST' });
      if (!res.ok) return;
      setTabData((prev) => ({
        ...prev,
        taches: (prev.taches || []).map((t) =>
          t.id === task.id
            ? { ...t, status: targetStatus, completed_at: targetStatus === 'completed' ? new Date().toISOString() : null }
            : t
        ),
      }));
    } catch (err) {
      console.error(err);
    }
  }

  // ── Loading / error states ──
  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-sm text-d-muted py-12 text-center animate-pulse">
          Chargement du projet...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data?.job) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center">
          <AlertCircle size={32} className="mx-auto mb-3 text-rose-400/60" />
          <p className="text-rose-400 text-sm mb-4">{error || 'Projet introuvable'}</p>
          <Link href="/platform/jobs" className="text-d-primary text-sm hover:underline">
            Retour aux projets
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const { job, contracts, payments, events, lead, photos } = data;

  const quoteAmount = parseFloat(job.quote_amount || 0);
  const subtotal    = finances?.subtotal    ?? quoteAmount;
  const tps         = finances?.tps         ?? subtotal * 0.05;
  const tvq         = finances?.tvq         ?? subtotal * 0.09975;
  const ttc         = finances?.ttc         ?? subtotal + tps + tvq;
  const totalPaid   = finances?.totalPaid   ?? (payments || [])
    .filter((p) => p.status === 'paid' || p.status === 'succeeded')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const totalExpenses   = finances?.totalExpenses ?? 0;
  const estimatedMaterialCost = finances?.estimatedMaterialCost ?? 0;
  const balanceRemaining = finances?.balanceRemaining ?? (ttc - totalPaid);
  // Use projected margin until real payments start flowing; switch to realized after.
  const marginMode = finances?.marginMode ?? (totalPaid === 0 ? 'projected' : 'realized');
  const margin           = finances?.margin        ?? (marginMode === 'projected'
    ? (ttc - estimatedMaterialCost - totalExpenses)
    : (totalPaid - totalExpenses));
  const marginPct        = finances?.marginPct     ?? 0;
  const progressPct      = finances?.progressPct   ?? (ttc > 0 ? Math.min(100, Math.round((totalPaid / ttc) * 100)) : 0);
  const expenses         = finances?.expenses      ?? [];

  // ── Tab content renderer ──
  function renderTabContent() {
    switch (activeTab) {
      case 'apercu':
        return <TabApercu job={job} events={events} lead={lead} payments={payments} />;

      case 'commande': {
        // Grab the latest non-superseded quote so the Commande tab can show
        // the actual items-to-order list + petits matériaux rollup. devis
        // tab may not have loaded yet when Commande is opened first — kick
        // the load from here so Jérémy doesn't have to click Devis first.
        const devisQuotesForCmd = tabData.devis;
        if (devisQuotesForCmd === undefined) {
          loadTabData('devis');
        }
        const latestQuoteForCmd = Array.isArray(devisQuotesForCmd)
          ? (devisQuotesForCmd.find(q => q.status !== 'superseded') || devisQuotesForCmd[0] || null)
          : null;
        return tabLoading.commande
          ? <div className="py-8 text-center text-xs text-d-muted animate-pulse">Chargement...</div>
          : <TabCommande
              commandeDraft={tabData.commande ?? null}
              quote={latestQuoteForCmd}
              jobId={job.id}
              onPricingApplied={() => {
                // Reload job base data + finances + devis tab after pricing applied
                loadJob();
                loadFinances();
                setTabData((prev) => ({ ...prev, devis: undefined }));
              }}
            />;
      }

      case 'devis': {
        if (tabLoading.devis) {
          return <div className="py-8 text-center text-xs text-d-muted animate-pulse">Chargement...</div>;
        }
        const devisQuotes = tabData.devis ?? [];
        // Use latest non-superseded quote for the editor, or first
        const latestQuote = devisQuotes.find(q => q.status !== 'superseded') || devisQuotes[0] || null;

        if (!latestQuote) {
          return (
            <div className="rounded-xl border border-dashed border-d-border/60 p-8 text-center">
              <FileText size={28} className="mx-auto mb-3 text-d-muted/40" />
              <p className="text-sm text-d-muted mb-4">Aucun devis généré pour ce projet.</p>
            </div>
          );
        }

        return (
          <DevisEditor
            job={job}
            quote={latestQuote}
            onSaved={async () => {
              // Silent refresh — loadJob(true) skips setLoading(true) so the top
              // spinner doesn't flash + unmount the DevisEditor tree mid-edit.
              // Without this, the autosave → loadJob → setLoading(true) chain
              // unmounts DevisEditor, then on remount its useState reads the
              // stale prop (old meta) before the quotes refetch lands — dropping
              // the toggle change back to its pre-save value.
              loadJob(true);
              loadFinances();
              try {
                const res = await fetch(`/api/jobs/${id}?expand=quotes`);
                if (res.ok) {
                  const json = await res.json();
                  setTabData(prev => ({ ...prev, devis: json.quotes ?? [] }));
                }
              } catch {
                /* non-fatal — editor holds state, next manual load will refresh */
              }
            }}
          />
        );
      }

      case 'contrat':
        return <TabContrat contracts={contracts} />;

      case 'paiements':
        return (
          <TabPaiements
            payments={payments}
            quoteAmount={quoteAmount}
            jobId={job.id}
            finances={finances}
            onPaymentAdded={() => { loadJob(); loadFinances(); }}
          />
        );

      case 'finances':
        return (
          <TabFinances
            finances={finances}
            quoteAmount={quoteAmount}
            jobId={job.id}
            jobLabel={`${job.job_id || '#' + job.id}${job.client_name ? ' · ' + job.client_name : ''}`}
            onExpenseAdded={() => loadFinances()}
          />
        );

      case 'taches':
        return tabLoading.taches
          ? <div className="py-8 text-center text-xs text-d-muted animate-pulse">Chargement...</div>
          : <TabTaches jobId={job.id} tasks={tabData.taches ?? []} onTaskToggle={handleTaskToggle} />;

      case 'timeline':
        return <TabTimeline events={events} />;

      default:
        return null;
    }
  }

  return (
    <DashboardLayout>
      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="Photo du projet"
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            aria-label="Fermer la photo"
            className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded"
          >
            &times;
          </button>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          {/* Breadcrumb + back */}
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/platform/jobs"
              className="flex items-center gap-1 text-xs text-d-muted hover:text-d-primary transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-d-primary/60 rounded"
            >
              <ChevronLeft size={13} />
              Projets
            </Link>
            <span className="text-xs text-d-muted/40">/</span>
            <span className="text-xs text-d-text font-medium truncate max-w-[200px]">
              {job.job_id || job.client_name || `Projet #${job.id}`}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-lg font-semibold text-d-text">
              {job.job_id || `Projet #${job.id}`}
            </h1>
            <StatusBadge status={job.status} size="lg" />
          </div>
          {job.client_name && (
            <p className="text-sm text-d-muted mt-0.5">{job.client_name}</p>
          )}
        </div>

        {/* Edit button — disabled P8 */}
        <button
          type="button"
          disabled
          title="Modifier — bientôt disponible"
          className="px-4 py-2 rounded-xl text-xs font-medium bg-d-surface border border-d-border text-d-muted cursor-not-allowed opacity-60"
        >
          Modifier — bientôt
        </button>
      </div>

      {/* Summary cards */}
      <SummaryCards
        job={job}
        payments={payments}
        finances={finances}
        onJobUpdate={(updated) => setData((d) => ({ ...d, job: { ...d.job, ...updated } }))}
      />

      {/* Financial summary card (preserved from existing page) */}
      <div className="mb-6 rounded-xl border border-d-border p-4">
        <p className="text-xs font-semibold text-d-muted mb-3">Résumé financier</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Sous-total', value: subtotal },
            { label: 'TPS (5%)', value: tps },
            { label: 'TVQ (9,975%)', value: tvq },
            { label: 'Total TTC', value: ttc, bold: true },
          ].map(({ label, value, bold }) => (
            <div key={label} className="px-3 py-2 rounded-lg bg-d-surface/40 border border-d-border/50">
              <p className="text-[10px] text-d-text0 mb-0.5">{label}</p>
              <p className={`text-sm ${bold ? 'font-semibold' : 'font-medium'} text-d-text`}>
                {formatCurrencyQC(value)}
              </p>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-d-text0">Progression du paiement</span>
            <span className={`text-[10px] font-medium ${progressPct >= 100 ? 'text-emerald-400' : 'text-d-primary'}`}>
              {progressPct}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-d-surface overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressPct >= 100 ? 'bg-emerald-500' : 'bg-d-primary'}`}
              style={{ width: `${Math.min(100, progressPct)}%` }}
            />
          </div>
        </div>

        <div className="border-t border-d-border/60 my-3" />
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-xs text-d-muted">Reçu</span>
            <span className="text-sm font-semibold text-emerald-400">{formatCurrencyQC(totalPaid)}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <span className="text-xs text-d-muted" title="Dépenses réelles loggées par Jérémy (factures payées, gaz, etc.)">
              Dépenses réelles
            </span>
            <span className="text-sm font-semibold text-rose-400">{formatCurrencyQC(totalExpenses)}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/15">
            <span className="text-xs text-d-muted" title="Coût matière estimé = somme des _cost × qty des items du devis (projection avant paiement fournisseur)">
              Coût matière estimé
            </span>
            <span className="text-sm font-medium text-amber-300/90">{formatCurrencyQC(estimatedMaterialCost)}</span>
          </div>
          <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
            balanceRemaining <= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'
          }`}>
            <span className="text-xs text-d-muted">Balance</span>
            <span className={`text-sm font-semibold ${balanceRemaining <= 0 ? 'text-emerald-400' : 'text-amber-500'}`}>
              {formatCurrencyQC(Math.max(0, balanceRemaining))}
            </span>
          </div>
          <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
            margin >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'
          }`}>
            <span className="text-xs text-d-muted">
              {marginMode === 'projected' ? 'Marge projetée' : 'Marge'}
            </span>
            <div className="text-right">
              <p className={`text-sm font-semibold ${margin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrencyQC(margin)}
              </p>
              <p className={`text-[10px] ${margin >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {Number(marginPct || 0).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Photos */}
      {photos && photos.length > 0 && (
        <div className="mb-6 rounded-xl border border-d-border p-4">
          <p className="text-xs font-semibold text-d-muted mb-3">Photos ({photos.length})</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {photos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setLightboxUrl(photo.file_url)}
                aria-label="Voir la photo en grand"
                className="aspect-square rounded-lg overflow-hidden border border-d-border/60 hover:border-d-primary/60 transition group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50"
              >
                <img
                  src={photo.file_url}
                  alt="Photo du projet"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 7-tab section */}
      <div className="rounded-2xl border border-d-border shadow-lg overflow-hidden">
        {/* Tab nav — desktop horizontal scroll, mobile accordion */}
        <div className="border-b border-d-border">
          {/* Desktop tabs */}
          <div className="hidden md:flex overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d-primary/50 focus-visible:ring-inset ${
                    active
                      ? 'border-d-primary text-d-primary bg-d-primary/5'
                      : 'border-transparent text-d-muted hover:text-d-text hover:border-d-border'
                  }`}
                  aria-selected={active}
                  role="tab"
                >
                  <Icon size={12} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Mobile: show active tab label + dropdown */}
          <div className="md:hidden px-4 py-3">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full bg-d-surface border border-d-border rounded-xl px-3 py-2 text-sm text-d-text focus:outline-none focus:ring-2 focus:ring-d-primary/50"
              aria-label="Navigation par onglet"
            >
              {TABS.map((tab) => (
                <option key={tab.id} value={tab.id}>{tab.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab content */}
        <div className="p-4 md:p-5 min-h-[200px]">
          {renderTabContent()}
        </div>
      </div>
    </DashboardLayout>
  );
}
