-- Phase 3.5: Extend RLS on ancillary tables so division scope propagates
-- transitively via EXISTS on already-scoped parent tables (leads, jobs).
-- Scoped users (role=manager/employee) currently see all cross-division events
-- on the activity feed because these tables filter by customer_id only.
--
-- Design: owner/admin always see everything (via role short-circuit); scoped
-- users only see rows where the linked lead/job is visible to them through
-- the leads/jobs RLS that already filters by user_can_see_division.

-- ── messages ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS messages_crud_own    ON public.messages;
DROP POLICY IF EXISTS messages_insert_own  ON public.messages;
DROP POLICY IF EXISTS messages_select_own  ON public.messages;
DROP POLICY IF EXISTS messages_update_own  ON public.messages;
CREATE POLICY messages_tenant_division_scope ON public.messages
  FOR ALL
  USING (
    (customer_id)::integer = public.current_customer_id()
    AND (
      public.current_user_role() IN ('owner','admin')
      OR (lead_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.leads l WHERE l.id = messages.lead_id))
    )
  )
  WITH CHECK (
    (customer_id)::integer = public.current_customer_id()
    AND (
      public.current_user_role() IN ('owner','admin')
      OR (lead_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.leads l WHERE l.id = messages.lead_id))
    )
  );

-- ── inbox_leads ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS inbox_leads_crud_own ON public.inbox_leads;
CREATE POLICY inbox_leads_tenant_division_scope ON public.inbox_leads
  FOR ALL
  USING (
    (customer_id)::integer = public.current_customer_id()
    AND (
      public.current_user_role() IN ('owner','admin')
      OR (lead_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.leads l WHERE l.id = inbox_leads.lead_id))
    )
  )
  WITH CHECK (
    (customer_id)::integer = public.current_customer_id()
    AND (
      public.current_user_role() IN ('owner','admin')
      OR (lead_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.leads l WHERE l.id = inbox_leads.lead_id))
    )
  );

-- ── inbox_lead_events ────────────────────────────────────────────────────
-- inbox_lead_events.lead_id → inbox_leads.id (NOT leads.id). Scope via inbox_leads.
DROP POLICY IF EXISTS inbox_lead_events_crud_own ON public.inbox_lead_events;
CREATE POLICY inbox_lead_events_tenant_division_scope ON public.inbox_lead_events
  FOR ALL
  USING (
    customer_id = public.current_customer_id()
    AND (
      public.current_user_role() IN ('owner','admin')
      OR EXISTS (SELECT 1 FROM public.inbox_leads il WHERE il.id = inbox_lead_events.lead_id)
    )
  )
  WITH CHECK (
    customer_id = public.current_customer_id()
    AND (
      public.current_user_role() IN ('owner','admin')
      OR EXISTS (SELECT 1 FROM public.inbox_leads il WHERE il.id = inbox_lead_events.lead_id)
    )
  );

-- ── tasks ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_isolation ON public.tasks;
CREATE POLICY tasks_tenant_division_scope ON public.tasks
  FOR ALL
  USING (
    customer_id = public.current_customer_id()
    AND (
      public.current_user_role() IN ('owner','admin')
      OR (lead_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.leads l WHERE l.id = tasks.lead_id))
      OR (lead_id IS NULL AND job_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = tasks.job_id))
    )
  )
  WITH CHECK (
    customer_id = public.current_customer_id()
    AND (
      public.current_user_role() IN ('owner','admin')
      OR (lead_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.leads l WHERE l.id = tasks.lead_id))
      OR (lead_id IS NULL AND job_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = tasks.job_id))
    )
  );

-- ── job_events ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_isolation ON public.job_events;
CREATE POLICY job_events_tenant_division_scope ON public.job_events
  FOR ALL
  USING (
    customer_id = public.current_customer_id()
    AND (
      public.current_user_role() IN ('owner','admin')
      OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_events.job_id)
    )
  )
  WITH CHECK (
    customer_id = public.current_customer_id()
    AND (
      public.current_user_role() IN ('owner','admin')
      OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_events.job_id)
    )
  );

-- ── payments ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_isolation ON public.payments;
CREATE POLICY payments_tenant_division_scope ON public.payments
  FOR ALL
  USING (
    customer_id = public.current_customer_id()
    AND (
      public.current_user_role() IN ('owner','admin')
      OR (job_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = payments.job_id))
    )
  )
  WITH CHECK (
    customer_id = public.current_customer_id()
    AND (
      public.current_user_role() IN ('owner','admin')
      OR (job_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = payments.job_id))
    )
  );

-- ── expenses ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_isolation ON public.expenses;
CREATE POLICY expenses_tenant_division_scope ON public.expenses
  FOR ALL
  USING (
    customer_id = public.current_customer_id()
    AND (
      public.current_user_role() IN ('owner','admin')
      OR (job_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = expenses.job_id))
    )
  )
  WITH CHECK (
    customer_id = public.current_customer_id()
    AND (
      public.current_user_role() IN ('owner','admin')
      OR (job_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = expenses.job_id))
    )
  );
