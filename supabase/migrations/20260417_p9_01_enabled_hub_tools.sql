-- P9: Add enabled_hub_tools JSONB column to customers table
-- Controls which Hub tools are visible per tenant in the unified nav
--
-- UP
ALTER TABLE customers ADD COLUMN IF NOT EXISTS enabled_hub_tools JSONB DEFAULT '[]'::jsonb;

-- Seed PUR (cid=9) with 4 hub tools
UPDATE customers
SET enabled_hub_tools = '["commande", "toiture", "catalogues", "fiches"]'::jsonb
WHERE id = 9;

-- BW (cid=1) and SP (cid=8) keep default empty array (no Hub section shown)

-- DOWN
-- ALTER TABLE customers DROP COLUMN IF EXISTS enabled_hub_tools;
