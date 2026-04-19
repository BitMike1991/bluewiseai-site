/**
 * PÜR Hub v2 — Build item spec strings for display and export.
 * Direct port from commande-royalty.html buildItemSpecs().
 */
import { WINDOW_TYPES, THERMOS_TYPES, ENTRY_DOOR_SPECS_DEFAULT } from '@/lib/hub/catalog-data';

const THERMOS_LABELS = {
  double: 'Thermos 7/8" double Low-E Argon',
  triple: 'Thermos 1 1/4" triple Low-E Argon',
  lamine: 'Thermos laminé (insonorisation + sécurité)',
  givre: 'Thermos givré (intimité)',
  gluechip: 'Thermos gluechip (texturé)',
};

const isThermosLine = (line) => /^\s*Thermos\b/i.test(line);
const isPatioGlassLine = (line) => /^\s*Verre\b.*Low-E/i.test(line);

const GRILLE_LABELS = {
  georgien_58: 'Carrelages Georgien 5/8"',
  georgien_1: 'Carrelages Georgien 1"',
  rectangulaire: 'Carrelages Rectangulaire 5/16"',
  tubulaire: 'Carrelages Tubulaire 1/4"',
  georgien: 'Carrelages Georgien',
  barrotin_1x4: 'Barrotin 1×4 (2")',
  barrotin_1x3: 'Barrotin 1×3 (2")',
};

const PANEL_LABELS = {
  G: 'ouvrant gauche',
  D: 'ouvrant droite',
  F: 'volet fixe',
  A: 'auvent',
  Gs: 'volet mobile',
  Gd: 'volets mobiles haut+bas',
  X: 'volet mobile',
  O: 'volet fixe',
};

export function buildItemSpecs(item) {
  const specs = [];

  if (item.category === 'window') {
    const typeData = WINDOW_TYPES[item.window_type];
    if (typeData?.specs_default) {
      specs.push(...typeData.specs_default.filter((line) => !isThermosLine(line)));
    }
    if (item.config?.panels) {
      const labels = item.config.panels.map((p) => PANEL_LABELS[p] || p);
      specs.push('Configuration : ' + labels.join(' \u00b7 '));
    }
    if (item.collection_info) {
      specs.push(`Collection ${item.collection_info.name || item.collection} \u2014 ${item.collection_info.material || item.collection}`);
    }
    specs.push('Couleur : ' + (item.color_name || item.color));
    specs.push(THERMOS_LABELS[item.thermos] || item.thermos);
    if (item.moustiquaire) specs.push('Moustiquaire incluse');
    if (item.egress === 'rencontre') specs.push('Rencontre la norme egress');
    if (item.egress === 'non') specs.push('Ne rencontre pas la norme egress');
    if (item.grille && item.grille !== 'none') specs.push(GRILLE_LABELS[item.grille] || item.grille);
    if (item.frame_thickness) specs.push(`\u00c9paisseur du cadre : ${item.frame_thickness}`);
  } else if (item.category === 'entry_door') {
    if (ENTRY_DOOR_SPECS_DEFAULT) specs.push(...ENTRY_DOOR_SPECS_DEFAULT);
    if (item.style_info?.name) specs.push(`Style : ${item.style_info.name}`);
    specs.push(`Slab : ${item.slab_w}"  \u00b7  Cadre ${item.frame_depth === '1_1_4' ? '1 1/4" \u2014 hauteur 82 1/2"' : '1 1/2" \u2014 hauteur 82 3/4"'}`);
    specs.push(`Mod\u00e8le : ${item.door_model}`);
    specs.push(`Couleurs : ext\u00e9rieur ${item.color_ext} / int\u00e9rieur ${item.color_int}`);
    specs.push(`Moulure : hybride ${item.moulding}`);
    specs.push(`Sens ouvrant : ${item.swing} (vue ext\u00e9rieur)`);
    specs.push(`Poign\u00e9e : ${item.handle === 'fournis_client' ? 'Fournis par client' : 'Fournis par contracteur'}`);
    specs.push(`Seuil : aluminium ${(item.sill || '').replace('anodise_', 'anodis\u00e9 ')}`);
    specs.push(`Serrure : ${item.lock === '2_trous' ? '2 trous' : '1 trou'}`);
    specs.push(`Pentures : finis ${item.hinges}`);
    if (item.glass) specs.push(`Verre : ${item.glass}`);
    if (item.frame_thickness) specs.push(`\u00c9paisseur du cadre : ${item.frame_thickness}`);
  } else if (item.category === 'patio_door') {
    if (item.collection_info?.specs_default) {
      specs.push(
        ...item.collection_info.specs_default.filter(
          (line) => !isThermosLine(line) && !isPatioGlassLine(line)
        )
      );
    }
    if (item.config?.panels) {
      specs.push(`Configuration : ${item.config_code} (${item.config.panels.length} volets)`);
    }
    specs.push(`Cadre : ${item.frame}`);
    specs.push(`Couleurs : ext\u00e9rieur ${item.color_ext} / int\u00e9rieur ${item.color_int}`);
    specs.push(`Verre : ${item.glass_type === 'triple' ? 'Triple Low-E' : 'Double Low-E Argon'}`);
    if (item.blinds && item.blinds !== 'none') specs.push(`Stores int\u00e9gr\u00e9s : ${item.blinds}`);
    if (item.moustiquaire) specs.push('Moustiquaire incluse');
    if (item.handle) specs.push(`Poign\u00e9e : ${item.handle}`);
    if (item.grille && item.grille !== 'none') specs.push(`Carrelages : ${item.grille.replace(/_/g, ' ')}`);
    if (item.frame_thickness) specs.push(`\u00c9paisseur du cadre : ${item.frame_thickness}`);
  }

  return specs;
}

const CATEGORY_LABELS = {
  window: 'Fen\u00eatre',
  entry_door: 'Porte d\u2019entr\u00e9e',
  patio_door: 'Porte patio',
};

export function getCategoryLabel(cat) {
  return CATEGORY_LABELS[cat] || cat;
}
