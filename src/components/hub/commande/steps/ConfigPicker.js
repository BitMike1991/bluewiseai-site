import { A } from '../commandeReducer';
import { getWindowTypes, getPatioCollections, getPatioConfigs, ENTRY_DOOR_STYLES } from '@/lib/hub/catalog-data';
import { Grid } from '@/components/hub/ui';
import WindowConfigSVG from '../svg/WindowConfigSVG';
import EntryDoorSVG from '../svg/EntryDoorSVG';
import PatioDoorSVG from '../svg/PatioDoorSVG';
import s from '../commande.module.css';

/**
 * Step 3 — SVG config picker with real SVG renderers.
 */
export default function ConfigPicker({ state, dispatch }) {
  if (state.category === 'window' && state.window_type) {
    const types = getWindowTypes(state.item_supplier);
    const typeData = types[state.window_type];
    if (!typeData?.configurations) return null;

    return (
      <Grid cols={4} gap="8px">
        {typeData.configurations.map((cfg) => {
          const variant = cfg.variant ? ` \u00b7 ${cfg.variant}` : '';
          return (
            <button
              key={cfg.code}
              type="button"
              className={`${s.configCard} ${state.config?.code === cfg.code ? s.configCardActive : ''}`}
              onClick={() => dispatch({ type: A.SET_CONFIG, payload: cfg })}
            >
              <div className={s.configSvg}>
                <WindowConfigSVG type={state.window_type} config={cfg} width={80} height={60} />
              </div>
              <div className={s.configCode}>{cfg.code}</div>
              <div className={s.configNotation}>{cfg.notation}{variant}</div>
              <div className={s.configDims}>{cfg.min.w}&ndash;{cfg.max.w}&quot; &times; {cfg.min.h}&ndash;{cfg.max.h}&quot;</div>
            </button>
          );
        })}
      </Grid>
    );
  }

  if (state.category === 'entry_door' && state.entry_door_style) {
    const style = ENTRY_DOOR_STYLES[state.entry_door_style];
    if (!style?.slabs) return null;

    return (
      <Grid cols={3} gap="10px">
        {style.slabs.map((slab) => {
          const code = `${style.code}-${slab.slab_w}`;
          const isActive = state.config?.code === code;
          return (
            <button
              key={slab.slab_w}
              type="button"
              className={`${s.configCard} ${isActive ? s.configCardActive : ''}`}
              onClick={() => dispatch({
                type: A.SET_CONFIG,
                payload: { code, slab, style },
              })}
            >
              <div className={s.configSvg}>
                <EntryDoorSVG styleKey={state.entry_door_style} width={70} height={80} />
              </div>
              <div className={s.configCode}>Slab {slab.slab_w}&quot;</div>
              <div className={s.configNotation}>{style.code}</div>
              <div className={s.configDims}>
                Cadre 1&frac14;: {slab.frame_1_1_4}&quot;<br />
                Cadre 1&frac12;: {slab.frame_1_1_2}&quot;
              </div>
            </button>
          );
        })}
      </Grid>
    );
  }

  if (state.category === 'patio_door' && state.patio_collection) {
    const configs = getPatioConfigs(state.item_supplier);
    if (!configs || configs.length === 0) return null;

    return (
      <Grid cols={4} gap="8px">
        {configs.map((cfg) => (
          <button
            key={cfg.code}
            type="button"
            className={`${s.configCard} ${state.config?.code === cfg.code ? s.configCardActive : ''}`}
            onClick={() => dispatch({ type: A.SET_CONFIG, payload: cfg })}
          >
            <div className={s.configSvg}>
              <PatioDoorSVG config={cfg} width={90} height={55} />
            </div>
            <div className={s.configCode}>{cfg.code}</div>
            <div className={s.configNotation}>{cfg.panels?.length || '?'} volets</div>
            <div className={s.configDims}>{cfg.min.w}&ndash;{cfg.max.w}&quot; &times; {cfg.min.h}&ndash;{cfg.max.h}&quot;</div>
          </button>
        ))}
      </Grid>
    );
  }

  return null;
}
