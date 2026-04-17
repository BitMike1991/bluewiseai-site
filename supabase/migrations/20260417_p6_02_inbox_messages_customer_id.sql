-- M2: Add customer_id to inbox_messages (P6 S155)
-- Backfills from inbox_leads.customer_id (TEXT -> INTEGER cast)
-- Adds NOT NULL check, FK to customers, and index

-- UP
BEGIN;

ALTER TABLE inbox_messages ADD COLUMN customer_id INTEGER;

UPDATE inbox_messages m
SET customer_id = il.customer_id::integer
FROM inbox_leads il
WHERE m.lead_id = il.id AND m.customer_id IS NULL;

-- Guard: abort if any NULLs remain (orphaned lead_id references)
DO $$
DECLARE null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM inbox_messages WHERE customer_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'M2 ABORT: % inbox_messages rows still NULL after backfill — check orphaned lead_id references', null_count;
  END IF;
END $$;

ALTER TABLE inbox_messages
  ADD CONSTRAINT inbox_messages_customer_id_not_null CHECK (customer_id IS NOT NULL) NOT VALID;
ALTER TABLE inbox_messages VALIDATE CONSTRAINT inbox_messages_customer_id_not_null;

ALTER TABLE inbox_messages
  ADD CONSTRAINT inbox_messages_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id);

CREATE INDEX IF NOT EXISTS idx_inbox_messages_customer_id ON inbox_messages(customer_id);

COMMIT;

-- DOWN
-- DROP INDEX IF EXISTS idx_inbox_messages_customer_id;
-- ALTER TABLE inbox_messages DROP CONSTRAINT IF EXISTS inbox_messages_customer_id_fkey;
-- ALTER TABLE inbox_messages DROP CONSTRAINT IF EXISTS inbox_messages_customer_id_not_null;
-- ALTER TABLE inbox_messages DROP COLUMN IF EXISTS customer_id;
