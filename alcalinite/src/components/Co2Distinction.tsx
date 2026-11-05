import { useCo2 } from '../store/Co2Context'

export function Co2Distinction() {
  const { context, send } = useCo2()

  return (
    <div className="bench">
      <section className="panel correction-panel">
        <p className="mark">Position de la sonde de pH</p>
        <h3>Pourquoi après le mélangeur, pas juste après l’injecteur ?</h3>
        <ul className="takeaways">
          <li>
            <strong>Trop près de l’injecteur</strong> : le CO₂ peut être mal réparti ; la mesure ne représente pas le
            pH moyen.
          </li>
          <li>
            <strong>Après le mélange</strong> : la mesure est plus représentative de l’eau traitée.
          </li>
          <li>
            <strong>Trop loin en aval</strong> : d’autres réactions ou échanges gazeux peuvent modifier le pH avant la
            mesure.
          </li>
        </ul>
        <p className="hint">
          La sonde envoie son signal à un <strong>régulateur de pH</strong>, qui ajuste le débit de CO₂ via une vanne
          ou un débitmètre régulateur. Sur une installation réelle, la position exacte dépend du temps de mélange, du
          temps de réponse de la sonde et de l’objectif du traitement.
        </p>
      </section>

      <section className="panel">
        <p className="mark">Ne pas confondre</p>
        <h3>Que fait la chaîne d’injection CO₂ ?</h3>
        <div className="choice-row">
          <button
            type="button"
            className={`choice${context.distinctionOk ? ' is-ok' : ''}`}
            onClick={() => send({ type: 'CONFIRM_DISTINCTION', choice: 'co2' })}
          >
            Elle dose le CO₂ (vanne asservie au pH après mélange)
          </button>
          <button
            type="button"
            className="choice"
            onClick={() => send({ type: 'CONFIRM_DISTINCTION', choice: 'tac' })}
          >
            Elle dose / mesure le TAC avec la sonde de pH
          </button>
          <button
            type="button"
            className="choice"
            onClick={() => send({ type: 'CONFIRM_DISTINCTION', choice: 'both' })}
          >
            La sonde de pH donne aussi le TAC directement
          </button>
        </div>

        <div className="distinction-grid">
          <div className="panel">
            <p className="mark">Dosage du CO₂</p>
            <ul className="takeaways">
              <li>Forage → injecteur (vanne) → mélangeur → sonde pH → suite</li>
              <li>Asservissement : sonde → régulateur → vanne CO₂</li>
              <li>Fait baisser le pH ; le TAC amortit la variation</li>
            </ul>
          </div>
          <div className="panel">
            <p className="mark">Mesure du TAC</p>
            <ul className="takeaways">
              <li>Mesure spécifique (labo ou analyseur dédié)</li>
              <li>Une sonde de pH seule ne mesure pas le TAC</li>
              <li>Titrage typique jusqu’à pH ≈ 4,3 (hélianthine)</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
