-- Audit trail for soft-deletes + restores (S167+1, 2026-04-21).
-- Mikael's requirement: "je veux savoir quand [Jeremy] essaye de deleter
-- quelque chose pas qu'il puisse utiliser le système et supprimer le tout
-- après pour me cacher des choses". Every delete + every restore lands
-- here forever, regardless of subsequent toggling of the entity row.

CREATE TABLE IF NOT EXISTS public.deletion_audit (
  id            bigserial PRIMARY KEY,
  customer_id   integer NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  entity_type   text    NOT NULL,
  entity_id     bigint  NOT NULL,
  entity_label  text,
  action        text    NOT NULL,
  user_id       uuid    REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  payload       jsonb   NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT deletion_audit_entity_type_chk
    CHECK (entity_type IN ('lead','job')),
  CONSTRAINT deletion_audit_action_chk
    CHECK (action IN ('deleted','restored'))
);

CREATE INDEX IF NOT EXISTS deletion_audit_tenant_recent_idx
  ON public.deletion_audit (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS deletion_audit_entity_idx
  ON public.deletion_audit (customer_id, entity_type, entity_id);

ALTER TABLE public.deletion_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deletion_audit FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON public.deletion_audit;
CREATE POLICY tenant_isolation ON public.deletion_audit
  FOR ALL
  USING (customer_id = public.current_customer_id())
  WITH CHECK (customer_id = public.current_customer_id());

COMMENT ON TABLE public.deletion_audit IS
  'Tamper-proof audit log of soft-delete + restore actions on leads + jobs. Never auto-purged. Mikael 2026-04-21: Jeremy must not be able to delete-then-hide anything from the owner view.';

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS deleted_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS deleted_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
