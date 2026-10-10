# Выкладка на reg.ru

Сайт — статика (`frontend/dist`, уже собрана и лежит в ветке `redesign`). Node на сервере не нужен.
Всё делает `deploy/regru.sh`: сначала бэкап, затем выкладка, затем проверка живого сайта.

## Команды (вставлять по SSH)

```bash
ssh u3629668@server274.hosting.reg.ru

# 1. Скачать скрипт выкладки
curl -fsSL https://raw.githubusercontent.com/otchenager/bazaimporta/redesign/deploy/regru.sh -o ~/regru.sh

# 2. Посмотреть, как устроен сервер. Ничего не меняет — пришлите вывод, если что-то выглядит странно
bash ~/regru.sh check

# 3. Выложить: бэкап → снимок правок с прода → новая версия → перенос Метрики → проверка
bash ~/regru.sh deploy
```

Если `check` пишет «не нашёл папку сайта»: `ls -la ~ ~/www` и повторить с путём,
например `DOCROOT=~/www/bazaimporta.ru bash ~/regru.sh check`.

## Что делает `deploy`
1. Ищет счётчики на текущей главной.
   - Метрика: счётчик 113396195 уже в `/metrika.js`; если на старом сайте был другой номер — скрипт предупредит.
   - Если находит **другие** пиксели (VK, myTarget, Facebook, Google), **останавливается** и просит прислать вывод — чтобы ничего не потерять.
2. Бэкап всей папки сайта (с `.htaccess` и `.git`) → `~/backups/bazaimporta-ГГГГММДД-ЧЧММСС.tar.gz`.
3. Незакоммиченные правки на проде коммитит в локальную ветку `prod-snapshot-…`. Плюс они лежат в архиве.
4. Ставит новую версию:
   - если сайт отдаётся из `frontend/dist` git-репозитория — переключает репозиторий на `redesign`;
   - иначе копирует `frontend/dist` из `~/bazaimporta-src` в папку сайта. Старые файлы не удаляются.
5. Проверяет на живом сайте:
   - все 4 страницы, OG-картинку, `metrika.js`, sitemap и оферту;
   - что 404 работает и что `/.git` и `/.env` закрыты;
   - что ссылки на канал и бота на месте и что отдаётся CSP.

## Лид-форма (один раз, до первой выкладки ветки `leadform-video`)
`~/config/lead-config.php` с BOT_TOKEN и CHAT_ID (шаблон — `deploy/lead-config.example.php`), папка `~/leads`.
Подробно — `docs/leadform.md`. Выкладка ветки: `BRANCH=leadform-video bash ~/regru.sh deploy`.

## Один раз в панели reg.ru
- **SSL → «Перенаправлять на HTTPS»** — включить. В `.htaccess` редирект не прописан: на reg.ru HTTPS обрабатывает фронтовый сервер, и правило могло бы зациклиться.
- Если `verify` пишет «нет CSP» — включить модуль `mod_headers` (обычно включён).

## После выкладки — руками (3 минуты)
- Открыть сайт с телефона из Telegram: на всех страницах «Вступить в базу» ведёт к боту Бориса (`BORIS_BOT_URL` в `frontend/src/content/copy.js`);
  в канал ведёт только карточка «Бесплатный канал» в тарифах; «Кто ты?» → трек.
- Тап по номеру в шапке (трубка) и в подвале — сразу звонок на +7 (985) 526-69-61.
- `https://www.bazaimporta.ru/…` отдаёт 301 на `https://bazaimporta.ru/…`.
- В треке «Есть опыт» кнопка «Закрытый канал — 4 990 ₽» ведёт в @bazaimporta_bot, оплата открывается.
- Старый адрес `/profi/` отдаёт 301 на `/est-opyt/`.
- Отправить ссылку на сайт в Telegram — превью с картинкой (`/og.jpg`). Если превью старое — @WebpageBot → «обновить».
- Метрика → Цели: создать JavaScript-события `cta_hero`, `cta_header`, `cta_sticky`, `cta_final`, `cta_pricing_free`, `cta_paid`,
  `cta_track_newbie`, `cta_track_experienced`, `cta_track_personal`, `cta_exclusive_newbie`, `cta_exclusive_experienced`,
  `cta_exclusive_personal`, `faq_pay_bot`, `phone_click`, `cta_404`, `cta_thanks`. Цель `cta_track_pro` больше не отправляется.
  С раунда 5 `cta_hero`, `cta_header`, `cta_sticky`, `cta_final` ведут в бот Бориса, а не в канал (имена целей прежние).
- Счётчик работает только на bazaimporta.ru / www.bazaimporta.ru. Проверка на `npm run preview`: в `public/metrika.js`
  временно `ALLOW_ANY_HOST = true`, открыть `?_ym_debug=1`, после проверки вернуть `false`.

## Пересборка (если правили тексты)
```bash
cd frontend
npm ci
npm run lint     # oxlint + правила текста (заголовок ≤ 8 слов, абзац ≤ 110 знаков)
npm run build    # vite → пререндер 4 страниц + 404 → dist/ (с .htaccess, sitemap; Метрика — public/metrika.js)
git add -A && git commit -m "…" && git push
# на сервере: bash ~/regru.sh deploy
```
Новые фото: положить в `frontend/src/assets/media`, затем `npm run media`.
Кейс Lamborghini и превью блока 444: `python scripts/prepare-case-media.py`; рисунок в hero: `python scripts/handshake-lineart.py`
(нужны `pip install opencv-python-headless pillow imageio-ffmpeg`).
