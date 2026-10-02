import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Importa config do Firebase para inicializar antes de tudo
import './firebase/config'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
