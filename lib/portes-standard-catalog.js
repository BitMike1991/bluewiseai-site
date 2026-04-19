// ============================================================================
// CATALOGUE PORTES STANDARD — Portes patio Odyssée + Belle-Vue Prima/Prestige
// ============================================================================
// Manufacturier: Portes Standard (portesstandard.com) — 50 ans d'expérience
// Distribué par: Touchette (que Jeremy utilise actuellement) et autres dealers
// Relevant: la quote Eric Brisson contenait "ODYSSEY 5'" = ce produit
//
// Extrait de:
//   - Brochure_porte_odyssey_FR.pdf (3 pages)
//   - Brochure_porte_prima_prestige_FR.pdf (5 pages)
// ============================================================================

// ---------- COORDONNÉES ----------
export const PORTES_STANDARD_INFO = {
  name: 'Portes Standard',
  tagline: 'Votre standard de qualité — 50 ans',
  website: 'PortesStandard.com',
  email: 'info@PortesStandard.com',
  distributed_by_touchette: true,
  certifications: ['Fenestration Canada', 'AAMA + ICMA (FGIA member)', 'AVFQ', 'Energy Star']
};

// ============================================================================
// ODYSSÉE — Porte patio
// ============================================================================
// La quote Brisson montrait "ODYSSEY 5'" avec config XO, dims 58 3/8" × 81"

