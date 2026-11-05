import { assign, setup } from 'xstate'
import type { ConceptId, SpeciesId, StationId } from '../types'
import { CAUSTIC, CONCEPTS, SPECIES } from '../data/stations'
import { atTaEndpoint, atTacEndpoint, taMeq, titrate } from '../lib/chemistry'

export type LabEvent =
  | { type: 'SELECT_STATION'; id: StationId }
  | { type: 'DROP_CONCEPT'; concept: ConceptId; target: ConceptId }
  | { type: 'DROP_SPECIES'; species: SpeciesId; intoBasin: boolean }
  | { type: 'BUFFER_DROP'; beaker: 'fragile' | 'buffered' }
  | { type: 'ADD_ACID' }
  | { type: 'STOP_ENDPOINT' }
  | { type: 'SET_READING'; degreeF: number }
  | { type: 'CONFIRM_NATURAL' }
  | { type: 'RESET_STATION' }
  | { type: 'NEXT' }

export type LabContext = {
  station: StationId
  conceptSlots: Partial<Record<ConceptId, ConceptId>>
  basin: SpeciesId[]
  rejected: SpeciesId[]
  fragileAcid: number
  bufferedAcid: number
  acidAdded: number
  readingValue: number | null
  naturalConfirmed: boolean
  completed: StationId[]
  flash: string | null
}

const ORDER: StationId[] = [
  'distinguer',
  'especes',
  'tampon',
  'dosage-ta',
  'dosage-tac',
  'lecture',
]

function markDone(ctx: LabContext, id: StationId): StationId[] {
  return ctx.completed.includes(id) ? ctx.completed : [...ctx.completed, id]
}

