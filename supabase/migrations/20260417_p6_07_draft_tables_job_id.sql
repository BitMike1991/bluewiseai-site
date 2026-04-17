-- M7: Add job_id FK to commande_drafts, toiture_drafts, roof_quotes (P6 S155)
-- No backfill — P10 will populate job_id for new drafts going forward
-- ON DELETE SET NULL: draft survives if job is deleted

-- UP (commande_drafts)
BEGIN;
ALTER TABLE commande_drafts ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE commande_drafts
  ADD CONSTRAINT commande_drafts_job_id_fkey FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_commande_drafts_job_id ON commande_drafts(job_id);
COMMIT;

-- UP (toiture_drafts)
BEGIN;
ALTER TABLE toiture_drafts ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE toiture_drafts
  ADD CONSTRAINT toiture_drafts_job_id_fkey FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_toiture_drafts_job_id ON toiture_drafts(job_id);
COMMIT;

-- UP (roof_quotes)
BEGIN;
ALTER TABLE roof_quotes ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE roof_quotes
  ADD CONSTRAINT roof_quotes_job_id_fkey FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_roof_quotes_job_id ON roof_quotes(job_id);
COMMIT;

-- DOWN (reverse order)
-- BEGIN;
-- DROP INDEX IF EXISTS idx_roof_quotes_job_id;
-- ALTER TABLE roof_quotes DROP CONSTRAINT IF EXISTS roof_quotes_job_id_fkey;
-- ALTER TABLE roof_quotes DROP COLUMN IF EXISTS job_id;
-- COMMIT;
-- BEGIN;
-- DROP INDEX IF EXISTS idx_toiture_drafts_job_id;
-- ALTER TABLE toiture_drafts DROP CONSTRAINT IF EXISTS toiture_drafts_job_id_fkey;
-- ALTER TABLE toiture_drafts DROP COLUMN IF EXISTS job_id;
-- COMMIT;
-- BEGIN;
-- DROP INDEX IF EXISTS idx_commande_drafts_job_id;
-- ALTER TABLE commande_drafts DROP CONSTRAINT IF EXISTS commande_drafts_job_id_fkey;
-- ALTER TABLE commande_drafts DROP COLUMN IF EXISTS job_id;
-- COMMIT;
