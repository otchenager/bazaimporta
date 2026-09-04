import { SOCIALS } from '../config/socials.js'

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[32rem] h-[32rem] bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[28rem] h-[28rem] bg-chrome/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 diagonal-stripe opacity-[0.04]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-5 sm:px-8 py-24 sm:py-32 text-center">
        <span className="inline-block text-xs sm:text-sm tracking-[0.3em] uppercase text-accent-light font-semibold mb-6">
          Сообщество автобизнеса        </span>
        <h1 className="text-4xl sm:text-6xl leading-[1.05] font-bold text-gradient-chrome mb-6">
          Твой путь в автоимпорт начинается здесь
        </h1>
        <p className="normal-case text-base sm:text-xl text-text-muted max-w-2xl mx-auto mb-10 font-sans">
          Пошаговая система от поставщика с 200+ машинами и Lamborghini за плечами
        </p>
        <a
          href={SOCIALS.channel}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-accent inline-block text-white font-display text-lg uppercase tracking-wide px-10 py-4 rounded-lg transition-all"
        >
          Вступить в канал
        </a>

        <div className="mt-8 flex justify-center">
          <a
            href={SOCIALS.channel}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 normal-case text-sm sm:text-base text-text-muted hover:text-chrome font-sans transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-accent-light">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16-1.703 8.03c-.128.573-.463.712-.94.443l-2.6-1.917-1.255 1.208c-.14.14-.257.257-.526.257l.188-2.664 4.85-4.383c.21-.187-.046-.292-.326-.105l-5.994 3.775-2.581-.807c-.561-.175-.572-.561.117-.83l10.09-3.888c.467-.17.876.114.68.881z" />
            </svg>
            Подписаться на бесплатный канал BAZA Import
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </section>
  )
}
