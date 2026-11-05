import { useEffect } from 'react'
import { ConceptBench } from '../components/ConceptBench'
import { BufferBench } from '../components/BufferBench'
import { ReadingBench } from '../components/ReadingBench'
import { SpeciesBench } from '../components/SpeciesBench'
import { Synoptic } from '../components/Synoptic'
import { TitrationBench } from '../components/TitrationBench'
import { CAUSTIC, stationById } from '../data/stations'
import { atTaEndpoint, atTacEndpoint } from '../lib/chemistry'
import { useLab } from '../store/LabContext'
import { useToastStore } from '../store/useToastStore'

export function PlantPage() {
  const { context, send, state } = useLab()
  const push = useToastStore((s) => s.push)
  const meta = stationById(context.station)
  const stationDone = context.completed.includes(context.station)
  const canNext =
    (context.station === 'distinguer' && state.can({ type: 'NEXT' })) ||
    (context.station === 'especes' && state.can({ type: 'NEXT' })) ||
    (context.station === 'tampon' && state.can({ type: 'NEXT' })) ||
    (context.station === 'dosage-ta' &&
      (stationDone || atTaEndpoint(context.acidAdded, CAUSTIC))) ||
    (context.station === 'dosage-tac' &&
      (stationDone || atTacEndpoint(context.acidAdded, CAUSTIC))) ||
    (context.station === 'lecture' && state.can({ type: 'NEXT' }))

  useEffect(() => {
    if (!context.flash) return
    const kind = context.flash.startsWith('Trop') || context.flash.startsWith('Pas') || context.flash.includes('n’apporte')
      ? 'alarm'
      : context.flash.includes('Correct') ||
          context.flash.includes('Point') ||
          context.flash.includes('terminé') ||
          context.flash.includes('en place') ||
          context.flash.includes('portent')
        ? 'ok'
        : 'info'
    push(kind, context.flash)
  }, [context.flash, push])

  return (
    <main className="plant">
      <Synoptic />

      <section className="station-panel">
        <header className="station-head">
          <div>
            <p className="mark">{meta.short}</p>
            <h2>{meta.title}</h2>
            <p className="brief">{meta.brief}</p>
          </div>
          <div className="station-actions">
            <button type="button" onClick={() => send({ type: 'RESET_STATION' })}>
              Recommencer le poste
            </button>
            <button
              type="button"
              className="primary"
              disabled={!canNext}
              onClick={() => send({ type: 'NEXT' })}
            >
              {context.station === 'lecture' && stationDone ? 'Terminé' : 'Valider / poste suivant'}
            </button>
          </div>
        </header>

        {context.station === 'distinguer' ? <ConceptBench /> : null}
        {context.station === 'especes' ? <SpeciesBench /> : null}
        {context.station === 'tampon' ? <BufferBench /> : null}
        {context.station === 'dosage-ta' ? <TitrationBench mode="ta" /> : null}
        {context.station === 'dosage-tac' ? <TitrationBench mode="tac" /> : null}
        {context.station === 'lecture' ? <ReadingBench /> : null}
      </section>

      <aside className="disclaimer panel">
        <p>
          Modèle pédagogique de station d’eau potable : dosages TA (≈ 8,3) et TAC (≈ 4,3), espèces OH⁻ /
          CO₃²⁻ / HCO₃⁻, unité °f. Ne remplace pas une consigne d’exploitation ni une analyse de laboratoire
          accrédité.
        </p>
      </aside>
    </main>
  )
}
