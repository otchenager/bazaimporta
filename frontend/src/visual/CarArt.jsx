import { useEffect, useRef, useState } from 'react'
import stillUrl from './car-still.webp?url'

// 3D Lamborghini Huracán в hero: car3d.js + public/models/huracan.glb (≈ 1.1 МБ). Загрузка начинается сразу при
// монтировании; three.js — отдельный чанк, LCP страницы (заголовок) не ждёт. Пока модель грузится, место пустое,
// затем машина проявляется шторкой сверху вниз.
// Без WebGL, при Save-Data, ошибке или таймауте — статичный кадр той же модели (car-still.webp, scripts/car-still.mjs).
const MODEL_URL = `${import.meta.env.BASE_URL}models/huracan.glb`

export default function CarArt({ label, className = '' }) {
  const ref = useRef(null)
  const [still, setStill] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let alive = true, car = null
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mobile = !window.matchMedia('(hover: hover) and (pointer: fine)').matches
    // Save-Data: 3D не грузим — сразу кадр-заглушка
    ;(navigator.connection?.saveData ? Promise.reject(new Error('save-data')) : import('./car3d.js'))
      .then(({ startCar3D }) => startCar3D(el, { url: MODEL_URL, mobile, still: reduced, timeout: mobile ? 15000 : 10000 }))
      .then((c) => {
        if (!alive) return c.dispose()
        car = c
      })
      .catch(() => alive && setStill(true))
    return () => {
      alive = false
      car?.dispose()
    }
  }, [])

  return (
    <div ref={ref} role="img" aria-label={label} className={`art ${className}`}>
      {still && <img src={stillUrl} alt="" className="art-still" decoding="async" />}
    </div>
  )
}
