import { A } from '../commandeReducer';
import { Input, Select, Textarea } from '@/components/hub/ui';
import s from '../commande.module.css';

export default function ProjectInfo({ state, dispatch }) {
  const set = (field) => (e) =>
    dispatch({ type: A.SET_PROJECT_FIELD, field, value: e.target.value });

  return (
    <div className={s.projectInfo}>
      <div className={s.gridRow2}>
        <Input label="Client" value={state.project.client} onChange={set('client')} placeholder="Nom du client" />
        <Input label="Référence" value={state.project.ref} onChange={set('ref')} placeholder="ex: PUR-240415" />
      </div>
      <Input label="Adresse" value={state.project.address} onChange={set('address')} placeholder="Adresse du projet" />
      <div className={s.gridRow2}>
        <Input label="Date souhaitée" type="date" value={state.project.date} onChange={set('date')} />
        <Select label="Urgence" value={state.project.urgency} onChange={set('urgency')}>
          <option value="standard">Standard</option>
          <option value="urgent">Urgent</option>
          <option value="rush">RUSH</option>
        </Select>
      </div>
      <Input label="Contact" value={state.project.contact} onChange={set('contact')} placeholder="Jeremy · (514) 926-7669" />
      <Textarea label="Notes" value={state.project.notes} onChange={set('notes')} placeholder="Notes pour le fournisseur..." />
    </div>
  );
}
