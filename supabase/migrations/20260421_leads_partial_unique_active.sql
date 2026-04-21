-- Soft-deleted leads were blocking re-creation with the same phone/email
-- because the existing unique indexes covered ALL rows. Drop the table
-- constraints (which back the unique indexes) and recreate as partial
-- unique indexes scoped to active leads only.
-- Applied via mcp__supabase__apply_migration on 2026-04-21.

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_customer_email_unique;
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_customer_phone_uniq;

DROP INDEX IF EXISTS public.leads_customer_email_unique;
DROP INDEX IF EXISTS public.leads_customer_phone_uniq;

CREATE UNIQUE INDEX IF NOT EXISTS leads_customer_email_active_uniq
  ON public.leads (customer_id, email)
  WHERE deleted_at IS NULL AND email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS leads_customer_phone_active_uniq
  ON public.leads (customer_id, phone)
  WHERE deleted_at IS NULL AND phone IS NOT NULL;

COMMENT ON INDEX public.leads_customer_email_active_uniq IS
  'Email uniqueness scoped to active leads only — soft-deleted leads keep their email but do not block recreation.';
COMMENT ON INDEX public.leads_customer_phone_active_uniq IS
  'Phone uniqueness scoped to active leads only — soft-deleted leads keep their phone but do not block recreation.';
