import Reveal from '../components/Reveal.jsx'
import Todo, { hasValue } from '../components/Todo.jsx'
import { COPY, LEGAL, LINKS } from '../content/copy.js'
import { ALL_PHOTOS, photoProps } from '../lib/images.js'

const STRIP = ALL_PHOTOS.filter((k) => k !== 'lamb')

export default function Trust() {
  const t = COPY.trust
  return (
    <section id="trust" className="border-b border-line">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 md:py-24">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-7">
            <p className="kicker">{t.kicker}</p>
            <h2 className="h-section mt-4">{t.title}</h2>
            <p className="mt-4 text-lg text-muted">{t.sub}</p>
          </Reveal>
          <Reveal className="lg:col-span-5" delay={100}>
            <ul className="flex flex-wrap gap-2 text-sm">
              <li className="rounded-full border border-line px-3 py-1.5 text-muted">{LEGAL.entityShort}</li>
              <li className="rounded-full border border-line px-3 py-1.5 text-muted">ИНН {LEGAL.inn}</li>
              <li>
                <a href={LINKS.offer} target="_blank" rel="noopener" className="inline-block rounded-full border border-line px-3 py-1.5 text-text underline-offset-4 hover:border-text hover:underline">
                  Публичная оферта
                </a>
              </li>
            </ul>
          </Reveal>
        </div>

        <div className="mt-10 grid gap-4 md:mt-14 lg:grid-cols-12">
          <Reveal as="figure" className="relative overflow-hidden rounded-xl border border-line lg:col-span-7">
            <img {...photoProps('lamb', '(max-width: 1024px) 92vw, 720px')} alt="Белый Lamborghini Huracán на передаче клиенту" loading="lazy" decoding="async" className="aspect-[4/3] h-full w-full object-cover" />
            <figcaption className="absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,#0a0a0aee,transparent)] p-5 pt-16 text-base font-semibold">{t.featured}</figcaption>
          </Reveal>
          <Reveal className="flex flex-col justify-end gap-3 rounded-xl border border-line bg-surface p-6 lg:col-span-5" delay={100}>
            <p className="kicker">{t.founder.role}</p>
            {hasValue(t.founder.name) && <Todo value={t.founder.name} className="font-display text-3xl uppercase" />}
            <Todo value={t.founder.line} as="p" className="text-muted" />
            <p className="num text-6xl text-accent">200+</p>
            <p className="text-muted">машин привезено</p>
          </Reveal>
        </div>

        <div className="strip -mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:px-8" tabIndex={0} aria-label="Фото передачи машин клиентам, листается вбок">
          {STRIP.map((k) => (
            <img
              key={k}
              {...photoProps(k, '220px')}
              alt="Передача машины клиенту"
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] w-[44vw] max-w-[220px] shrink-0 rounded-lg border border-line object-cover"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
