import { Link } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import { SOCIALS } from '../config/socials.js'

export default function ThankYou() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center gap-8">
      <Logo />
      <div className="max-w-md">
        <div className="w-16 h-16 rounded-full bg-surface-2 border border-accent/40 flex items-center justify-center mx-auto mb-6 text-3xl text-accent-light">
          &#10003;
        </div>
        <h1 className="text-3xl normal-case text-gradient-chrome mb-4">Спасибо за оплату!</h1>
        <p className="normal-case text-text-muted font-sans leading-relaxed">
          Вы будете добавлены в канал в течение 24 часов. Если у вас есть вопросы — напишите нам в Telegram.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <a
          href={SOCIALS.channel}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-accent text-white font-display uppercase tracking-wide px-8 py-3 rounded-lg transition-all"
        >
          Написать в Telegram
        </a>
        <Link
          to="/"
          className="bg-surface-2 border border-border text-chrome font-display uppercase tracking-wide px-8 py-3 rounded-lg hover:border-accent/50 transition-colors"
        >
          На главную
        </Link>
      </div>
    </div>
  )
}
