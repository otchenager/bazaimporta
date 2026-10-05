import { Link } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import Reveal from '../components/Reveal.jsx'
import { COPY } from '../content/copy.js'
import { TRACKS } from '../content/tracks.js'
import { track as trackGoal } from '../lib/analytics.js'
import { photoProps } from '../lib/images.js'

/**
 * Карточки «Кто ты?». В покое — фото и название; при наведении фото тускнеет, поверх проявляются подзаголовок и стрелка.
 * На тач-экранах ховера нет — подзаголовок виден всегда поверх затемнения (см. .track-card в index.css).
 * Телефон (< 640 px): фото сверху (16:10, кадр по лицам — photoPos), текст под ним на сплошном фоне — не перекрывает людей.
 */
export default function TrackPicker({ activeId }) {
  return (
    <section id="tracks" className="border-b border-line bg-bg-alt">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 md:py-24">
        <Reveal>
          <p className="kicker">{COPY.picker.kicker}</p>
          <h2 className="h-section mt-4">{COPY.picker.title}</h2>
        </Reveal>
        <ul className="mt-8 grid gap-3 sm:grid-cols-3 md:mt-12 md:gap-5">
          {TRACKS.map((t, i) => {
            const active = t.id === activeId
            return (
              <Reveal as="li" key={t.id} delay={i * 80}>
                <Link
                  to={t.slug}
                  state={{ scrollTo: 'track' }}
                  onClick={() => trackGoal(t.goal)}
                  data-goal={t.goal}
                  aria-current={active ? 'page' : undefined}
                  className={`track-card group relative flex flex-col overflow-hidden rounded-xl border bg-surface sm:block sm:aspect-[4/5] ${
                    active ? 'border-accent' : 'border-line hover:border-line-strong'
                  }`}
                >
                  <img
                    {...photoProps(t.photo, '(max-width: 640px) 92vw, 400px')}
                    alt={t.photoAlt}
                    loading="lazy"
                    decoding="async"
                    style={{ objectPosition: t.photoPos }}
                    className="track-photo aspect-[16/10] w-full object-cover sm:absolute sm:inset-0 sm:aspect-auto sm:h-full"
                  />
                  <div className="track-shade absolute inset-0 max-sm:hidden" aria-hidden="true" />
                  <div className="flex flex-col gap-1.5 p-5 sm:absolute sm:inset-x-0 sm:bottom-0 md:p-6">
                    <span className="num text-[0.7rem] tracking-[0.2em] text-accent">0{i + 1}</span>
                    <h3 className="text-3xl md:text-4xl">{t.label}</h3>
                    <div className="track-more">
                      <p className="text-base leading-snug text-text/90 md:text-lg">{t.pain}</p>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                        {active ? 'Ты здесь' : COPY.picker.cta}
                        <Icon name="arrow" size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
