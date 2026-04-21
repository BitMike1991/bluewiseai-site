-- P02 — QBO tax code mappings per tenant
-- Applied via mcp__supabase__apply_migration "p02_qbo_tax_mappings" on 2026-04-21.
-- Repo copy for traceability; IF NOT EXISTS guards make re-run a no-op.

CREATE TABLE IF NOT EXISTS public.qbo_tax_mappings (
  id                    bigserial PRIMARY KEY,
  customer_id           integer NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  bw_tax_type           text    NOT NULL,
  qbo_tax_code_id       text    NOT NULL,
  qbo_tax_code_name     text,
  qbo_description       text,
  auto_seeded           boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT qbo_tax_mappings_type_check
    CHECK (bw_tax_type IN ('tps','tvq','both','exempt'))
);

CREATE UNIQUE INDEX IF NOT EXISTS qbo_tax_mappings_tenant_type_uidx
  ON public.qbo_tax_mappings (customer_id, bw_tax_type);

CREATE OR REPLACE FUNCTION public.qbo_tax_mappings_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS qbo_tax_mappings_updated_at ON public.qbo_tax_mappings;
CREATE TRIGGER qbo_tax_mappings_updated_at
  BEFORE UPDATE ON public.qbo_tax_mappings
  FOR EACH ROW EXECUTE FUNCTION public.qbo_tax_mappings_set_updated_at();

ALTER TABLE public.qbo_tax_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qbo_tax_mappings FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON public.qbo_tax_mappings;
CREATE POLICY tenant_isolation ON public.qbo_tax_mappings
  FOR ALL
  USING (customer_id = public.current_customer_id())
  WITH CHECK (customer_id = public.current_customer_id());

COMMENT ON TABLE public.qbo_tax_mappings IS
  'P02 — maps BW tax types (tps|tvq|both|exempt) to realm TaxCode.Id. Auto-seeded from QBO after OAuth; owner/admin can override via /api/settings/qbo/taxes.';
