import CtaButton from '../components/CtaButton.jsx'
import Icon from '../components/Icon.jsx'
import Reveal from '../components/Reveal.jsx'
import Todo from '../components/Todo.jsx'
import { COPY, LINKS } from '../content/copy.js'

function List({ items }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((it) => (
        <li key={it} className="flex gap-3">
          <Icon name="check" size={20} className="mt-0.5 shrink-0 text-accent" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  )
}

export default function Pricing({ track }) {
  const p = COPY.pricing
  return (
    <section id="pricing" className="border-b border-line">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 md:py-24">
        <Reveal>
          <h2 className="kicker">{p.kicker}</h2>
        </Reveal>
        <div className="mt-8 grid gap-4 md:mt-12 md:grid-cols-2 md:gap-5">
          <Reveal className="flex flex-col rounded-xl border border-line bg-surface p-6 md:p-8">
            <h3 className="text-2xl">{p.free.name}</h3>
            <p className="num mt-3 text-5xl">{p.free.price}</p>
            <List items={p.free.items} />
            <span className="block h-8" aria-hidden="true" />
            <CtaButton href={LINKS.channel} goal="cta_pricing_free" variant="ghost" className="mt-auto">
              {track ? p.free.ctaTrack : p.free.cta}
            </CtaButton>
          </Reveal>
          <Reveal className="relative flex flex-col rounded-xl border-2 border-accent bg-[color-mix(in_oklab,var(--color-accent)_7%,var(--color-surface))] p-6 shadow-[0_0_60px_-20px_var(--color-accent)] md:p-8" delay={100}>
            <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent-ink">{p.paid.badge}</span>
            <h3 className="text-2xl">{p.paid.name}</h3>
            <p className="mt-3 flex items-baseline gap-3">
              <span className="num text-5xl">{p.paid.price}</span>
              <Todo value={p.paid.period} className="text-muted" />
            </p>
            <List items={p.paid.items} />
            <CtaButton href={LINKS.paidBot} goal="cta_paid" icon="lock" className="mt-8">
              {p.paid.cta}
            </CtaButton>
            <p className="mt-3 text-muted">{p.paid.note}</p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
