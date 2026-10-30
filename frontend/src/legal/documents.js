// <!-- ТРЕБУЕТ ПРОВЕРКИ ЮРИСТОМ -->
// Юридические документы сайта — те же, что в веб-приложении app.bazaimporta.ru: тексты — копия ./texts.js,
// реквизиты и редакция — ./requisites.js. Здесь только адреса страниц лендинга, ссылки /legal/… → адреса лендинга,
// дополнения политики cookie про сам лендинг (Вебвизор) и страница реквизитов, которой в приложении нет.
//
// Формат: раздел = { h: заголовок, p: [строки] }. Строка «— …» — пункт списка; подряд идущие пункты собираются в один список.
// { h, table: [[заголовки], ...строки] } — таблица; { h, rows: [[подпись, значение]] } — таблица реквизитов.
// Ссылки на страницы сайта и приложения и email в тексте становятся кликабельными (src/pages/Legal.jsx).
import { SITE_URL, REQUISITES as R } from './requisites.js'
import { TEXTS } from './texts.js'

const url = (path) => `${SITE_URL}${path}`

export const PATHS = {
  privacy: '/privacy/',
  consent: '/consent/',
  cookies: '/cookies/',
  oferta: '/oferta/',
  adsConsent: '/ads-consent/',
  terms: '/terms/',
  rekvizity: '/rekvizity/',
}

// /legal/<doc> приложения → страница лендинга. Полные адреса https://app.bazaimporta.ru/legal/… не трогаем.
const APP_DOC_PATH = { privacy: PATHS.privacy, consent: PATHS.consent, cookies: PATHS.cookies, terms: PATHS.terms, ads: PATHS.adsConsent, oferta: PATHS.oferta }
const localize = (t) => t.replace(/(?<!app\.bazaimporta\.ru)\/legal\/(privacy|consent|cookies|terms|ads|oferta)\b/g, (_, d) => url(APP_DOC_PATH[d]))
const localizeSections = (sections) =>
  sections.map((s) => ({
    ...s,
    ...(s.p && { p: s.p.map(localize) }),
    ...(s.table && { table: s.table.map((row) => row.map(localize)) }),
  }))

/** Заменяет фрагмент текста приложения; если при обновлении копии фрагмент пропал — сборка падает, а не молча расходится. */
function patch(sections, h, find, replace) {
  const s = sections.find((x) => x.h === h)
  const i = s?.p.findIndex((t) => t.includes(find)) ?? -1
  if (i < 0) throw new Error(`documents.js: в разделе «${h}» не найден текст «${find}» — сверьте с texts.js`)
  s.p[i] = typeof replace === 'function' ? replace(s.p[i]) : s.p[i].replace(find, replace)
}

// Политика cookie — общая с приложением, плюс то, что есть только на лендинге: метки рекламы в sessionStorage и Вебвизор.
function cookieSections() {
  const sections = TEXTS.cookies.sections.map((s) => ({ ...s, p: s.p && [...s.p] }))
  const necessary = sections.find((s) => s.h === '2. Необходимые — всегда включены')
  necessary.p.splice(4, 0, '— baza_utm (sessionStorage на bazaimporta.ru, до закрытия вкладки) — метки рекламы первого захода на сайт;')
  patch(sections, '3. Аналитические — только с вашего согласия', 'В приложении Метрика работает без Вебвизора', (t) =>
    t.replace('В приложении Метрика работает без Вебвизора', 'На сайте bazaimporta.ru Метрика работает с Вебвизором: он записывает действия на страницах — прокрутку, клики, движение курсора; форм с персональными данными на сайте нет. В приложении Метрика работает без Вебвизора'))
  const analytics = sections.find((s) => s.h === '3. Аналитические — только с вашего согласия')
  const isad = analytics.p.findIndex((t) => t.startsWith('— _ym_isad'))
  if (isad < 0) throw new Error('documents.js: в политике cookie не найден пункт _ym_isad — сверьте с texts.js')
  analytics.p.splice(isad + 1, 0, '— _ym_visorc — работа Вебвизора на сайте bazaimporta.ru, 30 минут;')
  patch(sections, '5. Согласие и его отзыв', '«Профиль → Настройки cookie»', 'на сайте bazaimporta.ru — ссылка «Настройки cookie» внизу каждой страницы, в приложении — «Профиль → Настройки cookie»')
  return sections
}

const doc = (path, short, key, sections = TEXTS[key].sections) => ({ path, short, title: TEXTS[key].title, sections: localizeSections(sections) })

export const PRIVACY = doc(PATHS.privacy, 'Политика ПДн', 'privacy')
export const CONSENT = doc(PATHS.consent, 'Согласие на обработку ПДн', 'consent')
export const COOKIES = doc(PATHS.cookies, 'Политика cookie', 'cookies', cookieSections())
export const OFERTA = doc(PATHS.oferta, 'Публичная оферта', 'oferta')
export const ADS_CONSENT = doc(PATHS.adsConsent, 'Согласие на рекламу', 'ads')
export const TERMS = doc(PATHS.terms, 'Пользовательское соглашение', 'terms')

// ——— Реквизиты (только на лендинге; данные — те же, что в разделе 12 оферты) ———
export const REKVIZITY = {
  path: PATHS.rekvizity,
  title: 'Реквизиты и контакты',
  short: 'Реквизиты',
  sections: [
    {
      h: 'Исполнитель',
      rows: [
        ['Наименование', R.entity],
        ['ИНН', R.inn],
        ['ОГРНИП', R.ogrnip],
        ['Адрес', R.address],
      ],
    },
    {
      h: 'Контакты',
      rows: [
        ['Электронная почта', R.email],
        ['Телефон', R.phone],
        ['Поддержка', 'раздел «Поддержка» в приложении https://app.bazaimporta.ru'],
        ['Оплата доступа', 'в приложении https://app.bazaimporta.ru, через ООО «Робокасса»'],
      ],
    },
  ],
}

/** Порядок — как в футере. */
export const DOCUMENTS = [PRIVACY, CONSENT, COOKIES, OFERTA, ADS_CONSENT, TERMS, REKVIZITY]
