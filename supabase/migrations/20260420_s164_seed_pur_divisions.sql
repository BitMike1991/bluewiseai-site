-- Seed PUR Construction (customer_id=9) divisions.
-- Jérémy's world: Fenêtres/Portes (solo, 100% owner) + Toiture (partner, 25% owner / 75% partner).
INSERT INTO public.divisions (customer_id, slug, name, owner_share_pct, enabled_hub_tools, active)
VALUES
  (9, 'fenetres_portes', 'Fenêtres & Portes', 100.00,
    '["commande","bc","catalogues","fiches"]'::jsonb, true),
  (9, 'toiture', 'Toiture', 25.00,
    '["toiture"]'::jsonb, true)
ON CONFLICT (customer_id, slug) DO NOTHING;
