// ============================================================================
// CATALOGUE GROUPE ROYALTY — source de vérité pour types fenêtres et portes
// ============================================================================
// Extrait de Groupe-Royalty-Brochure_small.pdf (60 pages, nov 2023)
// Source: pages 6-60. Zéro omission demandée par Mikael.
//
// RÈGLE CRITIQUE (Jeremy):
//   LA POINTE DU TRIANGLE EST SUR LA PENTURE, TOUJOURS.
//   Les configs sont toujours montrées de l'extérieur.
// ============================================================================

// ---------- COLLECTIONS ----------
export const COLLECTIONS = {
  zen: {
    id: 'zen',
    name: 'Collection Zen',
    style: 'Contemporain',
    materials: ['uPVC', 'Hybride (uPVC + aluminium)'],
    colors_available: 'all_6_plus_custom',
    description: 'Design contemporain, disponible en uPVC ou hybride avec revêtement aluminium extérieur.'
  },
  prestige: {
    id: 'prestige',
    name: 'Collection Prestige',
    style: 'Traditionnel',
    materials: ['uPVC', 'Hybride (uPVC + aluminium)'],
    colors_available: 'all_6_plus_custom',
    description: 'Design traditionnel avec moulures prononcées, disponible en uPVC ou hybride.'
  },
  urbain: {
    id: 'urbain',
    name: 'Collection Urbain',
    style: 'Contemporain',
    materials: ['uPVC'],
    colors_available: 'white_only',
    description: 'Design contemporain économique, uPVC blanc seulement.'
  },
  classique: {
    id: 'classique',
    name: 'Collection Classique',
    style: 'Traditionnel',
    materials: ['uPVC'],
    colors_available: 'white_only',
    description: 'Design traditionnel économique, uPVC blanc seulement.'
  }
};

// ---------- COULEURS ----------
export const WINDOW_COLORS = {
  standard_hybride: [
    { id: 'blanc', name: 'Blanc', hex: '#FFFFFF' },
    { id: 'noir', name: 'Noir', hex: '#1a1a1a' },
    { id: 'anodise', name: 'Anodisé', hex: '#A8A8A8' },
    { id: 'charbon', name: 'Charbon', hex: '#3C3C3C' },
    { id: 'brun_commercial', name: 'Brun commercial', hex: '#4A3425' },
    { id: 'sur_mesure', name: 'Couleur sur mesure', hex: null }
  ],
  standard_upvc: [
    { id: 'blanc', name: 'Blanc', hex: '#FFFFFF' }
  ]
};

// ---------- THERMOS ----------
export const THERMOS_TYPES = {
  double: {
    id: 'double',
    name: 'Thermos double',
    description: 'Le plus économique, argon + Technoform spacer',
    available_on: ['all_window_types', 'all_door_types'],
    energy_star: true
  },
  triple: {
    id: 'triple',
    name: 'Thermos triple',
    description: 'Double chambre argon, plus performant',
    available_on: ['battant', 'auvent'],
    energy_star: true
  },
  lamine: {
    id: 'lamine',
    name: 'Thermos laminé',
    description: 'Insonorisation + sécurité (plus difficile à briser)',
    available_on: ['all_window_types'],
    energy_star: true
  },
  givre: {
    id: 'givre',
    name: 'Thermos givré',
    description: 'Verre givré pour intimité',
    available_on: ['all_window_types']
  },
  gluechip: {
    id: 'gluechip',
    name: 'Thermos gluechip',
    description: 'Verre texturé gluechip',
    available_on: ['all_window_types']
  }
};

// ---------- TYPES DE FENÊTRES ----------
// Convention: { code, label, panels, notation_royalty, min, max }
// panels utilise la notation Royalty (G/F/D pour battant, etc.)

