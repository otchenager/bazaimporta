import { useSyncExternalStore } from 'react'

const REDUCED = '(prefers-reduced-motion: reduce)'

function subscribeQuery(query) {
  return (cb) => {
    const mq = window.matchMedia(query)
    mq.addEventListener('change', cb)
    return () => mq.removeEventListener('change', cb)
  }
}

const subscribeReduced = (cb) => subscribeQuery(REDUCED)(cb)

/** true, если пользователь просит меньше движения. На сервере — true (безопасно: без анимаций). */
export function useReducedMotion() {
  return useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => true)
}

/** 'high' — можно WebGL сразу; 'mid' — телефон с нормальным железом; 'low' — только статичный постер. */
export function deviceTier() {
  if (typeof window === 'undefined') return 'low'
  const nav = navigator
  const cores = nav.hardwareConcurrency ?? 4
  const memory = nav.deviceMemory ?? 4
  const saveData = nav.connection?.saveData === true
  if (saveData || cores <= 2 || memory <= 2) return 'low'
  const coarse = window.matchMedia('(pointer: coarse)').matches
  return coarse ? 'mid' : 'high'
}
