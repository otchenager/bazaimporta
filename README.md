# BAZA Import — bazaimporta.ru

Лендинг закрытого Telegram-клуба импортёров. Воронка: сайт → бесплатный канал [t.me/bazaimporta](https://t.me/bazaimporta)
→ доступ в закрытый канал через бота [@bazaimporta_bot](https://t.me/bazaimporta_bot) (Robokassa, 4 990 ₽).

## Структура
- `frontend/` — сайт: React 19 + Vite + Tailwind 4, **пререндер в статику** (`/`, `/s-nulya/`, `/profi/`, `/dlya-sebya/`, 404).
  Готовая сборка лежит в `frontend/dist` и выкладывается на reg.ru как есть (Apache, без Node).
- `deploy/regru.sh` — выкладка: `check` / `deploy` / `rollback`. Инструкция — [`docs/deploy.md`](docs/deploy.md), откат — [`docs/rollback.md`](docs/rollback.md).
- `backend/` — Express-сервис для оплаты через Prodamus. **Сейчас не используется** (оплата идёт через бота); код сохранён и защищён тестами.
- `docs/` — план, тексты сайта (`copy.md`), список недостающего контента (`content-needed.md`).
- `audit/` — скриншоты и Lighthouse до/после, конкуренты, оценка по рубрике.
- `brand/` — варианты логотипа, лицензии ассетов.

## Разработка
```bash
cd frontend
npm ci
npm run dev      # http://localhost:5173 (видны заглушки [НУЖЕН КОНТЕНТ])
npm run lint     # oxlint + правила текста
npm run build    # → dist/ (пререндер, .htaccess с CSP, sitemap, ym.js)
```
Тексты — `frontend/src/content/copy.js` и `tracks.js` (зеркало — `docs/copy.md`).

Backend: `cd backend && npm ci && npm test`.
