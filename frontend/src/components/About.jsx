const FEATURES = [
  {
    title: 'Живые эфиры',
    desc: 'Регулярные разборы актуальной ситуации на рынке, курсов валют и логистики в прямом эфире.',
  },
  {
    title: 'Разборы реальных сделок',
    desc: 'Полные кейсы от покупки на аукционе до постановки на учёт — с цифрами и подводными камнями.',
  },
  {
    title: 'Контакты проверенных брокеров',
    desc: 'База брокеров, логистов и таможенных представителей, с которыми мы работаем сами.',
  },
  {
    title: 'Шаблоны документов',
    desc: 'Готовые договоры, инвойсы и чек-листы для оформления сделки без юриста.',
  },
  {
    title: 'Закрытый чат участников',
    desc: 'Поддержка комьюнити и оперативные ответы на вопросы по вашей сделке.',
  },
]

export default function About() {
  return (
    <section className="border-b border-border">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="text-center mb-14">
          <span className="text-xs tracking-[0.3em] uppercase text-accent-light font-semibold">О канале</span>
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
