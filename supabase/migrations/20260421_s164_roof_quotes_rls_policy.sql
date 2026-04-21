-- roof_quotes currently has RLS enabled but NO policies — blocks all authenticated reads.
-- Scope by customer + division via the linked job (if any) so the toiture partner
-- sees his own roof quotes and nothing else.

DROP POLICY IF EXISTS roof_quotes_crud_own           ON public.roof_quotes;
DROP POLICY IF EXISTS roof_quotes_tenant_division    ON public.roof_quotes;
DROP POLICY IF EXISTS tenant_isolation                ON public.roof_quotes;

CREATE POLICY roof_quotes_tenant_division ON public.roof_quotes
  FOR ALL
  USING (
    customer_id = public.current_customer_id()
    AND (
      public.current_user_role() IN ('owner','admin')
      OR (job_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = roof_quotes.job_id))
    )
  )
  WITH CHECK (
    customer_id = public.current_customer_id()
    AND (
      public.current_user_role() IN ('owner','admin')
      OR (job_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = roof_quotes.job_id))
    )
  );
