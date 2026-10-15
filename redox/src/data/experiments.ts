import type { BenchFrame, Station } from '../types/redox'

function frame(left: string[], right: string[], moved: number, rightDone: string): BenchFrame {
  const lost = moved <= 1 ? `${moved} électron perdu` : `${moved} électrons perdus`
  const gained = moved <= 1 ? `${moved} électron gagné` : `${moved} électrons gagnés`
  return {
    left,
    right,
    leftCaption: lost,
    rightCaption: moved === 0 ? '0 électron gagné' : rightDone || gained,
  }
}

const aeration: Station = {
  id: 'aeration',
  kicker: 'Poste 1',
  title: 'Aération',
  brief: 'L’eau brute contient du fer dissous Fe²⁺. L’air apporte l’oxygène, qui capte les électrons. Le fer s’oxyde en Fe³⁺, plus facile à séparer ensuite.',
  reductantName: 'Fer dissous',
  oxidantName: 'Dioxygène',
  frames: [0, 1, 2, 3, 4].map((moved) =>
    frame(
      [...Array(moved).fill('Fe³⁺'), ...Array(4 - moved).fill('Fe²⁺')],
      moved === 4 ? ['2 H₂O'] : ['O₂', '4 H⁺'],
      moved,
      moved === 4 ? 'oxygène réduit en eau' : '',
    ),
  ),
  halfOxidation: 'Fe²⁺ → Fe³⁺ + e⁻',
  halfReduction: 'O₂ + 4 H⁺ + 4 e⁻ → 2 H₂O',
  global: '4 Fe²⁺ + O₂ + 4 H⁺ → 4 Fe³⁺ + 2 H₂O',
  success: 'Le fer dissous s’est oxydé. L’oxygène, oxydant, s’est réduit en eau.',
  summary: [
    { species: 'Fe²⁺', role: 'réducteur, oxydation' },
    { species: 'O₂', role: 'oxydant, réduction' },
    { species: 'Fe³⁺', role: 'produit de l’oxydation' },
    { species: 'H₂O', role: 'produit de la réduction' },
  ],
}

const manganese: Station = {
  id: 'manganese',
  kicker: 'Poste 2',
  title: 'Manganèse',
  brief: 'On écrit d’abord la demi-équation d’oxydation, deux fois. Puis la demi-équation de réduction de O₂. On additionne, et on simplifie ce qui apparaît des deux côtés.',
  reductantName: 'Manganèse dissous',
  oxidantName: 'Dioxygène',
  frames: Array.from({ length: 14 }, (_, moved) => frame(['Mn²⁺', 'H₂O'], ['H⁺'], moved, '')),
  halfOxidation: 'Mn²⁺ + 2 H₂O → MnO₂ + 4 H⁺ + 2 e⁻',
  halfReduction: 'O₂ + 4 e⁻ ⇌ 2 O²⁻ puis 2 O²⁻ + 8 H⁺ → 2 H₂O + 4 H⁺',
  global: '2 Mn²⁺ + O₂ + 2 H₂O → 2 MnO₂ + 4 H⁺',
  success: 'Le manganèse s’est oxydé en dioxyde. L’oxygène s’est réduit.',
  summary: [
    { species: 'Mn²⁺', role: 'réducteur, oxydation' },
    { species: 'O₂', role: 'oxydant, réduction' },
    { species: 'MnO₂', role: 'produit de l’oxydation' },
    { species: 'H₂O', role: 'produit de la réduction' },
  ],
}

const chlorine: Station = {
  id: 'chlore',
  kicker: 'Poste 3',
  title: 'Chloration',
  brief: 'Le dichlore peut oxyder le fer qui reste. Cl₂ capte les électrons : c’est l’oxydant, et il se réduit en chlorure.',
  reductantName: 'Fer dissous',
  oxidantName: 'Dichlore',
  frames: [
    frame(['Fe²⁺', 'Fe²⁺'], ['Cl₂'], 0, ''),
    frame(['Fe³⁺', 'Fe²⁺'], ['Cl₂ · 1 e⁻'], 1, ''),
    frame(['Fe³⁺', 'Fe³⁺'], ['2 Cl⁻'], 2, 'dichlore réduit en chlorure'),
  ],
  halfOxidation: 'Fe²⁺ → Fe³⁺ + e⁻',
  halfReduction: 'Cl₂ + 2 e⁻ → 2 Cl⁻',
  global: '2 Fe²⁺ + Cl₂ → 2 Fe³⁺ + 2 Cl⁻',
  success: 'Le fer s’est oxydé. Le dichlore, oxydant, s’est réduit en ions chlorure.',
  summary: [
    { species: 'Fe²⁺', role: 'réducteur, oxydation' },
    { species: 'Cl₂', role: 'oxydant, réduction' },
    { species: 'Fe³⁺', role: 'produit de l’oxydation' },
    { species: 'Cl⁻', role: 'produit de la réduction' },
  ],
}

const bench: Station = {
  id: 'banc',
  kicker: 'Banc',
  title: 'Laboratoire',
  brief: 'Avant les postes, le banc montre un transfert simple. Le fer donne deux électrons. L’ion cuivre(II) les capte. Fe⁺ et Cu⁺ ne sont que l’étape d’un électron : la réaction complète en transfère deux.',
  reductantName: 'Fer',
  oxidantName: 'Ion cuivre(II)',
  frames: [
    frame(['Fe'], ['Cu²⁺'], 0, ''),
    frame(['Fe⁺'], ['Cu⁺'], 1, ''),
    frame(['Fe²⁺'], ['Cu'], 2, 'cuivre réduit'),
  ],
  halfOxidation: 'Fe → Fe²⁺ + 2 e⁻',
  halfReduction: 'Cu²⁺ + 2 e⁻ → Cu',
  global: 'Fe + Cu²⁺ → Fe²⁺ + Cu',
  success: 'Bravo. Le fer s’est oxydé et l’ion cuivre(II) s’est réduit.',
  summary: [
    { species: 'Fe', role: 'réducteur, oxydation' },
    { species: 'Cu²⁺', role: 'oxydant, réduction' },
    { species: 'Fe²⁺', role: 'produit de l’oxydation' },
    { species: 'Cu', role: 'produit de la réduction' },
  ],
}

export const STATIONS: Station[] = [bench, aeration, manganese, chlorine]

export function stationById(id: string): Station {
  return STATIONS.find((item) => item.id === id) ?? STATIONS[0]
}

export function stationTotal(station: Station): number {
  return station.frames.length - 1
}

/** Électrons encore acceptés avant la prochaine étape écrite. */
export function electronsAcceptable(station: Station, current: number): number {
  if (station.id !== 'manganese') return stationTotal(station) - current
  if ((current >= 0 && current <= 3) || (current >= 5 && current <= 8)) return 1
  return 0
}

export function manganeseCanAdvance(current: number): boolean {
  return current === 4 || current === 9 || current === 10 || current === 11 || current === 12
}
