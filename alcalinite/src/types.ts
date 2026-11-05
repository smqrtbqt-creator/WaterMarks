export type StationId = 'distinguer' | 'especes' | 'tampon' | 'dosage-ta' | 'dosage-tac' | 'lecture'

export type ConceptId = 'ph' | 'basicite' | 'alcalinite'

export type SpeciesId = 'oh' | 'co3' | 'hco3' | 'na' | 'cl' | 'h3o'

export type WaterSample = {
  id: string
  label: string
  blurb: string
  /** pH initial approximatif */
  ph: number
  /** Concentrations en meq/L (équivalents acide) */
  oh: number
  co3: number
  hco3: number
}

export type ToastKind = 'ok' | 'alarm' | 'info'

export type Toast = {
  id: number
  kind: ToastKind
  text: string
}
