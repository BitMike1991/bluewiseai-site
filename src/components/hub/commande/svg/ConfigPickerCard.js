import WindowConfigSVG from './WindowConfigSVG';
import EntryDoorSVG from './EntryDoorSVG';
import PatioDoorSVG from './PatioDoorSVG';
import s from '../commande.module.css';

export default function ConfigPickerCard({
  category,
  // Window props
  windowType,
  config,
  // Entry door props
  styleKey,
  slab,
  // Patio props
  patioConfig,
  // Common
  code,
  label,
  sublabel,
  active,
  onClick,
}) {
  let svg;
  if (category === 'window' && config) {
    svg = <WindowConfigSVG type={windowType} config={config} width={80} height={60} />;
  } else if (category === 'entry_door' && styleKey) {
    svg = <EntryDoorSVG styleKey={styleKey} width={70} height={80} />;
  } else if (category === 'patio_door' && patioConfig) {
    svg = <PatioDoorSVG config={patioConfig} width={90} height={55} />;
  }

  return (
    <button
      type="button"
      className={`${s.configCard} ${active ? s.configCardActive : ''}`}
      onClick={onClick}
    >
      <div className={s.configSvg}>{svg}</div>
      <div className={s.configCode}>{code}</div>
      {label && <div className={s.configNotation}>{label}</div>}
      {sublabel && <div className={s.configDims}>{sublabel}</div>}
    </button>
  );
}
