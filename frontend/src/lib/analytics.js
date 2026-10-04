// Цели Яндекс.Метрики. Счётчик и его ID живут в /ym.js (см. scripts/prerender.mjs, docs/deploy.md).
// Без счётчика track() молча ничего не делает: клик по CTA всё равно уводит в Telegram.
export function track(goal, params) {
  if (typeof window === 'undefined' || !goal) return
  try {
    const id = window.BAZA_YM_ID
    if (id && typeof window.ym === 'function') window.ym(id, 'reachGoal', goal, params)
  } catch {
    // аналитика не должна ломать переход
  }
}
