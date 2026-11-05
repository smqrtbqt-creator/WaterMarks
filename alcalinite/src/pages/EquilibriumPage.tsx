import { useState } from 'react'
import {
  HOCL_PKA,
  SUBJECT,
  co2MgLForPh,
  evaluate,
  tendency,
  type EquilibriumInput,
  type Tendency,
  type WaterPoint,
} from '../lib/equilibrium'

type UnitId = 'forage' | 'co2' | 'contact' | 'chlore' | 'reseau'

const UNITS: { id: UnitId; index: string; title: string }[] = [
  { id: 'forage', index: '01', title: 'Forage' },
  { id: 'co2', index: '02', title: 'Injection CO₂' },
  { id: 'contact', index: '03', title: 'Contacteur calcaire' },
  { id: 'chlore', index: '04', title: 'Chloration' },
  { id: 'reseau', index: '05', title: 'Réseau' },
]

function fr(value: number, digits = 0) {
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function hPlusLabel(ph: number) {
  const value = 10 ** -ph
  const exp = Math.floor(Math.log10(value))
  const mant = value / 10 ** exp
  const sup = String(exp)
    .split('')
    .map((ch) => ({ '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' })[ch] ?? ch)
    .join('')
  return `${fr(mant, 2)} × 10${sup} mol/L`
}

function sense(kind: Tendency) {
  if (kind === 'agression') {
    return 'Plusieurs grandeurs sont basses ensemble. Le risque à surveiller est l’agression des métaux et des matériaux cimentaires.'
  }
  if (kind === 'incrustation') {
    return 'Plusieurs grandeurs sont hautes ensemble. Le risque à surveiller est le dépôt de carbonate de calcium.'
  }
  return 'Le pH, le TAC et le calcium ne vont pas tous dans le même sens.'
}

export function EquilibriumPage() {
  const [phRaw, setPhRaw] = useState(SUBJECT.phRaw)
  const [tacMmol, setTacMmol] = useState(SUBJECT.tacMmol)
  const [caMgL, setCaMgL] = useState(SUBJECT.caMgL)
  const [tempC, setTempC] = useState(SUBJECT.tempC)
  const [co2MgL, setCo2MgL] = useState(SUBJECT.co2MgL)
  const [contact, setContact] = useState(SUBJECT.contact)
  const [chlorineDoseMgL, setChlorineDoseMgL] = useState(SUBJECT.chlorineDoseMgL)
  const [chlorineDemandMgL, setChlorineDemandMgL] = useState(SUBJECT.chlorineDemandMgL)
  const [contactMin, setContactMin] = useState(SUBJECT.contactMin)
  const [unit, setUnit] = useState<UnitId>('forage')

  const input: EquilibriumInput = {
    phRaw,
    tacMmol,
    caMgL,
    tempC,
    co2MgL,
    contact,
    chlorineDoseMgL,
    chlorineDemandMgL,
    contactMin,
  }
  const result = evaluate(input)
  const dose68 = co2MgLForPh(input, 6.8)
  const kind = tendency(result.afterContact)
  const out = result.afterContact
  const cl = result.chlorine

  function applySubject() {
    setPhRaw(SUBJECT.phRaw)
    setTacMmol(SUBJECT.tacMmol)
    setCaMgL(SUBJECT.caMgL)
    setTempC(SUBJECT.tempC)
    setCo2MgL(0)
    setContact(0)
    setChlorineDoseMgL(SUBJECT.chlorineDoseMgL)
    setChlorineDemandMgL(SUBJECT.chlorineDemandMgL)
    setContactMin(SUBJECT.contactMin)
  }

  function applyCo2Case() {
    setPhRaw(SUBJECT.phRaw)
    setTacMmol(SUBJECT.tacMmol)
    setCaMgL(SUBJECT.caMgL)
    setTempC(SUBJECT.tempC)
    setContact(0)
    setCo2MgL(co2MgLForPh(SUBJECT, 6.8))
    setUnit('co2')
  }

  return (
    <main className="plant eq-page">
      <section className="station-panel">
        <header className="station-head">
          <div>
            <p className="mark">BTS GEMEAU · chimie de l’eau</p>
            <h2>Forage, CO₂, calcaire et chlore</h2>
            <p className="brief">
              Eau du sujet : pH 7,8, TAC 3,0 mmol/L, calcium 60 mg/L, 15 °C. Chaque curseur change la filière. Rien
              n’est noté.
            </p>
          </div>
          <div className="station-actions">
            <button type="button" onClick={applySubject}>
              Eau du sujet
            </button>
            <button type="button" onClick={applyCo2Case}>
              CO₂ jusqu’à pH 6,8
            </button>
            <button type="button" onClick={() => { setContact(1); setUnit('contact') }}>
              Ouvrir le contacteur
            </button>
          </div>
        </header>

        <div className="eq-line" role="group" aria-label="Ouvrages de la filière">
          {UNITS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`eq-unit${unit === item.id ? ' is-on' : ''}`}
              aria-pressed={unit === item.id}
              onClick={() => setUnit(item.id)}
            >
              <span className="eq-index">{item.index}</span>
              <span className="eq-unit-title">{item.title}</span>
              <UnitValue id={item.id} raw={result.raw} co2={result.afterCo2} out={out} co2MgL={co2MgL} contact={contact} residual={cl.residualMgL} fHocl={cl.fHocl} />
            </button>
          ))}
        </div>

        <div className="eq-work">
          <div className="eq-inspector">
            {unit === 'forage' ? (
              <>
                <h3>Eau brute</h3>
                <Slider label="pH" value={phRaw} min={6.2} max={8.8} step={0.1} digits={1} onChange={setPhRaw} />
                <Slider label="TAC" value={tacMmol} min={0.4} max={6} step={0.1} digits={1} unit="mmol/L" onChange={setTacMmol} />
                <Slider label="Calcium" value={caMgL} min={10} max={200} step={1} digits={0} unit="mg/L" onChange={setCaMgL} />
                <Slider label="Température" value={tempC} min={5} max={25} step={1} digits={0} unit="°C" onChange={setTempC} />
                <p>
                  Un pH de {fr(phRaw, 1)} signifie que l’activité des ions hydrogène vaut 10<sup>−{fr(phRaw, 1)}</sup>,
                  soit {hPlusLabel(phRaw)}. Sous 7, l’eau est acide par rapport à la neutralité ; au-dessus, elle est
                  basique. Le pH ne mesure pas le TAC.
                </p>
                <p>
                  Le TAC, {fr(tacMmol, 1)} mmol d’équivalents par litre ({fr(tacMmol / 0.2, 0)} °f), est la capacité de
                  l’eau à neutraliser un acide. Quand les bicarbonates dominent, il est surtout porté par HCO₃⁻. Il
                  tamponne le pH et, avec le calcium, il participe à l’équilibre calco-carbonique.
                </p>
                <p>
                  Il faut les trois grandeurs ensemble : le pH répartit H₂CO₃*, HCO₃⁻ et CO₃²⁻, le TAC donne la réserve
                  alcaline, le calcium dit combien de Ca²⁺ peut former CaCO₃. La température décale les constantes
                  (ici pK₁ ≈ {fr(result.pK1, 2)}, pK₂ ≈ {fr(result.pK2, 2)}). Une seule de ces mesures laisse
                  l’équilibre indéterminé.
                </p>
              </>
            ) : null}

            {unit === 'co2' ? (
              <>
                <h3>Injection de dioxyde de carbone</h3>
                <p className="eq-reaction">
                  CO₂(aq) + H₂O ⇌ H₂CO₃ ⇌ H⁺ + HCO₃⁻
                  <br />
                  HCO₃⁻ ⇌ H⁺ + CO₃²⁻
                </p>
                <Slider
                  label="Dose de CO₂"
                  value={co2MgL}
                  min={0}
                  max={120}
                  step={0.5}
                  digits={1}
                  unit="mg/L"
                  onChange={setCo2MgL}
                />
                <p className="eq-hint">
                  {dose68 <= 0
                    ? 'Le pH brut est déjà à 6,8 ou en dessous.'
                    : `Repère sur l’eau actuelle, sans calcaire : environ ${fr(dose68, 0)} mg/L amènent le pH vers 6,8.`}
                </p>
                <p>
                  Le CO₂ dissous libère des ions H⁺. Le pH passe de {fr(result.raw.ph, 2)} à {fr(result.afterCo2.ph, 2)}.
                  Dans ce modèle, aucun minéral ne se dissout à cette étape : le TAC reste {fr(result.afterCo2.tacMmol, 2)} mmol/L.
                </p>
                <p>
                  Le pH décrit l’activité de H⁺. Le TAC décrit une capacité de neutralisation. L’un peut baisser pendant
                  que l’autre ne bouge pas.
                </p>
              </>
            ) : null}

            {unit === 'contact' ? (
              <>
                <h3>Contact avec le carbonate de calcium</h3>
                <p className="eq-reaction">CaCO₃(s) + CO₂(aq) + H₂O ⇌ Ca²⁺ + 2 HCO₃⁻</p>
                <Slider
                  label="Part du CO₂ dissous qui réagit avec le calcaire"
                  value={contact * 100}
                  min={0}
                  max={100}
                  step={1}
                  digits={0}
                  unit="%"
                  onChange={(value) => setContact(value / 100)}
                />
                <p>
                  Acidifier augmente le CO₂ dissous, ce qui favorise la dissolution du carbonate de calcium. Ici,{' '}
                  {fr(result.dissolvedMmol, 2)} mmol/L de CaCO₃ se dissolvent.
                </p>
                <p>
                  Le calcium passe de {fr(result.afterCo2.caMgL, 0)} à {fr(out.caMgL, 0)} mg/L. Les bicarbonates passent
                  de {fr(result.afterCo2.hco3Mmol, 2)} à {fr(out.hco3Mmol, 2)} mmol/L. Le TAC passe de{' '}
                  {fr(result.afterCo2.tacMmol, 2)} à {fr(out.tacMmol, 2)} mmol/L, et le pH remonte à {fr(out.ph, 2)}.
                </p>
                {result.afterCo2.h2co3Mmol < 0.25 ? (
                  <p>Sans CO₂ dissous, le curseur ne dissout presque rien : il n’y a pas d’acide carbonique à consommer.</p>
                ) : null}
              </>
            ) : null}

            {unit === 'chlore' ? (
              <>
                <h3>Désinfection au chlore</h3>
                <p className="eq-reaction">
                  Cl₂ + H₂O ⇌ HOCl + H⁺ + Cl⁻
                  <br />
                  HOCl ⇌ H⁺ + OCl⁻
                </p>
                <p>
                  Dans le couple HOCl / OCl⁻, l’acide est HOCl et la base est OCl⁻. pKa = {fr(HOCL_PKA, 1)} à 25 °C,
                  comme dans le sujet. Formule : pH = pKa + log([OCl⁻] / [HOCl]).
                </p>
                <Slider label="Dose de chlore" value={chlorineDoseMgL} min={0} max={2} step={0.05} digits={2} unit="mg/L" onChange={setChlorineDoseMgL} />
                <Slider label="Demande en chlore" value={chlorineDemandMgL} min={0} max={2} step={0.05} digits={2} unit="mg/L" onChange={setChlorineDemandMgL} />
                <Slider label="Temps de contact" value={contactMin} min={5} max={120} step={5} digits={0} unit="min" onChange={setContactMin} />
                <ChlorineTable currentPh={cl.ph} current={cl} at68={cl.at68} at78={cl.at78} />
                <p>
                  À pH 6,8, HOCl représente environ {fr(cl.at68.fHocl * 100, 0)} % du chlore libre. À pH 7,8, cette part
                  tombe à environ {fr(cl.at78.fHocl * 100, 0)} %. À concentration égale, HOCl désinfecte mieux que OCl⁻.
                  Le pH choisit donc la forme du chlore.
                </p>
                <p>
                  Le pH seul ne dit pas que l’eau est désinfectée. Il faut aussi la dose ({fr(chlorineDoseMgL, 2)} mg/L),
                  la demande ({fr(chlorineDemandMgL, 2)} mg/L), le résiduel ({fr(cl.residualMgL, 2)} mg/L) et le temps
                  de contact ({fr(contactMin, 0)} min). Ce temps n’entre pas dans le pKa. Cryptosporidium résiste
                  fortement au chlore.
                </p>
              </>
            ) : null}

            {unit === 'reseau' ? (
              <>
                <h3>Distribution</h3>
                <p>
                  <strong>Classement agressif ou incrustant : non déterminé.</strong> {sense(kind)} Les quatre mesures
                  du tableau ne suffisent pas : il manque la force ionique, le magnésium, les sulfates, les chlorures,
                  un carbone minéral mesuré et un indice de saturation dont on écrit les hypothèses.
                </p>
                <p>
                  Une eau agressive peut corroder les métaux et attaquer les matériaux cimentaires. Une eau incrustante
                  peut déposer du calcaire, réduire la section et gêner les vannes. Ce sont des risques de réseau, pas
                  un verdict sur cette eau.
                </p>
                <p>
                  Une eau désinfectée doit rester compatible avec les canalisations. Le chlore résiduel se suit dans le
                  réseau ; il ne mesure pas la stabilité calco-carbonique. Avant la mise en distribution, on relève au
                  minimum le pH, le TAC, le calcium et le chlore libre résiduel, plus la température, la demande et le
                  temps de contact. La microbiologie et le bilan ionique complet sont en dehors de ce modèle.
                </p>
              </>
            ) : null}
          </div>

          <div className="eq-side" aria-live="polite">
            <h3>Bilan de la filière</h3>
            <div className="eq-table-wrap">
              <table className="eq-table">
                <caption>Valeurs reconstruites par le modèle, de l’eau brute jusqu’au contacteur.</caption>
                <thead>
                  <tr>
                    <th>Grandeur</th>
                    <th>Brute</th>
                    <th>Après CO₂</th>
                    <th>Après contact</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>pH</th>
                    <td>{fr(result.raw.ph, 2)}</td>
                    <td>{fr(result.afterCo2.ph, 2)}</td>
                    <td>{fr(out.ph, 2)}</td>
                  </tr>
                  <tr>
                    <th>TAC (mmol/L)</th>
                    <td>{fr(result.raw.tacMmol, 2)}</td>
                    <td>{fr(result.afterCo2.tacMmol, 2)}</td>
                    <td>{fr(out.tacMmol, 2)}</td>
                  </tr>
                  <tr>
                    <th>Calcium (mg/L)</th>
                    <td>{fr(result.raw.caMgL, 0)}</td>
                    <td>{fr(result.afterCo2.caMgL, 0)}</td>
                    <td>{fr(out.caMgL, 0)}</td>
                  </tr>
                  <tr>
                    <th>H₂CO₃* (mmol/L)</th>
                    <td>{fr(result.raw.h2co3Mmol, 2)}</td>
                    <td>{fr(result.afterCo2.h2co3Mmol, 2)}</td>
                    <td>{fr(out.h2co3Mmol, 2)}</td>
                  </tr>
                  <tr>
                    <th>HCO₃⁻ (mmol/L)</th>
                    <td>{fr(result.raw.hco3Mmol, 2)}</td>
                    <td>{fr(result.afterCo2.hco3Mmol, 2)}</td>
                    <td>{fr(out.hco3Mmol, 2)}</td>
                  </tr>
                  <tr>
                    <th>CO₃²⁻ (mmol/L)</th>
                    <td>{fr(result.raw.co3Mmol, 3)}</td>
                    <td>{fr(result.afterCo2.co3Mmol, 3)}</td>
                    <td>{fr(out.co3Mmol, 3)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <SpeciesBars point={out} hocl={cl.fHocl} />
          </div>
        </div>
      </section>

      <section className="station-panel" aria-label="Synthèse d’exploitation">
        <h3>Ce que l’exploitant surveille</h3>
        <div className="eq-table-wrap">
          <table className="eq-table">
            <thead>
              <tr>
                <th>Paramètre ou traitement</th>
                <th>Effet recherché</th>
                <th>À surveiller</th>
                <th>Lecture actuelle</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Injection de CO₂</th>
                <td>Abaisser le pH et déplacer les carbonates</td>
                <td>pH. Le TAC ne change pas si aucun minéral ne se dissout.</td>
                <td>
                  pH {fr(result.raw.ph, 2)} → {fr(result.afterCo2.ph, 2)} ; TAC {fr(result.afterCo2.tacMmol, 2)} mmol/L
                </td>
              </tr>
              <tr>
                <th>Correction de la minéralisation</th>
                <td>Relever le calcium et les bicarbonates</td>
                <td>Calcium, TAC, pH</td>
                <td>
                  CaCO₃ dissous {fr(result.dissolvedMmol, 2)} mmol/L ; calcium {fr(out.caMgL, 0)} mg/L ; TAC{' '}
                  {fr(out.tacMmol, 2)} mmol/L
                </td>
              </tr>
              <tr>
                <th>Injection de chlore</th>
                <td>Désinfecter ; la forme dépend du pH</td>
                <td>Résiduel, part de HOCl, demande, temps de contact</td>
                <td>
                  Résiduel {fr(cl.residualMgL, 2)} mg/L dont {fr(cl.fHocl * 100, 0)} % de HOCl ; contact{' '}
                  {fr(contactMin, 0)} min
                </td>
              </tr>
              <tr>
                <th>Contrôle du réseau</th>
                <td>Eau compatible avec les canalisations, résiduel suivi</td>
                <td>pH, TAC, calcium, chlore libre résiduel</td>
                <td>Classement non déterminé. {sense(kind)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="eq-conclusion">
          Sur cette eau, le pH {fr(result.raw.ph, 1)} et le TAC {fr(result.raw.tacMmol, 1)} mmol/L ne décrivent pas la
          même chose : l’un suit H⁺, l’autre la capacité à neutraliser un acide. L’injection de {fr(co2MgL, 0)} mg/L de
          CO₂ amène le pH à {fr(result.afterCo2.ph, 2)} sans changer le TAC, tant que le calcaire ne se dissout pas. Le
          contacteur, à {fr(contact * 100, 0)} %, dissout {fr(result.dissolvedMmol, 2)} mmol/L de CaCO₃ : le calcium
          vaut {fr(out.caMgL, 0)} mg/L et le TAC {fr(out.tacMmol, 2)} mmol/L, selon CaCO₃ + CO₂ + H₂O ⇌ Ca²⁺ + 2 HCO₃⁻.
          À pH {fr(out.ph, 2)}, environ {fr(cl.fHocl * 100, 0)} % du chlore libre est sous forme HOCl (pKa {fr(HOCL_PKA, 1)}).
          Ce pourcentage ne dit pas que l’eau est désinfectée : le résiduel est {fr(cl.residualMgL, 2)} mg/L après une
          demande de {fr(chlorineDemandMgL, 2)} mg/L. Le caractère agressif ou incrustant reste non déterminé. Les
          réglages réels suivent les exigences sanitaires et les procédures de la station.
        </p>
      </section>

      <aside className="disclaimer panel">
        <p>
          Modèle pédagogique. Le pH ne mesure pas le TAC. L’ajout de CO₂ seul ne modifie pas l’alcalinité ; la
          dissolution de CaCO₃ l’augmente. La part de HOCl vient du pKa 7,5 à 25 °C : la température de l’eau, sa
          composition, la demande, le temps de contact et le résiduel comptent aussi. Ce poste ne déclare pas l’eau
          potable et ne remplace pas une consigne d’exploitation.
        </p>
      </aside>
    </main>
  )
}

