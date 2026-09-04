import { SOCIALS } from '../config/socials.js'
import { PAID_FEATURES } from '../config/paidFeatures.js'
import { formatPrice } from '../config/tariffs.js'

export default function Comparison() {
  return (
    <section className="border-b border-border bg-bg-alt">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="text-center mb-14">
          <span className="text-xs tracking-[0.3em] uppercase text-accent-light font-semibold">Сравнение</span>
          <h2 className="text-3xl sm:text-4xl mt-3 text-gradient-chrome">Бесплатный или платный доступ</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <div className="card-surface rounded-2xl p-8 flex flex-col">
            <span className="inline-block w-fit text-[11px] uppercase tracking-widest px-3 py-1 rounded-full border border-border text-text-muted font-semibold mb-6">
              Бесплатно
            </span>
            <h3 className="text-2xl font-display text-chrome mb-4">Бесплатный канал</h3>
            <p className="normal-case text-sm text-text-muted font-sans leading-relaxed mb-8 flex-1">
              {/* TODO: подтянуть текст из ручной правки клиента */}
              Первые материалы, разборы рынка и часть системы — без оплаты, чтобы понять формат.
            </p>
            <a
              href={SOCIALS.channel}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center py-3 rounded-lg font-display uppercase tracking-wide text-sm bg-surface-2 text-chrome border border-border hover:border-accent/50 transition-colors"
            >
              Вступить бесплатно
            </a>
          </div>

          <div className="rounded-2xl p-8 flex flex-col relative card-surface border-accent/60 shadow-[0_0_40px_rgba(255,106,0,0.15)]">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 btn-accent text-white text-[11px] uppercase tracking-widest px-4 py-1 rounded-full font-semibold">
              Лучший выбор
            </span>
            <h3 className="text-2xl font-display text-chrome mb-4 mt-2">Платный доступ</h3>
            <ul className="space-y-2 mb-4 text-left flex-1">
              {PAID_FEATURES.map((f) => (
                <li key={f.title} className="normal-case text-sm text-text-muted font-sans flex items-start gap-2">
                  <span className="text-accent-light mt-0.5">&#10003;</span>
                  <span>{f.title}</span>
                </li>
              ))}
            </ul>
            <a href="#paid-channel" className="normal-case text-xs text-accent-light hover:text-accent-dark font-sans mb-6 inline-block w-fit">
              Подробнее ниже &darr;
            </a>
            <div className="text-3xl font-display font-semibold text-gradient-chrome mb-6">
              {formatPrice(4990)} <span className="text-sm text-text-muted normal-case font-sans">— полный доступ</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="#paid-channel"
                className="flex-1 text-center py-3 rounded-lg font-display uppercase tracking-wide text-sm bg-surface-2 text-chrome border border-border hover:border-accent/50 transition-colors"
              >
                Узнать больше
              </a>
              <a
                href={SOCIALS.channel}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-3 rounded-lg font-display uppercase tracking-wide text-sm btn-accent text-white transition-all"
              >
                Получить доступ
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
