import type { BrgmForage } from '../data/brgmForages'

/**
 * Modèle pédagogique d’injection de CO₂ :
 * le CO₂ abaisse le pH ; le TAC (pouvoir tampon) freine la baisse.
 * Le TAC n’est pas mesuré par la sonde de pH — analyse dédiée.
 */
export function phAfterCo2(forage: BrgmForage, co2MgL: number): number {
  const tac = Math.max(1, forage.tacDegreeF)
  const drop = (co2MgL * 0.12 * 15) / tac
  return Math.max(5.8, forage.ph - drop)
}

export function co2ForTargetPh(forage: BrgmForage, targetPh: number): number {
  if (targetPh >= forage.ph) return 0
  const tac = Math.max(1, forage.tacDegreeF)
  const drop = forage.ph - targetPh
  return (drop * tac) / (0.12 * 15)
}

/** Ordre hydraulique pédagogique de la filière CO₂. */
export type ChainPartId = 'inlet' | 'injector' | 'mixer' | 'probe' | 'next'

export const CHAIN_PARTS: {
  id: ChainPartId
  order: number
  title: string
  role: string
}[] = [
  {
    id: 'inlet',
    order: 1,
    title: 'Arrivée d’eau de forage',
    role: 'Débit d’eau + pH initial (eau brute avant dosage).',
  },
  {
    id: 'injector',
    order: 2,
    title: 'Injection de CO₂',
    role: 'Injecteur piloté par une vanne de dosage (débit de CO₂ réglé).',
  },
  {
    id: 'mixer',
    order: 3,
    title: 'Mélangeur statique',
    role: 'Dissolution et homogénéisation du CO₂ dans l’eau.',
  },
  {
    id: 'probe',
    order: 4,
    title: 'Sonde de pH',
    role: 'Mesure du pH après injection et mélange — pour asservir la vanne CO₂.',
  },
  {
    id: 'next',
    order: 5,
    title: 'Étape suivante',
    role: 'Reminéralisation, filtration ou autre étape selon le procédé.',
  },
]

export const CHAIN_ORDER_HINT =
  'Ordre : forage → injection CO₂ → mélangeur → sonde pH → étape suivante.'
