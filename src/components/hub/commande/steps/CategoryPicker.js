import { AppWindow, DoorOpen, Home } from 'lucide-react';
import { A } from '../commandeReducer';
import { Card, Grid } from '@/components/hub/ui';

const CATEGORIES = [
  { key: 'window', icon: <AppWindow size={32} aria-hidden="true" />, title: 'Fenêtre', desc: 'Battant, auvent, guillotine...' },
  { key: 'entry_door', icon: <DoorOpen size={32} aria-hidden="true" />, title: 'Porte d\'entrée', desc: 'Simple, double, latéraux...' },
  { key: 'patio_door', icon: <Home size={32} aria-hidden="true" />, title: 'Porte patio', desc: 'Coulissante 2-4 volets' },
];

export default function CategoryPicker({ state, dispatch }) {
  return (
    <Grid cols={3} gap="12px">
      {CATEGORIES.map((cat) => (
        <Card
          key={cat.key}
          icon={cat.icon}
          title={cat.title}
          description={cat.desc}
          active={state.category === cat.key}
          onClick={() => dispatch({ type: A.SET_CATEGORY, payload: cat.key })}
        />
      ))}
    </Grid>
  );
}
