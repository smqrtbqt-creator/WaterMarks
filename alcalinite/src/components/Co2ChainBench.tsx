import { motion } from 'framer-motion'
import { forageById } from '../data/brgmForages'
import { CHAIN_ORDER_HINT, CHAIN_PARTS, type ChainPartId } from '../lib/co2Dosing'
import { tacWaterColor, treatedWaterColor } from '../lib/waterTint'
import { useCo2 } from '../store/Co2Context'

export function Co2ChainBench() {
  const { context, send } = useCo2()
  const placed = new Set(context.slots.filter(Boolean) as ChainPartId[])
  const remaining = CHAIN_PARTS.filter((p) => !placed.has(p.id))
  const forage = forageById(context.forageId)
  const raw = tacWaterColor(forage.tacDegreeF)
  const out = treatedWaterColor(forage.tacDegreeF, forage.ph - 0.3)
  const progress = context.slots.filter(Boolean).length
  const flowing = progress > 0

  return (
    <div className="bench co2-chain">
      <div className={`co2-assemble-flow${flowing ? ' is-running' : ''}`} aria-hidden>
        {CHAIN_PARTS.map((part, i) => {
          const filled = context.slots[i] === part.id
          const tint = i < 2 ? raw : i < 3 ? `linear-gradient(90deg, ${raw}, ${out})` : out
          return (
            <div key={part.id} className="assemble-seg">
              {i > 0 ? (
                <span className={`lab-pipe-block${filled || context.slots[i - 1] ? ' on' : ''}`}>
                  <i style={{ background: typeof tint === 'string' && tint.startsWith('linear') ? out : tint }} />
                </span>
              ) : null}
              <div
                className={`assemble-node${filled ? ' on' : ''}`}
                style={
                  filled
                    ? {
                        borderColor: out,
                        background:
                          typeof tint === 'string' && !tint.startsWith('linear')
                            ? tint
                            : undefined,
                        boxShadow:
                          typeof tint === 'string' && tint.startsWith('linear')
                            ? `inset 0 -32px 0 ${out}`
                            : undefined,
                      }
                    : undefined
                }
              >
                <strong>{i + 1}</strong>
                <em>{part.title.split(/[· ]/)[0]}</em>
              </div>
            </div>
          )
        })}
      </div>
      <p className="hint">{CHAIN_ORDER_HINT} L’eau (couleur = TAC) traverse chaque poste.</p>

      <div className="chain-slots chain-slots-5">
        {CHAIN_PARTS.map((part, index) => {
          const filled = context.slots[index]
          const ok = filled === part.id
          const waterTint = index < 2 ? raw : out
          return (
            <div
              key={part.id}
              className={`drop-zone chain-slot${filled ? (ok ? ' is-ok' : ' is-bad') : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const id = e.dataTransfer.getData('chain') as ChainPartId
                if (id) send({ type: 'PLACE_PART', part: id, slot: index })
              }}
            >
              <p className="mark">Étape {index + 1}</p>
              <p className="zone-title">{filled ? CHAIN_PARTS.find((p) => p.id === filled)?.title : 'Déposer ici'}</p>
              {ok ? <p className="zone-body">{part.role}</p> : <p className="zone-hint">{part.title}</p>}
              {ok ? <div className="slot-water" style={{ background: waterTint }} title="Eau en transit" /> : null}
            </div>
          )
        })}
      </div>

      <div className="hand">
        <p className="hand-label">Éléments de la filière</p>
        <div className="card-row">
          {remaining.map((part) => (
            <motion.button
              key={part.id}
              type="button"
              className="concept-card"
              draggable
              onDragStart={(e) => {
                const ev = e as unknown as DragEvent
                ev.dataTransfer?.setData('chain', part.id)
              }}
              whileHover={{ scale: 1.02 }}
            >
              <strong>{part.title}</strong>
              <span className="muted">{part.role}</span>
            </motion.button>
          ))}
          {!remaining.length ? (
            <p className="done-line">Sonde après le mélangeur — validez pour doser.</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