export const ODYSSEE = {
  id: 'odyssee',
  name: 'Odyssée',
  manufacturer: 'Portes Standard',
  distributed_by: ['Touchette'],
  type: 'Porte patio coulissante',

  specs: {
    panels: {
      items: [
        'Verre Low-E avec gaz argon',
        'Intercalaire non conducteur',
        'Renforts d\'acier galvanisé calibre 16',
        'Système exclusif de roulement à billes tandem'
      ]
    },
    frame: {
      items: [
        'Seuil tout PVC qui ne pourrit pas',
        'Recouvrement intérieur en PVC',
        'Cadre de bois jointé 1 3/16" d\'épaisseur (jambages + tête)',
        'Jambages et tête extrudés d\'une seule pièce (recouvrement extérieur sans joint)',
        'Coupe-froid haute performance'
      ],
      depth_options: [
        { id: '5_1_2', mm: 140, inches: '5 1/2"' },
        { id: '6_5_8', mm: 168, inches: '6 5/8"' },
        { id: '7_1_4', mm: 184, inches: '7 1/4"' }
      ]
    },
    hardware: {
      moustiquaire: 'Cadre aluminium extrudé à glissement doux, treillis fibre de verre, facile à enlever',
      poignee_exterieure: 'Poignée extérieure plate montée en surface'
    }
  },

  energy: {
    low_e_argon: {
      name: 'Low-E avec gaz argon',
      re: 36,
      u_value: 1.65,
      r_value: 3.45,
      energy_star: true
    },
    low_e_plus_argon: {
      name: 'Low-E Plus avec gaz argon',
      re: 40,
      u_value: 1.48,
      r_value: 3.85,
      energy_star: true,
      best: true
    }
  },

  colors: {
    standard_pvc: [
      { id: 'blanc_141',       name: 'Blanc 141',       code: '141' },
      { id: 'blanc_creme_136', name: 'Blanc crème 136', code: '136' }
    ],
    custom_paint: 'Peinturable sur mesure — couleurs standards ou personnalisées'
  },

  handles: [
    { id: 'mortaise_std_blanc',  name: 'Poignée mortaise standard', finish: 'Blanc' },
    { id: 'd_surface_blanc',     name: 'Poignée extérieure forme de D montée en surface', finish: 'Blanc' },
    { id: 'mortaise_euro_nickel',name: 'Poignée mortaise Euro', finish: 'Nickel satiné' },
    { id: 'mortaise_euro_bronze',name: 'Poignée mortaise Euro', finish: 'Bronze huilé' },
    { id: 'mortaise_euro_chrome',name: 'Poignée mortaise Euro', finish: 'Chrome brossé' },
    { id: 'mortaise_euro_laiton',name: 'Poignée mortaise Euro', finish: 'Laiton' }
  ],

  security_options: {
    note: 'Offert en blanc ou noir',
    options: [
      'Barre de sécurité réglable',
      'Verrouillage au seuil à 2 positions'
    ]
  },

  grilles: {
    croisillons: [
      { id: 'georgien_58_1', name: 'Géorgien 5/8" ou 1"', finishes: ['Blanc', 'Peinturé'] },
      { id: 'rectangulaire_58', name: 'Rectangulaire 5/8"', finishes: ['Blanc', 'Peinturé'] },
      { id: 'mince_14', name: 'Mince 1/4"', finishes: ['Blanc', 'Étain', 'Laiton'] }
    ],
    faux_barrotins: [
      { id: 'sans_inter_78', name: '7/8" sans intercalaire', finishes: ['Blanc', 'Peinturé'] },
      { id: 'avec_inter_2',  name: '2" avec intercalaire' }
    ],
    motifs: ['Standard', 'Contour', 'Valence', 'Faux barrotins 2" sur mesure']
  },

  other_options: [
    'Serrure à clé',
    'Verres teintés bronze ou gris',
    'Extension de cadre intérieur grandeur standard (8 1/4", 9 1/4", 9 3/4")',
    'Extension de cadre intérieur max 13 3/4" (custom)',
    'Moulure à brique en PVC',
    'Moulure à brique en bois recouverte de PVC (1 1/2" et 2")',
    'Extension de seuil aluminium anodisé',
    'Recouvrement de seuil aluminium anodisé',
    'Lame de clouage',
    'Impostes et volets latéraux'
  ],

  // DIMENSIONS STANDARDS (from brochure page 3)
  // Nominal → Actual (mm → inches)
  dimensions: {
    widths: {
      '2_panneaux_xo_ox': {
        label: '2 PANNEAUX - XO / OX',
        configs: ['XO', 'OX'],
        sizes: [
          { nominal: '4\'10"', mm: 1483, inches: '58 3/8"' },
          { nominal: '5\'',    mm: 1505, inches: '59 1/4"' },
          { nominal: '6\'',    mm: 1784, inches: '70 1/4"' },
          { nominal: '7\'',    mm: 2115, inches: '83 1/4"' },
          { nominal: '8\'',    mm: 2391, inches: '94 1/8"' }
        ]
      },
      '3_panneaux_xoo_xox_oox': {
        label: '3 PANNEAUX - XOO / XOX / OOX',
        configs: ['XOO', 'XOX', 'OOX'],
        sizes: [
          { nominal: '8\'',  mm: 2224, inches: '87 9/16"' },
          { nominal: '9\'',  mm: 2643, inches: '104 1/16"' },
          { nominal: '10\'', mm: 3138, inches: '123 9/16"' },
          { nominal: '12\'', mm: 3553, inches: '139 7/8"' }
        ]
      },
      '3_panneaux_oxo_g_oxo_d': {
        label: '3 PANNEAUX - OXO-G / OXO-D',
        configs: ['OXO-G', 'OXO-D'],
        sizes: [
          { nominal: '8\'',  mm: 2259, inches: '88 15/16"' },
          { nominal: '9\'',  mm: 2678, inches: '105 7/16"' },
          { nominal: '10\'', mm: 3173, inches: '124 15/16"' },
          { nominal: '12\'', mm: 3588, inches: '141 1/4"' }
        ]
      },
      '4_panneaux_oxxo': {
        label: '4 PANNEAUX - OXXO',
        configs: ['OXXO'],
        sizes: [
          { nominal: '10\'', mm: 2948, inches: '116 1/16"' },
          { nominal: '12\'', mm: 3507, inches: '138 1/16"' }
        ]
      }
    },
    heights: [
      { nominal: '6\'',    mm: 1821, inches: '71 11/16"', note: 'Seulement sur portes 5\', 6\' et 9\'' },
      { nominal: '6\'8"',  mm: 2019, inches: '79 1/2"' },
      { nominal: '6\'10"', mm: 2057, inches: '81"' },
      { nominal: '8\'',    mm: 2430, inches: '95 11/16"' }
    ],
    note: 'Dimensions non standards aussi disponibles'
  },

  warranties: {
    items: [
      { item: 'Formation de buée à l\'intérieur de l\'unité scellée', duration: '20 ans' },
      { item: 'Bris spontané du verre (verre intérieur seulement)',    duration: '10 ans' },
      { item: 'PVC',                                                    duration: '10 ans' },
      { item: 'Pièces',                                                 duration: '1 an' }
    ],
    transferable: true
  }
};

// ============================================================================
// BELLE-VUE PRIMA & PRESTIGE — Portes patio premium
// ============================================================================

