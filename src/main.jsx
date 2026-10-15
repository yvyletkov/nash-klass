import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import '@fontsource/caveat/cyrillic-500.css'
import '@fontsource/caveat/cyrillic-700.css'
import '@fontsource/caveat/latin-700.css'
import '@fontsource/neucha/cyrillic-400.css'
import '@fontsource/neucha/latin-400.css'
import '@fontsource/pacifico/cyrillic-400.css'
import '@fontsource/pacifico/latin-400.css'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <App />
  </HashRouter>
)