export const WINDOW_TYPES = {
  battant: {
    id: 'battant',
    name: 'Fenêtre à battant',
    en: 'Casement',
    specs_default: [
      'Profilé cadre uPVC 5 5/8" haute performance',
      'Thermos 7/8" triple coupe-froid Low-E Argon',
      'Ouverture 90° pour nettoyage intérieur',
      'Mécanismes acier peinture cuite + pièces inox',
      'Verrous multipoint'
    ],
    csa: 'A3 · B7 · C5 · F20 · Zones 1-2',
    configurations: [
      { code: 'BS1',   notation: 'G',     panels: ['G'],                 min: { w: 15, h: 15 }, max: { w: 38,  h: 78 } },
      { code: 'BS1D',  notation: 'D',     panels: ['D'],                 min: { w: 15, h: 15 }, max: { w: 38,  h: 78 } },
      { code: 'BS2',   notation: 'GF',    panels: ['G','F'],             min: { w: 29, h: 15 }, max: { w: 76,  h: 78 } },
      { code: 'BS2D',  notation: 'FD',    panels: ['F','D'],             min: { w: 29, h: 15 }, max: { w: 76,  h: 78 } },
      { code: 'BS2L',  notation: 'GF',    panels: ['G','F'],             min: { w: 43, h: 15 }, max: { w: 108, h: 78 }, widthRatios: [1, 2], variant: 'Large · G 1/3 + F 2/3' },
      { code: 'BS2LD', notation: 'FD',    panels: ['F','D'],             min: { w: 43, h: 15 }, max: { w: 108, h: 78 }, widthRatios: [2, 1], variant: 'Large · F 2/3 + D 1/3' },
      { code: 'BS3',   notation: 'GFD',   panels: ['G','F','D'],         min: { w: 43, h: 15 }, max: { w: 114, h: 78 } },
      { code: 'BS3L',  notation: 'GFD',   panels: ['G','F','D'],         min: { w: 54, h: 15 }, max: { w: 160, h: 78 }, variant: 'Large' },
      { code: 'BS4',   notation: 'GFFD',  panels: ['G','F','F','D'],     min: { w: 57, h: 15 }, max: { w: 152, h: 78 } },
      { code: 'BS5',   notation: 'GFFFD', panels: ['G','F','F','F','D'], min: { w: 75, h: 15 }, max: { w: 190, h: 78 } }
    ]
  },

  auvent: {
    id: 'auvent',
    name: 'Fenêtre à auvent',
    en: 'Awning',
    specs_default: [
      'Profilé cadre uPVC 5 5/8" haute performance',
      'Thermos 7/8" triple coupe-froid Low-E Argon',
      'Mécanismes acier peinture cuite + pièces inox'
    ],
    csa: 'A3 · B7 · C3 · F20 · Zones 1-2',
    configurations: [
      { code: 'A1',      notation: 'A',   panels: ['A'],         min: { w: 15, h: 15 }, max: { w: 60,  h: 42  } },
      { code: 'A2',      notation: 'AF',  panels: ['A','F'],     min: { w: 29, h: 15 }, max: { w: 120, h: 42 }, variant: 'Auvent gauche · fixe droite' },
      { code: 'A2F',     notation: 'FA',  panels: ['F','A'],     min: { w: 29, h: 15 }, max: { w: 120, h: 42 }, variant: 'Fixe gauche · auvent droite' },
      { code: 'A3',      notation: 'AFA', panels: ['A','F','A'], min: { w: 43, h: 15 }, max: { w: 180, h: 42 }, variant: 'Auvent · fixe centre · auvent' },
      { code: 'A3F',     notation: 'FAF', panels: ['F','A','F'], min: { w: 43, h: 15 }, max: { w: 180, h: 42 }, variant: 'Fixe · auvent centre · fixe' },
      { code: 'A1CFD',   notation: 'F/A', panels: ['F','A'],     min: { w: 15, h: 29 }, max: { w: 60,  h: 80  }, vertical: true, variant: 'Fixe dessus + auvent dessous' },
      { code: 'A1CFB',   notation: 'A/F', panels: ['A','F'],     min: { w: 15, h: 29 }, max: { w: 60,  h: 80  }, vertical: true, variant: 'Auvent dessus + fixe dessous' },
      { code: 'A1CF2/3', notation: 'F/A', panels: ['F','A'],     min: { w: 15, h: 29 }, max: { w: 60,  h: 120 }, vertical: true, heightRatios: [2, 1], variant: 'Fixe 2/3 + auvent 1/3' }
    ]
  },

  guillotine: {
    id: 'guillotine',
    name: 'Fenêtre à guillotine',
    en: 'Hung',
    specs_default: [
      'Profilé cadre uPVC 5 5/8" haute performance',
      'Thermos 7/8" double coupe-froid Low-E Argon',
      'Système à ressorts à force constante',
      'Pivot-patins pour nettoyage facile',
      'Verrous automatiques anti-effraction'
    ],
    csa: 'A3 · B4 · C4 · F20 · Zones 1-2',
    configurations: [
      { code: 'G1',   notation: 'Simple',          panels: ['Gs'],            mode: 'simple', min: { w: 17, h: 28 }, max: { w: 44,  h: 74 } },
      { code: 'G2',   notation: 'Simple ×2',        panels: ['Gs','Gs'],       mode: 'simple', min: { w: 34, h: 28 }, max: { w: 88,  h: 74 } },
      { code: 'G3L',  notation: 'Simple+F+Simple',  panels: ['Gs','F','Gs'],   mode: 'simple', min: { w: 39, h: 28 }, max: { w: 137, h: 74 }, variant: 'Fixe central (Large)' },
      { code: 'GD1',  notation: 'Double',           panels: ['Gd'],            mode: 'double', min: { w: 17, h: 28 }, max: { w: 44,  h: 74 } },
      { code: 'GD2',  notation: 'Double ×2',        panels: ['Gd','Gd'],       mode: 'double', min: { w: 34, h: 28 }, max: { w: 88,  h: 74 } },
      { code: 'GD3L', notation: 'Double+F+Double',  panels: ['Gd','F','Gd'],   mode: 'double', min: { w: 39, h: 28 }, max: { w: 137, h: 74 }, variant: 'Fixe central (Large)' }
    ]
  },

  coulissante: {
    id: 'coulissante',
    name: 'Fenêtre coulissante',
    en: 'Sliding',
    specs_default: [
      'Profilé cadre uPVC 5 5/8" haute performance',
      'Thermos 7/8" double coupe-froid Low-E Argon',
      'Roulettes en acier inoxydable sans friction',
      'Verrous automatiques anti-effraction'
    ],
    csa: 'A3 · B4 · C3 · F20 · Zones 1-2',
    configurations: [
      { code: 'C2G',    notation: 'XO',  panels: ['X','O'],     min: { w: 29, h: 18 }, max: { w: 68,  h: 60 } },
      { code: 'C2D',    notation: 'OX',  panels: ['O','X'],     min: { w: 29, h: 18 }, max: { w: 68,  h: 60 } },
      { code: 'C2G13',  notation: 'XO',  panels: ['X','O'],     min: { w: 36, h: 18 }, max: { w: 90,  h: 60 }, widthRatios: [1, 2], variant: 'Gauche 1/3 coulisse · droite 2/3 fixe' },
      { code: 'C2D13',  notation: 'OX',  panels: ['O','X'],     min: { w: 36, h: 18 }, max: { w: 90,  h: 60 }, widthRatios: [2, 1], variant: 'Gauche 2/3 fixe · droite 1/3 coulisse' },
      { code: 'CD2',    notation: 'XX',  panels: ['X','X'],     min: { w: 29, h: 18 }, max: { w: 68,  h: 60 }, variant: 'Double coulissant' },
      { code: 'C3',     notation: 'XOX', panels: ['X','O','X'], min: { w: 42, h: 18 }, max: { w: 95,  h: 60 }, variant: 'Extrémités coulissent · centre fixe' },
      { code: 'C3L',    notation: 'XOX', panels: ['X','O','X'], min: { w: 42, h: 18 }, max: { w: 124, h: 60 }, variant: 'Large · extrémités coulissent · centre fixe' }
    ]
  },

  fixe: {
    id: 'fixe',
    name: 'Fenêtre fixe / panoramique',
    en: 'Picture / Fixed',
    specs_default: [
      'Profilé cadre uPVC 5 5/8" haute performance',
      'Thermos 7/8" triple coupe-froid Low-E Argon',
      'Aucune ouverture · maximum de lumière et de vue',
      'Cadre simplifié sans mécanisme',
      'Rendement énergétique optimal (pas de coupe-froid mobile)',
      'Idéal salon, grands panoramas, hauteur plafond'
    ],
    csa: 'A3 · B7 · C5 · F20 · Zones 1-2',
    configurations: [
      { code: 'F1',  notation: 'F',    panels: ['F'],             min: { w: 12, h: 12 }, max: { w: 120, h: 96 } },
      { code: 'F2',  notation: 'FF',   panels: ['F','F'],         min: { w: 24, h: 12 }, max: { w: 180, h: 96 } },
      { code: 'F3',  notation: 'FFF',  panels: ['F','F','F'],     min: { w: 36, h: 12 }, max: { w: 240, h: 96 } },
      { code: 'F4',  notation: 'FFFF', panels: ['F','F','F','F'], min: { w: 48, h: 12 }, max: { w: 300, h: 96 }, variant: 'Panoramique large' }
    ]
  },

  baie: {
    id: 'baie',
    name: 'Fenêtre en baie (Bay)',
    en: 'Bay window',
    specs_default: [
      'Assemblage de 3 fenêtres formant une projection',
      'Angle standard 30° (économique) ou 45° (projection plus marquée)',
      'Panneaux latéraux angulés vers l\'extérieur',
      'Profilé cadre uPVC 5 5/8" haute performance',
      'Thermos 7/8" triple coupe-froid Low-E Argon',
      'Renforts d\'acier intégrés dans les jambages d\'assemblage',
      'Plateau (seat board) et tête structurés sur mesure',
      'Projection habituelle 12"–18" selon angle'
    ],
    csa: 'A3 · B7 · C5 · F20 · Zones 1-2',
    configurations: [
      { code: 'BAIE-FFF', notation: 'F/F/F', panels: ['F','F','F'], min: { w: 60, h: 36 }, max: { w: 144, h: 84 }, bay: true, variant: 'Tout fixe · max lumière' },
      { code: 'BAIE-GFD', notation: 'G/F/D', panels: ['G','F','D'], min: { w: 60, h: 36 }, max: { w: 144, h: 84 }, bay: true, variant: 'Battants latéraux · fixe centre' },
      { code: 'BAIE-GFF', notation: 'G/F/F', panels: ['G','F','F'], min: { w: 60, h: 36 }, max: { w: 144, h: 84 }, bay: true, variant: 'Battant gauche · fixe centre + droite' },
      { code: 'BAIE-FFD', notation: 'F/F/D', panels: ['F','F','D'], min: { w: 60, h: 36 }, max: { w: 144, h: 84 }, bay: true, variant: 'Fixe gauche + centre · battant droite' }
    ]
  },

  arc: {
    id: 'arc',
    name: 'Fenêtre en arc (Bow)',
    en: 'Bow window',
    specs_default: [
      'Assemblage de 4 ou 5 fenêtres en arc de cercle',
      'Angle 10° à 15° par panneau pour courbe douce',
      'Profilé cadre uPVC 5 5/8" haute performance',
      'Thermos 7/8" triple coupe-froid Low-E Argon',
      'Renforts d\'acier intégrés dans les jambages d\'assemblage',
      'Plateau (seat board) et tête courbés sur mesure',
      'Projection habituelle 12"–24" selon rayon'
    ],
    csa: 'A3 · B7 · C5 · F20 · Zones 1-2',
    configurations: [
      { code: 'ARC-4F',     notation: 'FFFF',  panels: ['F','F','F','F'],     min: { w: 72, h: 36 }, max: { w: 180, h: 84 }, bow: true, variant: '4 panneaux · tout fixe' },
      { code: 'ARC-5F',     notation: 'FFFFF', panels: ['F','F','F','F','F'], min: { w: 90, h: 36 }, max: { w: 220, h: 84 }, bow: true, variant: '5 panneaux · tout fixe' },
      { code: 'ARC-5GFFFD', notation: 'GFFFD', panels: ['G','F','F','F','D'], min: { w: 90, h: 36 }, max: { w: 220, h: 84 }, bow: true, variant: '5 panneaux · battants aux extrémités' }
    ]
  }
};

