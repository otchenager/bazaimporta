# AJ import — лендинг + приём оплат

Одностраничный сайт для продажи доступа к закрытому Telegram-каналу по
импорту автомобилей из Кореи/Китая/Японии, с формой оплаты через Prodamus.

## Структура репозитория

- `frontend/` — React + Vite + Tailwind CSS лендинг (деплой на Vercel)
- `backend/` — Express-сервис: создание заказов Prodamus и приём вебхука об
  оплате (деплой на Railway)

Базы данных нет — сервис только формирует ссылку на оплату и транзитом
обрабатывает вебхук от Prodamus, ничего не сохраняя.

## Быстрый старт локально

```bash
# backend
cd backend
npm install
cp .env.example .env   # заполните значения
npm run dev            # http://localhost:4000

# frontend (в отдельном терминале)
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:4000
npm run dev            # http://localhost:5173
```

## Деплой

1. **Backend → Railway**: Root Directory `backend`, Start Command `npm start`,
   задайте переменные окружения из `backend/.env.example`. После деплоя
   скопируйте публичный URL и укажите `{URL}/webhook/prodamus` в личном
   кабинете Prodamus как адрес уведомлений.
2. **Frontend → Vercel**: Root Directory `frontend`, Build Command
   `npm run build`, Output Directory `dist`. Задайте `VITE_API_URL` равным
   URL backend на Railway. `frontend/vercel.json` уже настроен на SPA-роутинг
   для `/payment` и `/thank-you`.
3. В настройках backend (`CORS_ORIGIN`) укажите домен фронтенда на Vercel.

Подробности по каждой части — в `frontend/README.md` и `backend/README.md`.
