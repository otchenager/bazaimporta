# BAZA Import — редизайн под конверсию. План реализации

> **Для исполнителя:** superpowers:executing-plans (нативно в этой сессии). Шаги — чекбоксы `- [ ]`.

**Цель:** лендинг bazaimporta.ru, на котором каждый из трёх сегментов за 3 секунды узнаёт себя и кликает «Вступить бесплатно» (t.me/bazaimporta) или «Получить доступ» (@bazaimporta_bot).

**Архитектура:** остаёмся на React 19 + Vite + Tailwind 4 (текущий стек, шрифты Oswald + Manrope). Сайт **пререндерится в статический HTML** (SSG: `entry-server` + скрипт `prerender.mjs`) — это обязательно для reg.ru: там нет Node, только Apache. На каждый маршрут — свой `index.html` с мета-тегами, гидратация на клиенте. 3D (three.js) грузится лениво поверх постера и только на сильных устройствах.

**Стек:** React 19, react-router 7, Vite 8, Tailwind 4, three 0.182 (GLTFLoader + DRACOLoader), Playwright + Lighthouse (аудит, вне репозитория).

**Спецификация:** бриф владельца (сообщение от 04.10.2026), `audit/competitors.md`.

## Global Constraints
- Шрифты не меняем: Oswald (заголовки), Manrope (текст).
- Ссылки не меняем: `https://t.me/bazaimporta`, `https://t.me/bazaimporta_bot`, `https://t.me/visagevvvv`, `/oferta.docx`. Добавлять `?start=` к боту — только после «да» владельца (⛔3).
- Никаких выдуманных кейсов, цифр, цен, отзывов. Нет данных — заглушка `[НУЖЕН КОНТЕНТ: …]`, все места в `docs/content-needed.md`.
- Абзац ≤ 2 строк на 375px. Заголовки короткие и жирные.
- Цели Метрики: `cta_hero`, `cta_track_newbie`, `cta_track_pro`, `cta_track_personal`, плюс `cta_header`, `cta_sticky`, `cta_final`, `cta_paid` (оплата через бота).
- Бюджет: Lighthouse mobile Performance ≥ 90, Accessibility ≥ 95, LCP < 2,5 с, CLS < 0,1. Модель ≤ 3 МБ, загрузка после LCP.
- `prefers-reduced-motion` → без анимаций и WebGL, только постер.
- Деплой — статика из `frontend/dist` на reg.ru (Apache), команды вручную в `docs/deploy.md` + `docs/rollback.md`.

## Ключевые решения
1. **Маршруты треков — отдельные пререндеренные страницы `/s-nulya/`, `/profi/`, `/dlya-sebya/` + выбор трека на главной.**
   Клик по карточке — клиентский переход без перезагрузки (мгновенно, как якорь) с прокруткой к блоку трека.
   *Почему не якорь:* у каждой страницы свой `<title>`, description, OG и H1 под свой поисковый спрос
   («как привезти авто из Кореи самому», «обучение автоимпорту с нуля»). На каждую можно вести отдельную рекламу и посты.
   Показывается **один трек за раз**: текста на экране меньше, чем при трёх треках подряд.
2. **3D:** одна модель в hero (суперкар, перекрашенный в фирменный оранжевый) — на сильных устройствах после загрузки страницы.
   В карточках треков вместо трёх лишних моделей — **реальные фото машин клиентов** с hover-наклоном и бликом.
   *Почему:* три модели по 2–3 МБ на мобильном трафике из Telegram убивают Performance ≥ 90.
   Реальные фото одновременно работают на доверие (главный страх рынка — обман, см. конкурентов).
   Lamborghini Huracán с подходящей лицензией (CC-BY, Sketchfab) скачивается только из аккаунта — `[НУЖЕН КОНТЕНТ]`.
   До тех пор стоит Ferrari 458 (CC-BY 4.0, vicent091036). Модель меняется заменой одного файла.
3. **Доверие = реальные фото:** 24 фото передачи машин клиентам из `src/assets/media` (там есть основатель и белый Huracán).
   Видео 29 МБ (`IMG_1785.MP4`) убираем с главной: оно ломает бюджет.
4. **Бэкенд Prodamus** на reg.ru не задеплоен (там нет Node), оплата идёт через бота (Robokassa). Страница `/payment` убрана из маршрутов.
   Код бэкенда остаётся, но с исправлениями безопасности (Task 9).

