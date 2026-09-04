import { PAID_FEATURES } from '../config/paidFeatures.js'

export default function PaidChannel() {
  return (
    <section id="paid-channel" className="border-b border-border scroll-mt-20">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="text-center mb-14">
          <span className="text-xs tracking-[0.3em] uppercase text-accent-light font-semibold">Платный доступ</span>
          <h2 className="text-3xl sm:text-4xl mt-3 text-gradient-chrome">Что внутри платного канала</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PAID_FEATURES.map((f, i) => (
            <div key={f.title} className="card-surface rounded-xl p-7 text-left hover:border-accent/40 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-light to-accent-dark flex items-center justify-center text-white font-display text-sm mb-4">
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="normal-case text-lg font-display font-semibold text-chrome mb-2">{f.title}</h3>
              <p className="normal-case text-sm text-text-muted font-sans leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
