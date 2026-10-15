/** Une image du banc après un nombre donné d’électrons transférés. */
export type BenchFrame = {
  left: string[]
  right: string[]
  leftCaption: string
  rightCaption: string
}

export type RoleLine = {
  species: string
  role: string
}

/** Un poste de l’usine. Le transfert d’électrons est le geste du jeu. */
export type Station = {
  id: string
  kicker: string
  title: string
  brief: string
  reductantName: string
  oxidantName: string
  frames: BenchFrame[]
  halfOxidation: string
  halfReduction: string
  global: string
  success: string
  summary: RoleLine[]
}

export type Choice = {
  id: string
  label: string
}

export type McqItem = {
  id: string
  kind?: string
  title: string
  prompt: string
  formula?: string
  choices: Choice[]
  answerId: string
  why: string
}