function UnitValue({
  id,
  raw,
  co2,
  out,
  co2MgL,
  contact,
  residual,
  fHocl,
}: {
  id: UnitId
  raw: WaterPoint
  co2: WaterPoint
  out: WaterPoint
  co2MgL: number
  contact: number
  residual: number
  fHocl: number
}) {
  if (id === 'forage') return <span className="eq-unit-value">pH {fr(raw.ph, 1)} · TAC {fr(raw.tacMmol, 1)}</span>
  if (id === 'co2') return <span className="eq-unit-value">{fr(co2MgL, 0)} mg/L · pH {fr(co2.ph, 2)}</span>
  if (id === 'contact') return <span className="eq-unit-value">{fr(contact * 100, 0)} % · Ca {fr(out.caMgL, 0)} mg/L</span>
  if (id === 'chlore') return <span className="eq-unit-value">HOCl {fr(fHocl * 100, 0)} % · {fr(residual, 2)} mg/L</span>
  return <span className="eq-unit-value">non déterminé</span>
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  digits,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  digits: number
  unit?: string
  onChange: (value: number) => void
}) {
  return (
    <label className="slider-label">
      <span className="eq-slider-top">
        <span>{label}</span>
        <strong className="mono">
          {fr(value, digits)}
          {unit ? ` ${unit}` : ''}
        </strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  )
}

