# BAZA Import — frontend

React 19 + Vite + Tailwind 4. Сборка пререндерит страницы в статический HTML: `scripts/prerender.mjs`.

- `src/content/` — все тексты и треки
- `src/sections/` — блоки страницы, `src/components/` — общие элементы
- `src/visual/` — суперкар из частиц (WebGL, без зависимостей) и его статичный постер
- `scripts/optimize-media.mjs` — фото → WebP (`npm run media`), `scripts/render-og.mjs` — OG-картинка
- `public/.htaccess` — безопасность и кеш для Apache (хеш CSP подставляется при сборке)

Подробнее — в корневом README и `docs/`.
