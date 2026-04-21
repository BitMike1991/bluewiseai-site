-- Soft delete for leads
-- Applied via mcp__supabase__apply_migration "leads_soft_delete" on 2026-04-21.
-- Physical DELETE on leads is blocked by 8 child FKs all set to NO ACTION
-- (jobs, tasks, messages, inbox_leads, lead_events, send_logs, followups,
-- cold_recipients). Soft delete via deleted_at keeps every related row
-- intact while hiding the lead from the platform UI.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS leads_active_idx
  ON public.leads (customer_id) WHERE deleted_at IS NULL;

COMMENT ON COLUMN public.leads.deleted_at IS
  'Soft delete timestamp. NULL = active. Set by /api/leads/[id] DELETE; consumers must filter `WHERE deleted_at IS NULL`.';