## File Structure
```
frontend/
  index.html                     шаблон: <!--app-head-->, <!--app-html-->, preload шрифтов
  vite.config.js                 + ssr build
  scripts/prerender.mjs          рендер маршрутов в dist/**/index.html, sitemap.xml
  public/.htaccess               безопасность, кеш, 404, https, без листинга
  public/robots.txt, og.jpg, models/car.glb, draco/*
  src/
    entry-client.jsx             hydrateRoot
    entry-server.jsx             render(url) -> {html, head}
    App.jsx                      маршруты
    content/copy.js              ВСЕ тексты (зеркало docs/copy.md)
    content/tracks.js            3 трека: slug, тексты, фото, цель метрики
    lib/analytics.js             track(goal) -> ym reachGoal, безопасно без счётчика
    lib/motion.js                useReducedMotion, useDeviceTier
    lib/seo.js                   мета для маршрута
    components/  Header, StickyCta, CtaButton, Icon, Logo, Reveal, Footer
    sections/    Hero, TrackPicker, TrackDetail, Trust, HowItWorks, Pricing, FAQ, FinalCta
    three/       HeroCar.jsx (lazy), CarPoster
    pages/       Landing.jsx (главная + треки), ThankYou.jsx, NotFound.jsx
brand/   logo-a.svg, logo-b.svg, logo-c.svg, 3d-licenses.md
docs/    plan.md, copy.md, content-needed.md, deploy.md, rollback.md
audit/   before/, after/, competitors.md, score.md
```

## Review Focus
1. Пользователь открыл сайт из Telegram (in-app WebView, без `requestIdleCallback`, медленная сеть) — страница видна сразу, CTA работают без JS (это обычные `<a href>`).
2. `prefers-reduced-motion` или слабый телефон — WebGL не грузится, виден постер, нет горизонтального скролла.
3. Прямой заход на `/profi/` (холодный, без клиентского роутинга) — Apache отдаёт пререндеренный HTML с правильным H1 и мета, гидратация без ошибок.
4. Нет счётчика Метрики — `track()` ничего не ломает, клик по CTA всё равно уводит в Telegram.
5. Несуществующий URL — 404-страница с CTA, не белый экран.

---

### Task 1: SSG-каркас (пререндер)
**Files:** `frontend/index.html`, `src/entry-client.jsx`, `src/entry-server.jsx`, `scripts/prerender.mjs`, `vite.config.js`, `package.json`, удалить `src/main.jsx`.
- [ ] `entry-server.jsx`: `render(url)` → `renderToString(<StaticRouter location={url}><App/></StaticRouter>)` + `head` из `lib/seo.js`.
- [ ] `prerender.mjs`: для `['/', '/s-nulya/', '/profi/', '/dlya-sebya/', '/thank-you/']` пишет `dist/<route>/index.html`, отдельно `dist/404.html`; генерирует `sitemap.xml`.
- [ ] `npm run build` = `vite build && vite build --ssr src/entry-server.jsx --outDir dist-ssr && node scripts/prerender.mjs`.
- [ ] Проверка: `curl localhost:4173/profi/ | grep '<h1'` показывает H1 трека; в консоли браузера нет hydration mismatch.
- [ ] Commit.

### Task 2: Контент и треки
**Files:** `src/content/copy.js`, `src/content/tracks.js`, `docs/copy.md`, `docs/content-needed.md`.
- [ ] Тексты из `docs/copy.md` переносятся 1:1 в `copy.js`. Каждый трек: `slug, goal, kicker, pain, title, promise, benefits[4]{icon,title}, steps[], case{photo, caption}, cta`.
- [ ] Скрипт-проверка в `scripts/check-copy.mjs`: ни один абзац (`p`-поле) не длиннее 110 символов, заголовки ≤ 8 слов. Запуск в `npm run lint`.
- [ ] Commit.

### Task 3: Дизайн-система и базовые компоненты
**Files:** `src/index.css`, `components/CtaButton.jsx`, `Icon.jsx`, `Reveal.jsx`, `Logo.jsx`, `Header.jsx`, `StickyCta.jsx`, `Footer.jsx`, `lib/analytics.js`, `lib/motion.js`.
- [ ] Токены: фон `#0a0a0a`, поверхность `#141416`, линия `#26262b`, текст `#ececef`, приглушённый `#a3a3ab` (контраст ≥ 4,5:1), акцент `#ff6a00`. Без градиентного текста: акцент только на CTA и ключевых цифрах.
- [ ] `CtaButton({href, goal, children, variant})`: `<a target=_blank rel="noopener">`, `onClick` → `track(goal)`. Фокус-кольцо 2 px.
- [ ] `StickyCta`: только < 768px. Появляется после прокрутки hero и скрывается, когда в зоне видимости финальный CTA (IntersectionObserver). Учитывает `env(safe-area-inset-bottom)`.
- [ ] Commit.