function ChlorineTable({
  currentPh,
  current,
  at68,
  at78,
}: {
  currentPh: number
  current: { ratio: number; fHocl: number }
  at68: { ratio: number; fHocl: number }
  at78: { ratio: number; fHocl: number }
}) {
  const rows: { ph: number; ratio: number; fHocl: number; live: boolean; label?: string }[] = [
    { ph: 6.8, ...at68, live: Math.abs(currentPh - 6.8) < 0.05 },
    { ph: 7.8, ...at78, live: Math.abs(currentPh - 7.8) < 0.05 },
    { ph: currentPh, ...current, live: true, label: 'pH de la chloration' },
  ]
  return (
    <div className="eq-table-wrap">
      <table className="eq-table">
        <caption>Répartition du chlore libre HOCl + OCl⁻. Calcul du sujet, activités assimilées aux concentrations.</caption>
        <thead>
          <tr>
            <th>pH</th>
            <th>[OCl⁻] / [HOCl]</th>
            <th>Part de HOCl</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label ?? row.ph} className={row.live && row.label ? 'is-live' : undefined}>
              <th>{row.label ?? fr(row.ph, 1)}</th>
              <td>{fr(row.ratio, 2)}</td>
              <td>{fr(row.fHocl * 100, 0)} %</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SpeciesBars({ point, hocl }: { point: WaterPoint; hocl: number }) {
  const ct = Math.max(point.ctMmol, 1e-9)
  const parts = [
    { label: 'H₂CO₃*', share: point.h2co3Mmol / ct, color: '#8ec8e6' },
    { label: 'HCO₃⁻', share: point.hco3Mmol / ct, color: '#dff56a' },
    { label: 'CO₃²⁻', share: point.co3Mmol / ct, color: '#e7b15a' },
  ]
  return (
    <div className="eq-bars">
      <p>Espèces carbonatées après le contacteur</p>
      <div className="eq-bar" aria-hidden>
        {parts.map((part) => (
          <span key={part.label} style={{ width: `${part.share * 100}%`, background: part.color }} />
        ))}
      </div>
      <p className="eq-legend">
        {parts.map((part) => (
          <span key={part.label}>
            <i style={{ background: part.color }} />
            {part.label} {fr(part.share * 100, 0)} %
          </span>
        ))}
      </p>
      <p>Chlore libre au pH de sortie : HOCl {fr(hocl * 100, 0)} %, OCl⁻ {fr((1 - hocl) * 100, 0)} %</p>
      <div className="eq-bar" aria-hidden>
        <span style={{ width: `${hocl * 100}%`, background: '#8ed6a8' }} />
        <span style={{ width: `${(1 - hocl) * 100}%`, background: '#f07a68' }} />
      </div>
    </div>
  )
}
