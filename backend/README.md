# AJ import — backend

Express-сервис для создания заказов Prodamus и приёма вебхуков об оплате.
Без базы данных — все данные транзитные, ничего не хранится на сервере
(кроме fallback-лога недоставленных Telegram-уведомлений).

## Разработка

```bash
npm install
cp .env.example .env   # заполните реальными значениями
npm run dev
```

## Эндпоинты

- `GET /health` — проверка живости сервиса
- `POST /api/order` — создаёт заказ и возвращает ссылку на оплату Prodamus
  - body: `{ tariffId: "1m"|"3m"|"6m", telegramUsername: string, email?: string }`
  - response: `{ orderId, paymentUrl }`
- `POST /webhook/prodamus` — принимает уведомление об оплате от Prodamus,
  проверяет HMAC-подпись, шлёт уведомление админу в Telegram

## Переменные окружения

См. `.env.example`. Обязательные для боевой работы:

- `PRODAMUS_SHOP_ID` — поддомен вашей формы оплаты (`{shopId}.payform.ru`)
- `PRODAMUS_SECRET_KEY` — секретный ключ для подписи запросов/вебхуков
- `PRODAMUS_TEST_MODE` — `true`/`false`, переключает `demo_mode` в ссылке оплаты
- `TELEGRAM_BOT_TOKEN` — токен Telegram-бота для уведомлений
- `TELEGRAM_ADMIN_CHAT_ID` — chat_id администратора, куда слать уведомления
- `FRONTEND_URL` — адрес лендинга (для urlReturn/urlSuccess)
- `CORS_ORIGIN` — разрешённый origin фронтенда

## Важно про интеграцию с Prodamus

Названия полей в вебхуке (`payment_status`, `sum`, `customer_email` и т.д.)
и алгоритм подписи соответствуют публичной документации Prodamus на момент
написания. Перед продакшеном сверьте фактический формат вебхука в личном
кабинете Prodamus (Настройки → Уведомления) и при необходимости
скорректируйте `routes/webhook.js` и `utils/prodamus.js`.

## Деплой на Railway

- Root Directory: `backend`
- Start Command: `npm start`
- Задайте все переменные окружения из `.env.example` в настройках проекта Railway
- Укажите публичный URL Railway (`https://.../webhook/prodamus`) как адрес
  уведомлений в личном кабинете Prodamus
