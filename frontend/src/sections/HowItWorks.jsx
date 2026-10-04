import Reveal from '../components/Reveal.jsx'
import { COPY } from '../content/copy.js'

export default function HowItWorks() {
  const h = COPY.how
  return (
    <section id="how" className="border-b border-line bg-bg-alt">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 md:py-24">
        <Reveal>
          <p className="kicker">{h.kicker}</p>
          <h2 className="h-section mt-4">{h.title}</h2>
        </Reveal>
        <ol className="mt-8 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:mt-12 md:grid-cols-3">
          {h.steps.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 90} className="flex items-baseline gap-5 bg-bg-alt p-5 md:flex-col md:gap-8 md:p-8">
              <span className="num w-14 shrink-0 text-5xl text-accent md:w-auto md:text-7xl">0{i + 1}</span>
              <span>
                <span className="block text-xl font-semibold md:text-2xl">{s.title}</span>
                <span className="mt-1 block text-muted">{s.text}</span>
              </span>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
