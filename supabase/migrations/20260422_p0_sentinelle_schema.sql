-- Sentinelle P-00 — system health monitoring schema
-- 2026-04-22 — introduces 3 tables (registry, event log, VPS ping stream) used by the Sentinelle chain.
-- RLS: owner role only (matches current customer_users.role values; admin/manager can be added later).

CREATE TABLE IF NOT EXISTS public.system_health_checks (
  id                    text PRIMARY KEY,
  name                  text NOT NULL,
  category              text NOT NULL CHECK (category IN ('n8n','api','db','external','infra','data_quality')),
  criticality           text NOT NULL CHECK (criticality IN ('low','medium','high','critical')),
  interval_sec          integer NOT NULL DEFAULT 300 CHECK (interval_sec >= 60),
  enabled               boolean NOT NULL DEFAULT true,
  baseline              jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_run_at           timestamptz,
  last_status           text CHECK (last_status IN ('ok','warn','critical','error')),
  last_detail           text,
  last_ms               integer,
  consecutive_failures  integer NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_health_events (
  id              bigserial PRIMARY KEY,
  check_id        text NOT NULL REFERENCES public.system_health_checks(id) ON DELETE CASCADE,
  status          text NOT NULL CHECK (status IN ('ok','warn','critical','error')),
  detail          text,
  ms              integer,
  state_changed   boolean NOT NULL DEFAULT false,
  alerted         boolean NOT NULL DEFAULT false,
  alert_channels  jsonb NOT NULL DEFAULT '[]'::jsonb,
  acknowledged    boolean NOT NULL DEFAULT false,
  acknowledged_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_she_check_time
  ON public.system_health_events (check_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_she_state_change
  ON public.system_health_events (state_changed, created_at DESC)
  WHERE state_changed;

CREATE TABLE IF NOT EXISTS public.system_health_vps_pings (
  id           bigserial PRIMARY KEY,
  host         text NOT NULL,
  collected_at timestamptz NOT NULL,
  payload      jsonb NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shvp_host_time
  ON public.system_health_vps_pings (host, collected_at DESC);

ALTER TABLE public.system_health_checks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_vps_pings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_read_checks" ON public.system_health_checks;
CREATE POLICY "owner_read_checks" ON public.system_health_checks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.customer_users cu
    WHERE cu.user_id = auth.uid() AND cu.role = 'owner'
  ));

DROP POLICY IF EXISTS "owner_read_events" ON public.system_health_events;
CREATE POLICY "owner_read_events" ON public.system_health_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.customer_users cu
    WHERE cu.user_id = auth.uid() AND cu.role = 'owner'
  ));

DROP POLICY IF EXISTS "owner_ack_events" ON public.system_health_events;
CREATE POLICY "owner_ack_events" ON public.system_health_events FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.customer_users cu
    WHERE cu.user_id = auth.uid() AND cu.role = 'owner'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.customer_users cu
    WHERE cu.user_id = auth.uid() AND cu.role = 'owner'
  ));

DROP POLICY IF EXISTS "owner_read_vps_pings" ON public.system_health_vps_pings;
CREATE POLICY "owner_read_vps_pings" ON public.system_health_vps_pings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.customer_users cu
    WHERE cu.user_id = auth.uid() AND cu.role = 'owner'
  ));

CREATE OR REPLACE FUNCTION public.touch_system_health_checks_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_system_health_checks_updated_at ON public.system_health_checks;
CREATE TRIGGER trg_system_health_checks_updated_at
  BEFORE UPDATE ON public.system_health_checks
  FOR EACH ROW EXECUTE FUNCTION public.touch_system_health_checks_updated_at();
