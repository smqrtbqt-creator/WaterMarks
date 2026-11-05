import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { STATIONS } from '../data/stations'
import { useLab } from '../store/LabContext'
import { useCo2 } from '../store/Co2Context'
import { FeedbackToast } from './FeedbackToast'

export function Layout() {
  const { context } = useLab()
  const co2 = useCo2()
  const location = useLocation()
  const onCo2 = location.pathname.includes('/co2')
  const onEquilibrium = location.pathname.includes('/equilibre')
  const done = onCo2 ? co2.context.completed.length : context.completed.length
  const total = onCo2 ? 3 : STATIONS.length

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <p className="mark">BTSA GEMEAU · laboratoire</p>
          <h1>{onEquilibrium ? 'Filière forage' : onCo2 ? 'Dosage CO₂' : 'Alcalinité · TA / TAC'}</h1>
          <p className="plant-switch">
            <a href="/">Rivière Blanche</a>
            <a href="/laboratoire">Laboratoire</a>
            <a href="/redox/">Redox</a>
            <NavLink to="/" end className={({ isActive }) => (isActive && !onCo2 ? 'active' : undefined)}>
              TA / TAC
            </NavLink>
            <NavLink to="/co2" className={({ isActive }) => (isActive ? 'active' : undefined)}>
              Dosage CO₂
            </NavLink>
            <NavLink to="/equilibre" className={({ isActive }) => (isActive ? 'active' : undefined)}>
              Filière forage
            </NavLink>
            <a href="/liens">Liens</a>
            <a href="/documents-tp">Documents de TP</a>
          </p>
        </div>
        {onEquilibrium ? (
          <p className="score">
            <strong>Libre</strong>
            réglages, sans quiz
          </p>
        ) : (
          <p className="score">
            <strong>
              {done} / {total}
            </strong>
            {onCo2 ? 'étapes CO₂' : 'postes validés'}
          </p>
        )}
      </header>
      <Outlet />
      <FeedbackToast />
    </div>
  )
}
