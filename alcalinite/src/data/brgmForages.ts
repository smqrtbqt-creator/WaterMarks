/**
 * Eaux issues du rapport BRGM R 34914 (Aquitaine, 1991–92) —
 * nappes Eocène, syndicats ruraux de Gironde.
 * Concentrations d’après analyses de laboratoire (paliers représentatifs).
 */

export type BrgmForage = {
  id: string
  label: string
  code: string
  aquifer: string
  /** pH laboratoire */
  ph: number
  /** Conductivité labo µS/cm */
  conductivity: number
  clMgL: number
  so4MgL: number
  hco3MgL: number
  fMgL: number
  caMgL: number
  mgMgL: number
  /** TAC °f si mesuré (bulletin) ; sinon estimé ≈ HCO₃ mg/L / 12,2 */
  tacDegreeF: number
  /** TA °f — souvent 0 (pH < 8,3) */
  taDegreeF: number
  note: string
}

export const BRGM_FORAGES: BrgmForage[] = [
  {
    id: 'st-macaire',
    label: 'Saint-Macaire',
    code: '852-2X-0024',
    aquifer: 'Eocène moyen sableux (105–140 m)',
    ph: 7.56,
    conductivity: 1045,
    clMgL: 120.7,
    so4MgL: 273,
    hco3MgL: 204.35,
    fMgL: 1.62,
    caMgL: 101,
    mgMgL: 34,
    tacDegreeF: 204.35 / 12.2,
    taDegreeF: 0,
    note: 'Axe de salinité élevé (SO₄, Cl, F). Âge > 37 000 ans.',
  },
  {
    id: 'baurech',
    label: 'Baurech F3',
    code: '827-8X-0186',
    aquifer: 'Eocène moyen calcaire + sableux (128–195 m)',
    ph: 7.68,
    conductivity: 500,
    clMgL: 34.8,
    so4MgL: 108,
    hco3MgL: 189.1,
    fMgL: 0.8,
    caMgL: 48,
    mgMgL: 15,
    tacDegreeF: 189.1 / 12.2,
    taDegreeF: 0,
    note: 'Gradient latéral : moins minéralisé que St-Macaire. Âge ≈ 30 300 ans.',
  },
  {
    id: 'macau',
    label: 'Macau',
    code: '803-2X-0256',
    aquifer: 'Eocène moyen calcaire + sableux (153–249 m)',
    ph: 7.71,
    conductivity: 430,
    clMgL: 22,
    so4MgL: 37.6,
    hco3MgL: 237.9,
    fMgL: 1.01,
    caMgL: 49,
    mgMgL: 37,
    tacDegreeF: 237.9 / 12.2,
    taDegreeF: 0,
    note: 'Hors axe de forte salinité. Âge > 40 000 ans.',
  },
  {
    id: 'pian-medoc',
    label: 'Le Pian-Médoc',
    code: '803-1X-0199',
    aquifer: 'Eocène moyen calcaire + sableux (140–259 m)',
    ph: 7.65,
    conductivity: 906,
    clMgL: 97.65,
    so4MgL: 262,
    hco3MgL: 222.65,
    fMgL: 1.88,
    caMgL: 0,
    mgMgL: 0,
    tacDegreeF: 222.65 / 12.2,
    taDegreeF: 0,
    note: 'Sur l’axe Caudrot–St-Macaire–Haux–Pian. Fluor élevé.',
  },
  {
    id: 'targon',
    label: 'Targon',
    code: 'non enregistré (1991)',
    aquifer: 'Eocène moyen',
    ph: 7.44,
    conductivity: 740,
    clMgL: 61.05,
    so4MgL: 163,
    hco3MgL: 277.55,
    fMgL: 1.67,
    caMgL: 62,
    mgMgL: 23.8,
    tacDegreeF: 277.55 / 12.2,
    taDegreeF: 0,
    note: 'Ouvrage en développement lors des essais 1991.',
  },
  {
    id: 'fontet',
    label: 'Le Fontet',
    code: '852-4X-0110',
    aquifer: 'Eocène moyen + inférieur (195–301 m)',
    ph: 7.31,
    conductivity: 535,
    clMgL: 30.18,
    so4MgL: 55,
    hco3MgL: 280.6,
    fMgL: 1.32,
    caMgL: 46,
    mgMgL: 18,
    /** Bulletin labo : TAC = 23 °f, TA = nul */
    tacDegreeF: 23,
    taDegreeF: 0,
    note: 'Bulletin : TA nul, TAC = 23 °f. Fluor 1,32 mg/L.',
  },
]

export function forageById(id: string): BrgmForage {
  return BRGM_FORAGES.find((f) => f.id === id) ?? BRGM_FORAGES[0]
}
