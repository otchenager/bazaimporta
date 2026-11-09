import CtaButton from '../components/CtaButton.jsx'
import HeroVideo from '../visual/HeroVideo.jsx'
import Icon from '../components/Icon.jsx'
import { APP_URL, COPY, LINKS } from '../content/copy.js'
import { track as trackGoal } from '../lib/analytics.js'

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
                <span key={line} className={`block lg:whitespace-nowrap ${i === h.accentLine ? 'text-accent' : ''}`}>
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
            <p className={`mt-4 leading-snug text-muted sm:mt-6 sm:text-xl ${track ? 'max-w-[38ch]' : 'max-w-[48ch]'}`}>{track ? track.promise : h.sub}</p>
          )}
          {track ? (
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">
              <CtaButton href={LINKS.app} goal={`cta_exclusive_${track.id}`} className="w-full sm:w-auto">
                {COPY.exclusive.cta}
              </CtaButton>
              <p className="flex items-center justify-center gap-2 font-semibold text-accent sm:justify-start">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                {h.freeNote}
              </p>
            </div>
          ) : (
            <ul className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2">
              {h.choices.map((c) => (
                <li key={c.id}>
                  <a
                    href={`${APP_URL}${c.path}`}
                    target="_blank"
                    rel="noopener"
                    onClick={() => trackGoal(c.goal)}
                    data-goal={c.goal}
                    className="hero-choice group flex h-full flex-col gap-1.5 rounded-xl border border-line bg-surface p-5 transition-colors hover:border-accent focus-visible:border-accent"
                  >
                    <span className="num text-[0.7rem] uppercase tracking-[0.2em] text-accent">{c.kicker}</span>
                    <span className="font-display text-2xl font-bold uppercase leading-tight">{c.title}</span>
                    <span className="leading-snug text-muted">{c.text}</span>
                    {c.note && <span className="mt-1 text-sm font-semibold text-accent">{c.note}</span>}
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-3 font-semibold text-accent">
                      {c.cta}
                      <Icon name="arrow" size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* на телефоне видео — под заголовком и кнопками: оффер и CTA остаются в первом экране и читаются без подложки */}
        <HeroVideo
          alt={h.videoAlt}
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
