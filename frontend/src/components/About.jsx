const FEATURES = [
  {
    title: 'Ежедневные инсайты по рынку',
    desc: 'Регулярные разборы актуальной ситуации на рынке, курсов валют и логистики в прямом эфире. Без этого ты будешь принимать решения с опозданием',
  },
  {
    title: 'Разборы моих текущих сделок',
    desc: 'Я показываю, что покупаю сейчас, сколько плачу, сколько закладываю на логистику и как продаю. Это реальный опыт, в прямом эфире.',
  },
  {
    title: 'Горячие предложения с рынков Азии , Европы и США',
    desc: 'Эксклюзивные предложения от поставщиков в Азии, Европе и США. Стоимость под ключ в вашем городе сильно ниже Авито/Авто.ру оценки по рынку.',
  },
  {
    title: 'Шаблоны документов',
    desc: 'Готовые договоры, инвойсы и чек-листы для оформления сделки без юриста.',
  },
  {
    title: 'Открытый чат участников',
    desc: 'Поддержка комьюнити и оперативные ответы на вопросы по вашей сделке от админа группы и соучастников .',
  },
]

export default function About() {
  return (
    <section className="border-b border-border bg-bg-alt">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="text-center mb-14">
          <span className="text-xs tracking-[0.3em] uppercase text-accent-light font-semibold">Бесплатный канал</span>
          <h2 className="text-3xl sm:text-4xl mt-3 text-gradient-chrome">Что вы получаете внутри</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-surface rounded-xl p-7 text-left hover:border-accent/40 transition-colors">
              <h3 className="normal-case text-lg font-display font-semibold text-chrome mb-2">{f.title}</h3>
              <p className="normal-case text-sm text-text-muted font-sans leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