// ---------- PORTES D'ENTRÉE — CARACTÉRISTIQUES ----------
export const ENTRY_DOOR_SPECS = {
  panel: {
    type: 'R16 acier',
    warranty_paint: '10 ans',
    machining: 'CNC'
  },
  moulding: {
    material: 'Aluminium extrudé',
    width: '1 1/2"',
    styles: ['Hybride coloniale', 'Hybride contemporaine']
  },
  weatherstripping: 'Triple coupe-froid (vs double standard)',
  hinges: {
    standard: 'Pentures à billes',
    optional: 'Pentures décoratives',
    finishes: ['Argent', 'Laiton']
  },
  frame: {
    material: 'Pin jointé vissé',
    interior_cladding: 'Aluminium extrudé',
    exterior_cladding: 'Aluminium (retient recouvrement + garde les jambages alignés)'
  },
  sill: {
    treatment: 'Anodisé',
    finishes: ['Aluminium anodisé noir', 'Aluminium anodisé clair']
  },
  lock: {
    standard: 'Serrure préparée en usine',
    optional: 'Verrouillage multipoint'
  },
  sweep: 'Balai certifié ENERGY STAR (empêche infiltration sous la porte)',
  mullion: 'Aluminium entre porte et latéraux (meneau harmonisé avec moulure)',
  energy_star: true
};

