import { useRouter } from 'next/router';
import { AppWindow, DoorOpen, Layers, Tag, Package } from 'lucide-react';
import s from './catalogs.module.css';

const CATALOGS = [
  { slug: 'catalogues/fenetres', icon: <AppWindow size={36} aria-hidden="true" />, title: 'Fenêtres', desc: 'Battant, auvent, coulissante, guillotine, baie, arc' },
  { slug: 'catalogues/patio', icon: <DoorOpen size={36} aria-hidden="true" />, title: 'Portes patio', desc: 'Odyssée, Belle-Vue, coulissantes 2-4 volets' },
  { slug: 'catalogues/revetement', icon: <Layers size={36} aria-hidden="true" />, title: 'Revêtement', desc: 'Aluminium, vinyle, fibrociment, bois' },
  { slug: 'catalogues/promo', icon: <Tag size={36} aria-hidden="true" />, title: 'Promotions', desc: 'Offres spéciales et modèles en vedette' },
  { slug: 'catalogues/complet', icon: <Package size={36} aria-hidden="true" />, title: 'Catalogue complet', desc: 'Tous les produits — fenêtres, portes, patio' },
];

export default function CatalogChooser() {
  const router = useRouter();

  return (
    <div className={s.chooser}>
      <h2 className={s.chooserTitle}>Catalogues</h2>
      <p className={s.chooserSub}>Choisir un catalogue à consulter</p>
      <div className={s.chooserGrid}>
        {CATALOGS.map((cat) => (
          <button
            key={cat.slug}
            className={s.chooserCard}
            onClick={() => router.push(`/hub/${cat.slug}`, undefined, { shallow: true })}
          >
            <span className={s.chooserIcon}>{cat.icon}</span>
            <span className={s.chooserName}>{cat.title}</span>
            <span className={s.chooserDesc}>{cat.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
