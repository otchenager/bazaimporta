import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createApp, resolveCorsOrigin } from '../app.js'
import { escapeHtml, formatPaymentMessage } from '../utils/telegram.js'
import { computeSignature } from '../utils/prodamus.js'

let server, base
const SECRET = 'test-secret'

function listen(env) {
  return new Promise((resolve) => {
    const s = createApp(env).listen(0, () => resolve(s))
  })
}

before(async () => {
  server = await listen({ PRODAMUS_SECRET_KEY: SECRET, CORS_ORIGIN: 'https://bazaimporta.ru' })
  base = `http://127.0.0.1:${server.address().port}`
})
after(() => server.close())

test('escapeHtml экранирует разметку Telegram HTML', () => {
  assert.equal(escapeHtml('<a href="x">&</a>'), '&lt;a href="x"&gt;&amp;&lt;/a&gt;')
})

test('уведомление о платеже не пропускает HTML из данных платёжки', () => {
  const msg = formatPaymentMessage({ telegramUsername: 'ivan_ivanov', tariffTitle: '1 месяц', sum: '<b>9</b>', email: '<a href="http://evil">x</a>@e.ru' })
  assert.ok(!msg.includes('<a href'), msg)
  assert.ok(msg.includes('&lt;a href'), msg)
  assert.ok(msg.startsWith('<b>Новый платёж!</b>'))
})

test('вебхук без секрета на сервере отвечает 503, а не принимает платёж', async () => {
  const s = await listen({ CORS_ORIGIN: 'https://bazaimporta.ru' })
  const res = await fetch(`http://127.0.0.1:${s.address().port}/webhook/prodamus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: '1m-1', payment_status: 'success', sum: '4900' }),
  })
  s.close()
  assert.equal(res.status, 503)
})

test('вебхук с неверной подписью отклоняется', async () => {
  const res = await fetch(`${base}/webhook/prodamus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Sign: 'deadbeef' },
    body: JSON.stringify({ order_id: '1m-1', payment_status: 'success' }),
  })
  assert.equal(res.status, 400)
})

test('вебхук с верной подписью принимается', async () => {
  const payload = { order_id: '1m-1', payment_status: 'not_paid', sum: '4900' }
  const res = await fetch(`${base}/webhook/prodamus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Sign: computeSignature(payload, SECRET) },
    body: JSON.stringify(payload),
  })
  assert.equal(res.status, 200)
})

test('слишком большое тело запроса отклоняется (413)', async () => {
  const res = await fetch(`${base}/api/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tariffId: '1m', telegramUsername: 'ivan_ivanov', pad: 'x'.repeat(20_000) }),
  })
  assert.equal(res.status, 413)
})

test('в production нельзя запуститься с CORS * или без CORS_ORIGIN', () => {
  assert.throws(() => resolveCorsOrigin({ NODE_ENV: 'production' }))
  assert.throws(() => resolveCorsOrigin({ NODE_ENV: 'production', CORS_ORIGIN: '*' }))
  assert.equal(resolveCorsOrigin({ NODE_ENV: 'production', CORS_ORIGIN: 'https://bazaimporta.ru' }), 'https://bazaimporta.ru')
  assert.equal(resolveCorsOrigin({}), '*')
})
