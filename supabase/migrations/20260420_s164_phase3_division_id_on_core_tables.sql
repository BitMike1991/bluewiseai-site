-- Phase 3: put division_id on the 4 core tenant-scoped tables, backfill PUR, and
-- extend RLS to filter by user_can_see_division() so partner roles only see their division.

-- 1. Reusable consistency trigger — division_id must belong to the row's customer
CREATE OR REPLACE FUNCTION public.enforce_row_division_matches_customer()
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
    RAISE EXCEPTION 'division_id % belongs to customer % but row customer_id is %',
      NEW.division_id, div_customer_id, NEW.customer_id;
  END IF;
  RETURN NEW;
END
$$;

-- 2. Add division_id to leads, jobs, quotes, bons_de_commande
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS division_id bigint REFERENCES public.divisions(id) ON DELETE SET NULL;
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS division_id bigint REFERENCES public.divisions(id) ON DELETE SET NULL;
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS division_id bigint REFERENCES public.divisions(id) ON DELETE SET NULL;
ALTER TABLE public.bons_de_commande
  ADD COLUMN IF NOT EXISTS division_id bigint REFERENCES public.divisions(id) ON DELETE SET NULL;

-- 3. Partial indices
CREATE INDEX IF NOT EXISTS leads_division_idx ON public.leads (division_id) WHERE division_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS jobs_division_idx ON public.jobs (division_id) WHERE division_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS quotes_division_idx ON public.quotes (division_id) WHERE division_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS bdc_division_idx ON public.bons_de_commande (division_id) WHERE division_id IS NOT NULL;

-- 4. Attach consistency trigger to all 4 tables
DROP TRIGGER IF EXISTS leads_division_consistency_trg ON public.leads;
CREATE TRIGGER leads_division_consistency_trg
  BEFORE INSERT OR UPDATE OF division_id, customer_id ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.enforce_row_division_matches_customer();

DROP TRIGGER IF EXISTS jobs_division_consistency_trg ON public.jobs;
CREATE TRIGGER jobs_division_consistency_trg
  BEFORE INSERT OR UPDATE OF division_id, customer_id ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.enforce_row_division_matches_customer();

DROP TRIGGER IF EXISTS quotes_division_consistency_trg ON public.quotes;
CREATE TRIGGER quotes_division_consistency_trg
  BEFORE INSERT OR UPDATE OF division_id, customer_id ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_row_division_matches_customer();

DROP TRIGGER IF EXISTS bdc_division_consistency_trg ON public.bons_de_commande;
CREATE TRIGGER bdc_division_consistency_trg
  BEFORE INSERT OR UPDATE OF division_id, customer_id ON public.bons_de_commande
  FOR EACH ROW EXECUTE FUNCTION public.enforce_row_division_matches_customer();

-- 5. Backfill PUR cid=9 → fenetres_portes (Jérémy's default division)
DO $$
DECLARE
  pur_fenetres_id bigint;
BEGIN
  SELECT id INTO pur_fenetres_id
    FROM public.divisions
    WHERE customer_id = 9 AND slug = 'fenetres_portes';
  IF pur_fenetres_id IS NULL THEN
    RAISE EXCEPTION 'PUR fenetres_portes division not found — seed missing';
  END IF;

  UPDATE public.leads            SET division_id = pur_fenetres_id WHERE customer_id = 9 AND division_id IS NULL;
  UPDATE public.jobs             SET division_id = pur_fenetres_id WHERE customer_id = 9 AND division_id IS NULL;
  UPDATE public.quotes           SET division_id = pur_fenetres_id WHERE customer_id = 9 AND division_id IS NULL;
  UPDATE public.bons_de_commande SET division_id = pur_fenetres_id WHERE customer_id = 9 AND division_id IS NULL;
END$$;

-- 6. Extend RLS policies with user_can_see_division(division_id)
--    Owner/admin always pass (fn returns true). Scoped users must match their division.

-- leads had 4 overlapping policies — consolidate into one coherent policy.
DROP POLICY IF EXISTS leads_crud_own    ON public.leads;
DROP POLICY IF EXISTS leads_insert_own  ON public.leads;
DROP POLICY IF EXISTS leads_select_own  ON public.leads;
DROP POLICY IF EXISTS leads_update_own  ON public.leads;
CREATE POLICY leads_tenant_division_scope ON public.leads
  FOR ALL
  USING (customer_id = public.current_customer_id() AND public.user_can_see_division(division_id))
  WITH CHECK (customer_id = public.current_customer_id() AND public.user_can_see_division(division_id));

DROP POLICY IF EXISTS tenant_isolation ON public.jobs;
CREATE POLICY tenant_isolation ON public.jobs
  FOR ALL
  USING (customer_id = public.current_customer_id() AND public.user_can_see_division(division_id))
  WITH CHECK (customer_id = public.current_customer_id() AND public.user_can_see_division(division_id));

DROP POLICY IF EXISTS tenant_isolation ON public.quotes;
CREATE POLICY tenant_isolation ON public.quotes
  FOR ALL
  USING (customer_id = public.current_customer_id() AND public.user_can_see_division(division_id))
  WITH CHECK (customer_id = public.current_customer_id() AND public.user_can_see_division(division_id));

DROP POLICY IF EXISTS tenant_isolation_bdc ON public.bons_de_commande;
CREATE POLICY tenant_isolation_bdc ON public.bons_de_commande
  FOR ALL
  USING (customer_id = public.current_customer_id() AND public.user_can_see_division(division_id))
  WITH CHECK (customer_id = public.current_customer_id() AND public.user_can_see_division(division_id));

COMMENT ON COLUMN public.leads.division_id IS 'Division scope — NULL = unassigned (owner/admin only). Auto-tagged on creation.';
COMMENT ON COLUMN public.jobs.division_id IS 'Division scope — usually inherits from linked lead on creation.';
COMMENT ON COLUMN public.quotes.division_id IS 'Division scope — usually inherits from linked lead/job on creation.';
COMMENT ON COLUMN public.bons_de_commande.division_id IS 'Division scope — usually inherits from linked quote.';
