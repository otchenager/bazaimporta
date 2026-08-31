import Logo from './Logo.jsx'
import { SOCIALS } from '../config/socials.js'

export default function Header() {
  const scrollToPricing = (e) => {
    e.preventDefault()
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between">
        <a href="/" aria-label="BAZA Import — на главную">
          <Logo />
        </a>
        <nav className="flex items-center gap-3 sm:gap-5">
          <a
            href={SOCIALS.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-block text-sm text-text-muted hover:text-chrome transition-colors"
          >
            Telegram
          </a>
          <a
            href={SOCIALS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-block text-sm text-text-muted hover:text-chrome transition-colors"
          >
            Instagram
          </a>
          <a
            href="#pricing"
            onClick={scrollToPricing}
            className="btn-accent text-white text-sm font-semibold uppercase tracking-wide px-4 py-2 rounded-md transition-all"
          >
            Купить доступ
          </a>
        </nav>
      </div>
    </header>
  )
}
