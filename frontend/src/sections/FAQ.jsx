import Icon from '../components/Icon.jsx'
import Reveal from '../components/Reveal.jsx'
import { COPY } from '../content/copy.js'

export default function FAQ() {
  const f = COPY.faq
  return (
    <section id="faq" className="border-b border-line bg-bg-alt">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-8 md:py-24 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <p className="kicker">{f.kicker}</p>
          <h2 className="h-section mt-4">{f.title}</h2>
        </Reveal>
        <div className="border-t border-line lg:col-span-8">
          {f.items.map((it, i) => (
            <details key={it.q} className="group border-b border-line" open={i === 0}>
              <summary className="flex items-center justify-between gap-4 py-5 text-lg font-semibold md:text-xl">
                {it.q}
                <Icon name="plus" size={22} className="plus shrink-0 text-accent" />
              </summary>
              <p className="-mt-1 max-w-[60ch] pb-5 text-muted">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
