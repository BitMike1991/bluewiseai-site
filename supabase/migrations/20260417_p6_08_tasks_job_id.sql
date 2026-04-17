-- M8: Add job_id FK to tasks (P6 S155)
-- No backfill — tasks.lead_id remains the primary linkage
-- ON DELETE SET NULL: task survives if job is deleted

-- UP
BEGIN;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS job_id INTEGER;

ALTER TABLE tasks
  ADD CONSTRAINT tasks_job_id_fkey FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_job_id ON tasks(job_id);

COMMIT;

-- DOWN
-- DROP INDEX IF EXISTS idx_tasks_job_id;
-- ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_job_id_fkey;
-- ALTER TABLE tasks DROP COLUMN IF EXISTS job_id;
