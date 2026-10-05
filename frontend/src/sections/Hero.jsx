import CtaButton from '../components/CtaButton.jsx'
import Icon from '../components/Icon.jsx'
import HandshakeArt from '../visual/HandshakeArt.jsx'
import { COPY, LINKS } from '../content/copy.js'

export default function Hero({ track }) {
  const h = COPY.hero
  const kicker = track ? `Трек · ${track.label}` : h.kicker
  return (
    <section id="hero" className="relative overflow-hidden border-b border-line">
      <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-10 pt-7 sm:px-8 md:pb-16 md:pt-20 lg:grid-cols-12 lg:items-center lg:gap-x-10">
        <div className="relative z-10 lg:col-span-7">
          <p className="kicker">{kicker}</p>
          {track ? (
            <h1 className="h-section mt-6 max-w-[15ch]">{track.h1 ?? track.title}</h1>
          ) : (
            <h1 className="h-display mt-6">
              {h.title.map((line, i) => (
                <span key={line} className={`block lg:whitespace-nowrap ${i === 2 ? 'text-accent' : ''}`}>
                  {line}
                </span>
              ))}
            </h1>
          )}
          {track?.sub ? (
            <>
              <p className="mt-6 max-w-[30ch] text-xl font-semibold leading-snug sm:text-2xl">{track.sub}</p>
              <p className="mt-4 max-w-[52ch] leading-relaxed text-muted sm:text-lg">{track.lead}</p>
            </>
          ) : (
            <p className="mt-6 max-w-[38ch] text-lg leading-snug text-muted sm:text-xl">{track ? track.promise : h.sub}</p>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            {track ? (
              <CtaButton href={LINKS.boris} goal={`cta_exclusive_${track.id}`} className="w-full sm:w-auto">
                {COPY.exclusive.cta}
              </CtaButton>
            ) : (
              <CtaButton href={LINKS.channel} goal="cta_hero" className="w-full sm:w-auto">
                {h.cta}
              </CtaButton>
            )}
            <a href={track ? '#track' : '#tracks'} className="btn btn-ghost w-full sm:w-auto">
              <span>{track ? 'Что получишь' : h.secondary}</span>
              <Icon name="down" size={18} className="arrow" />
            </a>
          </div>
        </div>

        <div className="relative -mx-2 aspect-[670/510] sm:mx-auto sm:w-4/5 lg:col-span-5 lg:-ml-8 lg:-mr-12 lg:w-auto xl:-mr-20">
          <HandshakeArt label={h.artLabel} className="absolute inset-0" />
        </div>

        <p className="border-t border-line pt-6 font-display text-2xl font-bold uppercase leading-tight sm:text-4xl lg:col-span-12">
          {h.team.split('200+')[0]}
          <span className="text-accent">200+</span>
          {h.team.split('200+')[1]}
        </p>
      </div>
    </section>
  )
}
