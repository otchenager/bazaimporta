import { Link } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import Reveal from '../components/Reveal.jsx'
import { COPY } from '../content/copy.js'
import { TRACKS } from '../content/tracks.js'
import { photoProps } from '../lib/images.js'

function tilt(e) {
  if (e.pointerType !== 'mouse') return
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height
  el.style.setProperty('--ry', `${(x - 0.5) * 8}deg`)
  el.style.setProperty('--rx', `${(0.5 - y) * 6}deg`)
  el.style.setProperty('--gx', `${x * 100}%`)
  el.style.setProperty('--gy', `${y * 100}%`)
}
function untilt(e) {
  e.currentTarget.style.setProperty('--rx', '0deg')
  e.currentTarget.style.setProperty('--ry', '0deg')
}

export default function TrackPicker({ activeId }) {
  return (
    <section id="tracks" className="border-b border-line bg-bg-alt">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 md:py-24">
        <Reveal>
          <p className="kicker">{COPY.picker.kicker}</p>
          <h2 className="h-section mt-4">{COPY.picker.title}</h2>
        </Reveal>
        <ul className="mt-8 grid gap-3 md:mt-12 md:grid-cols-3 md:gap-5">
          {TRACKS.map((t, i) => {
            const active = t.id === activeId
            return (
              <Reveal as="li" key={t.id} delay={i * 80}>
                <Link
                  to={t.slug}
                  state={{ scrollTo: 'track' }}
                  onPointerMove={tilt}
                  onPointerLeave={untilt}
                  aria-current={active ? 'page' : undefined}
                  className={`tilt group relative flex overflow-hidden rounded-xl border bg-surface md:block ${
                    active ? 'border-accent' : 'border-line hover:border-line-strong'
                  }`}
                >
                  <div className="relative w-28 shrink-0 overflow-hidden sm:w-36 md:aspect-[4/5] md:w-full">
                    <img {...photoProps(t.photo, '(max-width: 768px) 144px, 400px')} alt={t.photoAlt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 hidden bg-[linear-gradient(to_top,#0a0a0a_8%,transparent_60%)] md:block" aria-hidden="true" />
                  </div>
                  <div className="flex flex-1 flex-col justify-center gap-1.5 p-4 md:absolute md:inset-x-0 md:bottom-0 md:p-6">
                    <span className="num text-[0.7rem] tracking-[0.2em] text-accent">0{i + 1}</span>
                    <h3 className="text-2xl md:text-4xl">{t.label}</h3>
                    <p className="text-sm leading-snug text-muted md:text-base md:text-text/80">«{t.pain}»</p>
                    <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                      {active ? 'Ты здесь' : COPY.picker.cta}
                      <Icon name="arrow" size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                  <span className="glare" aria-hidden="true" />
                </Link>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
