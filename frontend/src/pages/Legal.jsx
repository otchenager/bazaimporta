import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { COPY } from '../content/copy.js'
import { OPERATOR } from '../content/privacy.js'

/** Подряд идущие строки «— …» собираются в один список, остальные — абзацы; порядок сохраняется. */
function blocks(lines) {
  const out = []
  for (const t of lines) {
    if (!t.startsWith('— ')) out.push(t)
    else if (Array.isArray(out.at(-1))) out.at(-1).push(t)
    else out.push([t])
  }
  return out
}

/** Юридический документ: политика ПДн или согласие (тексты — src/content/privacy.js). */
export default function Legal({ doc }) {
  return (
    <>
      <Header />
      <main id="main" className="mx-auto max-w-3xl px-4 py-12 sm:px-8 md:py-20">
        <h1 className="h-section">{doc.title}</h1>
        <p className="mt-4 text-sm text-muted">
          {COPY.legal.updated} {OPERATOR.date}
        </p>
        <div className="mt-10 space-y-8 leading-relaxed">
          {doc.sections.map((s, i) => (
            <section key={s.h || i}>
              {s.h && <h2 className="text-xl md:text-2xl">{s.h}</h2>}
              {blocks(s.p).map((b) =>
                Array.isArray(b) ? (
                  <ul key={b[0]} className="mt-3 list-disc space-y-1.5 pl-5 text-muted marker:text-accent">
                    {b.map((t) => (
                      <li key={t}>{t.slice(2)}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={b} className="mt-3 text-muted">{b}</p>
                ),
              )}
            </section>
          ))}
        </div>
        <Link to="/" className="btn btn-ghost mt-12">{COPY.legal.home}</Link>
      </main>
      <Footer />
    </>
  )
}
