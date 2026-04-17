-- M4: Add CHECK constraint on jobs.status (P6 S155)
-- Covers legacy values (quoted, signed, paid_in_full, scheduled)
-- AND new ERP pipeline values for P13 forward
-- Pre-flight audit result: quoted(19), paid_in_full(2), signed(2), scheduled(1) — all in set

-- UP
BEGIN;

ALTER TABLE jobs
  ADD CONSTRAINT jobs_status_check CHECK (status IN (
    -- New ERP pipeline values
    'draft', 'measuring', 'awaiting_supplier', 'awaiting_client_approval',
    'accepted', 'contract_sent', 'contract_signed', 'awaiting_deposit',
    'deposit_received', 'in_production', 'installed', 'closed', 'cancelled',
    -- Legacy values (migrate to new in P13 cutover)
    'quoted', 'signed', 'paid_in_full', 'scheduled'
  )) NOT VALID;

ALTER TABLE jobs VALIDATE CONSTRAINT jobs_status_check;

COMMENT ON CONSTRAINT jobs_status_check ON jobs IS 'S155 P6. Legacy + new ERP enum. Legacy values migrate to new in P13.';

COMMIT;

-- DOWN
-- ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
