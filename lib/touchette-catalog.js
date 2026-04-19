// ============================================================================
// CATALOGUE TOUCHETTE PORTES & FENÊTRES — Série Tradition Performance
// ============================================================================
// Extrait de Brochure Performance FR Touchette.pdf (12 pages)
// Manufacturier: Touchette Portes & Fenêtres Inc. (40+ ans d'expertise)
// Utilisé par Jeremy (PÜR Construction) — voir quote Eric Brisson.
//
// DIFFÉRENCES CLÉS vs Royalty:
//  - Profilé cadre: 5 1/4" (vs Royalty 5 5/8")
//  - Profilé Alu-PVC: 5 3/4"
//  - Vitrage disponible en double 7/8" OU triple 1 1/4"
//  - Classe commerciale CW-PG100 (supérieure au résidentiel Royalty)
//  - Ligne spéciale Fenêtres Aluminium (extérieur alu + intérieur PVC)
//  - Certifié AAMA (profilés Thermoplast Nextrusions)
//  - Conçu pour résidentiel léger, multi-étages, institutionnel, commercial
//  - Touchette NE PUBLIE PAS de codes BS1-BS5 comme Royalty — la commande
//    se fait avec notation directe (nb de volets + config G/F/D)
// ============================================================================

// ---------- INFO ENTREPRISE ----------
export const TOUCHETTE_INFO = {
  name: 'Touchette Portes & Fenêtres Inc.',
  tagline: 'Plus de 40 ans d\'expertise',
  website: 'touchettepf.com',
  website_alt: 'touchetteportesfenetres.com',
  phone: '450-469-1451',
  phone_toll_free: '1-800-561-6185',
  email: 'touchette@touchettepf.com',
  rbq: '5806-9758-01',
  locations: [
    {
      name: 'Saint-Césaire (siège social / usine)',
      address: '1160, rue de Versailles',
      city: 'Saint-Césaire',
      postal: 'J0L 1T0'
    },
    {
      name: 'Mirabel',
      address: '13838, Boul. du Curé-Labelle',
      city: 'Mirabel',
      postal: 'J7J 1L3'
    }
  ],
  certifications: ['AAMA Certified Profiles (FGIA)', 'NAMI', 'NFRC', 'Energy Star', 'AVFQ'],
  profile_supplier: 'Thermoplast Nextrusions (un des seuls extrudeurs QC avec cert AAMA)'
};

// ---------- SÉRIE TRADITION PERFORMANCE ----------
// 3 familles de fenêtres + performances commerciales

export const TOUCHETTE_SERIE = {
  name: 'Série Tradition Performance',
  description: 'Gamme de fenêtres efficaces, esthétiques et faciles d\'entretien grâce au fini lustré des cadres. Produits innovants écoénergétiques adaptés aux besoins, conçus pour performance et durabilité.',
  frame_profiles: [
    { id: 'pvc_5_1_4',     width: '5 1/4"', material: 'PVC rigide',            for_glass: 'Double 7/8"' },
    { id: 'pvc_5_1_4_tri', width: '5 1/4"', material: 'PVC rigide',            for_glass: 'Triple 1 1/4"' },
    { id: 'alu_5_3_4',     width: '5 3/4"', material: 'Aluminium + PVC intérieur', for_glass: 'Double 7/8"' },
    { id: 'alu_5_3_4_tri', width: '5 3/4"', material: 'Aluminium + PVC intérieur', for_glass: 'Triple 1 1/4"' }
  ],
  glass_options: [
    { id: 'double', label: 'Double vitrage 7/8" (22.2mm)' },
    { id: 'triple', label: 'Triple vitrage 1 1/4" (32mm)' }
  ],
  sash_style: 'Contemporain',
  features_common: [
    'Cadre soudé PVC rigide, avec ou sans moulure à brique',
    'Cage à gypse et à bois incorporée (facilite installation)',
    'Volet soudé PVC rigide ou aluminium (selon ligne)',
    'Volet dans portion isolée de la maison pour rendement énergétique optimal',
    'Ouverture 90° pour nettoyage simple et rapide',
    'Triple coupe-froid pour étanchéité maximale au vent, air et eau',
    'Verre énergétique double ou triple pour plus de confort',
    'Moustiquaire en fibre de verre avec cadre en aluminium'
  ]
};

// ---------- 3 FAMILLES DE FENÊTRES ----------

