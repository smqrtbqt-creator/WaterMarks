import { Fragment } from 'react'
import { ElectronBench } from '../components/ElectronBench'
import { manganesePhaseLabel } from '../data/scenes'
import { STATIONS, stationById, stationTotal } from '../data/experiments'
import { useAppStore } from '../store/useAppStore'

export function PlantPage() {
  const labId = useAppStore((state) => state.labId)
  const progress = useAppStore((state) => state.progress)
  const chooseLab = useAppStore((state) => state.chooseLab)
  const station = stationById(labId)
  const doneCount = STATIONS.filter((item) => (progress[item.id] ?? 0) >= stationTotal(item)).length

  return (
    <>
      <section className="panel" aria-label="Synoptique de l’usine">
        <p className="kicker">File de l’eau</p>
        <div className="chain" style={{ marginTop: '0.7rem' }}>
          {STATIONS.map((item, index) => {
            const moved = progress[item.id] ?? 0
            const total = stationTotal(item)
            const done = moved >= total
            return (
              <Fragment key={item.id}>
                {index > 0 && (
                  <span className="pipe" aria-hidden>
                    <i />
                  </span>
                )}
                <button
                  type="button"
                  className={`unit${item.id === labId ? ' on' : ''}${done ? ' done' : ''}`}
                  aria-pressed={item.id === labId}
                  onClick={() => chooseLab(item.id)}
                >
                  <small>{item.kicker}</small>
                  <strong>{item.title}</strong>
                  <span className="state">
                    {item.id === 'manganese' ? manganesePhaseLabel(moved) : done ? 'réglé' : `${moved} / ${total} e⁻`}
                  </span>
                </button>
              </Fragment>
            )
          })}
        </div>
        <p style={{ marginTop: '0.75rem', color: 'var(--muted)' }}>
          Ces équations décrivent le transfert d’électrons dans l’usine. Elles ne suffisent pas à dire qu’une eau est potable.
        </p>
      </section>

      {doneCount === STATIONS.length && (
        <p className="panel banner">
          Quart réussi. Le fer et le manganèse ont été oxydés, le dichlore a joué son rôle d’oxydant. Le quiz vérifie qui donne les électrons et qui les capte.
        </p>
      )}

      <section className="panel">
        <p className="mark">{station.kicker}</p>
        <h2>{station.title}</h2>
        <p style={{ margin: '0.4rem 0 0.9rem', maxWidth: '46rem' }}>{station.brief}</p>
        <ElectronBench />
      </section>
    </>
  )
}
