-- P01 — QBO Canada OAuth infrastructure
-- Applied via mcp__supabase__apply_migration as "p01_accounting_connections_and_qbo_cols" on 2026-04-21.
-- Kept in repo for traceability; re-running is a no-op (IF NOT EXISTS guards throughout).

-- 1. accounting_connections (generic — QBO first; Xero/Sage future)
CREATE TABLE IF NOT EXISTS public.accounting_connections (
  id                      bigserial PRIMARY KEY,
  customer_id             integer NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  provider                text    NOT NULL,
  realm_id                text,
  environment             text    NOT NULL DEFAULT 'production',
  access_token_encrypted  text,
  refresh_token_encrypted text,
  expires_at              timestamptz,
  scopes                  jsonb   NOT NULL DEFAULT '[]'::jsonb,
  company_name            text,
  legal_name              text,
  status                  text    NOT NULL DEFAULT 'active',
  connected_at            timestamptz NOT NULL DEFAULT now(),
  disconnected_at         timestamptz,
  last_error              text,
  meta                    jsonb   NOT NULL DEFAULT '{}'::jsonb,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT accounting_connections_provider_check
    CHECK (provider IN ('qbo','xero','sage')),
  CONSTRAINT accounting_connections_env_check
    CHECK (environment IN ('production','sandbox')),
  CONSTRAINT accounting_connections_status_check
    CHECK (status IN ('active','revoked','error','pending')),
  CONSTRAINT accounting_connections_scopes_is_array
    CHECK (jsonb_typeof(scopes) = 'array')
);

CREATE UNIQUE INDEX IF NOT EXISTS accounting_connections_customer_provider_uidx
  ON public.accounting_connections (customer_id, provider);

CREATE INDEX IF NOT EXISTS accounting_connections_active_idx
  ON public.accounting_connections (customer_id) WHERE status = 'active';

-- 2. updated_at trigger
CREATE OR REPLACE FUNCTION public.accounting_connections_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS accounting_connections_updated_at ON public.accounting_connections;
CREATE TRIGGER accounting_connections_updated_at
  BEFORE UPDATE ON public.accounting_connections
  FOR EACH ROW EXECUTE FUNCTION public.accounting_connections_set_updated_at();

-- 3. RLS — ENABLE + policy in the same pass (feedback_rls_enabled_zero_policies_traps)
ALTER TABLE public.accounting_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_connections FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON public.accounting_connections;
CREATE POLICY tenant_isolation ON public.accounting_connections
  FOR ALL
  USING (customer_id = public.current_customer_id())
  WITH CHECK (customer_id = public.current_customer_id());

COMMENT ON TABLE public.accounting_connections IS
  'P01 — OAuth tokens for accounting providers (QBO first). Access/refresh tokens are AES-256-GCM ciphertext via lib/tokenEncryption.js. realm_id = QBO company id.';

-- 4. quotes.qbo_* columns
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS qbo_invoice_id  text,
  ADD COLUMN IF NOT EXISTS qbo_synced_at   timestamptz,
  ADD COLUMN IF NOT EXISTS qbo_last_error  text;

CREATE INDEX IF NOT EXISTS quotes_qbo_invoice_id_idx
  ON public.quotes (customer_id, qbo_invoice_id)
  WHERE qbo_invoice_id IS NOT NULL;

COMMENT ON COLUMN public.quotes.qbo_invoice_id IS
  'P01 — QBO Invoice.Id after successful push. NULL = not synced. Unique per customer_id + realm combo.';

-- 5. Risk-3 (WAVE1-BASELINE.md) — seed cid=1 (BW) minimal quote_config scaffold
--    so downstream consumers (P02 tax defaults, P09 review_request, P18 RBQ/APCHQ)
--    can assume the object exists.
UPDATE public.customers
   SET quote_config = jsonb_build_object(
         'quote',     jsonb_build_object('prefix','BW','valid_days',30,'warranties',jsonb_build_array(),'exclusions',jsonb_build_array()),
         'branding',  jsonb_build_object('business_name','BlueWise AI','email','admin@bluewiseai.com'),
         'contract',  jsonb_build_object('legal_clauses',jsonb_build_array(),'deposit_required',false),
         'promotions',jsonb_build_array(),
         'review_request', jsonb_build_object(
           'enabled', false,
           'delay_hours', 24,
           'sms_fr', 'Merci pour votre confiance chez {business}. Laissez-nous un avis : {url}',
           'sms_en', 'Thanks for choosing {business}. Leave us a review: {url}'
         ),
         'payment_schedule', jsonb_build_array()
       ),
       updated_at = now()
 WHERE id = 1 AND quote_config IS NULL;
