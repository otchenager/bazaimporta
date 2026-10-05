import { useEffect, useRef, useState } from 'react'
import ArrowButton from '../components/ArrowButton.jsx'
import Icon from '../components/Icon.jsx'
import Reveal from '../components/Reveal.jsx'
import { COPY } from '../content/copy.js'
import { mediaProps, mediaUrl } from '../lib/media.js'

// Только Huracán: фото передачи и два ролика AUTOLINE (перед и салон, обход кузова). Другие сделки — в ленте выдач (Trust).
const SLIDES = [
  { type: 'photo', name: 'handshake', thumb: 'handshake', alt: 'Передача белого Lamborghini Huracán клиенту: рукопожатие у машины' },
  { type: 'video', name: 'huracan-front', thumb: 'huracan-front-thumb', alt: 'Видео: Lamborghini Huracán — перед и салон' },
  { type: 'video', name: 'huracan-walk', thumb: 'huracan-walk-thumb', alt: 'Видео: Lamborghini Huracán — обход кузова' },
]
// До трёх миниатюр — все видны целиком, стрелки под фото не нужны (листать: миниатюры, свайп по фото, ← → на ленте)
const FIT = SLIDES.length <= 3

function Main({ slide, onSwipe }) {
  const start = useRef(null)
  const down = (e) => {
    start.current = { x: e.clientX, y: e.clientY }
  }
  const up = (e) => {
    const s = start.current
    start.current = null
    if (!s) return
    const dx = e.clientX - s.x
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - s.y)) onSwipe(dx < 0 ? 1 : -1)
  }
  return (
    <div className="deal-frame relative overflow-hidden rounded-xl border border-line bg-black" onPointerDown={down} onPointerUp={up} onPointerCancel={() => (start.current = null)}>
      {slide.type === 'video' ? (
        <video
          key={slide.name}
          className="absolute inset-0 h-full w-full object-contain"
          src={mediaUrl(slide.name, 'mp4')}
          poster={mediaUrl(`${slide.name}-poster`, '480')}
          controls
          playsInline
          preload="none"
          aria-label={slide.alt}
        />
      ) : (
        <img
          key={slide.name}
          {...mediaProps(slide.name, '(max-width: 1024px) 92vw, 720px', [4, 3])}
          alt={slide.alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  )
}

export default function DealCase() {
  const d = COPY.deal
  const [i, setI] = useState(0)
  const thumbs = useRef(null)
  const go = (n) => setI((cur) => (cur + n + SLIDES.length) % SLIDES.length)

  useEffect(() => {
    const el = thumbs.current?.children[i]
    // прокручиваем только ленту, не страницу
    if (!el || !thumbs.current) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const strip = thumbs.current
    strip.scrollTo({ left: el.offsetLeft - strip.offsetLeft - (strip.clientWidth - el.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' })
  }, [i])

  return (
    <div className="deal mt-10 grid gap-4 md:mt-14 lg:grid-cols-12 lg:gap-5">
      <Reveal className="deal-main min-w-0 lg:col-span-7">
        <Main slide={SLIDES[i]} onSwipe={go} />
      </Reveal>

      <Reveal as="aside" delay={100} className="flex min-w-0 flex-col rounded-xl border border-line bg-surface p-5 sm:p-8 lg:col-span-5" aria-label={`${d.kicker}: ${d.title}`}>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">{d.kicker}</p>
        <h3 className="mt-3 text-[2rem] sm:text-5xl">{d.title}</h3>
        <dl className="mt-6 text-base">
          {d.specs.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 first:border-t">
              <dt className={v ? 'text-muted' : 'text-text'}>{k}</dt>
              {v ? <dd className="font-semibold">{v}</dd> : <dd><Icon name="check" size={18} className="text-accent" /><span className="sr-only">да</span></dd>}
            </div>
          ))}
        </dl>
        <dl className="mt-5 text-base">
          {d.money.map(([k, v, main]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 first:border-t">
              <dt className="text-muted">{k}</dt>
              <dd className={main ? 'num whitespace-nowrap text-xl text-text sm:text-2xl' : 'num whitespace-nowrap text-lg text-text/80'}>{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-auto pt-6">
          <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-lg bg-accent px-4 py-4 text-accent-ink sm:px-5">
            <span className="font-display text-lg font-bold uppercase tracking-wide">{d.profit[0]}</span>
            <span className="num whitespace-nowrap text-[1.7rem] sm:text-3xl">{d.profit[1]}</span>
          </p>
        </div>
      </Reveal>

      <div className="flex min-w-0 items-center gap-2 lg:col-span-7">
        {!FIT && <ArrowButton dir="prev" label="Предыдущее фото" onClick={() => go(-1)} />}
        <ul
          ref={thumbs}
          className="strip flex min-w-0 flex-1 gap-2 overflow-x-auto p-1"
          aria-label="Фото и видео сделки, ← → листают"
          onKeyDown={(e) => {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
            e.preventDefault()
            const n = (i + (e.key === 'ArrowLeft' ? -1 : 1) + SLIDES.length) % SLIDES.length
            setI(n)
            thumbs.current?.children[n]?.querySelector('button')?.focus()
          }}
        >
          {SLIDES.map((s, n) => (
            <li key={s.name} className={`shrink-0 ${FIT ? 'w-[calc((100%-1rem)/3)]' : 'w-[calc((100%-1rem)/2.5)] sm:w-[calc((100%-1.5rem)/3.5)] lg:w-[calc((100%-2rem)/4.5)]'}`}>
              <button
                type="button"
                onClick={() => setI(n)}
                aria-label={s.type === 'video' ? `Показать: ${s.alt}` : `Показать фото: ${s.alt}`}
                aria-current={n === i ? 'true' : undefined}
                className={`thumb relative block aspect-[4/3] w-full overflow-hidden rounded-lg border-2 ${n === i ? 'border-accent' : 'border-transparent opacity-70 hover:opacity-100'}`}
              >
                <img {...mediaProps(s.thumb, '160px', [4, 3])} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                {s.type === 'video' && (
                  <span className="absolute inset-0 grid place-items-center bg-black/30" aria-hidden="true">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white">
                      <Icon name="play" size={16} />
                    </span>
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
        {!FIT && <ArrowButton dir="next" label="Следующее фото" onClick={() => go(1)} />}
      </div>
    </div>
  )
}