// ---------- ENTRY DOOR STYLES (Royalty brochure p.45) ----------
// 8 styles × 6 slab widths × 2 frame depths. All measurements in inches.
export const ENTRY_DOOR_STYLES = {
  single: {
    code: 'PS',
    name: 'Porte simple',
    en: 'Single door',
    panels: ['door'],
    slab_range: [28, 42],
    slabs: [
      { slab_w: 28, frame_1_1_4: 29.5,  frame_1_1_2: 30 },
      { slab_w: 30, frame_1_1_4: 31.5,  frame_1_1_2: 32 },
      { slab_w: 32, frame_1_1_4: 33.5,  frame_1_1_2: 34 },
      { slab_w: 34, frame_1_1_4: 35.5,  frame_1_1_2: 36 },
      { slab_w: 36, frame_1_1_4: 37.5,  frame_1_1_2: 38 },
      { slab_w: 42, frame_1_1_4: 43.5,  frame_1_1_2: 44 }
    ]
  },
  single_1side: {
    code: 'PS+1L',
    name: 'Porte + 1 latéral (gauche)',
    en: 'Single door + 1 sidelight (left)',
    panels: ['side_l','door'],
    side_panel_w: 14,
    slab_range: [28, 42],
    slabs: [
      { slab_w: 28, frame_1_1_4: 45.125, frame_1_1_2: 45.625 },
      { slab_w: 30, frame_1_1_4: 47.125, frame_1_1_2: 47.625 },
      { slab_w: 32, frame_1_1_4: 49.125, frame_1_1_2: 49.625 },
      { slab_w: 34, frame_1_1_4: 51.125, frame_1_1_2: 51.625 },
      { slab_w: 36, frame_1_1_4: 53.125, frame_1_1_2: 53.625 },
      { slab_w: 42, frame_1_1_4: 59.125, frame_1_1_2: 59.625 }
    ]
  },
  single_1side_R: {
    code: 'PS+1L-D',
    name: 'Porte + 1 latéral (droite)',
    en: 'Single door + 1 sidelight (right)',
    panels: ['door','side_r'],
    side_panel_w: 14,
    slab_range: [28, 42],
    slabs: [
      { slab_w: 28, frame_1_1_4: 45.125, frame_1_1_2: 45.625 },
      { slab_w: 30, frame_1_1_4: 47.125, frame_1_1_2: 47.625 },
      { slab_w: 32, frame_1_1_4: 49.125, frame_1_1_2: 49.625 },
      { slab_w: 34, frame_1_1_4: 51.125, frame_1_1_2: 51.625 },
      { slab_w: 36, frame_1_1_4: 53.125, frame_1_1_2: 53.625 },
      { slab_w: 42, frame_1_1_4: 59.125, frame_1_1_2: 59.625 }
    ]
  },
  single_2sides: {
    code: 'PS+2L',
    name: 'Porte + 2 latéraux',
    en: 'Single door + 2 sidelights',
    panels: ['side_l','door','side_r'],
    side_panel_w: 14,
    slab_range: [28, 42],
    slabs: [
      { slab_w: 28, frame_1_1_4: 60.75, frame_1_1_2: 61.25 },
      { slab_w: 30, frame_1_1_4: 62.75, frame_1_1_2: 63.25 },
      { slab_w: 32, frame_1_1_4: 64.75, frame_1_1_2: 65.25 },
      { slab_w: 34, frame_1_1_4: 66.75, frame_1_1_2: 67.25 },
      { slab_w: 36, frame_1_1_4: 68.75, frame_1_1_2: 69.25 },
      { slab_w: 42, frame_1_1_4: 74.75, frame_1_1_2: 75.25 }
    ]
  },
  double_post: {
    code: 'PD+P',
    name: '2 portes + poteau fixe',
    en: 'Double doors + fixed post',
    panels: ['door','post','door'],
    slab_range: [28, 42],
    slabs: [
      { slab_w: 28, frame_1_1_4: 59,    frame_1_1_2: 59.5 },
      { slab_w: 30, frame_1_1_4: 63,    frame_1_1_2: 63.5 },
      { slab_w: 32, frame_1_1_4: 67,    frame_1_1_2: 67.5 },
      { slab_w: 34, frame_1_1_4: 71,    frame_1_1_2: 71.5 },
      { slab_w: 36, frame_1_1_4: 75,    frame_1_1_2: 75.5 },
      { slab_w: 42, frame_1_1_4: 87,    frame_1_1_2: 87.5 }
    ]
  },
  double_astragal: {
    code: 'PD+A',
    name: '2 portes + astragale',
    en: 'Double doors + astragal',
    panels: ['door','astragal','door'],
    slab_range: [28, 42],
    slabs: [
      { slab_w: 28, frame_1_1_4: 58.125, frame_1_1_2: 58.625 },
      { slab_w: 30, frame_1_1_4: 62.125, frame_1_1_2: 62.625 },
      { slab_w: 32, frame_1_1_4: 66.125, frame_1_1_2: 66.625 },
      { slab_w: 34, frame_1_1_4: 70.125, frame_1_1_2: 70.625 },
      { slab_w: 36, frame_1_1_4: 74.125, frame_1_1_2: 74.625 },
      { slab_w: 42, frame_1_1_4: 86.125, frame_1_1_2: 86.625 }
    ]
  },
  single_side_astragal: {
    code: 'PS+L+A',
    name: '1 porte + latéral + astragale (gauche)',
    en: 'Single door + sidelight + astragal (left)',
    panels: ['side_l','astragal','door'],
    side_panel_w: 14,
    slab_range: [28, 42],
    slabs: [
      { slab_w: 28, frame_1_1_4: 44.75, frame_1_1_2: 44.75 },
      { slab_w: 30, frame_1_1_4: 46.75, frame_1_1_2: 46.75 },
      { slab_w: 32, frame_1_1_4: 48.75, frame_1_1_2: 48.75 },
      { slab_w: 34, frame_1_1_4: 50.75, frame_1_1_2: 50.75 },
      { slab_w: 36, frame_1_1_4: 52.75, frame_1_1_2: 52.75 },
      { slab_w: 42, frame_1_1_4: 58.75, frame_1_1_2: 58.75 }
    ]
  },
  single_side_astragal_R: {
    code: 'PS+L+A-D',
    name: '1 porte + astragale + latéral (droite)',
    en: 'Single door + astragal + sidelight (right)',
    panels: ['door','astragal','side_r'],
    side_panel_w: 14,
    slab_range: [28, 42],
    slabs: [
      { slab_w: 28, frame_1_1_4: 44.75, frame_1_1_2: 44.75 },
      { slab_w: 30, frame_1_1_4: 46.75, frame_1_1_2: 46.75 },
      { slab_w: 32, frame_1_1_4: 48.75, frame_1_1_2: 48.75 },
      { slab_w: 34, frame_1_1_4: 50.75, frame_1_1_2: 50.75 },
      { slab_w: 36, frame_1_1_4: 52.75, frame_1_1_2: 52.75 },
      { slab_w: 42, frame_1_1_4: 58.75, frame_1_1_2: 58.75 }
    ]
  }
};

