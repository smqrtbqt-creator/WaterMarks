import { create } from 'zustand'
import { electronsAcceptable, manganeseCanAdvance, stationById, stationTotal } from '../data/experiments'

type PlantState = {
  labId: string
  progress: Record<string, number>
  help: string | null
  chooseLab: (id: string) => void
  /** Transfère 1 ou 2 électrons sur le poste ouvert. */
  giveElectrons: (count: number) => boolean
  /** Passe à la demi-équation suivante, une fois les électrons de l’étape écrits. */
  advanceLab: () => boolean
  warn: (message: string) => void
  resetLab: () => void
}

export const useAppStore = create<PlantState>((set, get) => ({
  labId: 'banc',
  progress: {},
  help: null,
  chooseLab: (labId) => set({ labId, help: null }),
  warn: (help) => set({ help }),
  resetLab: () => {
    const labId = get().labId
    set({ progress: { ...get().progress, [labId]: 0 }, help: null })
  },
  advanceLab: () => {
    const labId = get().labId
    const station = stationById(labId)
    const current = get().progress[labId] ?? 0
    const total = stationTotal(station)
    if (station.id !== 'manganese' || !manganeseCanAdvance(current) || current >= total) return false
    set({ progress: { ...get().progress, [labId]: current + 1 }, help: null })
    return true
  },
  giveElectrons: (count) => {
    const labId = get().labId
    const station = stationById(labId)
    const total = stationTotal(station)
    const current = get().progress[labId] ?? 0
    if (current >= total) {
      set({ help: 'Ce poste a déjà reçu tous ses électrons. Réinitialise-le pour rejouer le transfert.' })
      return false
    }
    const left = electronsAcceptable(station, current)
    if (left <= 0) {
      set({ help: 'Cette demi-équation est écrite. Passe à l’étape suivante.' })
      return false
    }
    if (count > left) {
      set({
        help:
          left === 1
            ? 'Il ne reste qu’un électron sur ce poste. Le bouton « 2 électrons » en demanderait trop.'
            : `Il ne reste que ${left} électrons sur ce poste.`,
      })
      return false
    }
    set({ progress: { ...get().progress, [labId]: current + count }, help: null })
    return true
  },
}))
