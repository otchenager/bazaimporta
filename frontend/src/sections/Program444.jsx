import ArrowButton from '../components/ArrowButton.jsx'
import CtaButton from '../components/CtaButton.jsx'
import Icon from '../components/Icon.jsx'
import Reveal from '../components/Reveal.jsx'
import { COPY, LINKS } from '../content/copy.js'
import { mediaProps } from '../lib/media.js'
import useCarousel from '../lib/useCarousel.js'

/** Карусель превью из закрытого канала: свайп — нативный scroll-snap, стрелки листают по одному кадру. */
export function ProgramCarousel() {
  const p = COPY.program
  const { ref: track, edge, step } = useCarousel(12)

  return (
    <div className="relative">
      <ul ref={track} className="strip flex gap-3 overflow-x-auto" aria-label={p.title}>
        {p.slides.map((s) => (
          <li key={s.img} className="w-[86%] shrink-0">
            <figure>
              <div className="overflow-hidden rounded-xl border border-line bg-black">
                <img {...mediaProps(s.img, '(max-width: 1024px) 80vw, 480px', [2, 1])} alt={s.img === "markets" ? "Страница текстового разбора рынков" : "Кадр из видеоурока закрытого канала"} loading="lazy" decoding="async" className="aspect-[2/1] w-full object-cover" />
              </div>
              <figcaption className="mt-3 text-base leading-snug text-text/85">{s.caption}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex gap-2">
        <ArrowButton dir="prev" label="Предыдущий материал" onClick={() => step(-1)} disabled={edge.start} />
        <ArrowButton dir="next" label="Следующий материал" onClick={() => step(1)} disabled={edge.end} />
      </div>
    </div>
  )
}

/** Блок 444: что внутри закрытого канала — список и цена. Карусель стоит рядом с дорожной картой (TrackDetail). */
export default function ProgramDetails({ track }) {
  const p = COPY.program
  return (
    <div className="mt-14 border-t border-line pt-12 md:mt-20 md:pt-16">
      <Reveal>
        <h3 className="text-3xl md:text-4xl">{p.listTitle}</h3>
      </Reveal>
      <ul className="mt-8 grid gap-x-10 gap-y-6 md:grid-cols-2">
        {p.items.map((it, i) => (
          <Reveal as="li" key={it.title} delay={(i % 2) * 60} className="flex gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line bg-surface text-accent">
              <Icon name={it.icon} size={22} />
            </span>
            <p className="leading-snug">
              <strong className="block font-semibold text-text">{it.title}</strong>
              {it.text && <span className="mt-1 block text-base text-muted">{it.text}</span>}
            </p>
          </Reveal>
        ))}
      </ul>

      <Reveal className="mt-12 grid gap-6 rounded-xl border border-accent/60 bg-surface p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-end md:gap-10">
        <div>
          <p className="max-w-[46ch] text-lg leading-snug sm:text-xl">{p.goal}</p>
          <p className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="num text-4xl sm:text-5xl">{p.price}</span>
            <span className="text-muted">
              {p.priceNote} <strong className="whitespace-nowrap font-semibold text-accent">{p.priceLow}</strong>
            </span>
          </p>
        </div>
        <CtaButton href={LINKS.boris} goal={`cta_exclusive_${track.id}`} className="w-full md:w-auto">
          {COPY.exclusive.cta}
        </CtaButton>
      </Reveal>
    </div>
  )
}