// ---------- ENTRY DOOR MODELS ----------
export const ENTRY_DOOR_MODELS = [
  // Panneaux solides (sans verre)
  'Cosmo', 'Orléans', 'London',
  // Nuage (verre givré)
  'Nuage 22×64', 'Nuage 22×48', 'Nuage 22×17', 'Nuage 22×12',
  // Contour (verre décoratif)
  'Contour 22×64', 'Contour 22×48', 'Contour 22×17', 'Contour 22×12',
  // Verres décoratifs nommés
  'Cleo 22×64', 'Cleo 22×48',
  'Cezanne 22×64', 'Cezanne 22×48',
  'Impressa 22×64', 'Impressa 22×48',
  'Vermeer 22×64', 'Vermeer 22×48',
  'Scarlett 22×64', 'Scarlett 22×48',
  'Toscana 22×64', 'Toscana 22×48',
  'Arabella 22×64', 'Arabella 22×48',
  'Cordelia 22×64', 'Cordelia 22×48',
  'Vista 22×48', 'Vista 22×17',
  'Tessa 22×48', 'Tessa 22×17',
  'Celeste 22×48',
  'Astrid 22×64',
  'Palma 22×48',
  'Elio 22×64',
  'Sutton 22×48',
  'Briella 22×17',
  'Diamant 22×48',
  'Linatta 22×64',
  'Verona 22×64',
  'Aurora 22×48',
  // Spécial
  'Guillotine'
];

// ---------- ENTRY DOOR DEFAULT SPECS ----------
export const ENTRY_DOOR_SPECS_DEFAULT = [
  'Panneau R16 acier, peinture garantie 10 ans',
  'Moulure 1 1/2" aluminium extrudé',
  'Triple coupe-froid (vs double standard)',
  'Recouvrement aluminium intérieur et extérieur',
  'Cadre de porte en pin jointé vissé',
  'Balai de porte certifié ENERGY STAR'
];

// ---------- MESURES STANDARDS PORTES (Page 45) ----------
// 6 styles × 6 largeurs slab × 2 profondeurs cadre
// Format: { style, slabs[{slab_w, side_panel_w, frame_1_1_4, frame_1_1_2}] }
// Toutes les mesures en pouces. Hauteur: 82 1/2" (cadre 1 1/4") ou 82 3/4" (cadre 1 1/2")

