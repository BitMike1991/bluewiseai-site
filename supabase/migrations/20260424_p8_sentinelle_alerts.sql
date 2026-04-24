-- Sentinelle P-08 — alert fan-out + future 30-min voice escalation.
-- Two tables:
--   system_health_alerts       — every alert the router SENT (after dedupe)
--   system_health_escalations  — pending critical alerts awaiting 30-min voice escalation
--                                (populated by P-08 router; drained by a P-08c poll workflow)

CREATE TABLE IF NOT EXISTS public.system_health_alerts (
  id              bigserial PRIMARY KEY,
  check_id        text NOT NULL REFERENCES public.system_health_checks(id) ON DELETE CASCADE,
  from_status     text,
  to_status       text NOT NULL,
  criticality     text NOT NULL,
  detail          text,
  channels        jsonb NOT NULL DEFAULT '[]'::jsonb,
  digest          boolean NOT NULL DEFAULT false,
  digest_items    jsonb,
  forwarded_at    timestamptz,
  n8n_status      integer,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sha_check_time
  ON public.system_health_alerts (check_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sha_recent
  ON public.system_health_alerts (created_at DESC);

CREATE TABLE IF NOT EXISTS public.system_health_escalations (
  id               bigserial PRIMARY KEY,
  check_id         text NOT NULL REFERENCES public.system_health_checks(id) ON DELETE CASCADE,
  alert_id         bigint REFERENCES public.system_health_alerts(id) ON DELETE SET NULL,
  triggered_at     timestamptz NOT NULL DEFAULT now(),
  escalate_after   timestamptz NOT NULL,
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','voice_sent','resolved','cancelled')),
  voice_call_id    text,
  resolved_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_she_pending
  ON public.system_health_escalations (escalate_after)
  WHERE status = 'pending';

ALTER TABLE public.system_health_alerts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_escalations  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_read_alerts" ON public.system_health_alerts;
CREATE POLICY "owner_read_alerts" ON public.system_health_alerts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.customer_users cu
    WHERE cu.user_id = auth.uid() AND cu.role = 'owner'
  ));

DROP POLICY IF EXISTS "owner_read_escalations" ON public.system_health_escalations;
CREATE POLICY "owner_read_escalations" ON public.system_health_escalations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.customer_users cu
    WHERE cu.user_id = auth.uid() AND cu.role = 'owner'
  ));

CREATE OR REPLACE FUNCTION public.touch_system_health_escalations_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_system_health_escalations_updated_at ON public.system_health_escalations;
CREATE TRIGGER trg_system_health_escalations_updated_at
  BEFORE UPDATE ON public.system_health_escalations
  FOR EACH ROW EXECUTE FUNCTION public.touch_system_health_escalations_updated_at();
