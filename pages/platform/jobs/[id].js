// pages/platform/jobs/[id].js
// P8 — Job detail with 7-tab shell + read data
// P9 — Devis tab upgraded to DevisEditor (split-view WYSIWYG)
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../src/components/dashboard/DashboardLayout';
import StatusBadge from '../../../src/components/jobs/StatusBadge';
import DevisEditor from '../../../src/components/jobs/DevisEditor';
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrencyQC(amount) {
  if (amount == null || amount === '') return '\u2014';
  const num = parseFloat(amount);
  if (isNaN(num)) return '\u2014';
  return num.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '\u00a0$';
}

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

function SummaryCards({ job, payments }) {
  const address = job.client_address;
  const addressStr = address
    ? [address.street, address.city, address.province, address.postal_code].filter(Boolean).join(', ')
    : null;

  const totalPaid = (payments || [])
    .filter((p) => p.status === 'paid' || p.status === 'succeeded')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const quoteAmount = parseFloat(job.quote_amount || 0);
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

      {/* Projet */}
      <div className="rounded-xl border border-d-border bg-d-surface p-4 shadow-sm">
        <p className="text-[10px] font-semibold text-d-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Briefcase size={11} /> Projet
        </p>
        {job.project_type && (
          <p className="text-sm font-semibold text-d-text mb-1">
            {job.project_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </p>
        )}
        {job.project_description && (
          <p className="text-xs text-d-muted line-clamp-3">{job.project_description}</p>
        )}
        {!job.project_type && !job.project_description && (
          <p className="text-xs text-d-muted italic">Aucune description</p>
        )}
        {job.start_date && (
          <p className="text-xs text-d-muted mt-1.5">
            Début prévu : <span className="text-d-text">{formatShortDate(job.start_date)}</span>
          </p>
        )}
      </div>

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

      {/* Statut + pipeline dots */}
      <div className="rounded-xl border border-d-border bg-d-surface p-4 shadow-sm">
        <p className="text-[10px] font-semibold text-d-muted uppercase tracking-wider mb-2">
          Statut
        </p>
        <div className="mb-3">
          <StatusBadge status={job.status} size="md" />
        </div>
        <PipelineDots status={job.status} size="sm" />
        <p className="text-[10px] text-d-muted mt-2">
          Étape {getStatusMeta(job.status).order <= 13 ? getStatusMeta(job.status).order : '—'} / 13
        </p>
      </div>
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

function TabCommande({ commandeDraft, jobId, onPricingApplied }) {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null); // { matched, unmatched, partial_matches, total_ttc }
  const [uploadError, setUploadError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

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

  const commandeSection = commandeDraft ? (
    <div className="rounded-xl border border-d-border p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-d-text">Commande fournisseur</p>
        <span className="text-xs text-d-muted">MAJ {relativeTime(commandeDraft.updated_at)}</span>
      </div>
      <div className="space-y-2 text-xs">
        {commandeDraft.supplier && (
          <div className="flex justify-between">
            <span className="text-d-muted">Fournisseur</span>
            <span className="text-d-text">{commandeDraft.supplier}</span>
          </div>
        )}
        {commandeDraft.items_count != null && (
          <div className="flex justify-between">
            <span className="text-d-muted">Articles</span>
            <span className="text-d-text">{commandeDraft.items_count}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-d-muted">Statut</span>
          <span className="text-d-text capitalize">{commandeDraft.status || 'brouillon'}</span>
        </div>
      </div>
    </div>
  ) : (
    <div className="rounded-xl border border-dashed border-d-border/60 p-4 text-center mb-4">
      <Package size={20} className="mx-auto mb-2 text-d-muted/40" />
      <p className="text-xs text-d-muted">Aucune commande liée — utilisez le hub PUR pour en créer une.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {commandeSection}

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
                  {Number(uploadResult.total_ttc).toLocaleString('fr-CA', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}&nbsp;$
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
                <span className="text-xs font-mono text-d-primary">{q.quote_number}</span>
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

function TabPaiements({ payments, quoteAmount }) {
  const totalFacture = parseFloat(quoteAmount || 0) * 1.14975; // TTC estimate
  const totalRecu = (payments || [])
    .filter((p) => p.status === 'paid' || p.status === 'succeeded')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const balance = totalFacture - totalRecu;

  if (!payments || payments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-d-border/60 p-8 text-center">
        <CreditCard size={28} className="mx-auto mb-3 text-d-muted/40" />
        <p className="text-sm text-d-muted">Aucun paiement enregistré</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {payments.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between px-4 py-3 rounded-xl border border-d-border bg-d-surface/30"
        >
          <div>
            <p className="text-sm text-d-text">
              {(p.payment_type || 'paiement').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </p>
            <p className="text-xs text-d-muted">{p.paid_at ? formatDate(p.paid_at) : formatDate(p.created_at)}</p>
          </div>
          <div className="text-right">
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

  // Tab state
  const [activeTab, setActiveTab]   = useState('apercu');
  // Per-tab data cache (lazy-loaded on first visit)
  const [tabData, setTabData]       = useState({});
  const [tabLoading, setTabLoading] = useState({});

  // Load base data (job + contracts + payments + events + lead + photos)
  async function loadJob() {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/jobs/${id}`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
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
  async function loadFinances() {
    if (!id) return;
    try {
      const res = await fetch(`/api/jobs/${id}/finances`);
      if (!res.ok) return;
      const json = await res.json();
      setFinances(json);
    } catch { /* silent */ }
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
  const balanceRemaining = finances?.balanceRemaining ?? (ttc - totalPaid);
  const margin           = finances?.margin        ?? (totalPaid - subtotal - totalExpenses);
  const marginPct        = finances?.marginPct     ?? (subtotal > 0 ? (margin / subtotal) * 100 : 0);
  const progressPct      = finances?.progressPct   ?? (ttc > 0 ? Math.min(100, Math.round((totalPaid / ttc) * 100)) : 0);
  const expenses         = finances?.expenses      ?? [];

  // ── Tab content renderer ──
  function renderTabContent() {
    switch (activeTab) {
      case 'apercu':
        return <TabApercu job={job} events={events} lead={lead} payments={payments} />;

      case 'commande':
        return tabLoading.commande
          ? <div className="py-8 text-center text-xs text-d-muted animate-pulse">Chargement...</div>
          : <TabCommande
              commandeDraft={tabData.commande ?? null}
              jobId={job.id}
              onPricingApplied={() => {
                // Reload job base data + devis tab after pricing applied
                loadJob();
                setTabData((prev) => ({ ...prev, devis: undefined }));
              }}
            />;

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
            onSaved={() => {
              // Reload job base + devis tab data
              loadJob();
              setTabData(prev => ({ ...prev, devis: undefined }));
            }}
          />
        );
      }

      case 'contrat':
        return <TabContrat contracts={contracts} />;

      case 'paiements':
        return <TabPaiements payments={payments} quoteAmount={quoteAmount} />;

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
      <SummaryCards job={job} payments={payments} />

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
            <span className="text-xs text-d-muted">Dépenses</span>
            <span className="text-sm font-semibold text-rose-400">{formatCurrencyQC(totalExpenses)}</span>
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
            <span className="text-xs text-d-muted">Marge</span>
            <div className="text-right">
              <p className={`text-sm font-semibold ${margin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrencyQC(margin)}
              </p>
              <p className={`text-[10px] ${margin >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {marginPct.toFixed(1)}%
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
