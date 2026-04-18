// lib/status-config.js
// Pipeline status metadata for the jobs ERP view.
// Used by list page, detail page, and StatusBadge component.

export const STATUS_META = {
  draft:                    { label: 'Brouillon',           color: '#6b7280', bg: '#f3f4f6', order: 1,  group: 'in_progress' },
  measuring:                { label: 'Mesures en cours',    color: '#1e40af', bg: '#dbeafe', order: 2,  group: 'in_progress' },
  awaiting_supplier:        { label: 'Attente fournisseur', color: '#92400e', bg: '#fef3c7', order: 3,  group: 'in_progress' },
  awaiting_client_approval: { label: 'Attente client',      color: '#6b21a8', bg: '#e9d5ff', order: 4,  group: 'in_progress' },
  accepted:                 { label: 'Accepté',             color: '#166534', bg: '#dcfce7', order: 5,  group: 'active' },
  contract_sent:            { label: 'Contrat envoyé',      color: '#0e7490', bg: '#cffafe', order: 6,  group: 'active' },
  contract_signed:          { label: 'Contrat signé',       color: '#0891b2', bg: '#cffafe', order: 7,  group: 'active' },
  awaiting_deposit:         { label: 'Attente dépôt',       color: '#b45309', bg: '#fef3c7', order: 8,  group: 'active' },
  deposit_received:         { label: 'Dépôt reçu',          color: '#16a34a', bg: '#dcfce7', order: 9,  group: 'active' },
  in_production:            { label: 'En production',       color: '#2563eb', bg: '#dbeafe', order: 10, group: 'active' },
  installed:                { label: 'Installé',            color: '#15803d', bg: '#dcfce7', order: 11, group: 'done' },
  closed:                   { label: 'Terminé',             color: '#374151', bg: '#e5e7eb', order: 12, group: 'done' },
  cancelled:                { label: 'Annulé',              color: '#991b1b', bg: '#fee2e2', order: 13, group: 'done' },
  // Legacy values — display-mapped, never mutated in DB
  quoted:       { label: 'Devis envoyé',  color: '#6b21a8', bg: '#e9d5ff', order: 4,  group: 'in_progress', legacy: true },
  signed:       { label: 'Contrat signé', color: '#0891b2', bg: '#cffafe', order: 7,  group: 'active',      legacy: true },
  paid_in_full: { label: 'Terminé',       color: '#374151', bg: '#e5e7eb', order: 12, group: 'done',        legacy: true },
  scheduled:    { label: 'Planifié',      color: '#2563eb', bg: '#dbeafe', order: 10, group: 'active',      legacy: true },
};

// Fallback for unknown statuses — never crash
export function getStatusMeta(status) {
  const key = (status || 'draft').toLowerCase();
  return STATUS_META[key] || { label: status || 'Inconnu', color: '#6b7280', bg: '#f3f4f6', order: 999, group: 'in_progress' };
}

// Ordered array of canonical (non-legacy) status keys
export const STATUS_ORDER = [
  'draft',
  'measuring',
  'awaiting_supplier',
  'awaiting_client_approval',
  'accepted',
  'contract_sent',
  'contract_signed',
  'awaiting_deposit',
  'deposit_received',
  'in_production',
  'installed',
  'closed',
  'cancelled',
];

export const STATUS_GROUPS = {
  in_progress: ['draft', 'measuring', 'awaiting_supplier', 'awaiting_client_approval'],
  active:      ['accepted', 'contract_sent', 'contract_signed', 'awaiting_deposit', 'deposit_received', 'in_production'],
  done:        ['installed', 'closed', 'cancelled'],
};

// Legacy statuses still in production data — grouped with active-ish so they show by default
export const LEGACY_ACTIVE_STATUSES = ['quoted', 'signed', 'scheduled'];

// Default active filter: show in_progress + active + legacy-active; hide done + paid_in_full
export const DEFAULT_ACTIVE_STATUSES = [...STATUS_GROUPS.in_progress, ...STATUS_GROUPS.active, ...LEGACY_ACTIVE_STATUSES];
