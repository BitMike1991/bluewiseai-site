-- Migration: 20260418_pg_01_expenses_job_ref
-- P-D/P-G: add source + source_ref to expenses table for BC-linked material cost tracking
-- job_id was already present (bigint, nullable)

-- UP
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS source_ref TEXT;
CREATE INDEX IF NOT EXISTS idx_expenses_job_id ON expenses(job_id);
CREATE INDEX IF NOT EXISTS idx_expenses_source_ref ON expenses(source_ref);

COMMENT ON COLUMN expenses.source IS 'Origin of the expense: bon_de_commande | manual | import';
COMMENT ON COLUMN expenses.source_ref IS 'Reference number (BC number, import batch, etc.)';

-- DOWN
-- ALTER TABLE expenses DROP COLUMN IF EXISTS source;
-- ALTER TABLE expenses DROP COLUMN IF EXISTS source_ref;
-- DROP INDEX IF EXISTS idx_expenses_job_id;
-- DROP INDEX IF EXISTS idx_expenses_source_ref;
