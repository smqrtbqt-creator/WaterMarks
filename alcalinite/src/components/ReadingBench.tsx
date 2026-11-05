import { RIVER } from '../data/stations'
import {
  HCO3_MG_PER_DEGREE_F,
  HCO3_MG_PER_MEQ,
  hco3MeqToMgL,
  hco3MgLToDegreeF,
  tacMeq,
  toDegreeF,
  toMgLCaCO3,
} from '../lib/chemistry'
import { useLab } from '../store/LabContext'

const CHOICES = [8, 12, 15, 22]

export function ReadingBench() {
  const { context, send } = useLab()
  const tac = tacMeq(RIVER)
  const hco3Meq = RIVER.hco3
  const hco3Mg = hco3MeqToMgL(hco3Meq)
  const expected = hco3MgLToDegreeF(hco3Mg)
  const expectedAlt = toDegreeF(tac)
  const mgCaCO3 = toMgLCaCO3(expected)
  const done = context.completed.includes('lecture')
  const readingOk =
    context.readingValue !== null && Math.abs(context.readingValue - expected) <= 0.6
  const showCorrection = readingOk || context.naturalConfirmed || done

  return (
    <div className="bench reading-bench">
      <section className="panel">
        <p className="mark">Eau naturelle typique</p>
        <h3>{RIVER.label}</h3>
        <p>{RIVER.blurb}</p>
        <p className="mono eq">
          [HCO₃⁻] = {hco3Meq.toFixed(1).replace('.', ',')} meq/L
        </p>
        <p className="hint">
          Si les bicarbonates représentent l’essentiel de l’alcalinité (pH &lt; 8,3 → TA = 0), alors TAC ≈ [HCO₃⁻].
        </p>
      </section>

      <section className="panel">
        <p className="mark">Convertir le TAC</p>
        <p>Avec {hco3Meq.toFixed(1).replace('.', ',')} meq/L de bicarbonates, quel TAC en degrés français ?</p>
        <div className="choice-row">
          {CHOICES.map((value) => {
            const selected = context.readingValue === value
            const ok = selected && Math.abs(value - expected) <= 0.6
            return (
              <button
                key={value}
                type="button"
                className={`choice${selected ? (ok ? ' is-ok' : ' is-bad') : ''}`}
                disabled={done}
                onClick={() => send({ type: 'SET_READING', degreeF: value })}
              >
                {value} °f
              </button>
            )
          })}
        </div>
      </section>

      {showCorrection ? (
        <section className="panel correction-panel" aria-label="Correction TAC">
          <p className="mark">Correction · TAC</p>
          <p className="mono eq">[HCO₃⁻] = {hco3Meq.toFixed(1).replace('.', ',')} meq/L</p>

          <h3 className="correction-step">1. Convertir les bicarbonates en mg/L</h3>
          <p>
            La masse équivalente de HCO₃⁻ est de <span className="mono">{HCO3_MG_PER_MEQ} mg/meq</span>.
          </p>
          <p className="mono eq">
            [HCO₃⁻] = {hco3Meq.toFixed(1).replace('.', ',')} × {HCO3_MG_PER_MEQ}
          </p>
          <p className="boxed mono">
            [HCO₃⁻] = {hco3Mg.toFixed(0)} mg/L
          </p>

          <h3 className="correction-step">2. Convertir les bicarbonates en degrés français</h3>
          <p>
            On sait que : <span className="mono">1 °f ≈ {HCO3_MG_PER_DEGREE_F.toFixed(1).replace('.', ',')} mg/L HCO₃⁻</span>
          </p>
          <p className="mono eq">
            TAC = {hco3Mg.toFixed(0)} / {HCO3_MG_PER_DEGREE_F.toFixed(1).replace('.', ',')}
          </p>
          <p className="boxed mono">TAC = {expected.toFixed(0)} °f</p>

          <p className="ok-line">
            Résultat : avec {hco3Meq.toFixed(1).replace('.', ',')} meq/L de bicarbonates, on obtient un TAC
            d’environ {expected.toFixed(0)} °f, si les bicarbonates représentent l’essentiel de l’alcalinité de
            l’eau.
          </p>
          <p className="hint">
            Équivalence usuelle : {expected.toFixed(0)} °f ≈ {mgCaCO3.toFixed(0)} mg/L CaCO₃ (référence) · aussi{' '}
            {expectedAlt.toFixed(0)} °f via 0,2 meq/L par °f.
          </p>
        </section>
      ) : null}

      <section className="panel">
        <p className="mark">Lien TA / TAC</p>
        <p>
          Pour cette eau (pH {RIVER.ph.toFixed(1).replace('.', ',')} &lt; 8,3), confirmez l’interprétation usuelle :
        </p>
        <button
          type="button"
          className={`primary block${context.naturalConfirmed ? ' is-done' : ''}`}
          disabled={done}
          onClick={() => send({ type: 'CONFIRM_NATURAL' })}
        >
          TA = 0 et TAC ≈ [HCO₃⁻]
        </button>
        <ul className="takeaways">
          <li>TAC faible → eau peu tamponnée, pH instable.</li>
          <li>TAC élevé → pH plus stable ; avec dureté élevée, risque de tartre.</li>
          <li>TAC trop faible → eau potentiellement agressive pour les canalisations.</li>
        </ul>
      </section>
    </div>
  )
}
