/* Яндекс Метрика, счётчик 113396195. Внешний файл, а не инлайн-скрипт, — чтобы не ослаблять CSP (см. public/.htaccess).
   Хиты при переходах внутри SPA и цели на CTA отправляет приложение (src/lib/analytics.js).
   Счётчик работает только на боевом домене: localhost, 127.0.0.1, превью и чужие хосты не засоряют статистику.
   ALLOW_ANY_HOST = true — временно, для проверки на `npm run preview` с ?_ym_debug=1. В репозитории всегда false. */
(function () {
  var ID = 113396195
  var ALLOW_ANY_HOST = false
  var HOSTS = ['bazaimporta.ru', 'www.bazaimporta.ru']
  if (!ALLOW_ANY_HOST && HOSTS.indexOf(location.hostname) < 0) return
  // защита от повторного подключения файла: init — ровно один раз
  if (window.BAZA_YM_ID) return

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