export const TOUCHETTE_WINDOW_FAMILIES = {
  ouvrant_exterieur_fixe: {
    id: 'ouvrant_exterieur_fixe',
    name: 'Fenêtres ouvrant extérieur / fixes',
    tagline: 'Esthétisme, confort et sécurité',
    types_included: ['Battant (ouvrant extérieur)', 'Auvent', 'Fixe'],
    features: [
      'Profilés multichambres très robustes (rigidité + performance énergétique supérieure)',
      'Triple coupe-froid',
      'Cadre soudé PVC rigide',
      'Ouverture 90° pour nettoyage',
      'Verre double ou triple',
      'Vaste choix options finition intérieure/extérieure',
      'Moustiquaire fibre de verre + cadre aluminium'
    ],
    available_profiles: ['pvc_5_1_4', 'pvc_5_1_4_tri']
  },
  coulissante_guillotine: {
    id: 'coulissante_guillotine',
    name: 'Fenêtres coulissantes et à guillotine',
    tagline: 'Excellent rapport qualité-prix',
    types_included: ['Coulissante simple', 'Guillotine simple'],
    description: 'Parfaites pour espaces restreints. Profilés étroits laissent pénétrer un maximum de lumière et offrent une visibilité dégagée.',
    features: [
      'Cadre soudé PVC rigide avec cage à gypse + bois',
      'Volet portion isolée pour rendement énergétique',
      'Triple coupe-froid',
      'Volet sur roulettes pour glissement facile (coulissante)',
      'Ouverture 90° pour nettoyage (guillotine)',
      'Loquet central à came sécuritaire',
      'Poignée d\'opération intégrée au volet',
      'Verre double ou triple',
      'Moustiquaire fibre de verre + cadre aluminium'
    ],
    available_profiles: ['pvc_5_1_4', 'pvc_5_1_4_tri']
  },
  aluminium: {
    id: 'aluminium',
    name: 'Fenêtres Aluminium',
    tagline: 'Le meilleur des deux mondes',
    description: 'Aluminium extérieur + PVC intérieur. Combine l\'esthétisme et durabilité de l\'aluminium avec l\'efficacité énergétique et facilité d\'entretien du PVC.',
    types_included: ['Battant', 'Auvent', 'Fixe', 'Guillotine', 'Coulissant'],
    target_projects: ['Résidentiel léger et multi-étages', 'Institutionnel', 'Commercial'],
    certification: 'NAFS-11/17 (fenêtre commerciale)',
    features: [
      'Profilés cadre aluminium fixés mécaniquement avec vis en acier (rainures intégrées)',
      'Profilés volets aluminium assemblés avec clés de coin ajustables',
      'Verre énergétique double ou triple',
      'Moustiquaire robuste aluminium + mèche fibre de verre',
      'Isolation thermique vinyle soudée par fusion (protection max infiltration air/eau)'
    ],
    available_profiles: ['alu_5_3_4', 'alu_5_3_4_tri']
  }
};

// ---------- PERFORMANCES STRUCTURALES (page 10) ----------
// Normes NAFS-AAMA/WDMA/CSA 101/I.S.2/A404-11
// Performance Grade (PG) — plus élevé = meilleur

export const TOUCHETTE_PERFORMANCE = {
  norm: 'NAFS-AAMA/WDMA/CSA 101/I.S.2/A404-11',
  note: 'Les produits sont classés par grade de performance (PG). Plus la valeur est haute, plus le niveau de performance du produit est élevé. La performance s\'applique aux fenêtres de tailles inférieures ou équivalentes à celles testées.',
  models: [
    {
      model: 'Fixe',
      air_tightness: 'A3',
      water_pa: 730,
      wind_load_pa: 4800,
      forced_entry: 'F20',
      class: 'CW-PG100-FW',
      test_size: '72" × 72"'
    },
    {
      model: 'Battant',
      air_tightness: 'A3',
      water_pa: 730,
      wind_load_pa: 4800,
      forced_entry: 'F20',
      class: 'CW-PG100-C',
      test_size: '32" × 63"'
    },
    {
      model: 'Auvent',
      air_tightness: 'A3',
      water_pa: 730,
      wind_load_pa: 2400,
      forced_entry: 'F20',
      class: 'CW-PG50-AP',
      test_size: '62" × 48"'
    },
    {
      model: 'Guillotine simple',
      air_tightness: 'A3',
      water_pa: 720,
      wind_load_pa: 4080,
      forced_entry: 'F20',
      class: 'R-PG85-H',
      test_size: '39" × 63"'
    },
    {
      model: 'Coulissant simple',
      air_tightness: 'A3',
      water_pa: 620,
      wind_load_pa: 2880,
      forced_entry: 'F20',
      class: 'R-PG60-HS',
      test_size: '63" × 43"'
    },
    {
      model: 'Ouvrant intérieur - Aluminium',
      air_tightness: 'A3',
      water_pa: 730,
      wind_load_pa: 4800,
      forced_entry: 'F20',
      class: 'CW-PG100-DAW',
      test_size: '48" × 71"'
    }
  ],
  explanation: {
    valeur_u: 'INDIQUE LA PERTE DE CHALEUR. On cherche une valeur U faible.',
    valeur_r: 'MESURE L\'ISOLATION. Correspond à 1/U. On recherche une valeur R élevée.',
    valeur_re: 'INDIQUE LE RENDEMENT ÉNERGÉTIQUE. Rapport entre les pertes de chaleur, l\'isolation et le gain solaire. On recherche une valeur RE élevée.'
  }
};

