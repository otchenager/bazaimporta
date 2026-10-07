import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'
import CtaButton from './CtaButton.jsx'
import Icon from './Icon.jsx'
import PhoneLink from './PhoneLink.jsx'
import { COPY, LEGAL, LINKS } from '../content/copy.js'
import { TRACKS } from '../content/tracks.js'

/**
 * Шапка: логотип, треки (с md — в строке), CTA. На телефоне треки — вкладки под шапкой: три пункта помещаются
 * без бургера и видны сразу; вкладки не липкие, чтобы липкая шапка оставалась низкой (64 px) во встроенном браузере Telegram.
 */
export default function Header({ track }) {
  const activeSlug = track?.slug
  return (
    <>
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
        <div className="flex items-center gap-1 lg:gap-5">
          {/* номер: с 1024 px — текстом рядом с CTA, тише кнопки; на телефоне — трубка 44×44 */}
          <PhoneLink
            aria-label={`Позвонить: ${LEGAL.phone}`}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-muted transition-colors hover:text-text lg:hidden"
          >
            <Icon name="phone" size={22} />
          </PhoneLink>
          <PhoneLink className="hidden whitespace-nowrap rounded text-sm font-semibold tabular-nums text-muted transition-colors hover:text-text lg:inline" />
          {track ? (
            <CtaButton href={LINKS.boris} goal={`cta_exclusive_${track.id}`} className="!min-h-11 !gap-2 !px-3 !text-sm sm:!px-4">
              {COPY.exclusive.cta}
            </CtaButton>
          ) : (
            <CtaButton href={LINKS.boris} goal="cta_header" className="!min-h-11 !gap-2 !px-3 !text-sm sm:!px-4">
              {COPY.header.cta}
            </CtaButton>
          )}
        </div>
      </div>
    </header>
    <nav aria-label="Треки" className="border-b border-line bg-bg md:hidden">
      <ul className="mx-auto flex max-w-7xl px-2">
        {TRACKS.map((t) => (
          <li key={t.id} className="flex-1">
            <Link
              to={t.slug}
              aria-current={activeSlug === t.slug ? 'page' : undefined}
              className={`flex min-h-11 items-center justify-center border-b-2 px-1 text-base font-semibold ${
                activeSlug === t.slug ? 'border-accent text-text' : 'border-transparent text-muted'
              }`}
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
    </>
  )
}
