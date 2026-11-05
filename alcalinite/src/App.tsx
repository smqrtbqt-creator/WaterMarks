import { MotionConfig } from 'framer-motion'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { BASENAME } from './base'
import { Layout } from './components/Layout'
import { Co2Page } from './pages/Co2Page'
import { EquilibriumPage } from './pages/EquilibriumPage'
import { PlantPage } from './pages/PlantPage'
import { Co2Provider } from './store/Co2Context'
import { LabProvider } from './store/LabContext'

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LabProvider>
        <Co2Provider>
          <BrowserRouter basename={BASENAME}>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<PlantPage />} />
                <Route path="co2" element={<Co2Page />} />
                <Route path="equilibre" element={<EquilibriumPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </Co2Provider>
      </LabProvider>
    </MotionConfig>
  )
}
