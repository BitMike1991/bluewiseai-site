import CatalogPage from './CatalogPage';

export default function CatalogRevetement() {
  return (
    <CatalogPage
      title="Catalogue Revêtement"
      sections={[{
        title: 'Revêtement extérieur',
        items: [
          { name: 'Vinyle', description: 'Disponible chez plusieurs fournisseurs' },
          { name: 'Aluminium', description: 'OAM Aluzion — Saint-Eustache QC' },
          { name: 'Fibrociment', description: 'Résistant, esthétique bois' },
          { name: 'Bois torréfié', description: 'Naturel, traité thermiquement' },
        ],
      }]}
    />
  );
}
