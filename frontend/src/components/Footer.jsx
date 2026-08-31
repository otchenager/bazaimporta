import Logo from './Logo.jsx'
import { SOCIALS } from '../config/socials.js'

export default function Footer() {
  return (
    <footer className="bg-bg">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <Logo showTagline={false} />
        <div className="flex items-center gap-6">
          <a href={SOCIALS.channel} target="_blank" rel="noopener noreferrer" className="text-sm text-text-muted hover:text-chrome transition-colors">
            Наш канал
          </a>
          <a href={SOCIALS.instagram} target="_blank" rel="noopener noreferrer" className="text-sm text-text-muted hover:text-chrome transition-colors">
            Instagram
          </a>
        </div>
        <p className="normal-case text-xs text-text-muted font-sans">
          &copy; {new Date().getFullYear()} BAZA Import. Все права защищены.
        </p>
      </div>
    </footer>
  )
}
