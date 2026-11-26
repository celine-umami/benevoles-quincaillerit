import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/pacifico'
import './index.css'
import CalendarPage from './CalendarPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <header className="site-header">
      <h1>Inscription QuincailleRit</h1>
    </header>
    <CalendarPage />
  </StrictMode>,
)
