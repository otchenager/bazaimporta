export const TARIFFS = [
  {
    id: '1m',
    title: '1 месяц',
    price: 4900,
    description: 'Попробовать формат и войти в тему импорта',
    features: ['Доступ к каналу на 1 месяц', 'Все эфиры и разборы за период', 'Закрытый чат участников'],
  },
  {
    id: '3m',
    title: '3 месяца',
    price: 12900,
    description: 'Оптимально для подготовки и первой сделки',
    features: ['Доступ к каналу на 3 месяца', 'Все эфиры и разборы за период', 'Закрытый чат участников', 'Приоритетные ответы на вопросы'],
    highlighted: true,
  },
  {
    id: '6m',
    title: '6 месяцев',
    price: 22900,
    description: 'Для тех, кто планирует несколько поставок',
    features: ['Доступ к каналу на 6 месяцев', 'Все эфиры и разборы за период', 'Закрытый чат участников', 'Приоритетные ответы на вопросы', 'Максимальная выгода по цене'],
  },
]

export function getTariffById(id) {
  return TARIFFS.find((t) => t.id === id)
}

export function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽'
}
