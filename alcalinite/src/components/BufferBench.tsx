import { motion } from 'framer-motion'
import { BUFFERED, FRAGILE } from '../data/stations'
import { titrate } from '../lib/chemistry'
import { useLab } from '../store/LabContext'

function Beaker({
  label,
  blurb,
  acidDrops,
  sample,
  onDropAcid,
}: {
  label: string
  blurb: string
  acidDrops: number
  sample: typeof FRAGILE
  onDropAcid: () => void
}) {
  const state = titrate(sample, acidDrops * 0.35)
  const fill = Math.max(28, 72 - acidDrops * 4)

  return (
    <div
      className="beaker-card"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        if (e.dataTransfer.getData('acid') === '1') onDropAcid()
      }}
    >
      <header>
        <h3>{label}</h3>
        <p>{blurb}</p>
      </header>
      <svg viewBox="0 0 120 160" className="beaker-svg" aria-hidden>
        <path
          d="M28 18h64v10l8 110c1 12-8 20-20 20H40c-12 0-21-8-20-20l8-110z"
          fill="rgba(196,224,220,0.08)"
          stroke="rgba(196,224,220,0.35)"
        />
        <motion.rect
          x="36"
          width="48"
          rx="4"
          animate={{ y: 140 - fill, height: fill }}
          fill={state.ph > 7 ? 'rgba(120,180,210,0.45)' : state.ph > 5 ? 'rgba(223,245,106,0.28)' : 'rgba(240,122,104,0.4)'}
        />
        <text x="60" y="28" textAnchor="middle" fill="#dff56a" fontSize="11" fontFamily="IBM Plex Mono, monospace">
          pH {state.ph.toFixed(1)}
        </text>
      </svg>
      <p className="mono meter">Acide ajouté : {acidDrops} goutte{acidDrops > 1 ? 's' : ''}</p>
      <button type="button" className="ghost" onClick={onDropAcid}>
        Verser 1 goutte d’acide
      </button>
    </div>
  )
}

export function BufferBench() {
  const { context, send } = useLab()

  return (
    <div className="bench buffer-bench">
      <div className="beaker-row">
        <Beaker
          label={FRAGILE.label}
          blurb={FRAGILE.blurb}
          acidDrops={context.fragileAcid}
          sample={FRAGILE}
          onDropAcid={() => send({ type: 'BUFFER_DROP', beaker: 'fragile' })}
        />
        <Beaker
          label={BUFFERED.label}
          blurb={BUFFERED.blurb}
          acidDrops={context.bufferedAcid}
          sample={BUFFERED}
          onDropAcid={() => send({ type: 'BUFFER_DROP', beaker: 'buffered' })}
        />
      </div>
      <div className="hand">
        <p className="hand-label">Réactif</p>
        <motion.button
          type="button"
          className="acid-drop"
          draggable
          onDragStart={(e) => {
            const ev = e as unknown as DragEvent
            ev.dataTransfer?.setData('acid', '1')
          }}
          whileHover={{ scale: 1.04 }}
        >
          HCl — glisser sur un bécher
        </motion.button>
        <p className="hint">
          Même nombre de gouttes sur chaque eau (≥ 3). L’eau tamponnée garde un pH plus haut : c’est l’alcalinité, pas seulement le pH initial.
        </p>
      </div>
    </div>
  )
}
