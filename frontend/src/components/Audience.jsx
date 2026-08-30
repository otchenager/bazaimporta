const PERSONAS = [
  {
    title: 'Хочет привезти машину себе',
    desc: 'Разово выбрать и завезти автомобиль под личное использование без переплат посредникам.',
  },
  {
    title: 'Планирует запустить бизнес на перегонах',
    desc: 'Разобраться в схемах импорта, чтобы возить машины на заказ и зарабатывать на этом.',
  },
  {
    title: 'Уже перегоняет, но хочет системы',
    desc: 'Есть опыт, но нет стабильного процесса — нужны проверенные контакты и алгоритмы.',
  },
  {
    title: 'Автодилер или менеджер автосалона',
    desc: 'Хочет расширить ассортимент за счёт прямых поставок из Азии в обход перекупщиков.',
  },
]

export default function Audience() {
  return (
    <section className="border-b border-border">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="text-center mb-14">
          <span className="text-xs tracking-[0.3em] uppercase text-accent-light font-semibold">Для кого</span>
          <h2 className="text-3xl sm:text-4xl mt-3 text-gradient-chrome">Канал будет полезен, если вы</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {PERSONAS.map((p) => (
            <div key={p.title} className="card-surface rounded-xl p-7 text-left flex gap-4">
              <div className="w-1 self-stretch rounded-full bg-gradient-to-b from-accent-light to-accent-dark shrink-0" />
              <div>
                <h3 className="normal-case text-lg font-display font-semibold text-chrome mb-2">{p.title}</h3>
                <p className="normal-case text-sm text-text-muted font-sans leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
