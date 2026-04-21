-- Soft delete for jobs (S167+1, 2026-04-21).
-- Same pattern as leads — physical DELETE blocked by 8+ child FKs (quotes,
-- contracts, payments, expenses, bons_de_commande, job_events, tasks, etc.).
-- Soft delete keeps the audit trail intact while removing the project from
-- the platform UI.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS jobs_active_idx
  ON public.jobs (customer_id) WHERE deleted_at IS NULL;

COMMENT ON COLUMN public.jobs.deleted_at IS
  'Soft delete timestamp. NULL = active. Set by /api/jobs/[id] DELETE; consumers must filter `WHERE deleted_at IS NULL`.';
