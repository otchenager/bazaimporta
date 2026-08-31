import { useState } from 'react'

const QUESTIONS = [
  {
    q: 'Как вступить в канал?',
    a: 'Нажмите «Вступить в канал» — ссылка откроет бесплатный Telegram-канал BAZA Import в новой вкладке. Вступление занимает секунду, без оплаты и форм.',
  },
  {
    q: 'Канал платный?',
    a: 'Сначала бесплатный канал с частью материалов, платный доступ — по ссылке внутри.',
  },
  {
    q: 'Нужен ли опыт в автобизнесе, чтобы начать?',
    a: 'Нет. Материалы построены так, чтобы разобраться с нуля — от выбора страны и авто до постановки на учёт.',
  },
  {
    q: 'Какая машина мне понадобится, чтобы начать зарабатывать?',
    a: 'Канал не продаёт готовый бизнес «под ключ» — мы даём систему и контакты, которые вы применяете под свой бюджет и цели, будь то личный авто или перегон на продажу.',
  },
  {
    q: 'Что если я не нахожу канал по ссылке?',
    a: 'Проверьте, что ссылка открылась в приложении Telegram, а не в браузере. Если проблема повторяется — напишите нам в канале, разберёмся.',
  },
  {
    q: 'Вы даёте гарантии по срокам и стоимости доставки?',
    a: 'Мы делимся актуальными данными и реальными кейсами, но итоговые сроки и стоимость всегда зависят от конкретного лота, сезона и логистического маршрута.',
  },
]

function AccordionItem({ item, isOpen, onToggle }) {
  return (
    <div className="border-b border-border">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-6 text-left"
        aria-expanded={isOpen}
      >
        <span className="normal-case text-base sm:text-lg font-display text-chrome">{item.q}</span>
        <span className={`shrink-0 text-accent-light text-xl transition-transform ${isOpen ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] pb-6' : 'grid-rows-[0fr]'}`} style={{ overflow: 'hidden' }}>
        <div className="min-h-0">
          <p className="normal-case text-sm sm:text-base text-text-muted font-sans leading-relaxed text-left">{item.a}</p>
        </div>
      </div>
    </div>
  )
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section className="border-b border-border bg-bg-alt">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="text-center mb-10">
          <span className="text-xs tracking-[0.3em] uppercase text-accent-light font-semibold">FAQ</span>
          <h2 className="text-3xl sm:text-4xl mt-3 text-gradient-chrome">Частые вопросы</h2>
        </div>
        <div>
          {QUESTIONS.map((item, i) => (
            <AccordionItem
              key={item.q}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
