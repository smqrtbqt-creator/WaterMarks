import { BRGM_FORAGES, forageById } from '../data/brgmForages'
import { phAfterCo2 } from '../lib/co2Dosing'
import { useCo2 } from '../store/Co2Context'
import { Co2FlowPlant } from './Co2FlowPlant'

export function Co2DoseBench() {
  const { context, send } = useCo2()
  const forage = forageById(context.forageId)
  const ph = phAfterCo2(forage, context.co2MgL)
  const onTarget = Math.abs(ph - context.targetPh) <= 0.12

  return (
    <div className="bench co2-dose-layout">
      <section className="panel forage-panel">
        <p className="mark">Eaux BRGM · Gironde (R 34914)</p>
        <div className="forage-row">
          {BRGM_FORAGES.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`choice${f.id === context.forageId ? ' is-ok' : ''}`}
              onClick={() => send({ type: 'SELECT_FORAGE', id: f.id })}
            >
              {f.label}
              <span className="mono muted"> · TAC {f.tacDegreeF.toFixed(0)} °f</span>
            </button>
          ))}
        </div>
        <p className="hint">{forage.note}</p>
      </section>

      <section className="panel plant-panel">
        <p className="mark">Synoptique · eau colorée par le TAC</p>
        <Co2FlowPlant forage={forage} ph={ph} co2MgL={context.co2MgL} running />
      </section>

      <div className="co2-controls-grid">
        <section className="panel">
          <p className="mark">Commande CO₂</p>
          <label className="slider-label">
            Débit CO₂ injecté : <span className="mono">{context.co2MgL.toFixed(1)} mg/L</span>
          </label>
          <input
            type="range"
            min={0}
            max={40}
            step={0.5}
            value={context.co2MgL}
            onChange={(e) => send({ type: 'SET_CO2', mgL: Number(e.target.value) })}
          />
          <label className="slider-label">
            Cible pH : <span className="mono">{context.targetPh.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min={6.4}
            max={7.4}
            step={0.1}
            value={context.targetPh}
            onChange={(e) => send({ type: 'SET_TARGET', ph: Number(e.target.value) })}
          />
          {onTarget ? (
            <p className="ok-line">Cible pH atteinte. Observez l’eau traverser la chaîne : le TAC (couleur de base) ne change pas.</p>
          ) : (
            <p className="hint">
              Plus le TAC est élevé, plus l’eau est teintée et plus il faut de CO₂ pour baisser le pH.
            </p>
          )}
        </section>

        <section className="panel">
          <p className="mark">Lecture</p>
          <ul className="species-list">
            <li>
              <strong>pH (sonde)</strong> : {ph.toFixed(2)}
              <span className="muted"> — suit le CO₂</span>
            </li>
            <li>
              <strong>TAC (analyse)</strong> : {forage.tacDegreeF.toFixed(1)} °f
              <span className="muted"> — fixe · couleur de l’eau</span>
            </li>
            <li>
              <strong>HCO₃⁻</strong> : {forage.hco3MgL.toFixed(0)} mg/L
            </li>
            <li>
              <strong>κ</strong> : {forage.conductivity} µS/cm · F {forage.fMgL} mg/L
            </li>
          </ul>
          <p className="eq warn-line">
            Ordre : forage → injecteur → mélangeur → sonde pH → suite. La sonde n’est pas collée à l’injecteur. Le TAC
            n’est pas mesuré par la sonde de pH.
          </p>
        </section>
      </div>
    </div>
  )
}
