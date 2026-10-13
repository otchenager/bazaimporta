// <!-- ТРЕБУЕТ ПРОВЕРКИ ЮРИСТОМ -->
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { COPY } from '../content/copy.js'
import { PATHS } from '../legal/documents.js'
import { EDITION, SITE_URL } from '../legal/requisites.js'
import { openCookieSettings } from '../lib/consent.js'

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

// Ссылки на страницы сайта и email в тексте документа → кликабельные. Точка или запятая в конце — не часть ссылки.
const LINK_RE = new RegExp(`(${SITE_URL.replace(/[.]/g, '\\.')}[^\\s,;)»]*[^\\s,;.)»]|[\\w.+-]+@[\\w-]+\\.[\\w.-]*\\w)`, 'g')
function linkify(text) {
  return text.split(LINK_RE).map((part, i) => {
    if (i % 2 === 0) return part
    if (part.includes('@')) return <a key={i} href={`mailto:${part}`}>{part}</a>
    return <a key={i} href={part.slice(SITE_URL.length) || '/'}>{part}</a>
  })
}

const anchor = (i) => `s${i + 1}`

/** Юридический документ (тексты — src/legal/documents.js). */
export default function Legal({ doc }) {
  const toc = doc.sections.filter((s) => s.h)
  return (
    <>
      <Header leadHref="/#lead" />
      <main id="main" className="mx-auto max-w-3xl px-4 py-12 sm:px-8 md:py-20">
        <h1 className="h-section [overflow-wrap:anywhere]">{doc.title}</h1>
        <p className="mt-4 text-sm text-muted">
          {COPY.legal.updated} {EDITION}
        </p>

        {doc.path === PATHS.cookies && (
          <button type="button" className="btn btn-ghost mt-6" onClick={openCookieSettings}>
            {COPY.legal.cookieSettings}
          </button>
        )}

        {toc.length > 3 && (
          <nav aria-label={COPY.legal.toc} className="doc-text mt-8 rounded-xl border border-line p-5 text-sm">
            <p className="font-semibold">{COPY.legal.toc}</p>
            <ol className="mt-2 space-y-1 text-muted">
              {doc.sections.map((s, i) => s.h && (
                <li key={s.h}><a href={`#${anchor(i)}`}>{s.h}</a></li>
              ))}
            </ol>
          </nav>
        )}

        <div className="doc-text mt-10 space-y-8 leading-relaxed">
          {doc.sections.map((s, i) => (
            <section key={s.h || i} id={s.h ? anchor(i) : undefined} className="scroll-mt-24">
              {s.h && <h2 className="text-xl md:text-2xl">{s.h}</h2>}
              {s.rows && (
                <dl className="mt-3 divide-y divide-line border-y border-line">
                  {s.rows.map(([k, v]) => (
                    <div key={k} className="grid gap-1 py-2.5 sm:grid-cols-[14rem_1fr] sm:gap-4">
                      <dt className="text-muted">{k}</dt>
                      <dd className="[overflow-wrap:anywhere]">{linkify(v)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {s.p && blocks(s.p).map((b) =>
                Array.isArray(b) ? (
                  <ul key={b[0]} className="mt-3 list-disc space-y-1.5 pl-5 text-muted marker:text-accent">
                    {b.map((t) => (
                      <li key={t}>{linkify(t.slice(2))}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={b} className="mt-3 text-muted">{linkify(b)}</p>
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
