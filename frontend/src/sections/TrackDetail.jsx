import Icon from '../components/Icon.jsx'
import Reveal from '../components/Reveal.jsx'
import ProgramDetails, { ProgramCarousel } from './Program444.jsx'
import SupplierChat from './SupplierChat.jsx'
import { COPY } from '../content/copy.js'

// 4 пункта — в ряд, 5 — 3 + 2 на широком экране
const SPAN5 = ['lg:col-span-2', 'lg:col-span-2', 'lg:col-span-2', 'lg:col-span-3', 'lg:col-span-3']

function Points({ track }) {
  const five = track.points.length === 5
  return (
    <>
      <Reveal>
        <h2 className="text-3xl md:text-4xl">{COPY.director}</h2>
      </Reveal>
      <ul className={`mt-8 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:mt-10 md:grid-cols-2 ${five ? 'lg:grid-cols-6' : 'lg:grid-cols-4'}`}>
        {track.points.map((b, i) => (
          <Reveal as="li" key={b.title} delay={i * 70} className={`flex flex-col gap-4 bg-bg p-5 sm:p-6 ${five ? SPAN5[i] : ''} ${five && i === 4 ? 'md:col-span-2' : ''}`}>
            <Icon name={b.icon} size={28} className="text-accent" />
            <p className="leading-snug">
              <strong className="block text-lg font-semibold">{b.title}</strong>
              <span className="mt-1.5 block text-muted">{b.text}</span>
            </p>
          </Reveal>
        ))}
      </ul>
    </>
  )
}

function Benefits({ track }) {
  return (
    <>
      <Reveal>
        <p className="kicker">Что получишь</p>
        <h2 className="h-section mt-4 max-w-[16ch]">{track.benefitsTitle}</h2>
      </Reveal>
      <ul className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line md:mt-12 md:grid-cols-4">
        {track.benefits.map((b, i) => (
          <Reveal as="li" key={b.title} delay={i * 70} className="flex flex-col gap-4 bg-bg p-4 sm:p-6">
            <Icon name={b.icon} size={28} className="text-accent" />
            <p className="text-base font-semibold leading-snug sm:text-lg">{b.title}</p>
          </Reveal>
        ))}
      </ul>
    </>
  )
}

/**
 * Блок трека: пункты → [шаги трека | карусель «Что внутри закрытого канала»] → «Внутри тебя ждут» с ценой и CTA.
 * Карусель и «Внутри тебя ждут» — общие для всех треков (Program444.jsx, данные — COPY.program).
 * Под шагами «Есть опыт» — скриншот переписки с поставщиком (track.chat).
 * На мобильном колонки складываются: шаги → [переписка] → карусель → список → цена и CTA.
 */
export default function TrackDetail({ track }) {
  return (
    <section id="track" className="border-b border-line">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 md:py-24">
        {track.points ? <Points track={track} /> : <Benefits track={track} />}

        <div className="mt-14 grid gap-12 md:mt-20 lg:grid-cols-2 lg:gap-16">
          <div className="min-w-0">
            <Reveal>
              <h3 className="text-3xl md:text-4xl">{track.stepsTitle}</h3>
              <ol className="rail mt-6 space-y-5">
                {track.roadmap && (
                  <span className="rail-track" aria-hidden="true">
                    <span className="rail-dot" />
                  </span>
                )}
                {track.steps.map((s, i) => (
                  <li key={s.text ?? s} className="relative flex items-center gap-4">
                    <span
                      className={`num relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[0.7rem] ${s.accent ? 'border-accent bg-accent text-accent-ink' : 'border-line-strong bg-bg text-accent'}`}
                    >
                      {i + 1}
                    </span>
                    {s.accent ? (
                      <span className="text-lg font-semibold">
                        {s.text} <span className="num whitespace-nowrap text-2xl text-accent">{s.accent}</span>
                      </span>
                    ) : (
                      <span className="text-lg font-semibold">{s}</span>
                    )}
                  </li>
                ))}
              </ol>
            </Reveal>
            {track.chat && (
              <Reveal delay={150}>
                <SupplierChat chat={track.chat} />
              </Reveal>
            )}
          </div>

          <Reveal delay={100} className="min-w-0">
            <h3 className="text-3xl md:text-4xl">{COPY.program.title}</h3>
            <p className="mt-3 text-muted">{COPY.program.sub}</p>
            <div className="mt-6">
              <ProgramCarousel />
            </div>
          </Reveal>
        </div>

        <ProgramDetails track={track} />
      </div>
    </section>
  )
}
