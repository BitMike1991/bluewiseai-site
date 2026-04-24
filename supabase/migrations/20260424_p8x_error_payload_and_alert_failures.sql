-- Sentinelle P-08x — robustness pass.
-- Adds copy-pasteable error_payload on events/alerts/checks so Mikael can paste a
-- Sentinelle alert straight into a JARVIS conversation and get an instant diagnosis.
-- Introduces system_health_alert_failures — self-monitoring: if both Mailgun and Telnyx
-- throw during an alert fan-out, the n8n router writes a row here so we don't lose the signal.

ALTER TABLE public.system_health_events
  ADD COLUMN IF NOT EXISTS error_payload jsonb;

ALTER TABLE public.system_health_alerts
  ADD COLUMN IF NOT EXISTS error_payload jsonb;

ALTER TABLE public.system_health_checks
  ADD COLUMN IF NOT EXISTS last_error_payload jsonb;

CREATE TABLE IF NOT EXISTS public.system_health_alert_failures (
  id             bigserial PRIMARY KEY,
  alert_id       bigint REFERENCES public.system_health_alerts(id) ON DELETE SET NULL,
  check_id       text,
  channel        text NOT NULL,
  http_status    integer,
  error          text,
  raw_response   text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shaf_created_at
  ON public.system_health_alert_failures (created_at DESC);

ALTER TABLE public.system_health_alert_failures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_read_alert_failures" ON public.system_health_alert_failures;
CREATE POLICY "owner_read_alert_failures" ON public.system_health_alert_failures FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.customer_users cu
    WHERE cu.user_id = auth.uid() AND cu.role = 'owner'
  ));
