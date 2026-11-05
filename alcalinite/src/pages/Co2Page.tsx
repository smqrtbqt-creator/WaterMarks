import { useEffect } from 'react'
import { Co2ChainBench } from '../components/Co2ChainBench'
import { Co2Distinction } from '../components/Co2Distinction'
import { Co2DoseBench } from '../components/Co2DoseBench'
import { useCo2 } from '../store/Co2Context'
import { useToastStore } from '../store/useToastStore'

const STEPS = [
  {
    id: 'chaine',
    title: 'Assembler la filière',
    brief: 'Forage → injection CO₂ → mélangeur → sonde pH → étape suivante.',
  },
  {
    id: 'dosage',
    title: 'Doser le CO₂ (eaux BRGM)',
    brief: 'Eau colorée par le TAC. Le pH se lit après le mélangeur ; le TAC reste une analyse dédiée.',
  },
  {
    id: 'distinction',
    title: 'Sonde & TAC',
    brief: 'Pourquoi la sonde est après le mélange — et pourquoi elle ne mesure pas le TAC.',
  },
] as const

export function Co2Page() {
  const { context, send, state } = useCo2()
  const push = useToastStore((s) => s.push)
  const stepIndex = state.matches('chaine') ? 0 : state.matches('dosage') ? 1 : 2
  const meta = STEPS[stepIndex]
  const canNext =
    (state.matches('chaine') && state.can({ type: 'NEXT' })) ||
    (state.matches('dosage') && state.can({ type: 'NEXT' })) ||
    (state.matches('distinction') && state.can({ type: 'NEXT' }))

  useEffect(() => {
    if (!context.flash) return
    const kind =
      context.flash.startsWith('Pas') || context.flash.startsWith('Non')
        ? 'alarm'
        : context.flash.includes('Exact') ||
            context.flash.includes('atteinte') ||
            context.flash.includes('terminée') ||
            context.flash.includes('en place') ||
            context.flash.includes('Complète') ||
            context.flash.includes('assemblée')
          ? 'ok'
          : 'info'
    push(kind, context.flash)
  }, [context.flash, push])

  return (
    <main className="plant">
      <nav className="synoptic" aria-label="Étapes dosage CO₂">
        {STEPS.map((step, i) => {
          const done = context.completed.includes(step.id)
          return (
            <div
              key={step.id}
              className={`syn-unit${i === stepIndex ? ' is-active' : ''}${done ? ' is-done' : ''}`}
            >
              <span className="syn-index">{i + 1}</span>
              <span className="syn-label">{step.title.split(' ')[0]}</span>
            </div>
          )
        })}
      </nav>

      <section className="station-panel">
        <header className="station-head">
          <div>
            <p className="mark">BRGM R 34914 · Eocène Gironde</p>
            <h2>{meta.title}</h2>
            <p className="brief">{meta.brief}</p>
          </div>
          <div className="station-actions">
            <button type="button" onClick={() => send({ type: 'RESET' })}>
              Recommencer l’étape
            </button>
            <button type="button" className="primary" disabled={!canNext} onClick={() => send({ type: 'NEXT' })}>
              {state.matches('distinction') && context.completed.includes('distinction')
                ? 'Terminé'
                : 'Valider / suite'}
            </button>
          </div>
        </header>

        {state.matches('chaine') ? <Co2ChainBench /> : null}
        {state.matches('dosage') ? <Co2DoseBench /> : null}
        {state.matches('distinction') ? <Co2Distinction /> : null}
      </section>

      <aside className="disclaimer panel">
        <p>
          Données d’eaux adaptées du rapport public BRGM R 34914 (Dusseau &amp; Sourisseau, 1992) — salinité des
          nappes Eocène, syndicats ruraux de Gironde. Modèle pédagogique d’injection de CO₂ : ne remplace pas un
          dimensionnement d’usine.
        </p>
      </aside>
    </main>
  )
}
