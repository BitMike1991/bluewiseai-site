import { A } from '../commandeReducer';
import { getWindowTypes, getEntryDoorStyles, getPatioCollections } from '@/lib/hub/catalog-data';
import { Card, Grid } from '@/components/hub/ui';

const WINDOW_TYPE_LIST = [
  { key: 'battant', label: 'Battant', sub: 'Casement' },
  { key: 'auvent', label: 'Auvent', sub: 'Awning' },
  { key: 'guillotine', label: 'Guillotine', sub: 'Hung' },
  { key: 'coulissante', label: 'Coulissante', sub: 'Sliding' },
  { key: 'fixe', label: 'Fixe', sub: 'Picture' },
  { key: 'baie', label: 'Baie', sub: 'Bay window' },
  { key: 'arc', label: 'Arc', sub: 'Bow window' },
];

const ENTRY_DOOR_LIST = [
  { key: 'single', label: 'Porte simple' },
  { key: 'single_1side', label: 'Porte + 1 latéral G' },
  { key: 'single_1side_R', label: 'Porte + 1 latéral D' },
  { key: 'single_2sides', label: 'Porte + 2 latéraux' },
  { key: 'double_post', label: '2 portes + poteau fixe' },
  { key: 'double_astragal', label: '2 portes + astragale' },
  { key: 'single_side_astragal', label: 'Porte + latéral G + astragale' },
  { key: 'single_side_astragal_R', label: 'Porte + astragale + latéral D' },
];

export default function TypePicker({ state, dispatch }) {
  if (!state.category) return null;

  if (state.category === 'window') {
    return (
      <Grid cols={4} gap="10px">
        {WINDOW_TYPE_LIST.map((t) => (
          <Card
            key={t.key}
            title={t.label}
            description={t.sub}
            active={state.window_type === t.key}
            onClick={() => dispatch({ type: A.SET_WINDOW_TYPE, payload: t.key })}
          />
        ))}
      </Grid>
    );
  }

  if (state.category === 'entry_door') {
    return (
      <Grid cols={3} gap="10px">
        {ENTRY_DOOR_LIST.map((t) => (
          <Card
            key={t.key}
            title={t.label}
            active={state.entry_door_style === t.key}
            onClick={() => dispatch({ type: A.SET_ENTRY_DOOR_STYLE, payload: t.key })}
          />
        ))}
      </Grid>
    );
  }

  if (state.category === 'patio_door') {
    const PATIO_LIST = [
      { key: 'odyssee', label: 'Odyss\u00e9e', sub: 'PVC coulissante' },
      { key: 'belle_vue_prima', label: 'Belle-Vue Prima', sub: 'PVC premium' },
      { key: 'belle_vue_prestige', label: 'Belle-Vue Prestige', sub: 'Hybride alu ext.' },
      { key: 'belle_vue_levante', label: 'Belle-Vue Levante', sub: 'Lift & Slide' },
    ];
    return (
      <Grid cols={2} gap="10px">
        {PATIO_LIST.map((p) => (
          <Card
            key={p.key}
            title={p.label}
            description={p.sub}
            active={state.patio_collection === p.key}
            onClick={() => dispatch({ type: A.SET_PATIO_COLLECTION, payload: p.key })}
          />
        ))}
      </Grid>
    );
  }

  return null;
}
