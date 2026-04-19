import { useState } from 'react';
import s from './catalogs.module.css';

/**
 * Embeds existing polished HTML catalog/fiche pages inside the hub shell.
 * These are the magazine-quality pages Jeremy shows clients — we don't rebuild them,
 * we just wrap them in the hub navigation.
 */
export default function CatalogEmbed({ src, title }) {
  const [loading, setLoading] = useState(true);

  return (
    <div className={s.embedWrap}>
      {loading && (
        <div className={s.embedLoading}>Chargement...</div>
      )}
      <iframe
        src={src}
        title={title}
        className={s.embedFrame}
        onLoad={() => setLoading(false)}
        style={{ opacity: loading ? 0 : 1 }}
      />
    </div>
  );
}
