-- UP: Set default price_display_mode for existing PUR quotes (customer_id=9) where missing
UPDATE quotes
SET meta = COALESCE(meta, '{}'::jsonb) || '{"price_display_mode":"unitaire"}'::jsonb
WHERE customer_id = 9
  AND (meta IS NULL OR NOT (meta ? 'price_display_mode'));

-- DOWN: Remove price_display_mode from PUR quotes (customer_id=9)
-- UPDATE quotes
-- SET meta = meta - 'price_display_mode'
-- WHERE customer_id = 9;