export const DOOR_STANDARD_MEASUREMENTS = {
  single: {
    id: 'single',
    label: 'Porte simple',
    en: 'Single Door',
    has_side_panel: false,
    slabs: [
      { slab_w: 28, frame_1_1_4: '29 1/2', frame_1_1_2: 30 },
      { slab_w: 30, frame_1_1_4: '31 1/2', frame_1_1_2: 32 },
      { slab_w: 32, frame_1_1_4: '33 1/2', frame_1_1_2: 34 },
      { slab_w: 34, frame_1_1_4: '35 1/2', frame_1_1_2: 36 },
      { slab_w: 36, frame_1_1_4: '37 1/2', frame_1_1_2: 38 },
      { slab_w: 42, frame_1_1_4: '43 1/2', frame_1_1_2: 44 }
    ]
  },
  single_with_1_side: {
    id: 'single_with_1_side',
    label: 'Porte + 1 latéral',
    en: 'Single Door + 1 Side Panel',
    side_panel_w: 14,
    slabs: [
      { slab_w: 28, frame_1_1_4: '45 1/8', frame_1_1_2: '45 5/8' },
      { slab_w: 30, frame_1_1_4: '47 1/8', frame_1_1_2: '47 5/8' },
      { slab_w: 32, frame_1_1_4: '49 1/8', frame_1_1_2: '49 5/8' },
      { slab_w: 34, frame_1_1_4: '51 1/8', frame_1_1_2: '51 5/8' },
      { slab_w: 36, frame_1_1_4: '53 1/8', frame_1_1_2: '53 5/8' },
      { slab_w: 42, frame_1_1_4: '59 1/8', frame_1_1_2: '59 5/8' }
    ]
  },
  single_with_2_sides: {
    id: 'single_with_2_sides',
    label: 'Porte + 2 latéraux',
    en: 'Single Door + 2 Side Panels',
    side_panel_w: 14,
    slabs: [
      { slab_w: 28, frame_1_1_4: '60 3/4', frame_1_1_2: '61 1/4' },
      { slab_w: 30, frame_1_1_4: '62 3/4', frame_1_1_2: '63 1/4' },
      { slab_w: 32, frame_1_1_4: '64 3/4', frame_1_1_2: '65 1/4' },
      { slab_w: 34, frame_1_1_4: '66 3/4', frame_1_1_2: '67 1/4' },
      { slab_w: 36, frame_1_1_4: '68 3/4', frame_1_1_2: '69 1/4' },
      { slab_w: 42, frame_1_1_4: '74 3/4', frame_1_1_2: '75 1/4' }
    ]
  },
  double_with_fixed_post: {
    id: 'double_with_fixed_post',
    label: '2 portes + poteau fixe',
    en: 'Double Doors + Fixed Post',
    slabs: [
      { slab_w: 28, frame_1_1_4: 59, frame_1_1_2: '59 1/2' },
      { slab_w: 30, frame_1_1_4: 63, frame_1_1_2: '63 1/2' },
      { slab_w: 32, frame_1_1_4: 67, frame_1_1_2: '67 1/2' },
      { slab_w: 34, frame_1_1_4: 71, frame_1_1_2: '71 1/2' },
      { slab_w: 36, frame_1_1_4: 75, frame_1_1_2: '75 1/2' },
      { slab_w: 42, frame_1_1_4: 87, frame_1_1_2: '87 1/2' }
    ]
  },
  double_with_astragal: {
    id: 'double_with_astragal',
    label: '2 portes + astragale',
    en: 'Double Doors + Astragal',
    slabs: [
      { slab_w: 28, frame_1_1_4: '58 1/8', frame_1_1_2: '58 5/8' },
      { slab_w: 30, frame_1_1_4: '62 1/8', frame_1_1_2: '62 5/8' },
      { slab_w: 32, frame_1_1_4: '66 1/8', frame_1_1_2: '66 5/8' },
      { slab_w: 34, frame_1_1_4: '70 1/8', frame_1_1_2: '70 5/8' },
      { slab_w: 36, frame_1_1_4: '74 1/8', frame_1_1_2: '74 5/8' },
      { slab_w: 42, frame_1_1_4: '86 1/8', frame_1_1_2: '86 5/8' }
    ]
  },
  single_with_side_and_astragal: {
    id: 'single_with_side_and_astragal',
    label: '1 porte + latéral + astragale',
    en: 'Single Door + Side Panel + Astragal',
    side_panel_w: 14,
    slabs: [
      { slab_w: 28, frame_1_1_4: '44 3/4', frame_1_1_2: '44 3/4' },
      { slab_w: 30, frame_1_1_4: '46 3/4', frame_1_1_2: '46 3/4' },
      { slab_w: 32, frame_1_1_4: '48 3/4', frame_1_1_2: '48 3/4' },
      { slab_w: 34, frame_1_1_4: '50 3/4', frame_1_1_2: '50 3/4' },
      { slab_w: 36, frame_1_1_4: '52 3/4', frame_1_1_2: '52 3/4' },
      { slab_w: 42, frame_1_1_4: '58 3/4', frame_1_1_2: '58 3/4' }
    ]
  }
};

// ---------- PORTES DE COMMODITÉS (PRÉPARATIONS) ----------
export const CONVENIENCE_DOOR_OPTIONS = {
  discretion: {
    id: 'discretion',
    name: 'Discrétion — stores intégrés',
    description: 'Stores entre les deux panneaux de verre, sans entretien',
    sizes: ['20" × 64"', '22" × 48"', '22" × 36"'],
    blind_colors: ['Blanc', 'Gris satiné']
  },
  elevation: {
    id: 'elevation',
    name: 'Élévation — fenêtre guillotine',
    description: 'Fenêtre à guillotine intégrée dans la porte',
    sizes: ['22" × 64"', '22" × 48"', '22" × 36"'],
    glass_options: ['EDGE', 'TRANSIT', 'OPTIKA', 'MASTERLINE']
  }
};