// ---------- NOTATION ----------
// Touchette utilise la notation "Mec-Inov" (software de devis interne):
// Exemples vus dans les quotes Jeremy:
//   B3-HYB = Battant 3 lumières Hybride
//   B2-HYB = Battant 2 lumières Hybride
//   B1-HYB = Battant 1 lumière Hybride
//   B2-PVC = Battant 2 lumières PVC
//   A1-PVC = Auvent 1 lumière PVC
//   PF1-PVC = Panoramique Fixe 1 lumière PVC
//   (F) = Fixe
//   (G) = Gauche
//   (D) = Droite
//   (GF) = Gauche + Fixe
//   (FD) = Fixe + Droite
//   (GFD) = Gauche + Fixe + Droite
//
// Mapping Touchette → Royalty:
//   B1 → BS1 (1 lumière)
//   B2 → BS2 ou BS2L (2 lumières)
//   B3 → BS3 ou BS3L (3 lumières)
//   A1 → A1 (auvent 1 lumière)
//   A2 → A2
//   PF = Panoramique Fixe = fenêtre fixe (pas de code Royalty direct)

// ---------- TYPES DE FENÊTRES AVEC CONFIGURATIONS ----------
// Source: commande-royalty.html WINDOW_TYPES_TOUCHETTE (lignes 1482–1622)
// Codes Touchette: B1/B1D/B2/B2D/B3/B4, A1/A2/A2F/A3/A3F, G1/G2/G3, C2G/C2D/C3,
//                 F1/F2/F3/F4, BAIE-*, ARC-*

