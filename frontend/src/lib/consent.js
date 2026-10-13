// Согласие на cookie. Выбор хранится в технической cookie `consent` (1 год): «<версия>:a<0|1>m<0|1>».
// a — аналитические (Яндекс Метрика и Вебвизор), m — маркетинговые (пока не используются).
// Тот же формат разбирает public/metrika.js: до согласия на аналитику текущей версии счётчик не загружается.
import { VERSIONS } from '../legal/requisites.js'

export const CONSENT_COOKIE = 'consent'
export const CONSENT_VERSION = VERSIONS.cookies
const MAX_AGE = 365 * 24 * 60 * 60
const OPEN_EVENT = 'baza:cookie-settings'

/** Выбор текущей версии или null (не выбирал, выбор устарел или повреждён). */
export function readConsent() {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(/(?:^|;\s*)consent=([^;]+)/)
  const c = m && decodeURIComponent(m[1]).match(/^([\w.-]+):a([01])m([01])$/)
  if (!c || c[1] !== CONSENT_VERSION) return null
  return { analytics: c[2] === '1', marketing: c[3] === '1' }
}

export function saveConsent({ analytics, marketing }) {
  const prev = readConsent()
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${CONSENT_COOKIE}=${CONSENT_VERSION}:a${analytics ? 1 : 0}m${marketing ? 1 : 0}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`
  if (analytics) startAnalytics()
  else if (prev?.analytics || window.BAZA_YM_ID) stopAnalytics()
}

/** Согласие на аналитику дано на этой странице: счётчик загружается сразу, без перезагрузки. */
function startAnalytics() {
  window.BAZA_YM_OFF = false
  window.BAZA_startMetrika?.()
}

/**
 * Отзыв согласия: приложение больше не вызывает Метрику (src/lib/analytics.js смотрит на BAZA_YM_OFF),
 * cookie и записи _ym* удаляются. Уже загруженный tag.js выгрузить нельзя — он исчезнет при следующей загрузке страницы.
 */
function stopAnalytics() {
  window.BAZA_YM_OFF = true
  const host = location.hostname
  const parts = host.split('.')
  // cookie Метрики ставятся на домен второго уровня (.bazaimporta.ru) — удаляем на всех вариантах домена
  const domains = ['', host, '.' + host]
  for (let i = 1; i < parts.length - 1; i++) domains.push('.' + parts.slice(i).join('.'))
  for (const pair of document.cookie.split(';')) {
    const name = pair.split('=')[0].trim()
    if (!name.startsWith('_ym')) continue
    for (const d of domains) document.cookie = `${name}=; Max-Age=0; Path=/${d ? '; Domain=' + d : ''}`
  }
  try {
    for (const store of [localStorage, sessionStorage]) {
      for (const k of Object.keys(store)) if (k.startsWith('_ym')) store.removeItem(k)
    }
  } catch {
    // хранилище недоступно — удалять нечего
  }
}

/** Ссылка «Настройки cookie» в футере и на /cookies/ — открыть баннер с переключателями. */
export const openCookieSettings = () => window.dispatchEvent(new Event(OPEN_EVENT))
export const onOpenCookieSettings = (fn) => {
  window.addEventListener(OPEN_EVENT, fn)
  return () => window.removeEventListener(OPEN_EVENT, fn)
}
