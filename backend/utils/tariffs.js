// Источник истины по ценам — должен совпадать с frontend/src/config/tariffs.js.
// Цена всегда берётся отсюда, а не от клиента, чтобы сумму нельзя было подделать.
export const TARIFFS = {
  '1m': { id: '1m', title: '1 месяц', months: 1, price: 4900 },
  '3m': { id: '3m', title: '3 месяца', months: 3, price: 12900 },
  '6m': { id: '6m', title: '6 месяцев', months: 6, price: 22900 },
}

export function getTariff(tariffId) {
  return TARIFFS[tariffId] || null
}
