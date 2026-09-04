import { SOCIALS } from '../config/socials.js'

export default function Contacts() {
  return (
    <section className="border-b border-border">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="text-center mb-14">
          <span className="text-xs tracking-[0.3em] uppercase text-accent-light font-semibold">Контакты</span>
          <h2 className="text-3xl sm:text-4xl mt-3 text-gradient-chrome">Где нас найти</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <a
            href={SOCIALS.channel}
            target="_blank"
            rel="noopener noreferrer"
            className="group card-surface rounded-xl p-8 flex items-center gap-5 transition-all hover:border-accent/50 hover:shadow-[0_0_30px_rgba(255,106,0,0.2)]"
          >
            <span className="w-14 h-14 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0 text-accent-light group-hover:text-accent transition-colors">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16-1.703 8.03c-.128.573-.463.712-.94.443l-2.6-1.917-1.255 1.208c-.14.14-.257.257-.526.257l.188-2.664 4.85-4.383c.21-.187-.046-.292-.326-.105l-5.994 3.775-2.581-.807c-.561-.175-.572-.561.117-.83l10.09-3.888c.467-.17.876.114.68.881z" />
              </svg>
            </span>
            <span className="text-left">
              <span className="block font-display text-lg text-chrome normal-case">Telegram</span>
              <span className="block normal-case text-sm text-text-muted font-sans">Бесплатный канал BAZA Import</span>
            </span>
          </a>

          <a
            href="#"
            data-placeholder="instagram-coming-soon"
            aria-disabled="true"
            onClick={(e) => e.preventDefault()}
            className="group card-surface rounded-xl p-8 flex items-center gap-5 opacity-60 cursor-not-allowed"
          >
            <span className="w-14 h-14 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0 text-chrome-dark">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.2c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.25.07 1.63.07 4.81 0 3.19-.01 3.56-.07 4.81-.15 3.23-1.66 4.77-4.92 4.92-1.25.06-1.62.07-4.85.07-3.2 0-3.58-.01-4.85-.07-3.26-.15-4.77-1.7-4.92-4.92-.06-1.25-.07-1.62-.07-4.81 0-3.18.01-3.56.07-4.81.15-3.23 1.67-4.77 4.92-4.92C8.42 2.21 8.8 2.2 12 2.2zm0 1.98c-3.14 0-3.5.01-4.74.07-2.17.1-3.19 1.13-3.28 3.28-.06 1.24-.07 1.6-.07 4.74s.01 3.5.07 4.74c.1 2.16 1.12 3.19 3.28 3.28 1.24.06 1.6.07 4.74.07s3.5-.01 4.74-.07c2.16-.1 3.19-1.12 3.28-3.28.06-1.24.07-1.6.07-4.74s-.01-3.5-.07-4.74c-.1-2.16-1.13-3.19-3.28-3.28C15.5 4.19 15.14 4.18 12 4.18zm0 3.36a4.46 4.46 0 1 1 0 8.92 4.46 4.46 0 0 1 0-8.92zm0 1.98a2.48 2.48 0 1 0 0 4.96 2.48 2.48 0 0 0 0-4.96zm4.63-2.2a1.04 1.04 0 1 1 0 2.08 1.04 1.04 0 0 1 0-2.08z" />
              </svg>
            </span>
            <span className="text-left">
              <span className="block font-display text-lg text-chrome normal-case">Instagram</span>
              <span className="block normal-case text-sm text-text-muted font-sans">Скоро</span>
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}
