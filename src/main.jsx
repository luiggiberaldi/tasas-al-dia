import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import runOneSignal from './OneSignal';

// Inicia OneSignal solo en producción
if (import.meta.env.PROD) {
  runOneSignal();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
