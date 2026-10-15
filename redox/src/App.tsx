import { MotionConfig } from 'framer-motion'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { BASENAME } from './base'
import { Layout } from './components/Layout'
import { PlantPage } from './pages/PlantPage'
import { QuizPage } from './pages/QuizPage'

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter basename={BASENAME}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<PlantPage />} />
            <Route path="quiz" element={<QuizPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  )
}
