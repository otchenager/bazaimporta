const MODULES = [
  {
    n: '01',
    title: 'Страны и рынки',
    desc: 'Особенности рынков Кореи, Китая и Японии: где выгоднее покупать под ваш бюджет и цель.',
  },
  {
    n: '02',
    title: 'Подбор авто',
    desc: 'Как оценить состояние, историю и реальную рыночную цену конкретного лота.',
  },
  {
    n: '03',
    title: 'Аукционы',
    desc: 'Регистрация, ставки, работа с аукционными площадками и агентами без переплат.',
  },
  {
    n: '04',
    title: 'Логистика',
    desc: 'Морская и ж/д доставка, страхование груза, сроки и выбор надёжного перевозчика.',
  },
  {
    n: '05',
    title: 'Таможня',
    desc: 'Растаможка, расчёт платежей, СБКТС/ЭПТС и постановка на учёт без штрафов.',
  },
  {
    n: '06',
    title: 'Поиск клиента',
    desc: 'Как относительно быстро найти клиента и совершить первую продажу.',
  },
]

export default function Program() {
  return (
    <section className="border-b border-border bg-bg-alt">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="text-center mb-14">
          <span className="text-xs tracking-[0.3em] uppercase text-accent-light font-semibold">Программа</span>
          <h2 className="text-3xl sm:text-4xl mt-3 text-gradient-chrome">Путь от нуля до первого клиента</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULES.map((m) => (
            <div key={m.n} className="card-surface rounded-xl p-7 text-left relative overflow-hidden">
              <span className="absolute top-4 right-5 font-display text-4xl text-border select-none">{m.n}</span>
              <h3 className="normal-case text-lg font-display font-semibold text-chrome mb-2 relative">{m.title}</h3>
              <p className="normal-case text-sm text-text-muted font-sans leading-relaxed relative">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