### Task 4: Hero + 3D
**Files:** `sections/Hero.jsx`, `three/HeroCar.jsx`, `three/CarPoster.jsx`, `public/models/car.glb`, `public/draco/`.
- [ ] Постер (оптимизированное фото Huracán из архива, AVIF/WebP, `fetchpriority=high`) — это LCP.
- [ ] `HeroCar`: `lazy(import('three'))`, грузится по `requestIdleCallback` (fallback `setTimeout`) на `high`-устройствах. На `low` — после первого взаимодействия. На reduced-motion — никогда.
- [ ] Вращение за курсором (desktop) и за скроллом (mobile), рендер только на экране (IntersectionObserver + visibilitychange), DPR ≤ 1,5, при `webglcontextlost` — назад к постеру.
- [ ] Commit.

### Task 5: Выбор трека + раздел трека
**Files:** `sections/TrackPicker.jsx`, `sections/TrackDetail.jsx`, `pages/Landing.jsx`, `App.jsx`.
- [ ] 3 карточки-ссылки `<Link to="/profi/">` (без JS это обычные ссылки). Hover: наклон 3D (rotateX/Y ≤ 6°), блик, подъём фото. Активный трек подсвечен.
- [ ] На `/s-nulya/` дорожная карта из 6 шагов с бегущей точкой (как в RuHub, `case-rail`).
- [ ] Переход с главной → `navigate(slug)` + плавная прокрутка к `#track`. На прямом заходе — прокрутки нет, сначала hero.
- [ ] Commit.

### Task 6: Доверие, «Как это работает», тарифы, FAQ, финальный CTA
**Files:** `sections/Trust.jsx`, `HowItWorks.jsx`, `Pricing.jsx`, `FAQ.jsx`, `FinalCta.jsx`.
- [ ] Trust: основатель (фото) + стена реальных фото (горизонтальный ряд со scroll-snap, `loading=lazy`, размеры заданы → CLS 0) + полоса юр. данных.
- [ ] FAQ: нативные `<details>/<summary>` (работает без JS, доступно) + `FAQPage` schema.org.
- [ ] Commit.

### Task 7: Медиа-оптимизация
- [ ] `scripts/optimize-media.mjs` (sharp): фото → WebP 480/960 px, постер hero → AVIF + WebP 750/1500. Оригиналы остаются в `src/assets/media`, в сборку попадают только оптимизированные.
- [ ] Commit.

### Task 8: SEO, OG, аналитика, .htaccess
- [ ] `lib/seo.js`: title/description/canonical/OG/Twitter на маршрут. JSON-LD: `Organization` + `FAQPage`.
- [ ] `og.jpg` 1200×630 (рендер Playwright-ом из шаблона).
- [ ] Метрика: счётчик подключается, только если задан `VITE_YM_ID`. `[НУЖЕН КОНТЕНТ: номер счётчика]`.
- [ ] `.htaccess`: HTTPS-редирект, HSTS, CSP (self + mc.yandex.ru + fonts.googleapis/gstatic), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'`, `Options -Indexes`, запрет dot-файлов и `*.map`, кеш `assets/` на 1 год immutable, `ErrorDocument 404 /404.html`.
- [ ] Commit.

### Task 9: Безопасность бэкенда (не на reg.ru, но в репозитории)
- [ ] Вебхук: без `PRODAMUS_SECRET_KEY` → 503, а не «пропустить проверку».
- [ ] Экранировать HTML в уведомлении Telegram (`escapeHtml`).
- [ ] CORS: без `CORS_ORIGIN` сервер не стартует в production. Лимит тела запроса 10 КБ.
- [ ] `node --test` на escapeHtml и отказ без ключа. Commit.

### Task 10: Логотип
- [ ] `brand/logo-a.svg` (монограмма B + стрелка-трасса), `logo-b.svg` (wordmark BAZA с прорезью-дорогой), `logo-c.svg` (щит-шильдик). Проверка на 32 px и в круге аватара Telegram (рендер в `brand/preview.png`).
- [ ] Commit.

### Task 11: Цикл качества
- [ ] `node audit.mjs <url> audit/after` → скриншоты 375/768/1440 + Lighthouse. Оценка по рубрике в `audit/score.md`. Ниже 10 — исправить и повторить.
- [ ] `audit/after/compare.png` — before/after бок о бок.
- [ ] superpowers:verification-before-completion, engineering:code-review.

### Task 12: Деплой-пакет (⛔ стоп перед продом)
- [ ] `docs/deploy.md`: команды для вставки на сервер (бэкап → проверка Метрики на проде → выкладка `dist` → проверка). `docs/rollback.md`: откат из архива.
- [ ] engineering:deploy-checklist.
