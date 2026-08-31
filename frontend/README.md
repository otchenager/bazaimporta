# BAZA Import — frontend

Лендинг закрытого Telegram-канала BAZA Import.

Стек: React + Vite + Tailwind CSS v4, React Router.

## Разработка

```bash
npm install
cp .env.example .env   # укажите адрес backend (VITE_API_URL)
npm run dev
```

## Сборка

```bash
npm run build
```

## Структура

- `src/pages/Home.jsx` — сборка лендинга из блоков в `src/components/*`
- `src/pages/Payment.jsx` — форма оплаты (`/payment?tariff=1m|3m|6m`), создаёт заказ через backend и редиректит на Prodamus
- `src/pages/ThankYou.jsx` — страница `/thank-you` после оплаты
- `src/config/tariffs.js` — тарифы (цены и описания)
- `src/config/testimonials.js` — заготовка отзывов для карусели
- `src/config/socials.js` — ссылки на Telegram/Instagram

## Переменные окружения

- `VITE_API_URL` — базовый URL backend (Railway), например `https://aj-import-backend.up.railway.app`

## Деплой

Проект рассчитан на Vercel: Root Directory — `frontend`, Build Command — `npm run build`, Output Directory — `dist`.
