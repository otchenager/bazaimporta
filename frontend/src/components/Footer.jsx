import Logo from './Logo.jsx'
import { COPY, LEGAL, LINKS } from '../content/copy.js'

export default function Footer() {
  return (
    <footer className="border-t border-line bg-bg pb-28 md:pb-0">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-8 md:grid-cols-[auto_1fr_auto] md:items-start">
        <Logo />
        <div className="text-sm leading-relaxed text-muted">
          <p className="mb-1 font-semibold text-text">{COPY.footer.official}</p>
          <p>
            {LEGAL.entityName} · ИНН {LEGAL.inn} · ОГРНИП {LEGAL.ogrnip}
          </p>
          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            <a className="underline-offset-4 hover:text-text hover:underline" href={LEGAL.phoneHref}>{LEGAL.phone}</a>
            <a className="underline-offset-4 hover:text-text hover:underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
            <a className="underline-offset-4 hover:text-text hover:underline" href={LINKS.support} target="_blank" rel="noopener">
              {COPY.footer.support}: {LEGAL.supportTelegram}
            </a>
            <a className="underline underline-offset-4 hover:text-text" href={LINKS.offer} target="_blank" rel="noopener">
              {COPY.footer.offer}
            </a>
          </p>
        </div>
        <p className="text-sm text-muted">© {new Date().getFullYear()} {COPY.footer.rights}</p>
      </div>
    </footer>
  )
}
