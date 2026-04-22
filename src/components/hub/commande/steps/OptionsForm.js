import { A } from '../commandeReducer';
import { Input, Select } from '@/components/hub/ui';
import { COLLECTIONS, WINDOW_COLORS, ENTRY_DOOR_MODELS } from '@/lib/hub/catalog-data';
import s from '../commande.module.css';

// Canonical color palette exposed in every ext/int selector. Mikael
// 2026-04-22: "selecteur de tout partout" — the full set is always
// available; collection only drives the DEFAULT, not what's allowed.
// Example: Thomas Gigandet wants PVC blanc ext / brun int (rare combo,
// not in the old PVC-only palette). Fine.
const COLOR_OPTIONS = [
  'Blanc',
  'Noir',
  'Anodisé',
  'Charbon',
  'Brun commercial',
  'Sur mesure',
];

export default function OptionsForm({ state, dispatch }) {
  const set = (field) => (e) =>
    dispatch({ type: A.SET_FORM_FIELD, field, value: e.target.value });

  if (state.category === 'window') {
    return (
      <div className={s.optionsGrid}>
        <div className={s.gridRow2}>
          <Select label="Collection" value={state.form.collection} onChange={set('collection')}>
            <option value="pvc">PVC</option>
            <option value="hybride">Hybride aluminium</option>
          </Select>
          <Input label="Épaisseur du cadre" value={state.form.frame_thickness} onChange={set('frame_thickness')} placeholder="ex: 4 9/16, 6 9/16" />
        </div>
        <div className={s.gridRow2}>
          <Select label="Couleur extérieure" value={state.form.color_ext} onChange={set('color_ext')}>
            {COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select label="Couleur intérieure" value={state.form.color_int} onChange={set('color_int')}>
            {COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <div className={s.gridRow2}>
          <Select label="Thermos" value={state.form.thermos} onChange={set('thermos')}>
            <option value="double">Double Low-E Argon</option>
            <option value="triple">Triple Low-E Argon</option>
            <option value="lamine">Laminé</option>
            <option value="givre">Givré</option>
            <option value="gluechip">Gluechip</option>
          </Select>
          <Select label="Moustiquaire" value={String(state.form.moustiquaire)} onChange={(e) => dispatch({ type: A.SET_FORM_FIELD, field: 'moustiquaire', value: e.target.value === 'true' })}>
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </Select>
        </div>
        <div className={s.gridRow2}>
          <Select label="Norme egress" value={state.form.egress} onChange={set('egress')}>
            <option value="rencontre">Rencontrée</option>
            <option value="non">Non rencontrée</option>
            <option value="na">N/A</option>
          </Select>
          <Select label="Carrelages" value={state.form.grille} onChange={set('grille')}>
            <option value="none">Aucun</option>
            <option value="georgien_58">Georgien 5/8&quot;</option>
            <option value="georgien_1">Georgien 1&quot;</option>
            <option value="rectangulaire">Rectangulaire 5/16&quot;</option>
            <option value="tubulaire">Tubulaire 1/4&quot;</option>
          </Select>
        </div>
      </div>
    );
  }

  if (state.category === 'entry_door') {
    return (
      <div className={s.optionsGrid}>
        <div className={s.gridRow2}>
          <Input label="Profondeur cadre" value={state.form.frame_depth} onChange={set('frame_depth')} placeholder="ex: 1 1/4, 1 1/2" />
          <Input label="&Eacute;paisseur du cadre" value={state.form.frame_thickness} onChange={set('frame_thickness')} placeholder="ex: 4 9/16, 6 9/16" />
        </div>
        <div className={s.gridRow2}>
          <Select label="Mod&egrave;le porte" value={state.form.door_model} onChange={set('door_model')}>
            {ENTRY_DOOR_MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </Select>
          <Select label="Sens ouvrant" value={state.form.swing} onChange={set('swing')}>
            <option value="gauche">Gauche (vue extérieur)</option>
            <option value="droite">Droite (vue extérieur)</option>
          </Select>
        </div>
        <div className={s.gridRow3}>
          <Select label="Couleur extérieure" value={state.form.color_ext} onChange={set('color_ext')}>
            {COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select label="Couleur intérieure" value={state.form.color_int} onChange={set('color_int')}>
            {COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select label="Moulure" value={state.form.moulding} onChange={set('moulding')}>
            <option value="contemporaine">Hybride contemporaine</option>
            <option value="coloniale">Hybride coloniale</option>
          </Select>
        </div>
        <div className={s.gridRow3}>
          <Select label="Poignée" value={state.form.handle} onChange={set('handle')}>
            <option value="fournis_client">Fournis par client</option>
            <option value="fournis_contracteur">Fournis par contracteur</option>
          </Select>
          <Select label="Seuil" value={state.form.sill} onChange={set('sill')}>
            <option value="anodise_clair">Anodisé clair</option>
            <option value="anodise_noir">Anodisé noir</option>
          </Select>
          <Select label="Serrure" value={state.form.lock} onChange={set('lock')}>
            <option value="1_trou">1 trou</option>
            <option value="2_trous">2 trous</option>
          </Select>
        </div>
        <div className={s.gridRow2}>
          <Input label="Verre (optionnel)" value={state.form.glass} onChange={set('glass')} placeholder="ex: Cathedral 21×65" />
          <Select label="Pentures finis" value={state.form.hinges} onChange={set('hinges')}>
            <option value="argent">Argent</option>
            <option value="laiton">Laiton</option>
          </Select>
        </div>
      </div>
    );
  }

  if (state.category === 'patio_door') {
    return (
      <div className={s.optionsGrid}>
        <div className={s.gridRow3}>
          <Input label="&Eacute;paisseur du cadre" value={state.form.frame_thickness} onChange={set('frame_thickness')} placeholder="ex: 4 9/16, 5 1/2, 7 1/4" />
          <Select label="Couleur extérieure" value={state.form.color_ext} onChange={set('color_ext')}>
            {COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select label="Couleur intérieure" value={state.form.color_int} onChange={set('color_int')}>
            {COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <div className={s.gridRow3}>
          <Select label="Verre" value={state.form.glass_type} onChange={set('glass_type')}>
            <option value="double">Double Low-E Argon</option>
            <option value="triple">Triple Low-E</option>
          </Select>
          <Select label="Stores intégrés" value={state.form.blinds} onChange={set('blinds')}>
            <option value="none">Aucun</option>
            <option value="blanc">Blanc</option>
            <option value="argent">Argent</option>
            <option value="gris_ardoise">Gris ardoise</option>
            <option value="espresso">Espresso</option>
            <option value="beige">Beige</option>
            <option value="sable">Sable</option>
          </Select>
        </div>
        <div className={s.gridRow3}>
          <Select label="Moustiquaire" value={String(state.form.moustiquaire)} onChange={(e) => dispatch({ type: A.SET_FORM_FIELD, field: 'moustiquaire', value: e.target.value === 'true' })}>
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </Select>
          <Input label="Poignée" value={state.form.handle} onChange={set('handle')} />
          <Select label="Carrelages / barrotins" value={state.form.grille} onChange={set('grille')}>
            <option value="none">Aucune</option>
            <option value="barrotin_1x4">Barrotin 1×4 (2&quot;)</option>
            <option value="barrotin_1x3">Barrotin 1×3 (2&quot;)</option>
            <option value="georgien">Georgien</option>
          </Select>
        </div>
      </div>
    );
  }

  return null;
}