export const labMachine = setup({
  types: {
    context: {} as LabContext,
    events: {} as LabEvent,
  },
  guards: {
    conceptsDone: ({ context }) =>
      CONCEPTS.every((c) => context.conceptSlots[c.id] === c.id),
    speciesDone: ({ context }) => {
      const good = SPECIES.filter((s) => s.alkalinity).map((s) => s.id)
      const bad = SPECIES.filter((s) => !s.alkalinity).map((s) => s.id)
      const allGood = good.every((id) => context.basin.includes(id))
      const noBad = bad.every((id) => !context.basin.includes(id))
      return allGood && noBad && context.rejected.length >= bad.length
    },
    bufferDone: ({ context }) => context.fragileAcid >= 3 && context.bufferedAcid >= 3,
    /** Arrêt sur le pH de virage, pas sur une valeur en °f. */
    taStoppedOk: ({ context }) => atTaEndpoint(context.acidAdded, CAUSTIC),
    tacStoppedOk: ({ context }) => atTacEndpoint(context.acidAdded, CAUSTIC),
    readingOk: ({ context }) =>
      context.readingValue !== null &&
      Math.abs(context.readingValue - 15) <= 0.6 &&
      context.naturalConfirmed,
  },
}).createMachine({
  id: 'alcalinite-lab',
  initial: 'distinguer',
  context: {
    station: 'distinguer',
    conceptSlots: {},
    basin: [],
    rejected: [],
    fragileAcid: 0,
    bufferedAcid: 0,
    acidAdded: 0,
    readingValue: null,
    naturalConfirmed: false,
    completed: [],
    flash: null,
  },
  on: {
    SELECT_STATION: {
      target: '.routing',
      actions: assign(({ event }) => ({
        station: event.id,
        flash: null,
      })),
    },
  },
  states: {
    routing: {
      always: [
        { guard: ({ context }) => context.station === 'distinguer', target: 'distinguer' },
        { guard: ({ context }) => context.station === 'especes', target: 'especes' },
        { guard: ({ context }) => context.station === 'tampon', target: 'tampon' },
        { guard: ({ context }) => context.station === 'dosage-ta', target: 'dosageTa' },
        { guard: ({ context }) => context.station === 'dosage-tac', target: 'dosageTac' },
        { guard: ({ context }) => context.station === 'lecture', target: 'lecture' },
      ],
    },
    distinguer: {
      entry: assign({ station: 'distinguer' as const }),
      on: {
        DROP_CONCEPT: {
          actions: assign(({ context, event }) => {
            const ok = event.concept === event.target
            return {
              conceptSlots: { ...context.conceptSlots, [event.target]: event.concept },
              flash: ok
                ? `Correct : ${event.concept === 'ph' ? 'pH' : event.concept === 'basicite' ? 'basicité' : 'alcalinité'}.`
                : 'Pas cette case — relisez la définition.',
            }
          }),
        },
        NEXT: {
          guard: 'conceptsDone',
          target: 'especes',
          actions: assign(({ context }) => ({
            completed: markDone(context, 'distinguer'),
            flash: 'Les trois notions sont en place.',
          })),
        },
        RESET_STATION: {
          actions: assign({ conceptSlots: {}, flash: null }),
        },
      },
    },
    especes: {
      entry: assign({ station: 'especes' as const }),
      on: {
        DROP_SPECIES: {
          actions: assign(({ context, event }) => {
            const meta = SPECIES.find((s) => s.id === event.species)
            if (!meta) return {}
            if (event.intoBasin) {
              if (context.basin.includes(event.species)) return {}
              if (!meta.alkalinity) {
                return {
                  flash: `${meta.formula} n’apporte pas d’alcalinité — essayez l’autre zone.`,
                }
              }
              return {
                basin: [...context.basin, event.species],
                rejected: context.rejected.filter((id) => id !== event.species),
                flash: `${meta.formula} : ${meta.note}`,
              }
            }
            if (context.rejected.includes(event.species)) return {}
            if (meta.alkalinity) {
              return { flash: `${meta.formula} contribue à l’alcalinité — placez-le dans le bassin.` }
            }
            return {
              rejected: [...context.rejected, event.species],
              basin: context.basin.filter((id) => id !== event.species),
              flash: `${meta.formula} écarté. ${meta.note}`,
            }
          }),
        },
        NEXT: {
          guard: 'speciesDone',
          target: 'tampon',
          actions: assign(({ context }) => ({
            completed: markDone(context, 'especes'),
            flash: 'OH⁻, CO₃²⁻ et HCO₃⁻ portent l’alcalinité.',
          })),
        },
        RESET_STATION: {
          actions: assign({ basin: [], rejected: [], flash: null }),
        },
      },
    },
    tampon: {
      entry: assign({ station: 'tampon' as const }),
      on: {
        BUFFER_DROP: {
          actions: assign(({ context, event }) => {
            if (event.beaker === 'fragile') {
              return {
                fragileAcid: context.fragileAcid + 1,
                flash:
                  context.fragileAcid + 1 >= 2
                    ? 'Peu de HCO₃⁻ : le pH chute vite.'
                    : 'Acide ajouté à l’eau fragile…',
              }
            }
            return {
              bufferedAcid: context.bufferedAcid + 1,
              flash:
                context.bufferedAcid + 1 >= 2
                  ? 'Beaucoup de HCO₃⁻ : le pH résiste.'
                  : 'Acide ajouté à l’eau tamponnée…',
            }
          }),
        },
        NEXT: {
          guard: 'bufferDone',
          target: 'dosageTa',
          actions: assign(({ context }) => ({
            completed: markDone(context, 'tampon'),
            acidAdded: 0,
            flash: 'Alcalinité ≠ pH : c’est la réserve qui amortit.',
          })),
        },
        RESET_STATION: {
          actions: assign({ fragileAcid: 0, bufferedAcid: 0, flash: null }),
        },
      },
    },
    dosageTa: {
      entry: assign(({ context }) => ({
        station: 'dosage-ta' as const,
        acidAdded: context.completed.includes('dosage-ta') ? context.acidAdded : 0,
      })),
      on: {
        ADD_ACID: {
          actions: assign(({ context }) => {
            const acidAdded = Math.round((context.acidAdded + 0.2) * 100) / 100
            const { ph } = titrate(CAUSTIC, acidAdded)
            const ok = atTaEndpoint(acidAdded, CAUSTIC)
            return {
              acidAdded,
              flash: ok
                ? `pH ≈ ${ph.toFixed(1)} : virage phénolphtaléine. TA = ${acidAdded.toFixed(1)} meq/L d’acide consommé.`
                : null,
              completed: ok ? markDone(context, 'dosage-ta') : context.completed,
            }
          }),
        },
        STOP_ENDPOINT: [
          {
            guard: 'taStoppedOk',
            actions: assign(({ context }) => {
              const { ph } = titrate(CAUSTIC, context.acidAdded)
              return {
                completed: markDone(context, 'dosage-ta'),
                flash: `pH ≈ ${ph.toFixed(1)} (cible 8,3). TA = ${context.acidAdded.toFixed(1)} meq/L d’acide — ce n’est pas des °f.`,
              }
            }),
          },
          {
            actions: assign(({ context }) => {
              const { ph } = titrate(CAUSTIC, context.acidAdded)
              return {
                flash:
                  ph > 8.7
                    ? `pH ${ph.toFixed(1)} : encore trop basique (cible ≈ 8,3). Continuez l’acide.`
                    : `pH ${ph.toFixed(1)} : trop bas — vous êtes déjà vers le TAC (cible TA ≈ 8,3).`,
              }
            }),
          },
        ],
        NEXT: {
          guard: ({ context }) =>
            context.completed.includes('dosage-ta') || atTaEndpoint(context.acidAdded, CAUSTIC),
          target: 'dosageTac',
          actions: assign(({ context }) => ({
            completed: markDone(context, 'dosage-ta'),
            flash: 'Même essai, indicateur hélianthine : visez maintenant pH ≈ 4,3.',
          })),
        },
        RESET_STATION: {
          actions: assign(({ context }) => ({
            acidAdded: 0,
            flash: null,
            completed: context.completed.filter((id) => id !== 'dosage-ta'),
          })),
        },
      },
    },
    dosageTac: {
      entry: assign(({ context }) => ({
        station: 'dosage-tac' as const,
        acidAdded: context.completed.includes('dosage-ta')
          ? Math.max(context.acidAdded, taMeq(CAUSTIC))
          : context.acidAdded,
      })),
      on: {
        ADD_ACID: {
          actions: assign(({ context }) => {
            const acidAdded = Math.round((context.acidAdded + 0.2) * 100) / 100
            const { ph } = titrate(CAUSTIC, acidAdded)
            const ok = atTacEndpoint(acidAdded, CAUSTIC)
            return {
              acidAdded,
              flash: ok
                ? `pH ≈ ${ph.toFixed(1)} : virage hélianthine. TAC = ${acidAdded.toFixed(1)} meq/L d’acide consommé (pas des °f).`
                : null,
              completed: ok ? markDone(context, 'dosage-tac') : context.completed,
            }
          }),
        },
        STOP_ENDPOINT: [
          {
            guard: 'tacStoppedOk',
            actions: assign(({ context }) => {
              const { ph } = titrate(CAUSTIC, context.acidAdded)
              return {
                completed: markDone(context, 'dosage-tac'),
                flash: `pH ≈ ${ph.toFixed(1)} (cible 4,3). TAC = ${context.acidAdded.toFixed(1)} meq/L d’acide — les °f se calculent ensuite.`,
              }
            }),
          },
          {
            actions: assign(({ context }) => {
              const { ph } = titrate(CAUSTIC, context.acidAdded)
              return {
                flash:
                  ph > 4.7
                    ? `pH ${ph.toFixed(1)} : trop haut. Continuez jusqu’à ≈ 4,3 (hélianthine).`
                    : `pH ${ph.toFixed(1)} : trop bas — acide en excès. Recommencez le poste.`,
              }
            }),
          },
        ],
        NEXT: {
          guard: ({ context }) =>
            context.completed.includes('dosage-tac') || atTacEndpoint(context.acidAdded, CAUSTIC),
          target: 'lecture',
          actions: assign(({ context }) => ({
            completed: markDone(context, 'dosage-tac'),
            flash: `TAC mesuré = ${context.acidAdded.toFixed(1)} meq/L. Ensuite seulement : conversion en °f.`,
          })),
        },
        RESET_STATION: {
          actions: assign(({ context }) => ({
            acidAdded: taMeq(CAUSTIC),
            flash: null,
            completed: context.completed.filter((id) => id !== 'dosage-tac'),
          })),
        },
      },
    },
    lecture: {
      entry: assign({ station: 'lecture' as const }),
      on: {
        SET_READING: {
          actions: assign(({ event }) => ({
            readingValue: event.degreeF,
            flash:
              Math.abs(event.degreeF - 15) <= 0.6
                ? 'Correct : 3,0 meq/L × 61 = 183 mg/L HCO₃⁻ → 183 / 12,2 ≈ 15 °f.'
                : 'Reprenez : [HCO₃⁻] en mg/L = meq × 61, puis TAC (°f) = mg/L ÷ 12,2.',
          })),
        },
        CONFIRM_NATURAL: {
          actions: assign({
            naturalConfirmed: true,
            flash: 'pH < 8,3 ⇒ TA = 0 et TAC ≈ [HCO₃⁻]. Avec 3,0 meq/L → ≈ 15 °f.',
          }),
        },
        NEXT: {
          guard: 'readingOk',
          actions: assign(({ context }) => ({
            completed: markDone(context, 'lecture'),
            flash: 'Laboratoire terminé — TAC lu, notions reliées à la conduite.',
          })),
        },
        RESET_STATION: {
          actions: assign({ readingValue: null, naturalConfirmed: false, flash: null }),
        },
      },
    },
  },
})

export function nextStation(id: StationId): StationId | null {
  const i = ORDER.indexOf(id)
  return i >= 0 && i < ORDER.length - 1 ? ORDER[i + 1] : null
}

export { ORDER as STATION_ORDER }
