import { WINDOW_TYPES, ENTRY_DOOR_SPECS, PATIO_DOOR_COLLECTIONS, COLLECTIONS } from '@/lib/hub/catalog-data';
import CatalogPage from './CatalogPage';

export default function CatalogFull({ onAddToCommande }) {
  const sections = [
    {
      title: `Fenêtres (${Object.keys(WINDOW_TYPES).length} types)`,
      cols: 4,
      items: Object.values(WINDOW_TYPES).map((wt) => ({
        name: wt.name,
        description: wt.en,
        specs: [`${wt.configurations?.length || 0} configs`],
        addData: { category: 'window', window_type: wt.id },
      })),
    },
    {
      title: `Portes d'entrée (${Object.keys(ENTRY_DOOR_SPECS).length} styles)`,
      cols: 4,
      items: Object.entries(ENTRY_DOOR_SPECS).map(([key, style]) => ({
        name: style.name,
        description: style.code,
        specs: style.slabs ? [`${style.slabs.length} slabs`] : [],
        addData: { category: 'entry_door', entry_door_style: key },
      })),
    },
    {
      title: `Portes patio (${Object.keys(PATIO_DOOR_COLLECTIONS).length} collections)`,
      cols: 3,
      items: Object.entries(PATIO_DOOR_COLLECTIONS).map(([key, col]) => ({
        name: col.name,
        description: col.type || '',
        addData: { category: 'patio_door', patio_collection: key },
      })),
    },
    {
      title: `Collections (${Object.keys(COLLECTIONS).length})`,
      cols: 4,
      items: Object.values(COLLECTIONS).map((col) => ({
        name: col.name,
        description: col.style,
      })),
    },
  ];

  return (
    <CatalogPage
      title="Catalogue Complet"
      sections={sections}
      onAddToCommande={onAddToCommande}
    />
  );
}
