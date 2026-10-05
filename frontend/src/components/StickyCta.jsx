import { useEffect, useState } from 'react'
import CtaButton from './CtaButton.jsx'
import { COPY, LINKS } from '../content/copy.js'

/**
 * Липкая кнопка на мобильных. Появляется, когда hero ушёл с экрана,
 * и прячется, пока виден финальный CTA (чтобы не было двух одинаковых кнопок).
 */
export default function StickyCta({ track }) {
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    const hero = document.getElementById('hero')
    const final = document.getElementById('final')
    if (!hero) return
    let heroVisible = true
    let finalVisible = false
    const sync = () => setHidden(heroVisible || finalVisible)
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) heroVisible = e.isIntersecting
        if (e.target === final) finalVisible = e.isIntersecting
      }
      sync()
    })
    io.observe(hero)
    if (final) io.observe(final)
    return () => io.disconnect()
  }, [])

  return (
    <div
      className="sticky-cta fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 px-4 pt-3 backdrop-blur-md md:hidden"
      data-hidden={hidden}
      aria-hidden={hidden}
    >
      {track ? (
        <CtaButton href={LINKS.boris} goal={`cta_exclusive_${track.id}`} className="w-full" tabIndex={hidden ? -1 : 0}>
          {COPY.exclusive.cta}
        </CtaButton>
      ) : (
        <CtaButton href={LINKS.channel} goal="cta_sticky" className="w-full" tabIndex={hidden ? -1 : 0}>
          {COPY.sticky.cta}
        </CtaButton>
      )}
    </div>
  )
}
