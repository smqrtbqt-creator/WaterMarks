import { useEffect, useRef, useState, type RefObject } from 'react'
import { motion } from 'framer-motion'
import { manganeseLesson, sceneFor, type ElementSymbol, type SceneMolecule } from '../data/scenes'
import { stationById, stationTotal } from '../data/experiments'
import { useAppStore } from '../store/useAppStore'

const ATOM_COLOR: Record<ElementSymbol, string> = {
  Fe: '#e07a3d',
  Cu: '#d08a4a',
  Mn: '#d06b9b',
  O: '#ef6b5c',
  H: '#f4f7f8',
  Cl: '#7dcea0',
}

const ATOM_RADIUS: Record<ElementSymbol, number> = {
  Fe: 22,
  Cu: 22,
  Mn: 22,
  O: 18,
  H: 14,
  Cl: 20,
}

type Flight = { id: string; x: number; y: number; dx: number; dy: number }

export function ElectronBench() {
  const labId = useAppStore((state) => state.labId)
  const transferred = useAppStore((state) => state.progress[state.labId] ?? 0)
  const help = useAppStore((state) => state.help)
  const giveElectrons = useAppStore((state) => state.giveElectrons)
  const advanceLab = useAppStore((state) => state.advanceLab)
  const warn = useAppStore((state) => state.warn)
  const resetLab = useAppStore((state) => state.resetLab)
  const station = stationById(labId)
  const total = stationTotal(station)
  const [placed, setPlaced] = useState(0)
  useEffect(() => {
    setPlaced(0)
  }, [labId, transferred])
  const lesson = labId === 'manganese' ? manganeseLesson(transferred, placed) : null
  const scene = lesson ?? sceneFor(labId, transferred)
  const done = transferred === total
  const oxidantRef = useRef<HTMLDivElement>(null)
  const reactantRef = useRef<HTMLDivElement>(null)
  const [flights, setFlights] = useState<Flight[]>([])

  function fly(count: number, origin?: DOMRect) {
    const target = oxidantRef.current?.getBoundingClientRect()
    const sitting = reactantRef.current?.querySelector('.orbit')?.getBoundingClientRect()
    const start = origin ?? sitting ?? reactantRef.current?.getBoundingClientRect() ?? target
    if (!start || !target) return
    const next = Array.from({ length: count }, (_, index) => {
      const x = start.left + start.width / 2 + index * 12
      const y = start.top + start.height / 2
      return {
        id: `${Date.now()}-${index}`,
        x,
        y,
        dx: target.left + target.width / 2 - x,
        dy: target.top + target.height / 2 - y,
      }
    })
    setFlights((current) => [...current, ...next])
  }

  function spawn(count: number, origin?: DOMRect) {
    if (!giveElectrons(count)) return
    fly(count, origin)
  }

  function placeOnOxygen(count: number, origin?: DOMRect) {
    const room = 4 - placed
    if (count > room) {
      warn(room === 1 ? 'Il ne reste qu’un électron à poser sur O₂.' : `Il ne reste que ${room} électrons à poser sur O₂.`)
      return
    }
    fly(count, origin)
    const next = placed + count
    if (next >= 4) advanceLab()
    else setPlaced(next)
  }

  function give(count: number, origin?: DOMRect) {
    if (lesson?.mode === 'capture') placeOnOxygen(count, origin)
    else spawn(count, origin)
  }

  function dropAt(x: number, y: number, origin?: DOMRect) {
    const oxidant = oxidantRef.current?.getBoundingClientRect()
    const hit = (rect: DOMRect | undefined) =>
      Boolean(rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)
    if (hit(oxidant)) give(1, origin)
    else warn('Dépose l’électron sur la case qui doit le recevoir : la carte e⁻, ou O₂ à l’étape de réduction.')
  }

  return (
    <div>
      {lesson ? (
        <section className="lesson" aria-label="Demi-équations du manganèse">
          <p className="kicker">{lesson.phaseLabel}</p>
          <p className="lesson-title">{lesson.title}</p>
          <ol>
            {lesson.rows.map((row) => (
              <li key={row.id} className={`lesson-row ${row.state}`}>
                <span className="kicker">{row.label}</span>
                <p className="formula">{row.equation}</p>
              </li>
            ))}
          </ol>
          {lesson.mode === 'done' && (
            <div className="balance">
              <p className="formula">2 Mn²⁺ + 4 H₂O → 2 MnO₂ + 8 H⁺ + 4 e⁻</p>
              <p className="formula">O₂ + 4 e⁻ ⇌ 2 O²⁻</p>
              <p className="formula">2 O²⁻ + 8 H⁺ → 2 H₂O + 4 H⁺</p>
              <p className="formula">2 Mn²⁺ + O₂ + 2 H₂O → 2 MnO₂ + 4 H⁺</p>
            </div>
          )}
        </section>
      ) : (
        <p className="formula global-eq">{station.global}</p>
      )}
      <ul className="legend">
        <li><i className="swatch fe" /> Fer</li>
        <li><i className="swatch cu" /> Cuivre</li>
        <li><i className="swatch mn" /> Manganèse</li>
        <li><i className="swatch o" /> Oxygène</li>
        <li><i className="swatch h" /> Hydrogène</li>
        <li><i className="swatch cl" /> Chlore</li>
        <li><i className="swatch e" /> Électron</li>
      </ul>

      <div className="stage">
        <MoleculeGroup title={lesson?.leftTitle ?? 'À gauche de l’équation'} molecules={scene.reactants} zoneRef={reactantRef} oxidantRef={oxidantRef} onGive={(origin) => give(1, origin)} dropAt={dropAt} />
        <p className="mono arrow">{lesson ? lesson.phaseLabel : `${transferred} / ${total} e⁻`}</p>
        <MoleculeGroup title={lesson?.rightTitle ?? 'À droite de l’équation'} molecules={scene.products} zoneRef={lesson?.mode === 'tear' ? oxidantRef : undefined} oxidantRef={oxidantRef} onGive={(origin) => give(1, origin)} dropAt={dropAt} />
      </div>

      {flights.map((flight) => (
        <motion.span
          key={flight.id}
          className="electron flying"
          style={{ left: flight.x, top: flight.y }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: flight.dx, y: flight.dy, opacity: 0.2 }}
          transition={{ duration: 0.55 }}
          onAnimationComplete={() => setFlights((current) => current.filter((item) => item.id !== flight.id))}
          aria-hidden
        >
          e⁻
        </motion.span>
      ))}

      <div className="actions" style={{ marginTop: '0.8rem' }}>
        {lesson?.mode === 'next' ? (
          <button type="button" className="primary" onClick={() => advanceLab()}>
            {lesson.nextLabel ?? 'Étape suivante'}
          </button>
        ) : lesson?.mode === 'tear' ? (
          <button type="button" className="primary" onClick={() => give(1)}>
            Arracher 1 électron à l’eau
          </button>
        ) : lesson?.mode === 'capture' ? (
          <>
            <button type="button" className="primary" onClick={() => give(1)}>
              Poser 1 électron sur O₂
            </button>
            <button type="button" className="primary" onClick={() => give(2)}>
              Poser 2 électrons sur O₂
            </button>
          </>
        ) : lesson?.mode === 'done' ? null : (
          <>
            <button type="button" className="primary" onClick={() => give(1)}>
              Donner 1 électron
            </button>
            <button type="button" className="primary" onClick={() => give(2)}>
              Donner 2 électrons
            </button>
          </>
        )}
        <button type="button" className="ghost" onClick={resetLab}>
          Réinitialiser
        </button>
      </div>

      {help && (
        <p className="panel help" role="status" style={{ marginTop: '0.7rem' }}>
          {help}
        </p>
      )}

      {!done && (
        <p style={{ marginTop: '0.7rem', color: 'var(--muted)' }}>
          {lesson
            ? lesson.note
            : 'Les électrons dessinés sur le réducteur sont ceux qu’il peut perdre. Ceux qui arrivent se posent sur l’oxydant. Les produits en pointillés sont déjà dans l’équation, ils se forment au fil du transfert.'}
        </p>
      )}

      {done && (
        <section className="panel ok" aria-live="polite" style={{ marginTop: '0.8rem' }}>
          <p>{station.success}</p>
          <p className="formula" style={{ marginTop: '0.6rem' }}>
            {station.halfOxidation}
          </p>
          <p className="formula">{station.halfReduction}</p>
          <p className="formula" style={{ marginTop: '0.45rem' }}>
            {station.global}
          </p>
          <table>
            <thead>
              <tr>
                <th>Espèce</th>
                <th>Rôle</th>
              </tr>
            </thead>
            <tbody>
              {station.summary.map((line) => (
                <tr key={line.species}>
                  <td className="formula">{line.species}</td>
                  <td>{line.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}

function MoleculeGroup({
  title,
  molecules,
  zoneRef,
  oxidantRef,
  onGive,
  dropAt,
}: {
  title: string
  molecules: SceneMolecule[]
  zoneRef?: RefObject<HTMLDivElement | null>
  oxidantRef: RefObject<HTMLDivElement | null>
  onGive: (origin: DOMRect) => void
  dropAt: (x: number, y: number, origin?: DOMRect) => void
}) {
  return (
    <section className="basin" ref={zoneRef}>
      <p className="kicker">{title}</p>
      <div className="mol-row">
        {molecules.map((item) => (
          <MoleculeCard key={item.id} molecule={item} oxidantRef={item.accepts ? oxidantRef : undefined} onGive={onGive} dropAt={dropAt} />
        ))}
      </div>
    </section>
  )
}

function MoleculeCard({
  molecule,
  oxidantRef,
  onGive,
  dropAt,
}: {
  molecule: SceneMolecule
  oxidantRef?: RefObject<HTMLDivElement | null>
  onGive: (origin: DOMRect) => void
  dropAt: (x: number, y: number, origin?: DOMRect) => void
}) {
  const dragged = useRef(false)
  const width = molecule.atoms.length >= 3 ? '8.8rem' : molecule.atoms.length === 2 ? '7.6rem' : '6.4rem'

  if (molecule.kind === 'electrons') {
    return (
      <figure ref={oxidantRef} className={`mol ${molecule.state}`} style={{ width }} data-formula={molecule.formula}>
        <div className="mol-body electron-well">
          {Array.from({ length: molecule.caught }, (_, index) => (
            <span key={`${molecule.id}-caught-${index}`} className="caught" title="Électron écrit dans la demi-équation" />
          ))}
          {Array.from({ length: molecule.loose }, (_, index) => (
            <motion.button
              key={`${molecule.id}-e-${index}`}
              type="button"
              className="electron orbit"
              drag
              dragSnapToOrigin
              whileDrag={{ scale: 1.12 }}
              aria-label={`Électron de la demi-équation, le donner à l’oxydant`}
              onDragStart={() => {
                dragged.current = false
              }}
              onDrag={(_, info) => {
                if (Math.abs(info.offset.x) + Math.abs(info.offset.y) > 6) dragged.current = true
              }}
              onDragEnd={(event, info) => {
                if (!dragged.current) return
                const node = event.target as HTMLElement
                dropAt(info.point.x, info.point.y, node.getBoundingClientRect())
              }}
              onClick={(event) => {
                if (!dragged.current) onGive(event.currentTarget.getBoundingClientRect())
              }}
            >
              e⁻
            </motion.button>
          ))}
        </div>
        <figcaption className="formula">{molecule.formula}</figcaption>
        <p className="mol-hint">{molecule.hint}</p>
      </figure>
    )
  }

  return (
    <figure ref={oxidantRef} className={`mol ${molecule.state}`} style={{ width }} data-formula={molecule.formula}>
      <div className="mol-body">
        <svg viewBox="0 0 140 96" className="mol-svg" role="img" aria-label={molecule.formula}>
          {molecule.bonds.map((bond) =>
            bondSegments(molecule, bond).map((segment, index) => (
              <line
                key={`${bond.a}-${bond.b}-${index}`}
                x1={segment.x1}
                y1={segment.y1}
                x2={segment.x2}
                y2={segment.y2}
                stroke="rgba(232,243,241,0.8)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )),
          )}
          {molecule.atoms.map((atom, index) => (
            <g key={`${atom.el}-${index}`}>
              <circle cx={atom.x} cy={atom.y} r={ATOM_RADIUS[atom.el]} fill={ATOM_COLOR[atom.el]} />
              <text
                x={atom.x}
                y={atom.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={atom.el === 'H' ? 12 : 14}
                fontWeight="700"
                fill="#1c140c"
              >
                {atom.el}
              </text>
            </g>
          ))}
        </svg>
        {Array.from({ length: molecule.loose }, (_, index) => {
          const spot = electronSpot(molecule, index, molecule.loose)
          return (
            <motion.button
              key={`${molecule.id}-e-${index}`}
              type="button"
              className="electron orbit"
              style={spot}
              drag
              dragSnapToOrigin
              whileDrag={{ scale: 1.12 }}
              aria-label={`Électron sur ${molecule.formula}, le donner à l’oxydant`}
              onDragStart={() => {
                dragged.current = false
              }}
              onDrag={(_, info) => {
                if (Math.abs(info.offset.x) + Math.abs(info.offset.y) > 6) dragged.current = true
              }}
              onDragEnd={(event, info) => {
                if (!dragged.current) return
                const node = event.target as HTMLElement
                dropAt(info.point.x, info.point.y, node.getBoundingClientRect())
              }}
              onClick={(event) => {
                if (!dragged.current) onGive(event.currentTarget.getBoundingClientRect())
              }}
            >
              e⁻
            </motion.button>
          )
        })}
        {Array.from({ length: molecule.caught }, (_, index) => (
          <span key={`${molecule.id}-caught-${index}`} className="caught" style={caughtSpot(index)} title="Électron capté" />
        ))}
      </div>
      <figcaption className="formula">{molecule.formula}</figcaption>
      <p className="mol-hint">{molecule.hint}</p>
    </figure>
  )
}

function electronSpot(molecule: SceneMolecule, index: number, total: number) {
  const host = molecule.atoms[molecule.electronHost ?? 0]
  const spread = 0.85
  const angle = -Math.PI / 2 + (index - (total - 1) / 2) * spread
  const radius = ATOM_RADIUS[host.el] + 16
  const x = host.x + Math.cos(angle) * radius
  const y = host.y + Math.sin(angle) * radius
  return { left: `${(x / 140) * 100}%`, top: `${(y / 96) * 100}%` }
}

function caughtSpot(index: number) {
  return { left: `${18 + index * 16}%`, top: '10%' }
}

function bondSegments(molecule: SceneMolecule, bond: { a: number; b: number; double?: boolean }) {
  const start = molecule.atoms[bond.a]
  const end = molecule.atoms[bond.b]
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.hypot(dx, dy) || 1
  const ux = dx / length
  const uy = dy / length
  const startRadius = ATOM_RADIUS[start.el]
  const endRadius = ATOM_RADIUS[end.el]
  const x1 = start.x + ux * startRadius
  const y1 = start.y + uy * startRadius
  const x2 = end.x - ux * endRadius
  const y2 = end.y - uy * endRadius
  if (!bond.double) return [{ x1, y1, x2, y2 }]
  const ox = -uy * 3.5
  const oy = ux * 3.5
  return [
    { x1: x1 + ox, y1: y1 + oy, x2: x2 + ox, y2: y2 + oy },
    { x1: x1 - ox, y1: y1 - oy, x2: x2 - ox, y2: y2 - oy },
  ]
}