// ---------- POIGNÉES ----------
export const HANDLES = {
  dorex_imperial: {
    id: 'dorex_imperial',
    brand: 'Dorex',
    name: 'Impérial',
    style: 'Traditional',
    finishes: [
      { code: 'C3',   name: 'Laiton poli',        en: 'Polished Brass' },
      { code: 'C5',   name: 'Laiton antique',     en: 'Antique Brass' },
      { code: 'C15',  name: 'Nickel satiné',      en: 'Satin Nickel' },
      { code: 'C15A', name: 'Nickel antique',     en: 'Antique Nickel' },
      { code: 'V3',   name: 'Fini endurance',     en: 'Endurance finish (lifetime)' }
    ]
  },
  dorex_capri: {
    id: 'dorex_capri',
    brand: 'Dorex',
    name: 'Capri',
    style: 'Transitional',
    finishes: [
      { code: 'C3',   name: 'Laiton poli' },
      { code: 'C5',   name: 'Laiton antique' },
      { code: 'C11P', name: 'Bronze antique' },
      { code: 'C15',  name: 'Nickel satiné' },
      { code: 'C15A', name: 'Nickel antique' }
    ]
  },
  baldwin_traditional: {
    brand: 'Baldwin',
    category: 'Traditionnelle',
    models: ['Columbus', 'Napa', 'Elizabeth'],
    finishes: [
      { code: '003', name: 'Laiton poli' },
      { code: '049', name: 'Laiton mat et noir' },
      { code: '112', name: 'Bronze vénitien' },
      { code: '141', name: 'Nickel poli' },
      { code: '150', name: 'Nickel satiné' },
      { code: '152', name: 'Nickel mat antique' },
      { code: '260', name: 'Chrome poli' }
    ]
  },
  baldwin_contemporary: {
    brand: 'Baldwin',
    category: 'Contemporaine',
    models: ['Miami', 'Seattle', 'Santa Cruz'],
    finishes: [
      { code: '112', name: 'Bronze vénitien' },
      { code: '141', name: 'Nickel poli' },
      { code: '150', name: 'Nickel satiné' },
      { code: '260', name: 'Chrome poli' }
    ]
  },
  baldwin_rustic: {
    brand: 'Baldwin',
    category: 'Rustique',
    models: ['Elkhorn', 'Kodiak', 'Longview'],
    finishes: [
      { code: '481', name: 'Bronze foncé' },
      { code: '492', name: 'Bronze blanc' }
    ]
  }
};

// ---------- PORTES PATIO ----------
export const PATIO_DOOR_COLLECTIONS = {
  urbania: {
    name: 'Urbania',
    en: 'Urbania (sliding, new)',
    frame_options: ['6"', '7 1/4"', '8"', '9 1/4"'],
    max_width_ft: 10,
    handle_type: 'Studio',
    locking: 'Mortaise 2 points + option serrure à clé',
    specs_default: [
      'Format 2 lumières jusqu\'à 10 pi largeur',
      'Barrure 2 points anti-effraction',
      'Configuration asymétrique disponible',
      'Verre scellé Low-E argon',
      'Intercalaire warm edge noir',
      'Couvercle seuil aluminium anodisé',
      'Roues tandem résistantes corrosion',
      'Poignée Studio',
      'Moustiquaire ultra-résistante cadre aluminium 3"'
    ]
  },
  loft: {
    name: 'Loft',
    en: 'Loft (lift & slide, new)',
    frame_options: ['7 1/4"', '8"', '9 1/4"'],
    max_width_ft: 10,
    handle_type: 'Kora Lift & Slide',
    locking: 'Mortaise 3 points',
    specs_default: [
      'Format 2 lumières jusqu\'à 10 pi largeur',
      'Système levante-coulissante',
      'Barrure 2 points',
      'Verre Low-E argon',
      'Warm edge noir',
      'Seuil aluminium anodisé',
      'Poignée Kora Lift & Slide'
    ]
  },
  classique_pvc: {
    name: 'Classique PVC',
    en: 'Classic PVC',
    frame_options: ['5 1/2"', '7 1/4"'],
    max_width_ft: 8,
    handle_type: 'Euro',
    specs_default: [
      'Cadre bois 5 1/2" ou 7 1/4"',
      'Volet PVC 2 3/4" contemporain soudé 45°',
      'Seuil monobloc étanche',
      'Renforts d\'acier',
      'Recouvrement intérieur PVC (optionnel)',
      'Verre trempé clair Low-E warm edge',
      'Roulettes tandem nylon ajustables'
    ]
  },
  hybride: {
    name: 'Hybride',
    en: 'Hybrid',
    frame_options: ['5 1/2"', '7 1/4"'],
    max_width_ft: 8,
    handle_type: 'Euro',
    specs_default: [
      'Extérieur aluminium extrudé',
      'Cadre bois 5 1/2" ou 7 1/4"',
      'Volet 2 3/4" contemporain alu extérieur',
      'Système entrecroisant 1"',
      'Seuil et marche-pied anodisés',
      'Verre trempé Low-E warm edge',
      'Roulettes tandem nylon'
    ]
  },
  urbain_pvc: {
    name: 'Urbain PVC',
    en: 'Urban PVC',
    frame_options: ['7 1/4"'],
    max_width_ft: 8,
    handle_type: 'Euro',
    specs_default: [
      'Cadre 7 1/4"',
      'Seuil et marche-pieds anodisés',
      'Volet PVC 4 1/2" contemporain soudé 45°',
      'Barrotins 2" 1×4 en option',
      'Verre trempé Low-E warm edge',
      'Roulettes tandem nylon'
    ]
  },
  zen_hybride: {
    name: 'Zen Hybride',
    en: 'Zen Hybrid',
    frame_options: ['5 1/2"', '7 1/4"'],
    max_width_ft: 8,
    handle_type: 'Euro',
    specs_default: [
      'Extérieur aluminium extrudé',
      'Cadre bois 5 1/2" ou 7 1/4"',
      'Volet 4 1/2" contemporain extérieur alu',
      'Système entrecroisant 1"',
      'Seuil et marche-pied anodisés',
      'Barrotins 2" 1×3 option',
      'Verre trempé Low-E warm edge'
    ]
  }
};