export const BELLE_VUE = {
  id: 'belle_vue',
  name: 'Belle-Vue',
  manufacturer: 'Portes Standard',
  distributed_by: ['Touchette'],
  type: 'Porte patio premium (coulissante ou levante-coulissante)',

  models: {
    prima: {
      id: 'prima',
      name: 'Belle-Vue Prima',
      description: 'Tout PVC — version économique de la gamme Belle-Vue',
      material: 'PVC',
      ext_colors: ['Blanc 141', 'Blanc crème 136', 'Peinturable sur mesure']
    },
    prestige: {
      id: 'prestige',
      name: 'Belle-Vue Prestige',
      description: 'Hybride — PVC intérieur + aluminium extérieur durable',
      material: 'Hybride (PVC intérieur + aluminium extrudé extérieur)',
      features_extra: [
        'Extrusions d\'aluminium',
        'Design élégant avec volets de 3 1/2"',
        'Seuil recouvert d\'aluminium anodisé',
        'Cache rainure sur glissière de tête'
      ],
      ext_colors_stock: ['Noir', 'Brun commercial', 'Blanc', 'Anodisé clair'],
      ext_colors_custom: 'Couleurs personnalisées sur commande'
    }
  },

  specs_common: {
    panels: [
      'Verre Low-E avec gaz argon (standard) ou Low-E Plus argon',
      'Intercalaire non conducteur',
      'Renforts acier galvanisé calibre 16',
      'Système exclusif roulement à billes tandem'
    ],
    frame: [
      'Seuil tout PVC qui ne pourrit pas (Prima) / recouvert aluminium anodisé (Prestige)',
      'Revêtement intérieur PVC',
      'Cadre bois jointé 1 3/16" (jambages + tête)',
      'Jambages et tête extrudés d\'une seule pièce',
      'Coupe-froid haute performance'
    ],
    frame_depths: [
      { id: '5_1_2', mm: 140, inches: '5 1/2"' },
      { id: '6_5_8', mm: 168, inches: '6 5/8"' },
      { id: '7_1_4', mm: 184, inches: '7 1/4"' }
    ],
    handles: {
      level: 40,
      description: 'Poignées ergonomiques de niveau 40 (une des plus sécuritaires en Amérique du Nord)',
      included: 'Poignée exclusive niveau 40 incluse (intérieur + extérieur)',
      mortaise_options: [
        { style: 'Euro', finishes: ['Blanc', 'Nickel satiné', 'Bronze huilé', 'Chrome brossé', 'Laiton'] },
        { style: 'Contemporaine', finishes: ['Blanc', 'Nickel satiné', 'Bronze huilé'] }
      ],
      locking: '1 ou 2 points de verrouillage'
    },
    moustiquaire: 'Cadre aluminium renforci à glissement doux, treillis fibre de verre',
    security: ['Barre de sécurité réglable', 'Verrouillage au seuil à 2 positions']
  },

  energy: {
    double_low_e_plus_argon: {
      name: 'Double vitrage Low-E Plus argon',
      prima:    { re: 37, u_value: 1.48, r_value: 3.85 },
      prestige: { re: 34, u_value: 1.59, r_value: 3.57 }
    },
    triple_2x_low_e_2x_argon: {
      name: 'Triple vitrage 2× Low-E avec 2× gaz argon (option)',
      optional: true,
      prima:    { re: 37, u_value: 1.25, r_value: 4.5 },
      prestige: { re: 35, u_value: 1.36, r_value: 4.2 }
    }
  },

  glass_options: [
    'Verre triple double Low-E avec gaz argon',
    'Stores intégrés Eclipse avec Low-E (gaz argon non-disponible)',
    'Croisillons',
    'Verre teinté bronze ou gris',
    'Faux barrotins'
  ],

  grilles: {
    croisillons: [
      { id: 'georgien', name: 'Géorgien 5/8" ou 1"', finishes: ['Blanc', 'Peint'] },
      { id: 'rectangulaire', name: 'Rectangulaire 5/8"', finishes: ['Blanc', 'Peint'] },
      { id: 'mince', name: 'Mince 1/4"', finishes: ['Blanc', 'Étain', 'Laiton'] }
    ],
    faux_barrotins: [
      { id: 'sans_inter', name: '7/8" sans intercalaire' },
      { id: 'avec_inter', name: '2" avec intercalaire' }
    ],
    motifs: ['Standard', 'Contour', 'Valence', 'Faux barrotins 2" sur mesure']
  },

  eclipse_blinds: {
    name: 'Stores Eclipse intégrés',
    description: 'Stores intérieurs placés entre les vitres — intimité contrôlée, pas de nettoyage requis',
    functions: ['Élévation / abaissement', 'Ouverture / fermeture'],
    available_on: 'Prima et Prestige',
    note: 'Summum en matière d\'intimité, élégance et commodité'
  },

  levante_coulissante: {
    name: 'Belle-Vue Levante et coulissante',
    description: 'Porte à levier — poignée vers le haut = verrouille + étanche, poignée vers le bas = soulève + glisse facilement',
    available_on: 'Prima et Prestige',
    tagline: 'La porte idéale pour ceux qui voient grand — mur de verre géant'
  },

  // DIMENSIONS STANDARDS (from brochure page 5)
  // * = offert sur Prima ET Prestige avec stores Eclipse
  // † = offert sur Belle-Vue Prima avec stores Eclipse
  dimensions: {
    widths: {
      '2_panneaux_xo_ox': {
        label: '2 PANNEAUX - XO/OX',
        configs: ['XO', 'OX'],
        sizes: [
          { nominal: '5\'',  mm: 1505, inches: '59 1/4"', eclipse_both: true },
          { nominal: '6\'',  mm: 1784, inches: '70 1/4"', eclipse_both: true },
          { nominal: '7\'',  mm: 2115, inches: '83 1/4"' },
          { nominal: '8\'',  mm: 2391, inches: '94 1/8"' }
        ]
      },
      '3_panneaux_xoo_xox_oox': {
        label: '3 PANNEAUX - XOO / XOX / OOX',
        configs: ['XOO', 'XOX', 'OOX'],
        xox_no_eclipse: true,
        sizes: [
          { nominal: '8\'',  mm: 2184, inches: '86"',      eclipse_both: true },
          { nominal: '9\'',  mm: 2604, inches: '102 1/2"', eclipse_both: true },
          { nominal: '10\'', mm: 3099, inches: '122"' },
          { nominal: '12\'', mm: 3513, inches: '138 5/16"' }
        ]
      },
      '3_panneaux_oxo_g_oxo_d': {
        label: '3 PANNEAUX - OXO-G / OXO-D',
        configs: ['OXO-G', 'OXO-D'],
        sizes: [
          { nominal: '8\'',  mm: 2286, inches: '90"',      eclipse_both: true },
          { nominal: '9\'',  mm: 2705, inches: '106 1/2"', eclipse_both: true },
          { nominal: '10\'', mm: 3200, inches: '126"' },
          { nominal: '12\'', mm: 3615, inches: '142 5/16"' }
        ]
      },
      '4_panneaux_oxxo': {
        label: '4 PANNEAUX - OXXO',
        configs: ['OXXO'],
        sizes: [
          { nominal: '10\'', mm: 2948, inches: '116 1/16"', eclipse_both: true },
          { nominal: '12\'', mm: 3507, inches: '138 1/16"', eclipse_both: true }
        ]
      }
    },
    heights: [
      { nominal: '6\'8"',  mm: 2019, inches: '79 1/2"', eclipse_both: true },
      { nominal: '6\'10"', mm: 2057, inches: '81"',      eclipse_prima_only: true },
      { nominal: '8\'',    mm: 2430, inches: '95 11/16"' }
    ]
  },

  warranties: {
    items: [
      { item: 'Formation de buée à l\'intérieur de l\'unité scellée', duration: '20 ans', note: '10 ans pour stores intégrés' },
      { item: 'PVC',                                                    duration: '20 ans' },
      { item: 'Pièces',                                                 duration: '10 ans' },
      { item: 'Bris spontané du verre (verre intérieur seulement)',    duration: '10 ans', note: 'Ne s\'applique pas aux stores intégrés' },
      { item: 'Mécanisme des stores intégrés',                         duration: '10 ans' }
    ],
    transferable: true
  }
};

// ---------- RÉCAP POUR LE UI ----------
// Liste des portes patio Portes Standard disponibles via Touchette

export const PORTES_STANDARD_PATIO = [
  {
    id: 'odyssee',
    name: 'Odyssée',
    tagline: 'Classique PVC — économique',
    data: ODYSSEE
  },
  {
    id: 'belle_vue_prima',
    name: 'Belle-Vue Prima',
    tagline: 'Tout PVC premium + poignées niveau 40',
    data: BELLE_VUE.models.prima
  },
  {
    id: 'belle_vue_prestige',
    name: 'Belle-Vue Prestige',
    tagline: 'Hybride alu ext. + poignées niveau 40',
    data: BELLE_VUE.models.prestige
  },
  {
    id: 'belle_vue_levante',
    name: 'Belle-Vue Levante & Coulissante',
    tagline: 'Lift & slide — mur de verre géant',
    data: BELLE_VUE.levante_coulissante
  }
];
