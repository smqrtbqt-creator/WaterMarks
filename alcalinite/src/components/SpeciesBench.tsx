import { motion } from 'framer-motion'
import { SPECIES } from '../data/stations'
import { useLab } from '../store/LabContext'
import type { SpeciesId } from '../types'

function IonSvg({ formula }: { formula: string }) {
  return (
    <svg viewBox="0 0 88 64" className="ion-svg" aria-hidden>
      <ellipse cx="44" cy="32" rx="34" ry="22" fill="rgba(142, 200, 230, 0.12)" stroke="rgba(142, 200, 230, 0.55)" />
      <text x="44" y="36" textAnchor="middle" fill="currentColor" fontSize="13" fontFamily="IBM Plex Mono, monospace">
        {formula}
      </text>
    </svg>
  )
}

export function SpeciesBench() {
  const { context, send } = useLab()
  const used = new Set([...context.basin, ...context.rejected])
  const available = SPECIES.filter((s) => !used.has(s.id))

  return (
    <div className="bench species-bench">
      <div className="basins">
        <div
          className="drop-zone basin-alk"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const species = e.dataTransfer.getData('species') as SpeciesId
            if (species) send({ type: 'DROP_SPECIES', species, intoBasin: true })
          }}
        >
          <p className="zone-title">Bassin alcalinité</p>
          <p className="zone-hint">Espèces qui neutralisent H⁺</p>
          <div className="ion-row">
            {context.basin.map((id) => {
              const s = SPECIES.find((x) => x.id === id)!
              return (
                <div key={id} className="ion-chip is-ok">
                  <IonSvg formula={s.formula} />
                </div>
              )
            })}
          </div>
        </div>
        <div
          className="drop-zone basin-out"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const species = e.dataTransfer.getData('species') as SpeciesId
            if (species) send({ type: 'DROP_SPECIES', species, intoBasin: false })
          }}
        >
          <p className="zone-title">Hors alcalinité</p>
          <p className="zone-hint">Ions qui ne tamponnent pas</p>
          <div className="ion-row">
            {context.rejected.map((id) => {
              const s = SPECIES.find((x) => x.id === id)!
              return (
                <div key={id} className="ion-chip">
                  <IonSvg formula={s.formula} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="hand">
        <p className="hand-label">Espèces dissoutes</p>
        <div className="card-row">
          {available.map((s) => (
            <motion.button
              key={s.id}
              type="button"
              className="ion-card"
              draggable
              onDragStart={(e) => {
                const ev = e as unknown as DragEvent
                ev.dataTransfer?.setData('species', s.id)
              }}
              whileHover={{ y: -2 }}
            >
              <IonSvg formula={s.formula} />
              <span>{s.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
