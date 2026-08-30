export default function Hero() {
  const scrollToPricing = (e) => {
    e.preventDefault()
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[32rem] h-[32rem] bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[28rem] h-[28rem] bg-chrome/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 diagonal-stripe opacity-[0.04]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-5 sm:px-8 py-24 sm:py-32 text-center">
        <span className="inline-block text-xs sm:text-sm tracking-[0.3em] uppercase text-accent-light font-semibold mb-6">
          Закрытый Telegram-канал
        </span>
        <h1 className="text-4xl sm:text-6xl leading-[1.05] font-bold text-gradient-chrome mb-6">
          Привези свою первую машину из Кореи / Китая / Японии без переплат и ошибок
        </h1>
        <p className="normal-case text-base sm:text-xl text-text-muted max-w-2xl mx-auto mb-10 font-sans">
          Пошаговая система от импортёра с 90+ машинами и Lamborghini за плечами
        </p>
        <a
          href="#pricing"
          onClick={scrollToPricing}
          className="btn-accent inline-block text-white font-display text-lg uppercase tracking-wide px-10 py-4 rounded-lg transition-all"
        >
          Купить доступ
        </a>
      </div>
    </section>
  )
}