// ---------- PATIO DOOR CONFIGURATIONS (shared across Royalty collections) ----------
export const PATIO_CONFIGS = [
  { code: 'XO',   panels: ['X','O'],         min: { w: 60,  h: 78 }, max: { w: 96,  h: 96 } },
  { code: 'OX',   panels: ['O','X'],         min: { w: 60,  h: 78 }, max: { w: 96,  h: 96 } },
  { code: 'OXO',  panels: ['O','X','O'],     min: { w: 90,  h: 78 }, max: { w: 108, h: 96 } },
  { code: 'XOX',  panels: ['X','O','X'],     min: { w: 90,  h: 78 }, max: { w: 108, h: 96 } },
  { code: 'OXXO', panels: ['O','X','X','O'], min: { w: 108, h: 78 }, max: { w: 192, h: 96 } },
  { code: 'XOOX', panels: ['X','O','O','X'], min: { w: 108, h: 78 }, max: { w: 192, h: 96 } }
];

export const PATIO_DOOR_OPTIONS = {
  frame_widths: ['6"', '7 1/4"', '8"', '9 1/4"'],
  nailing_fin: ['4 9/16"', '6 9/16"'],
  integrated_blinds: {
    description: 'Stores intégrés entre les deux panneaux de verre, sans entretien',
    colors: ['Blanc', 'Argent', 'Gris ardoise', 'Espresso', 'Beige', 'Sable']
  },
  glass: {
    types: [
      'Verre double énergétique',
      'Verre triple clair ou énergétique',
      'Verre scellé triple 1 1/4" (1 ou 2 verres Low-E)'
    ]
  },
  grilles: [
    'Bâtonnet 5/16"',
    'Rectangle 5/8"',
    'Rectangle 2"',
    'Georgien 1 3/4"',
    'Georgien 1"',
    'Georgien 5/8"',
    'Tubulaire'
  ],
  grille_patterns: ['Rectangulaire', 'Contour', 'Partiel'],
  handles_contemporary_euro: [
    { id: 'blanc', name: 'Blanc' },
    { id: 'nickel_satine', name: 'Nickel satiné' },
    { id: 'noir', name: 'Noir' }
  ],
  handles_9100: ['Extérieur/Intérieur match set'],
  handles_euro: ['Laiton', 'Chrome', 'Chrome brossé', 'Nickel noir', 'Bronze huilé', 'Laiton antique', 'Nickel satiné'],
  accessories: [
    'Barre de sécurité',
    'Poignée multipoint',
    'Barrure coup de pied (standard)',
    'Moustiquaire aluminium 3"',
    'Serrure à clé (Urbania)'
  ]
};

// ---------- GARANTIES ROYALTY (RÉFÉRENCE — version brochure) ----------
// NOTE: Sur le site PUR, on utilise des garanties modifiées.
// PUR a retiré "main d'œuvre" et "transférable" des garanties client-facing.
// Voir data/translations.js pour la version PÜR nettoyée.
export const ROYALTY_WARRANTIES_REFERENCE = {
  fenetres: {
    thermos_gaz: '20 ans',
    thermos_fissure: '2 ans après installation',
    quincaillerie: 'À vie limitée',
    pvc_aluminium: 'À vie limitée',
    installation: '7 ans',
    main_oeuvre: '2 ans (PUR: NE PAS AFFICHER)',
    transferable: '1 fois seulement (PUR: NE PAS AFFICHER)'
  },
  portes_entree: {
    portes: '20 ans',
    fini_acier_blanc_n700_n600_n900: '20 ans',
    balais_non_peinture: '1 an',
    thermos: '10 ans',
    decoloration_serigraphies: '5 ans',
    quincaillerie_multipoint: '10 ans',
    peinture_acier: '10 ans',
    installation: '7 ans',
    main_oeuvre: '2 ans (PUR: NE PAS AFFICHER)'
  },
  portes_patio: {
    quincaillerie_moustiquaire: '5 ans',
    thermos: '10 ans',
    carrelage_aluminium: '10 ans',
    composante_vinyle_blanc: '20 ans',
    composante_vinyle_alu_peint: '10 ans écaillement',
    installation: '7 ans',
    main_oeuvre: '2 ans (PUR: NE PAS AFFICHER)'
  }
};

// ---------- COORDONNÉES FABRICANT ----------
export const ROYALTY_CONTACT = {
  name: 'Groupe Royalty — Portes et Fenêtres',
  rbq: '5596-2039-01',
  member: 'APCHQ',
  phone_tollfree: '1-888-969-1866',
  website: 'grouperoyalty.com',
  email: 'info@grouperoyalty.com',
  locations: [
    {
      name: 'Saint-Laurent — Siège social / Manufacture',
      address: '3454, rue Griffith',
      city: 'Saint-Laurent',
      postal: 'H4T 1A7',
      phone: '514-429-1414',
      fax: '1-800-311-5113'
    },
    {
      name: 'Laval',
      address: '3320, 100e Avenue',
      city: 'Laval',
      postal: 'H7T 0J7',
      phone: '450-781-2280'
    },
    {
      name: 'Place Vertu',
      address: '3131 boul. Côte-Vertu Ouest',
      city: 'Saint-Laurent',
      postal: 'H4R 1Y8',
      phone: '450-300-1717'
    }
  ]
};
