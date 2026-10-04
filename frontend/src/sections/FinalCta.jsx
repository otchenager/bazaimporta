import CtaButton from '../components/CtaButton.jsx'
import Reveal from '../components/Reveal.jsx'
import CarPoster from '../visual/CarPoster.jsx'
import { COPY, LINKS } from '../content/copy.js'

export default function FinalCta() {
  const f = COPY.final
  return (
    <section id="final" className="relative overflow-hidden border-b border-line">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 md:py-28">
        <Reveal className="relative z-10 max-w-2xl">
          <h2 className="h-display">{f.title}</h2>
          <p className="mt-5 text-lg text-muted sm:text-xl">{f.sub}</p>
          <CtaButton href={LINKS.channel} goal="cta_final" className="mt-8 w-full sm:w-auto">
            {f.cta}
          </CtaButton>
        </Reveal>
        <CarPoster className="pointer-events-none absolute -right-24 bottom-6 hidden w-[56rem] opacity-40 lg:block" />
      </div>
    </section>
  )
}
