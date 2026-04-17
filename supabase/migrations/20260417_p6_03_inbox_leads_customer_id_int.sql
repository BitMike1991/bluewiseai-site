-- M3: Add parallel customer_id_int (INTEGER) to inbox_leads (P6 S155)
-- TEXT customer_id column kept for backward compat until P13 cutover
-- Only backfills rows where TEXT value is numeric

-- UP
BEGIN;

ALTER TABLE inbox_leads ADD COLUMN customer_id_int INTEGER;

-- Only backfill rows where TEXT is numeric (guard against unexpected non-numeric data)
UPDATE inbox_leads
SET customer_id_int = customer_id::integer
WHERE customer_id ~ '^[0-9]+$';

-- Report non-numeric rows (should be 0 — logged here for audit trail):
-- SELECT id, customer_id FROM inbox_leads WHERE customer_id !~ '^[0-9]+$';
-- Result at migration time: 0 rows

ALTER TABLE inbox_leads
  ADD CONSTRAINT inbox_leads_customer_id_int_fkey FOREIGN KEY (customer_id_int) REFERENCES customers(id);

CREATE INDEX IF NOT EXISTS idx_inbox_leads_customer_id_int ON inbox_leads(customer_id_int);

COMMENT ON COLUMN inbox_leads.customer_id_int IS 'Parallel INTEGER column added S155 P6. Prefer over TEXT customer_id. Old column kept for backward compat until P13 cutover.';

COMMIT;

-- DOWN
-- DROP INDEX IF EXISTS idx_inbox_leads_customer_id_int;
-- ALTER TABLE inbox_leads DROP CONSTRAINT IF EXISTS inbox_leads_customer_id_int_fkey;
-- ALTER TABLE inbox_leads DROP COLUMN IF EXISTS customer_id_int;