export const WINDOW_TYPES_TOUCHETTE = {
  battant: {
    name: 'Fenêtre à battant',
    en: 'Casement',
    specs_default: [
      'Profilé cadre PVC rigide 5 1/4"',
      'Cadre soudé avec cage à gypse + bois incorporée',
      'Triple coupe-froid pour étanchéité air/eau/vent',
      'Ouverture 90° pour nettoyage intérieur',
      'Volet dans portion isolée — rendement énergétique optimal',
      'Verre double 7/8" ou triple 1 1/4" Low-E Argon',
      'Moustiquaire fibre de verre + cadre aluminium',
      'Classe CW-PG100-C (commercial grade) · F20'
    ],
    csa: 'A3 · Water 730 Pa · Wind 4800 Pa · F20 · CW-PG100-C',
    configurations: [
      { code: 'B1',  notation: 'G',    panels: ['G'],             min: { w: 15, h: 15 }, max: { w: 38,  h: 78 } },
      { code: 'B1D', notation: 'D',    panels: ['D'],             min: { w: 15, h: 15 }, max: { w: 38,  h: 78 } },
      { code: 'B2',  notation: 'GF',   panels: ['G','F'],         min: { w: 29, h: 15 }, max: { w: 76,  h: 78 } },
      { code: 'B2D', notation: 'FD',   panels: ['F','D'],         min: { w: 29, h: 15 }, max: { w: 76,  h: 78 } },
      { code: 'B3',  notation: 'GFD',  panels: ['G','F','D'],     min: { w: 43, h: 15 }, max: { w: 114, h: 78 } },
      { code: 'B4',  notation: 'GFFD', panels: ['G','F','F','D'], min: { w: 57, h: 15 }, max: { w: 152, h: 78 } }
    ]
  },
  auvent: {
    name: 'Fenêtre à auvent',
    en: 'Awning',
    specs_default: [
      'Profilé cadre PVC rigide 5 1/4"',
      'Cadre soudé, volet en portion isolée',
      'Triple coupe-froid étanchéité maximale',
      'Mécanisme à manivelle avec verrouillage multipoint',
      'Verre double 7/8" ou triple 1 1/4" Low-E Argon',
      'Moustiquaire fibre de verre + cadre aluminium',
      'Classe CW-PG50-AP · F20 (test 62×48)'
    ],
    csa: 'A3 · Water 730 Pa · Wind 2400 Pa · F20 · CW-PG50-AP',
    configurations: [
      { code: 'A1',  notation: 'A',   panels: ['A'],         min: { w: 15, h: 15 }, max: { w: 60,  h: 42 } },
      { code: 'A2',  notation: 'AF',  panels: ['A','F'],     min: { w: 29, h: 15 }, max: { w: 120, h: 42 }, variant: 'Auvent gauche · fixe droite' },
      { code: 'A2F', notation: 'FA',  panels: ['F','A'],     min: { w: 29, h: 15 }, max: { w: 120, h: 42 }, variant: 'Fixe gauche · auvent droite' },
      { code: 'A3',  notation: 'AFA', panels: ['A','F','A'], min: { w: 43, h: 15 }, max: { w: 180, h: 42 }, variant: 'Auvent · fixe centre · auvent' },
      { code: 'A3F', notation: 'FAF', panels: ['F','A','F'], min: { w: 43, h: 15 }, max: { w: 180, h: 42 }, variant: 'Fixe · auvent centre · fixe' }
    ]
  },
  guillotine: {
    name: 'Fenêtre à guillotine',
    en: 'Hung (single)',
    specs_default: [
      'Profilé cadre PVC rigide 5 1/4"',
      'Cadre soudé avec cage à gypse + bois',
      'Loquet central à came sécuritaire',
      "Poignée d'opération intégrée au volet",
      'Ouverture 90° pour nettoyage',
      'Verre double 7/8" ou triple 1 1/4" Low-E Argon',
      'Moustiquaire fibre de verre + cadre aluminium',
      'Classe R-PG85-H · F20 (test 39×63)'
    ],
    csa: 'A3 · Water 720 Pa · Wind 4080 Pa · F20 · R-PG85-H',
    configurations: [
      { code: 'G1', notation: 'Simple',    panels: ['Gs'],           mode: 'simple', min: { w: 17, h: 28 }, max: { w: 44,  h: 74 } },
      { code: 'G2', notation: 'Simple ×2', panels: ['Gs','Gs'],      mode: 'simple', min: { w: 34, h: 28 }, max: { w: 88,  h: 74 } },
      { code: 'G3', notation: 'Simple ×3', panels: ['Gs','Gs','Gs'], mode: 'simple', min: { w: 39, h: 28 }, max: { w: 137, h: 74 } }
    ]
  },
  coulissante: {
    name: 'Fenêtre coulissante',
    en: 'Sliding (single)',
    specs_default: [
      'Profilé cadre PVC rigide 5 1/4"',
      'Cadre soudé avec cage à gypse + bois',
      'Volet sur roulettes — glissement facile',
      'Loquet central à came sécuritaire',
      'Verre double 7/8" ou triple 1 1/4" Low-E Argon',
      'Moustiquaire fibre de verre + cadre aluminium',
      'Classe R-PG60-HS · F20 (test 63×43)'
    ],
    csa: 'A3 · Water 620 Pa · Wind 2880 Pa · F20 · R-PG60-HS',
    configurations: [
      { code: 'C2G', notation: 'XO',  panels: ['X','O'],     min: { w: 29, h: 18 }, max: { w: 68, h: 60 } },
      { code: 'C2D', notation: 'OX',  panels: ['O','X'],     min: { w: 29, h: 18 }, max: { w: 68, h: 60 } },
      { code: 'C3',  notation: 'XOX', panels: ['X','O','X'], min: { w: 42, h: 18 }, max: { w: 95, h: 60 }, variant: 'Extrémités coulissent · centre fixe' }
    ]
  },
  fixe: {
    name: 'Fenêtre fixe / panoramique',
    en: 'Picture / Fixed',
    specs_default: [
      'Profilé cadre PVC rigide 5 1/4"',
      'Cadre soudé PVC rigide sans mécanisme',
      "Triple coupe-froid d'étanchéité",
      'Verre double 7/8" ou triple 1 1/4" Low-E Argon',
      'Maximum de lumière et de vue',
      'Classe CW-PG100-FW · F20 (test 72×72)'
    ],
    csa: 'A3 · Water 730 Pa · Wind 4800 Pa · F20 · CW-PG100-FW',
    configurations: [
      { code: 'F1',  notation: 'F',    panels: ['F'],             min: { w: 12, h: 12 }, max: { w: 120, h: 96 } },
      { code: 'F2',  notation: 'FF',   panels: ['F','F'],         min: { w: 24, h: 12 }, max: { w: 180, h: 96 } },
      { code: 'F3',  notation: 'FFF',  panels: ['F','F','F'],     min: { w: 36, h: 12 }, max: { w: 240, h: 96 } },
      { code: 'F4',  notation: 'FFFF', panels: ['F','F','F','F'], min: { w: 48, h: 12 }, max: { w: 300, h: 96 }, variant: 'Panoramique large' }
    ]
  },
  baie: {
    name: 'Fenêtre en baie (Bay)',
    en: 'Bay window',
    specs_default: [
      'Assemblage 3 fenêtres avec projection',
      'Angle 30° ou 45° selon design',
      "Panneaux latéraux angulés vers l'extérieur",
      'Profilé cadre PVC rigide 5 1/4"',
      'Verre double 7/8" ou triple 1 1/4" Low-E Argon',
      'Renforts acier dans jambages d\'assemblage',
      'Plateau et tête structurés sur mesure'
    ],
    csa: 'NAFS-AAMA · F20',
    configurations: [
      { code: 'BAIE-FFF', notation: 'F/F/F', panels: ['F','F','F'], min: { w: 60, h: 36 }, max: { w: 144, h: 84 }, bay: true, variant: 'Tout fixe' },
      { code: 'BAIE-GFD', notation: 'G/F/D', panels: ['G','F','D'], min: { w: 60, h: 36 }, max: { w: 144, h: 84 }, bay: true, variant: 'Battants latéraux' },
      { code: 'BAIE-GFF', notation: 'G/F/F', panels: ['G','F','F'], min: { w: 60, h: 36 }, max: { w: 144, h: 84 }, bay: true, variant: 'Battant gauche' },
      { code: 'BAIE-FFD', notation: 'F/F/D', panels: ['F','F','D'], min: { w: 60, h: 36 }, max: { w: 144, h: 84 }, bay: true, variant: 'Battant droite' }
    ]
  },
  arc: {
    name: 'Fenêtre en arc (Bow)',
    en: 'Bow window',
    specs_default: [
      'Assemblage 4 ou 5 fenêtres en arc',
      'Angle 10°-15° par panneau',
      'Profilé cadre PVC rigide 5 1/4"',
      'Verre double 7/8" ou triple 1 1/4" Low-E Argon',
      'Renforts acier + plateau courbé sur mesure'
    ],
    csa: 'NAFS-AAMA · F20',
    configurations: [
      { code: 'ARC-4F',     notation: 'FFFF',  panels: ['F','F','F','F'],     min: { w: 72, h: 36 }, max: { w: 180, h: 84 }, bow: true, variant: '4 panneaux tout fixe' },
      { code: 'ARC-5F',     notation: 'FFFFF', panels: ['F','F','F','F','F'], min: { w: 90, h: 36 }, max: { w: 220, h: 84 }, bow: true, variant: '5 panneaux tout fixe' },
      { code: 'ARC-5GFFFD', notation: 'GFFFD', panels: ['G','F','F','F','D'], min: { w: 90, h: 36 }, max: { w: 220, h: 84 }, bow: true, variant: '5 panneaux battants aux extrémités' }
    ]
  }
};

export const TOUCHETTE_NOTATION = {
  code_prefix: {
    'B': 'Battant',
    'A': 'Auvent',
    'C': 'Coulissante',
    'G': 'Guillotine',
    'PF': 'Panoramique Fixe',
    'F': 'Fixe'
  },
  material_suffix: {
    'HYB': 'Hybride (PVC + aluminium)',
    'PVC': 'PVC',
    'ALU': 'Aluminium'
  },
  config_in_parens: 'G=Gauche, F=Fixe, D=Droite, A=Auvent',
  example: 'B3-HYB (GFD) 87 × 51 1/4" — Fenêtre à battant hybride 3 lumières, gauche+fixe+droite'
};
