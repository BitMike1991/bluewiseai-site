import CatalogPage from './CatalogPage';

export default function CatalogPromo() {
  return (
    <CatalogPage
      title="Promotions en cours"
      sections={[{
        title: 'Offres spéciales',
        cols: 2,
        items: [
          {
            name: '8+ fenêtres = porte entrée gratuite',
            description: 'Porte acier standard avec ou sans thermos (clair ou sablé). Vitrail = extra à discuter.',
            badge: 'PROMO',
            badgeColor: 'green',
          },
        ],
      }]}
    />
  );
}
