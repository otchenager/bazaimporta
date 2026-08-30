import { useState } from 'react'
import { TESTIMONIALS } from '../config/testimonials.js'

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function Testimonials() {
  const [index, setIndex] = useState(0)

  if (!TESTIMONIALS.length) return null

  const prev = () => setIndex((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)
  const next = () => setIndex((i) => (i + 1) % TESTIMONIALS.length)
  const current = TESTIMONIALS[index]

  return (
    <section className="border-b border-border">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="text-center mb-14">
          <span className="text-xs tracking-[0.3em] uppercase text-accent-light font-semibold">Отзывы</span>
          <h2 className="text-3xl sm:text-4xl mt-3 text-gradient-chrome">Что говорят участники</h2>
        </div>

        <div className="card-surface rounded-2xl p-8 sm:p-10 text-left">
          <p className="normal-case text-lg text-text leading-relaxed font-sans mb-8">&laquo;{current.text}&raquo;</p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-2 border border-border flex items-center justify-center font-display text-chrome shrink-0">
              {current.avatar ? (
                <img src={current.avatar} alt={current.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                initials(current.name)
              )}
            </div>
            <div>
              <div className="font-display text-chrome normal-case">{current.name}</div>
              <div className="normal-case text-sm text-text-muted font-sans">{current.role}</div>
            </div>
          </div>
        </div>

        {TESTIMONIALS.length > 1 && (
          <div className="flex items-center justify-center gap-6 mt-8">
            <button
              onClick={prev}
              aria-label="Предыдущий отзыв"
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-chrome hover:border-accent/50 transition-colors"
            >
              &#8592;
            </button>
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Отзыв ${i + 1}`}
                  className={`w-2 h-2 rounded-full transition-colors ${i === index ? 'bg-accent-light' : 'bg-border'}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              aria-label="Следующий отзыв"
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-chrome hover:border-accent/50 transition-colors"
            >
              &#8594;
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
