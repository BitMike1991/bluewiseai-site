import { useState } from 'react';
import { AppWindow, DoorOpen, Home } from 'lucide-react';
import CatalogEmbed from '@/components/hub/catalogs/CatalogEmbed';
import s from './fiches.module.css';

const SECTIONS = [
  { id: 'battant', icon: <AppWindow size={32} aria-hidden="true" />, title: 'Fenêtre à battant', desc: 'Casement — modèle #1 au Québec' },
  { id: 'auvent', icon: <AppWindow size={32} aria-hidden="true" />, title: 'Fenêtre à auvent', desc: 'Awning — sous-sol & espaces compacts' },
  { id: 'coulissante', icon: <AppWindow size={32} aria-hidden="true" />, title: 'Fenêtre coulissante', desc: 'Sliding — économique horizontale' },
  { id: 'guillotine', icon: <AppWindow size={32} aria-hidden="true" />, title: 'Fenêtre à guillotine', desc: 'Hung — classique verticale' },
  { id: 'baybow', icon: <AppWindow size={32} aria-hidden="true" />, title: 'Bay Bow & Panoramique', desc: 'Architectural & grand format' },
  { id: 'porte-entree', icon: <DoorOpen size={32} aria-hidden="true" />, title: 'Porte d\'entrée', desc: 'Acier isolé R16 — garanties & options' },
  { id: 'odyssee', icon: <Home size={32} aria-hidden="true" />, title: 'Porte patio Odyssée', desc: 'Portes Standard — économique PVC' },
  { id: 'prima', icon: <Home size={32} aria-hidden="true" />, title: 'Belle-Vue Prima', desc: 'Portes Standard — premium PVC' },
  { id: 'prestige', icon: <Home size={32} aria-hidden="true" />, title: 'Belle-Vue Prestige', desc: 'Portes Standard — hybride haut de gamme' },
];

export default function FichesChooser() {
  const [activeSection, setActiveSection] = useState(null);

  if (activeSection) {
    return (
      <div>
        <button className={s.backBtn} onClick={() => setActiveSection(null)}>
          &larr; Toutes les fiches
        </button>
        <CatalogEmbed
          src={`/fiches-tech/index.html#${activeSection}`}
          title="Fiches Techniques"
        />
      </div>
    );
  }

  return (
    <div className={s.chooser}>
      <h2 className={s.chooserTitle}>Fiches Techniques</h2>
      <p className={s.chooserSub}>Choisir un produit</p>
      <div className={s.chooserGrid}>
        {SECTIONS.map((sec) => (
          <button
            key={sec.id}
            className={s.chooserCard}
            onClick={() => setActiveSection(sec.id)}
          >
            <span className={s.chooserIcon}>{sec.icon}</span>
            <span className={s.chooserName}>{sec.title}</span>
            <span className={s.chooserDesc}>{sec.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
