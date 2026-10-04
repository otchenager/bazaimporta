import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import ThankYou from './pages/ThankYou.jsx'
import NotFound from './pages/NotFound.jsx'
import { TRACKS } from './content/tracks.js'

// Оплата идёт через бота @bazaimporta_bot (Robokassa), поэтому страницы /payment нет.
export default function App() {
  // Эффект родителя срабатывает после эффектов детей: Reveal уже отметил видимое — теперь можно включить анимации
  useEffect(() => {
    document.documentElement.classList.add('js')
  }, [])
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      {TRACKS.map((t) => (
        <Route key={t.id} path={t.slug} element={<Landing />} />
      ))}
      <Route path="/thank-you/" element={<ThankYou />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
