import { WINDOW_TYPES, ENTRY_DOOR_SPECS, PATIO_DOOR_COLLECTIONS, THERMOS_TYPES, COLLECTIONS, WINDOW_COLORS } from '@/lib/hub/catalog-data';
import s from './fiches.module.css';

export default function FichesTechPage() {
  return (
    <div className={s.fiches}>
      <h2 className={s.title}>Fiches Techniques</h2>

      {/* Windows */}
      <section className={s.section}>
        <h3 className={s.sectionTitle}>Fen&ecirc;tres</h3>
        {Object.values(WINDOW_TYPES).map((wt) => (
          <div key={wt.id} className={s.fiche}>
            <div className={s.ficheHeader}>
              <span className={s.ficheName}>{wt.name}</span>
              <span className={s.ficheEn}>{wt.en}</span>
            </div>
            {wt.description && <p className={s.ficheDesc}>{wt.description}</p>}
            {wt.specs && (
              <div className={s.specGrid}>
                {wt.specs.profile && <div><strong>Profil:</strong> {wt.specs.profile}</div>}
                {wt.specs.thermos_thickness && <div><strong>Thermos:</strong> {wt.specs.thermos_thickness}</div>}
                {wt.specs.weatherstripping && <div><strong>Coupe-froid:</strong> {wt.specs.weatherstripping}</div>}
                {wt.specs.energy_star && <div><strong>Energy Star:</strong> Oui</div>}
              </div>
            )}
            {wt.configurations && (
              <div className={s.configTable}>
                <table>
                  <thead>
                    <tr><th>Code</th><th>Notation</th><th>Min</th><th>Max</th></tr>
                  </thead>
                  <tbody>
                    {wt.configurations.map((cfg) => (
                      <tr key={cfg.code}>
                        <td>{cfg.code}</td>
                        <td>{cfg.notation}{cfg.variant ? ` (${cfg.variant})` : ''}</td>
                        <td>{cfg.min.w}&quot;&times;{cfg.min.h}&quot;</td>
                        <td>{cfg.max.w}&quot;&times;{cfg.max.h}&quot;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Thermos */}
      <section className={s.section}>
        <h3 className={s.sectionTitle}>Types de thermos</h3>
        {Object.values(THERMOS_TYPES).map((t) => (
          <div key={t.id} className={s.fiche}>
            <div className={s.ficheHeader}>
              <span className={s.ficheName}>{t.name}</span>
            </div>
            <p className={s.ficheDesc}>{t.description}</p>
          </div>
        ))}
      </section>

      {/* Collections */}
      <section className={s.section}>
        <h3 className={s.sectionTitle}>Collections</h3>
        {Object.values(COLLECTIONS).map((col) => (
          <div key={col.id} className={s.fiche}>
            <div className={s.ficheHeader}>
              <span className={s.ficheName}>{col.name}</span>
              <span className={s.ficheEn}>{col.style}</span>
            </div>
            <p className={s.ficheDesc}>{col.description}</p>
            <div className={s.specGrid}>
              <div><strong>Mat&eacute;riaux:</strong> {col.materials?.join(', ')}</div>
              <div><strong>Couleurs:</strong> {col.colors_available === 'all_6_plus_custom' ? '6+ couleurs' : 'Blanc seulement'}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Entry Doors */}
      <section className={s.section}>
        <h3 className={s.sectionTitle}>Portes d&rsquo;entr&eacute;e</h3>
        {Object.entries(ENTRY_DOOR_SPECS).map(([key, style]) => (
          <div key={key} className={s.fiche}>
            <div className={s.ficheHeader}>
              <span className={s.ficheName}>{style.name}</span>
              <span className={s.ficheEn}>{style.code}</span>
            </div>
            {style.slabs && (
              <div className={s.configTable}>
                <table>
                  <thead>
                    <tr><th>Slab</th><th>Cadre 1&frac14;&quot;</th><th>Cadre 1&frac12;&quot;</th></tr>
                  </thead>
                  <tbody>
                    {style.slabs.map((slab) => (
                      <tr key={slab.slab_w}>
                        <td>{slab.slab_w}&quot;</td>
                        <td>{slab.frame_1_1_4}&quot;</td>
                        <td>{slab.frame_1_1_2}&quot;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Patio */}
      <section className={s.section}>
        <h3 className={s.sectionTitle}>Portes patio</h3>
        {Object.entries(PATIO_DOOR_COLLECTIONS).map(([key, col]) => (
          <div key={key} className={s.fiche}>
            <div className={s.ficheHeader}>
              <span className={s.ficheName}>{col.name}</span>
            </div>
            {col.configurations && (
              <div className={s.configTable}>
                <table>
                  <thead>
                    <tr><th>Code</th><th>Volets</th><th>Min</th><th>Max</th></tr>
                  </thead>
                  <tbody>
                    {col.configurations.map((cfg) => (
                      <tr key={cfg.code}>
                        <td>{cfg.code}</td>
                        <td>{cfg.panels?.length}</td>
                        <td>{cfg.min?.w}&quot;&times;{cfg.min?.h}&quot;</td>
                        <td>{cfg.max?.w}&quot;&times;{cfg.max?.h}&quot;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
