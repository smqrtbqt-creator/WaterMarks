import { useMachine } from '@xstate/react'
import { createContext, useContext, type ReactNode } from 'react'
import { labMachine, type LabContext as Ctx, type LabEvent } from '../machines/labMachine'
import type { StateFrom } from 'xstate'

type LabApi = {
  state: StateFrom<typeof labMachine>
  context: Ctx
  send: (event: LabEvent) => void
}

const LabCtx = createContext<LabApi | null>(null)

export function LabProvider({ children }: { children: ReactNode }) {
  const [state, send] = useMachine(labMachine)
  return (
    <LabCtx.Provider value={{ state, context: state.context, send }}>{children}</LabCtx.Provider>
  )
}

export function useLab() {
  const value = useContext(LabCtx)
  if (!value) throw new Error('useLab hors LabProvider')
  return value
}
