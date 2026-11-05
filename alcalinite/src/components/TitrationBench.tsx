import { motion } from 'framer-motion'
import { CAUSTIC } from '../data/stations'
import {
  atTaEndpoint,
  atTacEndpoint,
  methylColor,
  phenolColor,
  taMeq,
  tacMeq,
  titrate,
} from '../lib/chemistry'
import { useLab } from '../store/LabContext'

export function TitrationBench({ mode }: { mode: 'ta' | 'tac' }) {
  const { context, send } = useLab()
  const state = titrate(CAUSTIC, context.acidAdded)
  const indicator = mode === 'ta' ? phenolColor(state.ph) : methylColor(state.ph)
  const taTarget = taMeq(CAUSTIC)
  const tacTarget = tacMeq(CAUSTIC)
  const done = context.completed.includes(mode === 'ta' ? 'dosage-ta' : 'dosage-tac')
  const atEndpoint = mode === 'ta' ? atTaEndpoint(context.acidAdded, CAUSTIC) : atTacEndpoint(context.acidAdded, CAUSTIC)
  const targetPh = mode === 'ta' ? 8.3 : 4.3

  return (
    <div className="bench titration-bench">
      <div className="titration-grid">
        <section className="panel sample-card">
          <p className="mark">Échantillon</p>
          <h3>{CAUSTIC.label}</h3>
          <p>{CAUSTIC.blurb}</p>
          <ul className="species-list mono">
            <li>OH⁻ = {CAUSTIC.oh.toFixed(1)} meq/L</li>
            <li>CO₃²⁻ = {CAUSTIC.co3.toFixed(1)} meq/L</li>
            <li>HCO₃⁻ = {CAUSTIC.hco3.toFixed(1)} meq/L</li>
            <li>TA attendu ≈ {taTarget.toFixed(1)} meq/L</li>
            <li>TAC attendu ≈ {tacTarget.toFixed(1)} meq/L</li>
          </ul>
          <p className="hint">Les °f (degré français) se calculent à l’étape Lecture — pas ici.</p>
        </section>

        <section className="panel flask-card">
          <p className="mark">
            {mode === 'ta' ? 'Indicateur · phénolphtaléine' : 'Indicateur · hélianthine (méthylorange)'}
          </p>
          <svg viewBox="0 0 160 200" className="flask-svg" aria-hidden>
            <path
              d="M60 16h40v36l28 120c3 14-7 24-22 24H54c-15 0-25-10-22-24l28-120z"
              fill="rgba(196,224,220,0.06)"
              stroke="rgba(196,224,220,0.4)"
            />
            <motion.ellipse
              cx="80"
              cy="150"
              rx="36"
              ry="22"
              animate={{ fill: indicator }}
              transition={{ duration: 0.25 }}
            />
            <text x="80" y="44" textAnchor="middle" fill="#e8f3f1" fontSize="14" fontFamily="IBM Plex Mono, monospace">
              pH {state.ph.toFixed(1)}
            </text>
            <text x="80" y="62" textAnchor="middle" fill="#dff56a" fontSize="10" fontFamily="IBM Plex Mono, monospace">
              cible ≈ {targetPh.toFixed(1)}
            </text>
            <text x="80" y="188" textAnchor="middle" fill="#93aeb0" fontSize="10">
              Acide consommé : {context.acidAdded.toFixed(1)} meq/L
            </text>
          </svg>
          <div className="titration-actions">
            <button type="button" className="primary" onClick={() => send({ type: 'ADD_ACID' })} disabled={done}>
              Ajouter 0,2 meq d’acide
            </button>
            <button
              type="button"
              className="accent"
              onClick={() => send({ type: 'STOP_ENDPOINT' })}
              disabled={done}
            >
              {mode === 'ta'
                ? 'Valider le virage TA (pH ≈ 8,3)'
                : 'Valider le virage TAC (pH ≈ 4,3)'}
            </button>
          </div>
          {atEndpoint ? (
            <p className="ok-line">
              {mode === 'ta' ? (
                <>
                  Virage atteint. <strong>TA = {context.acidAdded.toFixed(1)} meq/L</strong> (acide consommé jusqu’à
                  pH ≈ 8,3).
                </>
              ) : (
                <>
                  Virage hélianthine. <strong>TAC = {context.acidAdded.toFixed(1)} meq/L</strong> d’acide consommé
                  jusqu’à pH ≈ 4,3 — ce n’est pas une valeur en °f.
                </>
              )}
            </p>
          ) : (
            <p className="hint">
              {mode === 'ta'
                ? 'Stoppez quand le rose disparaît (pH ≈ 8,3). Le TA se lit sur l’acide versé, pas sur le pH.'
                : 'Continuez jusqu’à pH ≈ 4,3 (virage hélianthine). Le TAC = quantité d’acide consommée à cet arrêt.'}
            </p>
          )}
        </section>

        <section className="panel live-card">
          <p className="mark">Lecture du dosage</p>
          <ul className="species-list">
            <li>
              <span className="mono">pH mesuré</span> = {state.ph.toFixed(1)}
              <span className="muted"> (état acide/basique)</span>
            </li>
            <li>
              <span className="mono">{mode === 'ta' ? 'TA' : 'TAC'}</span> ={' '}
              {atEndpoint || done ? `${context.acidAdded.toFixed(1)} meq/L` : '— (acide au virage)'}
              <span className="muted"> (alcalinité)</span>
            </li>
            <li className="muted">°f = conversion ultérieure (1 °f = 0,2 meq/L) — poste Lecture</li>
          </ul>
          <p className="eq">
            {mode === 'ta' ? (
              <>TA = [OH⁻] + [CO₃²⁻]</>
            ) : (
              <>
                TAC = acide consommé jusqu’à pH ≈ 4,3
                <br />
                <span className="muted">= [OH⁻] + 2[CO₃²⁻] + [HCO₃⁻] (en moles)</span>
              </>
            )}
          </p>
          <ul className="species-list mono">
            <li>OH⁻ restant {state.oh.toFixed(2)}</li>
            <li>CO₃²⁻ restant {state.co3.toFixed(2)}</li>
            <li>HCO₃⁻ restant {state.hco3.toFixed(2)}</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
