import type { ConceptId, SpeciesId, StationId, WaterSample } from '../types'

export type StationMeta = {
  id: StationId
  short: string
  title: string
  brief: string
}

export const STATIONS: StationMeta[] = [
  {
    id: 'distinguer',
    short: 'Notions',
    title: 'pH · basicité · alcalinité',
    brief: 'Glissez chaque définition sur la bonne grandeur. Ce sont trois idées distinctes.',
  },
  {
    id: 'especes',
    short: 'Espèces',
    title: 'Qui porte l’alcalinité ?',
    brief: 'Placez dans le bassin les espèces qui neutralisent un acide. Laissez de côté les ions inertes.',
  },
  {
    id: 'tampon',
    short: 'Tampon',
    title: 'Pouvoir tampon',
    brief: 'Ajoutez le même acide aux deux eaux. Observez laquelle résiste à la baisse de pH.',
  },
  {
    id: 'dosage-ta',
    short: 'TA',
    title: 'Dosage du TA',
    brief: 'Avec la phénolphtaléine, dosez jusqu’à pH ≈ 8,3 (rose → incolore). Le TA ne voit pas les HCO₃⁻.',
  },
  {
    id: 'dosage-tac',
    short: 'TAC',
    title: 'Dosage du TAC',
    brief:
      'Hélianthine : ajoutez l’acide jusqu’à pH ≈ 4,3. Le TAC = acide consommé (meq/L). Le pH n’est pas le TAC en °f.',
  },
  {
    id: 'lecture',
    short: 'Lecture',
    title: 'Degré français & interprétation',
    brief:
      'Ici seulement : convertir le TAC (meq/L) en °f et mg/L CaCO₃. Reliez aussi TA et TAC pour une eau naturelle.',
  },
]

export function stationById(id: StationId): StationMeta {
  return STATIONS.find((s) => s.id === id) ?? STATIONS[0]
}

export const CONCEPTS: { id: ConceptId; label: string; definition: string }[] = [
  {
    id: 'ph',
    label: 'pH',
    definition: 'Indique l’état acide ou basique à un instant donné (via [H₃O⁺]).',
  },
  {
    id: 'basicite',
    label: 'Basicité',
    definition: 'Caractérise la présence de bases (souvent liée aux OH⁻).',
  },
  {
    id: 'alcalinite',
    label: 'Alcalinité',
    definition: 'Mesure la capacité de l’eau à neutraliser un acide (réserve de bases).',
  },
]

export const SPECIES: {
  id: SpeciesId
  formula: string
  name: string
  alkalinity: boolean
  note: string
}[] = [
  { id: 'oh', formula: 'OH⁻', name: 'Hydroxyde', alkalinity: true, note: 'Compte dans TA et TAC.' },
  { id: 'co3', formula: 'CO₃²⁻', name: 'Carbonate', alkalinity: true, note: 'Deux H⁺ ; factor 2 dans le TAC molaire.' },
  { id: 'hco3', formula: 'HCO₃⁻', name: 'Hydrogénocarbonate', alkalinity: true, note: 'Majoritaire dans les eaux naturelles · TAC seulement.' },
  { id: 'na', formula: 'Na⁺', name: 'Sodium', alkalinity: false, note: 'Ion compagnon, sans pouvoir tampon acide.' },
  { id: 'cl', formula: 'Cl⁻', name: 'Chlorure', alkalinity: false, note: 'N’appartient pas à l’alcalinité.' },
  { id: 'h3o', formula: 'H₃O⁺', name: 'Hydronium', alkalinity: false, note: 'C’est l’acidité, pas une base.' },
]

/** Eau de forage typique : pH < 8,3 → TA ≈ 0, TAC ≈ HCO₃⁻. */
export const RIVER: WaterSample = {
  id: 'riviere',
  label: 'Eau de forage',
  blurb: 'pH 7,4 · TA ≈ 0 · alcalinité surtout HCO₃⁻',
  ph: 7.4,
  oh: 0,
  co3: 0,
  hco3: 3.0, // 15 °f
}

/** Eau après chaulage / correction basique (concentrations en mmol/L). */
export const CAUSTIC: WaterSample = {
  id: 'chaulage',
  label: 'Eau chaulée',
  blurb: 'pH élevé · TA > 0 · carbonates présents',
  ph: 10.6,
  oh: 0.4,
  co3: 0.6,
  hco3: 1.0,
}

/** Faible alcalinité, pH encore basique — pH fragile. */
export const FRAGILE: WaterSample = {
  id: 'fragile',
  label: 'Eau peu tamponnée',
  blurb: 'pH 9,0 mais presque pas de réserve',
  ph: 9.0,
  oh: 0.15,
  co3: 0.05,
  hco3: 0.2,
}

/** Forte alcalinité, pH modéré. */
export const BUFFERED: WaterSample = {
  id: 'tamponnee',
  label: 'Eau bien tamponnée',
  blurb: 'pH 7,6 · TAC élevé grâce aux bicarbonates',
  ph: 7.6,
  oh: 0,
  co3: 0,
  hco3: 4.0,
}
