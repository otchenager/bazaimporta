import Logo from './Logo.jsx'
import { LEGAL } from '../config/legal.js'

export default function Footer() {
  return (
    <footer className="bg-bg">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <Logo showTagline={false} />
        <p className="normal-case text-xs text-text-muted font-sans">
          &copy; {new Date().getFullYear()} BAZA Import. Все права защищены.
        </p>
      </div>

      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6">
          <p className="normal-case text-xs text-accent-light font-sans font-semibold mb-2">
            Работаем официально
          </p>
          <p className="normal-case text-xs text-text-muted font-sans leading-relaxed">
            {LEGAL.entityName} &middot; ИНН {LEGAL.inn} &middot; ОГРНИП {LEGAL.ogrnip}
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> &middot; </span>
            <a href={LEGAL.phoneHref} className="hover:text-chrome transition-colors">{LEGAL.phone}</a>
            <span> &middot; </span>
            <a href={`mailto:${LEGAL.email}`} className="hover:text-chrome transition-colors">{LEGAL.email}</a>
            <span> &middot; </span>
            <a href={LEGAL.supportTelegramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-chrome transition-colors">
              Тех. поддержка: {LEGAL.supportTelegram}
            </a>
            <span> &middot; </span>
            <a href={LEGAL.offerUrl} target="_blank" rel="noopener noreferrer" className="hover:text-chrome transition-colors underline underline-offset-2">
              Публичная оферта
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
