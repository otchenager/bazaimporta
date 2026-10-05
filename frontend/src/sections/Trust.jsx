import { useState } from 'react'
import ArrowButton from '../components/ArrowButton.jsx'
import Lightbox from '../components/Lightbox.jsx'
import Reveal from '../components/Reveal.jsx'
import DealCase from './DealCase.jsx'
import { COPY, LEGAL, LINKS } from '../content/copy.js'
import { ALL_PHOTOS, photoAvif, photoLarge, photoProps } from '../lib/images.js'
import useCarousel from '../lib/useCarousel.js'

// Выдачи клиентам: сначала BMW и Audi (раньше были в галерее кейса), дальше остальные фото. Huracán — в кейсе.
const ALT = {
  'p20-27-53': 'Передача BMW 7 серии клиенту',
  'p20-22-10': 'Передача Audi A6 клиентам',
}
const FIRST = Object.keys(ALT)
const PHOTOS = [...FIRST, ...ALL_PHOTOS.filter((k) => k !== 'lamb' && !FIRST.includes(k))].map((key) => ({
  key,
  alt: ALT[key] ?? 'Передача машины клиенту',
}))
const LARGE = PHOTOS.map((p) => ({ src: photoLarge(p.key), alt: p.alt, width: 960, height: 1200 }))
const GAP = 16

/** Лента выдач: десктоп — 3 карточки + край 4-й, планшет — 2 + край, телефон — 1 + край. По клику — лайтбокс. */
function Gallery() {
  const { ref, edge, step, onKeyDown } = useCarousel(GAP)
  const [open, setOpen] = useState(null)
  return (
    <div className="mt-12 md:mt-16">
      <div className="flex items-end justify-between gap-4">
        <h3 className="text-2xl md:text-3xl">Выдачи клиентам</h3>
        <div className="flex gap-2">
          <ArrowButton dir="prev" label="Предыдущие фото выдач" onClick={() => step(-1)} disabled={edge.start} />
          <ArrowButton dir="next" label="Следующие фото выдач" onClick={() => step(1)} disabled={edge.end} />
        </div>
      </div>
      <Reveal base="gal" className="mt-5">
        <ul
          ref={ref}
          className="gallery strip flex overflow-x-auto"
          style={{ gap: GAP }}
          tabIndex={0}
          onKeyDown={onKeyDown}
          aria-label="Фото передачи машин клиентам, листается стрелками ← →"
        >
          {PHOTOS.map((p, n) => (
            <li key={p.key} className="gal-item" style={{ '--i': Math.min(n, 4) }}>
              <button type="button" className="gal-card" onClick={() => setOpen(n)} aria-label={`Открыть фото: ${p.alt}`}>
                <picture>
                  {photoAvif(p.key) && <source type="image/avif" srcSet={photoAvif(p.key)} sizes="(max-width: 640px) 84vw, (max-width: 1024px) 44vw, 400px" />}
                  <img {...photoProps(p.key, '(max-width: 640px) 84vw, (max-width: 1024px) 44vw, 400px')} alt={p.alt} loading="lazy" decoding="async" />
                </picture>
              </button>
            </li>
          ))}
        </ul>
      </Reveal>
      <Lightbox items={LARGE} index={open} onChange={setOpen} label="Фото выдач" />
    </div>
  )
}

export default function Trust() {
  const t = COPY.trust
  return (
    <section id="trust" className="border-b border-line">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 md:py-24">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-7">
            <p className="kicker">{t.kicker}</p>
            <h2 className="h-section mt-4">{t.title}</h2>
            <p className="mt-4 text-lg text-muted">{t.sub}</p>
          </Reveal>
          <Reveal className="lg:col-span-5" delay={100}>
            <ul className="flex flex-wrap gap-2 text-sm">
              <li className="rounded-full border border-line px-3 py-1.5 text-muted">{LEGAL.entityShort}</li>
              <li className="rounded-full border border-line px-3 py-1.5 text-muted">ИНН {LEGAL.inn}</li>
              <li>
                <a href={LINKS.offer} target="_blank" rel="noopener" className="inline-block rounded-full border border-line px-3 py-1.5 text-text underline-offset-4 hover:border-text hover:underline">
                  Публичная оферта
                </a>
              </li>
            </ul>
          </Reveal>
        </div>

        <DealCase />
        <Gallery />
      </div>
    </section>
  )
}
