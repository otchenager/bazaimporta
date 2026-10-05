/* Яндекс Метрика, счётчик 113396195. Внешний файл, а не инлайн-скрипт, — чтобы не ослаблять CSP (см. public/.htaccess).
   Хиты при переходах внутри SPA и цели на CTA отправляет приложение (src/lib/analytics.js).
   На localhost счётчик молчит, если в адресе нет ?_ym_debug=1 — чтобы не засорять статистику разработкой. */
(function () {
  var ID = 113396195
  var host = location.hostname
  if ((host === 'localhost' || host === '127.0.0.1') && location.search.indexOf('_ym_debug') < 0) return

  window.BAZA_YM_ID = ID
  // В счётчике включён ecommerce: "dataLayer" — массив должен существовать до инициализации
  window.dataLayer = window.dataLayer || []

  ;(function (m, e, t, r, i, k, a) {
    m[i] =
      m[i] ||
      function () {
        ;(m[i].a = m[i].a || []).push(arguments)
      }
    m[i].l = 1 * new Date()
    // защита от двойной загрузки tag.js
    for (var j = 0; j < document.scripts.length; j++) {
      if (document.scripts[j].src === r) return
    }
    k = e.createElement(t)
    a = e.getElementsByTagName(t)[0]
    k.async = 1
    k.src = r
    a.parentNode.insertBefore(k, a)
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=' + ID, 'ym')

  window.ym(ID, 'init', {
    ssr: true,
    webvisor: true,
    clickmap: true,
    ecommerce: 'dataLayer',
    referrer: document.referrer,
    url: location.href,
    accurateTrackBounce: true,
    trackLinks: true,
  })
})()
