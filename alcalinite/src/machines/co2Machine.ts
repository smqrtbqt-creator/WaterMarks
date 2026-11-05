import { assign, setup } from 'xstate'
import { BRGM_FORAGES, forageById } from '../data/brgmForages'
import { CHAIN_ORDER_HINT, CHAIN_PARTS, type ChainPartId, phAfterCo2 } from '../lib/co2Dosing'

export type Co2Event =
  | { type: 'PLACE_PART'; part: ChainPartId; slot: number }
  | { type: 'SELECT_FORAGE'; id: string }
  | { type: 'SET_CO2'; mgL: number }
  | { type: 'SET_TARGET'; ph: number }
  | { type: 'CONFIRM_DISTINCTION'; choice: 'co2' | 'tac' | 'both' }
  | { type: 'RESET' }
  | { type: 'NEXT' }

export type Co2Context = {
  slots: (ChainPartId | null)[]
  forageId: string
  co2MgL: number
  targetPh: number
  distinctionOk: boolean
  completed: ('chaine' | 'dosage' | 'distinction')[]
  flash: string | null
}

function mark(ctx: Co2Context, id: Co2Context['completed'][number]) {
  return ctx.completed.includes(id) ? ctx.completed : [...ctx.completed, id]
}

export const co2Machine = setup({
  types: {
    context: {} as Co2Context,
    events: {} as Co2Event,
  },
  guards: {
    chainDone: ({ context }) =>
      CHAIN_PARTS.every((p) => context.slots[p.order - 1] === p.id),
    dosageDone: ({ context }) => {
      const forage = forageById(context.forageId)
      const ph = phAfterCo2(forage, context.co2MgL)
      return Math.abs(ph - context.targetPh) <= 0.12
    },
    distinctionDone: ({ context }) => context.distinctionOk,
  },
}).createMachine({
  id: 'co2-lab',
  initial: 'chaine',
  context: {
    slots: [null, null, null, null, null],
    forageId: BRGM_FORAGES[0].id,
    co2MgL: 0,
    targetPh: 7.0,
    distinctionOk: false,
    completed: [],
    flash: null,
  },
  states: {
    chaine: {
      on: {
        PLACE_PART: {
          actions: assign(({ context, event }) => {
            const expected = CHAIN_PARTS[event.slot]
            const ok = expected?.id === event.part
            const slots = [...context.slots] as (ChainPartId | null)[]
            if (ok) slots[event.slot] = event.part
            return {
              slots,
              flash: ok
                ? `${expected.title} en place.`
                : `Pas cet élément ici — ${CHAIN_ORDER_HINT}`,
            }
          }),
        },
        NEXT: {
          guard: 'chainDone',
          target: 'dosage',
          actions: assign(({ context }) => ({
            completed: mark(context, 'chaine'),
            flash: 'Filière OK : sonde après le mélangeur. Dosez le CO₂ sur une eau BRGM.',
          })),
        },
        RESET: {
          actions: assign({ slots: [null, null, null, null, null], flash: null }),
        },
      },
    },
    dosage: {
      on: {
        SELECT_FORAGE: {
          actions: assign(({ event }) => ({
            forageId: event.id,
            co2MgL: 0,
            flash: `Eau ${forageById(event.id).label} chargée — TAC issu de l’analyse, pas de l’injecteur.`,
          })),
        },
        SET_CO2: {
          actions: assign(({ context, event }) => {
            const forage = forageById(context.forageId)
            const ph = phAfterCo2(forage, event.mgL)
            const ok = Math.abs(ph - context.targetPh) <= 0.12
            return {
              co2MgL: event.mgL,
              flash: ok
                ? `pH ≈ ${ph.toFixed(2)} — cible atteinte. Le TAC (${forage.tacDegreeF.toFixed(0)} °f) n’a pas changé : c’est une mesure d’analyse.`
                : null,
              completed: ok ? mark(context, 'dosage') : context.completed,
            }
          }),
        },
        SET_TARGET: {
          actions: assign(({ event }) => ({ targetPh: event.ph })),
        },
        NEXT: {
          guard: 'dosageDone',
          target: 'distinction',
          actions: assign(({ context }) => ({
            completed: mark(context, 'dosage'),
            flash: 'Dernière étape : ne pas confondre dosage CO₂ et dosage TAC.',
          })),
        },
        RESET: {
          actions: assign({ co2MgL: 0, flash: null }),
        },
      },
    },
    distinction: {
      on: {
        CONFIRM_DISTINCTION: {
          actions: assign(({ context, event }) => {
            const ok = event.choice === 'co2'
            return {
              distinctionOk: ok,
              flash: ok
                ? 'Exact : vanne CO₂ asservie au pH après mélange. Une sonde de pH ne mesure pas le TAC.'
                : 'Non : le TAC demande une mesure dédiée — la sonde de pH seule ne le donne pas.',
              completed: ok ? mark(context, 'distinction') : context.completed,
            }
          }),
        },
        NEXT: {
          guard: 'distinctionDone',
          actions: assign(({ context }) => ({
            completed: mark(context, 'distinction'),
            flash: 'Module CO₂ terminé — eaux BRGM Gironde (R 34914).',
          })),
        },
        RESET: {
          actions: assign({ distinctionOk: false, flash: null }),
        },
      },
    },
  },
})
