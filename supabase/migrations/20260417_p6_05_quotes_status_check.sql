-- M5: Add CHECK constraint on quotes.status (P6 S155)
-- Full ERP quote lifecycle enum
-- Pre-flight audit result: superseded(8), ready(6), accepted(3) — all in set

-- UP
BEGIN;

ALTER TABLE quotes
  ADD CONSTRAINT quotes_status_check CHECK (status IN (
    'draft', 'awaiting_supplier', 'ready', 'sent', 'viewed',
    'accepted', 'superseded', 'expired', 'declined'
  )) NOT VALID;

ALTER TABLE quotes VALIDATE CONSTRAINT quotes_status_check;

COMMENT ON CONSTRAINT quotes_status_check ON quotes IS 'S155 P6. Full ERP quote lifecycle enum.';

COMMIT;

-- DOWN
-- ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
