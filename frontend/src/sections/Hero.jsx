import CtaButton from '../components/CtaButton.jsx'
import Icon from '../components/Icon.jsx'
import HeroVideo from '../visual/HeroVideo.jsx'
import { COPY, LINKS } from '../content/copy.js'
import { track as reachGoal } from '../lib/analytics.js'

export default function Hero({ track }) {
  const h = COPY.hero
  const kicker = track ? `Трек · ${track.label}` : h.kicker
  return (
    <section id="hero" className="relative overflow-hidden border-b border-line">
      <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl gap-5 px-4 pb-10 pt-5 sm:gap-8 sm:px-8 sm:pt-7 md:pb-16 md:pt-20 lg:grid-cols-12 lg:items-center lg:gap-x-10">
        <div className="relative z-10 lg:col-span-7">
          <p className="kicker">{kicker}</p>
          {track ? (
            <h1 className="h-section mt-6 max-w-[15ch]">{track.h1 ?? track.title}</h1>
          ) : (
            <h1 className="h-display mt-4 sm:mt-6">
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
            <p className="mt-4 max-w-[38ch] leading-snug text-muted sm:mt-6 sm:text-xl">{track ? track.promise : h.sub}</p>
          )}
          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">
            {track ? (
              <CtaButton href={LINKS.boris} goal={`cta_exclusive_${track.id}`} className="w-full sm:w-auto">
                {COPY.exclusive.cta}
              </CtaButton>
            ) : (
              <CtaButton href={LINKS.boris} goal="cta_hero" className="w-full sm:w-auto">
                {h.cta}
              </CtaButton>
            )}
            {/* вторичная кнопка — к лид-форме (плавный скролл: scroll-behavior в index.css) */}
            <a href="#lead" className="btn btn-ghost w-full sm:w-auto" data-goal="lead_cta_hero" onClick={() => reachGoal('lead_cta_hero')}>
              <span>{h.consult}</span>
              <Icon name="down" size={18} className="arrow" />
            </a>
          </div>
        </div>

        {/* на телефоне видео — под заголовком и кнопками: оффер и CTA остаются в первом экране и читаются без подложки */}
        <HeroVideo
          alt={h.videoAlt}
          film={h.film}
          pauseLabel={h.pauseLabel}
          playLabel={h.playLabel}
          className="aspect-video lg:col-span-5 lg:aspect-[4/3] xl:aspect-[16/11]"
        />

        <p className="border-t border-line pt-6 font-display text-2xl font-bold uppercase leading-tight sm:text-4xl lg:col-span-12">
          {h.team.split('200+')[0]}
          <span className="text-accent">200+</span>
          {h.team.split('200+')[1]}
        </p>
      </div>
    </section>
  )
}
