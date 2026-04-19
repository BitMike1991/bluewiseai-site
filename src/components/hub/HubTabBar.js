import { ClipboardList, Home, Package, FileText, Receipt } from 'lucide-react';
import s from '@/styles/hub.module.css';

const TABS = [
  { key: 'commande', label: 'Commande', icon: <ClipboardList size={22} aria-hidden="true" />, slug: '' },
  { key: 'toiture', label: 'Toiture', icon: <Home size={22} aria-hidden="true" />, slug: 'toiture' },
  { key: 'catalogues', label: 'Catalogues', icon: <Package size={22} aria-hidden="true" />, slug: 'catalogues' },
  { key: 'devis', label: 'Devis', icon: <Receipt size={22} aria-hidden="true" />, slug: 'devis' },
  { key: 'fiches', label: 'Fiches', icon: <FileText size={22} aria-hidden="true" />, slug: 'fiches' },
];

export default function HubTabBar({ activeTool, onNavigate }) {
  function isActive(tab) {
    if (tab.slug === '') return activeTool === '';
    return activeTool.startsWith(tab.key);
  }

  return (
    <div className={s.tabBar}>
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`${s.tabItem} ${isActive(tab) ? s.tabItemActive : ''}`}
          onClick={() => onNavigate(tab.slug)}
          aria-label={tab.label}
        >
          <span className={s.tabItemIcon}>{tab.icon}</span>
          <span className={s.tabItemLabel}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
