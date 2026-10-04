import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './fonts.js'
import './index.css'
import App from './App.jsx'

const container = document.getElementById('root')
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

// В сборке страница пререндерена — гидратируем; в `npm run dev` разметки нет — рендерим с нуля
if (container.firstElementChild) hydrateRoot(container, app)
else createRoot(container).render(app)
