import Logo from './Logo.jsx'
import PhoneLink from './PhoneLink.jsx'
import Icon from './Icon.jsx'
import { COPY, LEGAL, LINKS } from '../content/copy.js'
import { DOCUMENTS } from '../legal/documents.js'
import { openCookieSettings } from '../lib/consent.js'

const linkCls = 'underline underline-offset-4 hover:text-text'

export default function Footer() {
  return (
    <footer className="border-t border-line bg-bg pb-28 md:pb-0">
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-8">
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
          <h2 className="font-display text-xl font-bold uppercase tracking-[0.02em] sm:text-2xl">{COPY.footer.contactTitle}</h2>
          <PhoneLink className="group inline-flex min-h-11 items-center gap-3 self-start rounded font-display text-[2rem] font-bold leading-none tracking-[0.01em] whitespace-nowrap text-accent tabular-nums sm:self-auto sm:text-5xl">
            <Icon name="phone" size={28} className="shrink-0 transition-transform group-hover:-rotate-12" />
            <span className="underline-offset-[6px] group-hover:underline">{LEGAL.phone}</span>
          </PhoneLink>
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-8 md:grid-cols-[auto_1fr_auto] md:items-start">
        <Logo />
        <div className="min-w-0 text-sm leading-relaxed text-muted">
          <p className="mb-1 font-semibold text-text">{COPY.footer.official}</p>
          {/* реквизиты исполнителя — src/legal/requisites.js */}
          <p className="text-xs [overflow-wrap:anywhere]">
            {LEGAL.entityName} · ИНН {LEGAL.inn} · ОГРНИП {LEGAL.ogrnip} ·{' '}
            <a className="underline-offset-4 hover:text-text hover:underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> · {LEGAL.address}
          </p>
          <p className="mt-1">
            <a className="underline-offset-4 hover:text-text hover:underline" href={LINKS.support} target="_blank" rel="noopener">
              {COPY.footer.support}: {LEGAL.supportTelegram}
            </a>
          </p>
          <nav aria-label={COPY.footer.docs} className="mt-3">
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {DOCUMENTS.map((d) => (
                <li key={d.path}>
                  <a className={linkCls} href={d.path}>{d.short}</a>
                </li>
              ))}
              <li>
                <button type="button" className={`${linkCls} cursor-pointer`} onClick={openCookieSettings}>
                  {COPY.footer.cookieSettings}
                </button>
              </li>
            </ul>
          </nav>
        </div>
        <p className="text-sm text-muted">© {new Date().getFullYear()} {COPY.footer.rights}</p>
      </div>
    </footer>
  )
}
