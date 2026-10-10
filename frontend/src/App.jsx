import { useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import ThankYou from './pages/ThankYou.jsx'
import NotFound from './pages/NotFound.jsx'
import Legal from './pages/Legal.jsx'
import { PRIVACY, CONSENT } from './content/privacy.js'
import { TRACKS } from './content/tracks.js'
import { hit } from './lib/analytics.js'

/** Хит Метрики на каждую смену маршрута. Первый (загрузка страницы) уже отправил счётчик — его пропускаем. */
function useRouteHits() {
  const { pathname, search } = useLocation()
  const prev = useRef(null)
  useEffect(() => {
    const url = window.location.origin + pathname + search
    if (prev.current && prev.current !== url) hit(url, prev.current)
    prev.current = url
  }, [pathname, search])
}

// Оплата идёт через бота @bazaimporta_bot (Robokassa), поэтому страницы /payment нет.
export default function App() {
  useRouteHits()
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
      {/* старые адреса треков; на сервере — 301 в .htaccess */}
      {TRACKS.filter((t) => t.oldSlug).map((t) => (
        <Route key={t.oldSlug} path={t.oldSlug} element={<Navigate to={t.slug} replace />} />
      ))}
      <Route path="/thank-you/" element={<ThankYou />} />
      <Route path={PRIVACY.path} element={<Legal doc={PRIVACY} />} />
      <Route path={CONSENT.path} element={<Legal doc={CONSENT} />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
