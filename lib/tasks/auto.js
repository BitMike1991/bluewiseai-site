// lib/tasks/auto.js
// Emit follow-up tasks automatically on pipeline events. Tasks are Jérémy-
// readable (French), dedup on (job_id, type, status=open), and never delete —
// only marked 'skipped'/'completed'.

// Event → tasks to create. Multiple tasks per event supported.
const EVENT_TASK_RULES = {
  quote_sent: [
    {
      type: 'follow_up',
      title: 'Relancer le client sur le devis',
      description: 'Si aucune réponse 7 jours après envoi du devis, relancer par SMS + appel.',
      dueDays: 7,
      priority: 'normal',
    },
  ],
  quote_accepted: [
    {
      type: 'verify',
      title: 'Vérifier la signature du contrat',
      description: 'Le client a accepté — s\'assurer qu\'il signe le contrat dans les 3 jours.',
      dueDays: 3,
      priority: 'high',
    },
  ],
  contract_signed: [
    {
      type: 'follow_up',
      title: 'Suivre l\'acompte Interac',
      description: 'Contrat signé. Relancer pour l\'acompte si non reçu dans 2 jours.',
      dueDays: 2,
      priority: 'high',
    },
  ],
  deposit_received: [
    {
      type: 'order',
      title: 'Commander le matériel fournisseur',
      description: 'Dépôt reçu — placer la commande Royalty / Novatech / Touchette selon le devis.',
      dueDays: 5,
      priority: 'high',
    },
    {
      type: 'schedule',
      title: 'Planifier la date d\'installation',
      description: 'Coordonner avec le client et l\'équipe pour une date d\'installation.',
      dueDays: 7,
      priority: 'normal',
    },
  ],
};

function addDays(dateIso, days) {
  const d = new Date(dateIso || new Date().toISOString());
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString();
}

/**
 * Create auto-tasks for a pipeline event, deduped by (job_id, type, open).
 * @param {any} supabase
 * @param {Object} opts
 * @param {number} opts.customerId
 * @param {string|number} opts.jobId - jobs.id
 * @param {number|null} [opts.leadId]
 * @param {string} opts.eventType - 'quote_sent' | 'quote_accepted' | 'contract_signed' | 'deposit_received'
 * @returns {Promise<Array>} created task rows (may be empty if all already existed)
 */
export async function createAutoTasks(supabase, opts) {
  const { customerId, jobId, leadId = null, eventType } = opts || {};
  const rules = EVENT_TASK_RULES[eventType];
  if (!rules || !rules.length) return [];
  if (!customerId || !jobId) return [];

  // Dedup: fetch open auto tasks for this job to avoid duplicates on event re-fire
  const { data: existing } = await supabase
    .from('tasks')
    .select('id, type, status')
    .eq('customer_id', customerId)
    .eq('job_id', jobId)
    .eq('source', 'auto');

  const openByType = new Set(
    (existing || [])
      .filter(t => t.status === 'open' || t.status === 'pending')
      .map(t => t.type)
  );

  const nowIso = new Date().toISOString();
  const rowsToInsert = rules
    .filter(r => !openByType.has(r.type))
    .map(r => ({
      customer_id: customerId,
      job_id: jobId,
      lead_id: leadId,
      type: r.type,
      title: r.title,
      description: r.description,
      status: 'open',
      priority: r.priority || 'normal',
      due_at: addDays(nowIso, r.dueDays),
      source: 'auto',
      board: 'pipeline',
    }));

  if (!rowsToInsert.length) return [];

  const { data: inserted, error } = await supabase
    .from('tasks')
    .insert(rowsToInsert)
    .select('id, type, title, due_at');

  if (error) {
    console.warn('[tasks/auto] insert failed', error.message);
    return [];
  }
  return inserted || [];
}
