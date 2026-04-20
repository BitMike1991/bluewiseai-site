-- Phase 2: divisions-inside-tenant (employee model)
-- Foundation schema only — no row-level backfill on leads/jobs/quotes/BC yet (Phase 3).

-- 1. divisions table
CREATE TABLE IF NOT EXISTS public.divisions (
  id               bigserial PRIMARY KEY,
  customer_id      integer NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  slug             text NOT NULL,
  name             text NOT NULL,
  owner_share_pct  numeric(5,2) NOT NULL DEFAULT 100
                   CHECK (owner_share_pct >= 0 AND owner_share_pct <= 100),
  enabled_hub_tools jsonb NOT NULL DEFAULT '[]'::jsonb,
  active           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT divisions_slug_lowercase CHECK (slug = lower(slug)),
  CONSTRAINT divisions_slug_format CHECK (slug ~ '^[a-z][a-z0-9_]{1,31}$'),
  CONSTRAINT divisions_tools_is_array CHECK (jsonb_typeof(enabled_hub_tools) = 'array')
);

CREATE UNIQUE INDEX IF NOT EXISTS divisions_customer_slug_uidx
  ON public.divisions (customer_id, slug);
CREATE INDEX IF NOT EXISTS divisions_customer_active_idx
  ON public.divisions (customer_id) WHERE active;

-- 2. updated_at trigger
CREATE OR REPLACE FUNCTION public.divisions_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS divisions_updated_at ON public.divisions;
CREATE TRIGGER divisions_updated_at
  BEFORE UPDATE ON public.divisions
  FOR EACH ROW EXECUTE FUNCTION public.divisions_set_updated_at();

-- 3. RLS on divisions (same pattern as other tenant tables)
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON public.divisions;
CREATE POLICY tenant_isolation ON public.divisions
  FOR ALL
  USING (customer_id = public.current_customer_id())
  WITH CHECK (customer_id = public.current_customer_id());

-- 4. customer_users.division_id + role CHECK
ALTER TABLE public.customer_users
  ADD COLUMN IF NOT EXISTS division_id bigint
    REFERENCES public.divisions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS customer_users_division_idx
  ON public.customer_users (division_id)
  WHERE division_id IS NOT NULL;

ALTER TABLE public.customer_users
  DROP CONSTRAINT IF EXISTS customer_users_role_check;
ALTER TABLE public.customer_users
  ADD CONSTRAINT customer_users_role_check
    CHECK (role IN ('owner','admin','manager','employee'));

-- Invariant: a division_id must belong to the same customer as the user row.
CREATE OR REPLACE FUNCTION public.customer_users_division_consistency()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  div_customer_id integer;
BEGIN
  IF NEW.division_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT customer_id INTO div_customer_id
    FROM public.divisions WHERE id = NEW.division_id;
  IF div_customer_id IS NULL THEN
    RAISE EXCEPTION 'division_id % does not exist', NEW.division_id;
  END IF;
  IF div_customer_id <> NEW.customer_id THEN
    RAISE EXCEPTION 'division_id % belongs to customer % but user row customer_id is %',
      NEW.division_id, div_customer_id, NEW.customer_id;
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS customer_users_division_consistency_trg ON public.customer_users;
CREATE TRIGGER customer_users_division_consistency_trg
  BEFORE INSERT OR UPDATE OF division_id, customer_id ON public.customer_users
  FOR EACH ROW EXECUTE FUNCTION public.customer_users_division_consistency();

-- 5. RLS helpers for Phase 3
CREATE OR REPLACE FUNCTION public.current_division_id()
RETURNS bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cu.division_id
    FROM public.customer_users cu
   WHERE cu.user_id = auth.uid()
   LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cu.role
    FROM public.customer_users cu
   WHERE cu.user_id = auth.uid()
   LIMIT 1
$$;

-- user_can_see_division(row_division_id):
--   owner/admin OR unscoped user → true
--   scoped user (has division_id) → row must match their division
CREATE OR REPLACE FUNCTION public.user_can_see_division(row_division_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN cu.role IN ('owner','admin') THEN true
    WHEN cu.division_id IS NULL THEN true
    ELSE row_division_id = cu.division_id
  END
  FROM public.customer_users cu
  WHERE cu.user_id = auth.uid()
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.current_division_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_can_see_division(bigint) TO authenticated, service_role;

COMMENT ON TABLE public.divisions IS
  'Phase 2 — sub-units inside a tenant (e.g. PUR: Fenêtres vs Toiture). Managers/employees are scoped to one division; owners see all.';
COMMENT ON COLUMN public.divisions.owner_share_pct IS
  'Percentage of profit from this division''s jobs that goes to the tenant owner (Jérémy). Partner keeps 100 - owner_share_pct.';
COMMENT ON COLUMN public.divisions.enabled_hub_tools IS
  'Array of hub tool slugs visible inside this division. Subset of customers.enabled_hub_tools.';
COMMENT ON COLUMN public.customer_users.division_id IS
  'NULL = user sees all divisions of their tenant (owner/admin). Non-null = scoped to one division.';
