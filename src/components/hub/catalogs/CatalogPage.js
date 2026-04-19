import { Card, Grid, Badge } from '@/components/hub/ui';
import s from './catalogs.module.css';

export default function CatalogPage({ title, sections, onAddToCommande }) {
  return (
    <div className={s.catalog}>
      <h2 className={s.catalogTitle}>{title}</h2>
      {sections.map((section, i) => (
        <div key={i} className={s.section}>
          {section.title && <h3 className={s.sectionTitle}>{section.title}</h3>}
          <Grid cols={section.cols || 3} gap="12px">
            {section.items.map((item, j) => (
              <div key={j} className={s.productCard}>
                <div className={s.productInfo}>
                  <div className={s.productName}>{item.name}</div>
                  {item.description && <div className={s.productDesc}>{item.description}</div>}
                  {item.specs && (
                    <div className={s.productSpecs}>
                      {item.specs.map((spec, k) => (
                        <span key={k} className={s.spec}>{spec}</span>
                      ))}
                    </div>
                  )}
                  {item.badge && <Badge color={item.badgeColor || 'default'}>{item.badge}</Badge>}
                </div>
                {onAddToCommande && item.addData && (
                  <button
                    className={s.addBtn}
                    onClick={() => onAddToCommande(item.addData)}
                  >
                    Ajouter &agrave; la commande &rarr;
                  </button>
                )}
              </div>
            ))}
          </Grid>
        </div>
      ))}
    </div>
  );
}
