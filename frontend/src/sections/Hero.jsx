import CtaButton from '../components/CtaButton.jsx'
import Icon from '../components/Icon.jsx'
import HeroCar from '../visual/HeroCar.jsx'
import { COPY, LINKS } from '../content/copy.js'

export default function Hero({ track }) {
  const h = COPY.hero
  const kicker = track ? `Трек · ${track.label}` : h.kicker
  return (
    <section id="hero" className="relative overflow-hidden border-b border-line">
      <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl gap-6 px-4 pb-10 pt-10 sm:px-8 md:pb-16 md:pt-20 lg:grid-cols-12 lg:items-center">
        <div className="relative z-10 lg:col-span-6">
          <p className="kicker">{kicker}</p>
          {track ? (
            <h1 className="h-section mt-5 max-w-[14ch]">{track.title}</h1>
          ) : (
            <h1 className="h-display mt-5">
              {h.title.map((line, i) => (
                <span key={line} className={`block lg:whitespace-nowrap ${i === 2 ? 'text-accent' : ''}`}>
                  {line}
                </span>
              ))}
            </h1>
          )}
          <p className="mt-5 max-w-[34ch] text-lg leading-snug text-muted sm:text-xl">{track ? track.promise : h.sub}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <CtaButton href={LINKS.channel} goal="cta_hero" className="w-full sm:w-auto">
              {h.cta}
            </CtaButton>
            <a href={track ? '#track' : '#tracks'} className="btn btn-ghost w-full sm:w-auto">
              <span>{track ? 'Что получишь' : h.secondary}</span>
              <Icon name="down" size={18} className="arrow" />
            </a>
          </div>
        </div>

        <div className="relative -mx-4 aspect-[1000/400] sm:mx-0 lg:col-span-6 lg:-mr-16 lg:aspect-[1000/520]">
          <HeroCar label={h.carLabel} />
        </div>

        <dl className="grid grid-cols-3 gap-4 border-t border-line pt-6 lg:col-span-12 lg:max-w-2xl">
          {h.stats.map((s) => (
            <div key={s.label}>
              <dt className="sr-only">{s.label}</dt>
              <dd className="num text-3xl sm:text-5xl">{s.value}</dd>
              <dd className="mt-1 text-xs leading-tight text-muted sm:text-sm">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
