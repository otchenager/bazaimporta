import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Лента со scroll-snap: свайп — нативный скролл, step(±1) листает на одну карточку.
 * edge.start / edge.end — для неактивных стрелок; fits — все карточки видны целиком (стрелки не нужны).
 */
export default function useCarousel(gap = 12) {
  const ref = useRef(null)
  const [edge, setEdge] = useState({ start: true, end: false, fits: false })

  const sync = useCallback(() => {
    const el = ref.current
    if (!el) return
    const fits = el.scrollWidth <= el.clientWidth + 1
    const next = { start: el.scrollLeft < 8, end: fits || el.scrollLeft + el.clientWidth > el.scrollWidth - 8, fits }
    setEdge((cur) => (cur.start === next.start && cur.end === next.end && cur.fits === next.fits ? cur : next))
  }, [])

  useEffect(() => {
    sync()
    const el = ref.current
    el?.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    return () => {
      el?.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
  }, [sync])

  const step = useCallback(
    (dir) => {
      const el = ref.current
      const slide = el?.firstElementChild
      if (!slide) return
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollBy({ left: dir * (slide.getBoundingClientRect().width + gap), behavior: reduced ? 'auto' : 'smooth' })
    },
    [gap],
  )

  /** ← → на самой ленте (она в порядке табуляции). */
  const onKeyDown = useCallback(
    (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      e.preventDefault()
      step(e.key === 'ArrowLeft' ? -1 : 1)
    },
    [step],
  )

  return { ref, edge, step, onKeyDown }
}
