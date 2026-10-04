import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'
import CtaButton from './CtaButton.jsx'
import { COPY, LINKS } from '../content/copy.js'
import { TRACKS } from '../content/tracks.js'

export default function Header({ activeSlug }) {
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
        <Link to="/" aria-label="BAZA Import — на главную" className="rounded">
          <Logo />
        </Link>
        <nav aria-label="Треки" className="hidden items-center gap-1 md:flex">
          {TRACKS.map((t) => (
            <Link
              key={t.id}
              to={t.slug}
              aria-current={activeSlug === t.slug ? 'page' : undefined}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                activeSlug === t.slug ? 'text-text' : 'text-muted hover:text-text'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <CtaButton href={LINKS.channel} goal="cta_header" className="!min-h-11 !px-4 !text-sm">
          {COPY.header.cta}
        </CtaButton>
      </div>
    </header>
  )
}
