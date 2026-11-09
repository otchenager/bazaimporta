import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'
import CtaButton from './CtaButton.jsx'
import Icon from './Icon.jsx'
import { CONTACT, COPY, LINKS } from '../content/copy.js'
import { track as trackGoal } from '../lib/analytics.js'
import { TRACKS } from '../content/tracks.js'

/**
 * Шапка: логотип, треки (с md — в строке), CTA. На телефоне треки — вкладки под шапкой: три пункта помещаются
 * без бургера и видны сразу; вкладки не липкие, чтобы липкая шапка оставалась низкой (64 px) во встроенном браузере Telegram.
 * Слева от CTA — номер для звонков: с lg трубка и номер текстом, уже — круглая кнопка-трубка (номер целиком не помещается).
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
        {/* справа — звонок и регистрация в веб-приложении */}
        <div className="flex shrink-0 items-center gap-2 lg:gap-4">
          <a
            href={`tel:${CONTACT.tel}`}
            onClick={() => trackGoal('phone_header')}
            data-goal="phone_header"
            aria-label={`Позвонить: ${CONTACT.phone}`}
            className="flex size-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-line text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent focus-visible:text-accent lg:size-auto lg:rounded-md lg:border-0 lg:px-2 lg:py-2"
          >
            <Icon name="phone" size={18} />
            <span className="hidden tabular-nums lg:inline">{CONTACT.phone}</span>
          </a>
          <CtaButton href={LINKS.app} goal={track ? `cta_exclusive_${track.id}` : 'cta_header'} className="!min-h-11 !gap-2 !px-3 !text-sm sm:!px-4">
            {COPY.header.cta}
          </CtaButton>
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
