import CtaButton from '../components/CtaButton.jsx'
import Icon from '../components/Icon.jsx'
import Reveal from '../components/Reveal.jsx'
import Todo from '../components/Todo.jsx'
import { LINKS } from '../content/copy.js'
import { photoProps } from '../lib/images.js'

export default function TrackDetail({ track }) {
  return (
    <section id="track" className="border-b border-line">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 md:py-24">
        <Reveal>
          <p className="kicker">Что получишь</p>
          <h2 className="h-section mt-4 max-w-[16ch]">{track.benefitsTitle}</h2>
        </Reveal>

        <ul className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line md:mt-12 md:grid-cols-4">
          {track.benefits.map((b, i) => (
            <Reveal as="li" key={b.title} delay={i * 70} className="flex flex-col gap-4 bg-bg p-4 sm:p-6">
              <Icon name={b.icon} size={28} className="text-accent" />
              <p className="text-[0.95rem] font-semibold leading-snug sm:text-lg">{b.title}</p>
            </Reveal>
          ))}
        </ul>

        <div className="mt-14 grid gap-10 md:mt-20 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <h3 className="text-3xl md:text-4xl">{track.stepsTitle}</h3>
            <ol className="rail mt-6 space-y-5">
              {track.roadmap && (
                <span className="rail-track" aria-hidden="true">
                  <span className="rail-dot" />
                </span>
              )}
              {track.steps.map((s, i) => (
                <li key={s} className="relative flex items-center gap-4">
                  <span className="num relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line-strong bg-bg text-[0.7rem] text-accent">
                    {i + 1}
                  </span>
                  <span className="text-lg font-semibold">{s}</span>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal as="figure" className="overflow-hidden rounded-xl border border-line bg-surface" delay={100}>
            <div className="aspect-[4/3] overflow-hidden">
              <img {...photoProps(track.case.photo, '(max-width: 1024px) 92vw, 560px')} alt="Передача машины клиенту" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </div>
            <figcaption className="flex flex-col gap-2 p-5">
              <span className="kicker">Кейс</span>
              <span className="text-lg font-semibold">Реальная передача машины клиенту</span>
              <Todo value={track.case.facts} />
            </figcaption>
          </Reveal>
        </div>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          <CtaButton href={LINKS.channel} goal={track.goal}>
            {track.cta}
          </CtaButton>
          {track.paidCta && (
            <CtaButton href={LINKS.paidBot} goal="cta_paid" variant="ghost" icon="lock">
              {track.paidCta}
            </CtaButton>
          )}
        </div>
      </div>
    </section>
  )
}
