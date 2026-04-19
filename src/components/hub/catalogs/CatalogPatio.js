import { PATIO_DOOR_COLLECTIONS, PORTES_STANDARD_PATIO } from '@/lib/hub/catalog-data';
import CatalogPage from './CatalogPage';

export default function CatalogPatio({ onAddToCommande }) {
  const royaltySection = {
    title: 'Portes patio — Groupe Royalty',
    cols: 2,
    items: Object.entries(PATIO_DOOR_COLLECTIONS).map(([key, col]) => ({
      name: col.name,
      description: col.description || col.type || '',
      specs: col.configurations ? [`${col.configurations.length} configurations`] : [],
      addData: { category: 'patio_door', patio_collection: key },
    })),
  };

  const psSection = {
    title: 'Portes patio — Portes Standard (via Touchette)',
    cols: 2,
    items: (Array.isArray(PORTES_STANDARD_PATIO) ? PORTES_STANDARD_PATIO : []).map((col) => ({
      name: col.name,
      description: col.type || '',
      specs: col.specs?.items?.slice(0, 3) || [],
    })),
  };

  return (
    <CatalogPage
      title="Catalogue Portes Patio"
      sections={[royaltySection, psSection]}
      onAddToCommande={onAddToCommande}
    />
  );
}
