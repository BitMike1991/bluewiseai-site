import { T } from '../toitureReducer';
import { Input, Textarea } from '@/components/hub/ui';
import s from '../toiture.module.css';

export default function ClientInfo({ state, dispatch }) {
  const set = (field) => (e) =>
    dispatch({ type: T.SET_CLIENT_FIELD, field, value: e.target.value });

  return (
    <div>
      <div className={s.formGrid2}>
        <Input label="Nom" value={state.client.name} onChange={set('name')} placeholder="Nom du client" />
        <Input label="Téléphone" value={state.client.phone} onChange={set('phone')} placeholder="(514) 000-0000" />
      </div>
      <div className={s.formGrid2} style={{ marginTop: 12 }}>
        <Input label="Courriel" type="email" value={state.client.email} onChange={set('email')} placeholder="email@exemple.com" />
        <Input label="Adresse" value={state.client.address} onChange={set('address')} placeholder="Adresse du projet" />
      </div>
      <div className={s.formGrid2} style={{ marginTop: 12 }}>
        <Input label="Ville" value={state.client.city} onChange={set('city')} placeholder="Ville" />
        <Input label="Code postal" value={state.client.postal} onChange={set('postal')} placeholder="J0K 1A0" />
      </div>
      <div style={{ marginTop: 12 }}>
        <Textarea label="Notes" value={state.client.notes} onChange={set('notes')} placeholder="Notes sur le projet..." />
      </div>
    </div>
  );
}
