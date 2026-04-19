import { WINDOW_TYPES, COLLECTIONS, WINDOW_COLORS } from '@/lib/hub/catalog-data';
import CatalogPage from './CatalogPage';

export default function CatalogFenetres({ onAddToCommande }) {
  const windowSection = {
    title: 'Types de fenêtres — Groupe Royalty',
    cols: 3,
    items: Object.values(WINDOW_TYPES).map((wt) => ({
      name: wt.name,
      description: wt.description?.slice(0, 120) + '...',
      specs: [
        wt.specs?.profile,
        wt.specs?.thermos_thickness ? `Thermos ${wt.specs.thermos_thickness}` : null,
        wt.configurations ? `${wt.configurations.length} configs` : null,
      ].filter(Boolean),
      addData: { category: 'window', window_type: wt.id },
    })),
  };

  const collectionSection = {
    title: 'Collections',
    cols: 4,
    items: Object.values(COLLECTIONS).map((col) => ({
      name: col.name,
      description: `${col.style} — ${col.materials?.join(', ')}`,
      badge: col.colors_available === 'all_6_plus_custom' ? '6+ couleurs' : 'Blanc',
      badgeColor: col.colors_available === 'all_6_plus_custom' ? 'blue' : 'default',
    })),
  };

  return (
    <CatalogPage
      title="Catalogue Fenêtres"
      sections={[windowSection, collectionSection]}
      onAddToCommande={onAddToCommande}
    />
  );
}
