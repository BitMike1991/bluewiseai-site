-- UP: Create bons_de_commande table for P-C batch BC workflow
-- One BC per supplier per batch — customer_id scoped, RLS enabled

CREATE TABLE IF NOT EXISTS bons_de_commande (
  id             SERIAL PRIMARY KEY,
  customer_id    INTEGER NOT NULL REFERENCES customers(id),
  bc_number      TEXT UNIQUE NOT NULL,
  supplier       TEXT NOT NULL,  -- 'royalty' | 'touchette' | 'other'
  status         TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','sent','received')),
  item_refs      JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Array of { quote_id, item_index, job_id, project_number }
  html_content   TEXT,
  sent_at        TIMESTAMPTZ,
  received_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bdc_customer    ON bons_de_commande(customer_id);
CREATE INDEX IF NOT EXISTS idx_bdc_supplier    ON bons_de_commande(supplier, status);
CREATE INDEX IF NOT EXISTS idx_bdc_bc_number   ON bons_de_commande(bc_number);

-- RLS
ALTER TABLE bons_de_commande ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_bdc" ON bons_de_commande
  USING (customer_id = current_setting('app.current_tenant', true)::integer)
  WITH CHECK (customer_id = current_setting('app.current_tenant', true)::integer);

-- DOWN (commented — run manually to revert)
-- DROP TABLE IF EXISTS bons_de_commande;
