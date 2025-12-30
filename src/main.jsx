import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import runOneSignal from './OneSignal'; // <--- 1. Importamos la configuración

// 2. Iniciamos el servicio de notificaciones
runOneSignal();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)