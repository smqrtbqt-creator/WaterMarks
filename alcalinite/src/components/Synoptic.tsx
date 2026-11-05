import { STATIONS } from '../data/stations'
import { useLab } from '../store/LabContext'
import type { StationId } from '../types'

export function Synoptic() {
  const { context, send } = useLab()

  return (
    <nav className="synoptic" aria-label="Chaîne du laboratoire">
      {STATIONS.map((station, index) => {
        const active = context.station === station.id
        const done = context.completed.includes(station.id)
        return (
          <button
            key={station.id}
            type="button"
            className={`syn-unit${active ? ' is-active' : ''}${done ? ' is-done' : ''}`}
            aria-current={active ? 'step' : undefined}
            onClick={() => send({ type: 'SELECT_STATION', id: station.id as StationId })}
          >
            <span className="syn-index">{index + 1}</span>
            <span className="syn-label">{station.short}</span>
            {index < STATIONS.length - 1 ? <i className="syn-pipe" aria-hidden /> : null}
          </button>
        )
      })}
    </nav>
  )
}
