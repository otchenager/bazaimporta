import { useEffect, useRef, useState } from 'react'
import CarPoster from './CarPoster.jsx'
import { deviceTier, useReducedMotion } from '../lib/motion.js'

const INTERACTIONS = ['pointerdown', 'touchstart', 'scroll', 'keydown']

/**
 * Постер сразу (не влияет на LCP), частицы — поверх, когда браузер свободен.
 * high: по requestIdleCallback; mid (телефоны): после первого взаимодействия; low и reduced-motion: только постер.
 */
export default function HeroCar({ label }) {
  const reduced = useReducedMotion()
  const canvasRef = useRef(null)
  const [load, setLoad] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (reduced || failed) return
    const tier = deviceTier()
    if (tier === 'low') return
    if (tier === 'high') {
      if ('requestIdleCallback' in window) {
        const id = window.requestIdleCallback(() => setLoad(true), { timeout: 2000 })
        return () => window.cancelIdleCallback(id)
      }
      const id = setTimeout(() => setLoad(true), 600)
      return () => clearTimeout(id)
    }
    const go = () => setLoad(true)
    INTERACTIONS.forEach((e) => window.addEventListener(e, go, { once: true, passive: true }))
    return () => INTERACTIONS.forEach((e) => window.removeEventListener(e, go))
  }, [reduced, failed])

  useEffect(() => {
    if (!load || !canvasRef.current) return
    let stop = () => {}
    let cancelled = false
    import('./carParticles.js').then(({ startCar }) => {
      if (cancelled || !canvasRef.current) return
      stop = startCar(canvasRef.current, {
        count: deviceTier() === 'high' ? 7000 : 4200,
        interactive: true,
        onReady: () => setReady(true),
        onLost: () => {
          setReady(false)
          setFailed(true)
          setLoad(false)
        },
      })
    })
    return () => {
      cancelled = true
      stop()
    }
  }, [load])

  return (
    <div className="relative h-full w-full">
      <CarPoster
        label={label}
        className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ${ready ? 'opacity-0' : 'opacity-100'}`}
      />
      {load && <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />}
    </div>
  )
}
