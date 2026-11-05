import { motion } from 'framer-motion'
import { CONCEPTS } from '../data/stations'
import { useLab } from '../store/LabContext'
import type { ConceptId } from '../types'

export function ConceptBench() {
  const { context, send } = useLab()
  const placed = new Set(Object.values(context.conceptSlots))
  const remaining = CONCEPTS.filter((c) => !placed.has(c.id))

  return (
    <div className="bench">
      <div className="targets">
        {CONCEPTS.map((slot) => {
          const filled = context.conceptSlots[slot.id]
          const ok = filled === slot.id
          return (
            <div
              key={slot.id}
              className={`drop-zone${filled ? (ok ? ' is-ok' : ' is-bad') : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const concept = e.dataTransfer.getData('concept') as ConceptId
                if (concept) send({ type: 'DROP_CONCEPT', concept, target: slot.id })
              }}
            >
              <p className="zone-title">{slot.label}</p>
              {filled ? (
                <p className="zone-body">{CONCEPTS.find((c) => c.id === filled)?.definition}</p>
              ) : (
                <p className="zone-hint">Déposez la définition ici</p>
              )}
            </div>
          )
        })}
      </div>

      <div className="hand">
        <p className="hand-label">Cartes à placer</p>
        <div className="card-row">
          {remaining.map((card) => (
            <motion.button
              key={card.id}
              type="button"
              className="concept-card"
              draggable
              onDragStart={(e) => {
                const ev = e as unknown as DragEvent
                ev.dataTransfer?.setData('concept', card.id)
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              {card.definition}
            </motion.button>
          ))}
          {!remaining.length ? <p className="done-line">Tout est classé — validez pour continuer.</p> : null}
        </div>
      </div>
    </div>
  )
}
