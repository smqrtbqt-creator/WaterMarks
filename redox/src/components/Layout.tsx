import { NavLink, Outlet } from 'react-router-dom'
import { STATIONS, stationTotal } from '../data/experiments'
import { useAppStore } from '../store/useAppStore'

export function Layout() {
  const progress = useAppStore((state) => state.progress)
  const done = STATIONS.filter((station) => (progress[station.id] ?? 0) >= stationTotal(station)).length

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <p className="mark">Usine de traitement · électrons</p>
          <h1>Station redox</h1>
          <p className="plant-switch">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
              Laboratoire
            </NavLink>
            <NavLink to="/quiz" className={({ isActive }) => (isActive ? 'active' : undefined)}>
              Quiz
            </NavLink>
          </p>
        </div>
        <p className="score">
          <strong>
            {done} / {STATIONS.length}
          </strong>
          postes réglés
        </p>
      </header>
      <Outlet />
    </div>
  )
}
