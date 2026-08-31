import { useNavigate } from 'react-router-dom'
import { TARIFFS, formatPrice } from '../config/tariffs.js'

// Not currently rendered on the page — funnel routes through the free
// Telegram channel instead of direct payment. Kept for the next stage
// when paid-channel sales resume. See Home.jsx.
export default function PricingSection() {
  const navigate = useNavigate()

  return (
    <section id="pricing" className="border-b border-border bg-bg-alt scroll-mt-20">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="text-center mb-14">
          <span className="text-xs tracking-[0.3em] uppercase text-accent-light font-semibold">Тарифы</span>
          <h2 className="text-3xl sm:text-4xl mt-3 text-gradient-chrome">Выберите срок доступа</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {TARIFFS.map((t) => (
            <div
              key={t.id}
              className={`rounded-2xl p-8 flex flex-col relative ${
                t.highlighted
                  ? 'card-surface border-accent/60 shadow-[0_0_40px_rgba(181,34,44,0.15)]'
                  : 'card-surface'
              }`}
            >
              {t.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 btn-accent text-white text-[11px] uppercase tracking-widest px-4 py-1 rounded-full font-semibold">
                  Популярный
                </span>
              )}
              <h3 className="text-2xl font-display text-chrome mb-1">{t.title}</h3>
              <p className="normal-case text-sm text-text-muted font-sans mb-6">{t.description}</p>
              <div className="text-4xl font-display font-semibold text-gradient-chrome mb-6">
                {formatPrice(t.price)}
              </div>
              <ul className="flex-1 space-y-3 mb-8 text-left">
                {t.features.map((f) => (
                  <li key={f} className="normal-case text-sm text-text-muted font-sans flex items-start gap-2">
                    <span className="text-accent-light mt-0.5">&#10003;</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate(`/payment?tariff=${t.id}`)}
                className={`w-full py-3 rounded-lg font-display uppercase tracking-wide text-sm transition-all ${
                  t.highlighted
                    ? 'btn-accent text-white'
                    : 'bg-surface-2 text-chrome border border-border hover:border-accent/50'
                }`}
              >
                Оплатить
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
