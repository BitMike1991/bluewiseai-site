-- Sentinelle P-07 — runner execution log
-- Every invocation of /api/sentinelle/run-all gets one row here (via n8n Sentinelle Runner).
-- Lets us audit missed schedules, latency regressions, and alert fan-out counts independently
-- of individual check rows.

CREATE TABLE IF NOT EXISTS public.system_health_runs (
  id              bigserial PRIMARY KEY,
  run_id          uuid,
  started_at      timestamptz NOT NULL,
  duration_ms     integer,
  summary         jsonb NOT NULL DEFAULT '{}'::jsonb,
  events_written  integer,
  alerted_count   integer NOT NULL DEFAULT 0,
  http_status     integer,
  error_detail    text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shr_started_at
  ON public.system_health_runs (started_at DESC);

ALTER TABLE public.system_health_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_read_runs" ON public.system_health_runs;
CREATE POLICY "owner_read_runs" ON public.system_health_runs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.customer_users cu
    WHERE cu.user_id = auth.uid() AND cu.role = 'owner'
  ));
