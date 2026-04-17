-- M6: Enable RLS on brain_* tables (P6 S155)
-- No public policies added — internal JARVIS tooling only
-- service_role always bypasses RLS (no access disruption)

-- UP
ALTER TABLE brain_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_notifications ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE brain_conversations IS 'RLS enabled S155 P6. Service role bypass. No public policies — internal JARVIS tooling.';
COMMENT ON TABLE brain_embeddings IS 'RLS enabled S155 P6.';
COMMENT ON TABLE brain_notifications IS 'RLS enabled S155 P6.';

-- DOWN
-- ALTER TABLE brain_conversations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE brain_embeddings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE brain_notifications DISABLE ROW LEVEL SECURITY;
