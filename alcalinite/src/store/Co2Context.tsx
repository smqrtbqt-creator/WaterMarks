import { useMachine } from '@xstate/react'
import { createContext, useContext, type ReactNode } from 'react'
import { co2Machine, type Co2Context as Ctx, type Co2Event } from '../machines/co2Machine'
import type { StateFrom } from 'xstate'

type Api = {
  state: StateFrom<typeof co2Machine>
  context: Ctx
  send: (event: Co2Event) => void
}

const CtxReact = createContext<Api | null>(null)

export function Co2Provider({ children }: { children: ReactNode }) {
  const [state, send] = useMachine(co2Machine)
  return (
    <CtxReact.Provider value={{ state, context: state.context, send }}>{children}</CtxReact.Provider>
  )
}

export function useCo2() {
  const value = useContext(CtxReact)
  if (!value) throw new Error('useCo2 hors Co2Provider')
  return value
}
