// UTM-метки и yclid первого захода — в sessionStorage, чтобы заявка с любой страницы несла источник из Директа.
// sessionStorage может быть недоступен (приватный режим, запрет cookies, встроенный браузер) — тогда просто без меток.
const KEY = 'baza_utm'
export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid']

/** При первом заходе запомнить метки из адреса. Уже сохранённые не перезаписываем: важен источник входа. */
export function captureUtm() {
  try {
    if (sessionStorage.getItem(KEY)) return
    const q = new URLSearchParams(window.location.search)
    const utm = {}
    for (const k of UTM_KEYS) {
      const v = q.get(k)
      if (v) utm[k] = v.slice(0, 200)
    }
    if (Object.keys(utm).length) sessionStorage.setItem(KEY, JSON.stringify(utm))
  } catch {
    // без меток заявка всё равно уходит
  }
}

export function readUtm() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}
