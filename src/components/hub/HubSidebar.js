import { useState } from 'react';
import { ClipboardList, Home, Package, FileText, Receipt } from 'lucide-react';
import s from '@/styles/hub.module.css';

const NAV_ITEMS = [
  { key: 'commande', label: 'Commande', icon: <ClipboardList size={20} aria-hidden="true" />, slug: '' },
  { key: 'toiture', label: 'Toiture', icon: <Home size={20} aria-hidden="true" />, slug: 'toiture' },
  {
    key: 'catalogues',
    label: 'Catalogues',
    icon: <Package size={20} aria-hidden="true" />,
    slug: 'catalogues',
    children: [
      { key: 'cat-fenetres', label: 'Fenêtres', slug: 'catalogues/fenetres' },
      { key: 'cat-patio', label: 'Patio', slug: 'catalogues/patio' },
      { key: 'cat-revetement', label: 'Revêtement', slug: 'catalogues/revetement' },
      { key: 'cat-promo', label: 'Promo', slug: 'catalogues/promo' },
      { key: 'cat-complet', label: 'Complet', slug: 'catalogues/complet' },
    ],
  },
  { key: 'devis', label: 'Devis', icon: <Receipt size={20} aria-hidden="true" />, slug: 'devis' },
  { key: 'fiches', label: 'Fiches Tech', icon: <FileText size={20} aria-hidden="true" />, slug: 'fiches' },
];

export default function HubSidebar({ activeTool, onNavigate, expanded, onToggle }) {
  const [expandedGroup, setExpandedGroup] = useState(null);

  function handleClick(item) {
    if (item.children) {
      setExpandedGroup(expandedGroup === item.key ? null : item.key);
      // Navigate to chooser page for this group
      if (!activeTool.startsWith(item.slug)) {
        onNavigate(item.slug);
      }
    } else {
      onNavigate(item.slug);
    }
  }

  function isActive(item) {
    if (item.slug === '') return activeTool === '';
    return activeTool === item.slug || activeTool.startsWith(item.slug + '/');
  }

  return (
    <nav className={`${s.sidebar} ${expanded ? s.sidebarExpanded : ''}`}>
      {expanded ? (
        <img src="/images/pur-logo-rbq-white.png" alt="PÜR" className={s.sidebarExpandedLogo} />
      ) : (
        <img src="/images/pur-logo-rbq-white.png" alt="PÜR" className={s.sidebarLogo} />
      )}

      <button
        className={s.sidebarToggle}
        onClick={onToggle}
        title={expanded ? 'Réduire le menu' : 'Agrandir le menu'}
        aria-label={expanded ? 'Réduire le menu' : 'Agrandir le menu'}
      >
        {expanded ? '◀' : '▶'}
      </button>

      {NAV_ITEMS.map((item) => (
        <div key={item.key} className={item.children ? s.navGroup : undefined}>
          <button
            className={[
              s.navItem,
              isActive(item) ? s.navItemActive : '',
              expanded ? s.navItemExpanded : '',
            ].filter(Boolean).join(' ')}
            onClick={() => handleClick(item)}
            title={!expanded ? item.label : undefined}
            aria-label={item.label}
          >
            <span>{item.icon}</span>
            {expanded && <span className={s.navItemLabel}>{item.label}</span>}
            {item.children && expanded && (
              <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.4 }}>
                {expandedGroup === item.key ? '▾' : '▸'}
              </span>
            )}
          </button>

          {item.children && (expandedGroup === item.key || isActive(item)) && (
            item.children.map((child) => (
              <button
                key={child.key}
                className={[
                  s.navSubItem,
                  activeTool === child.slug ? s.navSubItemActive : '',
                  expanded ? s.navSubItemExpanded : '',
                ].filter(Boolean).join(' ')}
                onClick={() => onNavigate(child.slug)}
                title={!expanded ? child.label : undefined}
                aria-label={child.label}
              >
                <span>•</span>
                {expanded && <span className={s.navSubItemLabel}>{child.label}</span>}
              </button>
            ))
          )}
        </div>
      ))}
    </nav>
  );
}

// Exported for bottom tab bar use
export { NAV_ITEMS };
