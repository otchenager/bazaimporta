// <!-- ТРЕБУЕТ ПРОВЕРКИ ЮРИСТОМ -->
// Единственное место с реквизитами юридических документов. Данные — те же, что в веб-приложении app.bazaimporta.ru
// (github.com/valexer3/bazaimporta-app → web/src/legal.js): меняете там — меняйте и здесь.
// Значение в квадратных скобках — плейсхолдер: пока он есть, `node scripts/check-copy.mjs --release` падает.

export const SITE = 'bazaimporta.ru'
export const SITE_URL = `https://${SITE}`
export const APP_SITE_URL = 'https://app.bazaimporta.ru'

// Исполнитель и оператор персональных данных (ключи entity…phone — как в приложении)
export const REQUISITES = {
  entity: 'ИП Малиновский Кирилл Анатольевич',
  entityShort: 'ИП Малиновский К. А.',
  inn: '772702193696',
  ogrnip: '325774600046101',
  address: 'г. Москва, ул. Южнобутовская, д. 21, кв. 28',
  email: 'info@bazaimporta.ru',
  // только в тексте документов (как в приложении); кнопок и ссылок tel: на сайте нет
  phone: '+7 (985) 526-69-61',
}

// Дата редакции документов: выводится вверху каждого документа (= EDITION в web/src/legal/texts.js приложения)
export const EDITION = '27 октября 2026 г.'

// Версии для доказательства согласия (= LEGAL_VERSIONS в server/src/legal.js приложения).
// cookies — общая с приложением: cookie `consent` ставится на .bazaimporta.ru, новая версия снова покажет баннер.
export const VERSIONS = {
  cookies: '2026-10-19', // public/metrika.js получает её через index.html (vite.config.js)
  pd: '2026-10-29',
  ads: '2026-10-19',
}

const isPlaceholder = (v) => typeof v === 'string' && /\[[^\]]+\]/.test(v)

/** Незаполненные обязательные плейсхолдеры: [где, значение]. */
export function missingRequisites() {
  const groups = { REQUISITES, EDITION: { EDITION } }
  return Object.entries(groups).flatMap(([g, o]) =>
    Object.entries(o)
      .filter(([, v]) => isPlaceholder(v))
      .map(([k, v]) => [`${g}.${k}`, v]),
  )
}
