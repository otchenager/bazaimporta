// Яндекс Метрика: счётчик подключает /metrika.js (public/metrika.js, тег в index.html).
// Без счётчика (не боевой домен, блокировщик) функции молча ничего не делают: клик по CTA всё равно уводит в Telegram.
export const YM_ID = 113396195

function ym(...args) {
  if (typeof window === 'undefined' || typeof window.ym !== 'function' || !window.BAZA_YM_ID) return
  try {
    window.ym(YM_ID, ...args)
  } catch {
    // аналитика не должна ломать переход
  }
}

/** Цель «JavaScript-событие» (имена — docs/copy.md, «Цели Метрики»). */
export function track(goal, params) {
  if (goal) ym('reachGoal', goal, params)
}

/** Хит при переходе внутри SPA (React Router). Первый хит отправляет сам счётчик при init. */
export function hit(url, referer) {
  ym('hit', url, { title: document.title, referer })
}
