import { Router } from 'express'
import { verifySignature } from '../utils/prodamus.js'
import { formatPaymentMessage, sendAdminNotification } from '../utils/telegram.js'
import { getTariff } from '../utils/tariffs.js'

function extractTelegramUsername(payload) {
  const source = String(payload.customer_extra || payload.comment || payload.order_comment || '')
  const match = source.match(/@([a-zA-Z0-9_]{5,32})/)
  return match ? match[1] : 'не указан'
}

function isSuccessfulStatus(status) {
  if (!status) return false
  const normalized = String(status).toLowerCase()
  return ['success', 'succeeded', 'paid', 'payed', 'completed', 'оплачено'].includes(normalized)
}

export default function createWebhookRouter(env) {
  const router = Router()

  router.post('/prodamus', async (req, res) => {
    const secretKey = env.PRODAMUS_SECRET_KEY
    // Без ключа подлинность уведомления не проверить — такие запросы не принимаем вовсе
    if (!secretKey) {
      console.error('Prodamus webhook rejected: PRODAMUS_SECRET_KEY is not configured')
      return res.status(503).send('Webhook is not configured')
    }

    const payload = { ...(req.body || {}) }
    const signature = payload.signature || req.get('Sign') || req.get('sign')
    delete payload.signature

    if (!verifySignature(payload, signature, secretKey)) {
      console.warn('Prodamus webhook: invalid signature', { orderId: payload.order_id })
      return res.status(400).send('Invalid signature')
    }

    const orderId = String(payload.order_id || payload.order_num || 'неизвестен')
    const status = payload.payment_status || payload.status || ''

    if (isSuccessfulStatus(status)) {
      const tariff = getTariff(orderId.split('-')[0])
      await sendAdminNotification(
        formatPaymentMessage({
          telegramUsername: extractTelegramUsername(payload),
          tariffTitle: tariff ? tariff.title : `заказ ${orderId}`,
          sum: payload.sum || payload.amount || '—',
          email: payload.customer_email || payload.email || '',
        }),
        env,
      )
    } else {
      console.log('Prodamus webhook: non-success status, notification skipped', { orderId, status })
    }

    // Prodamus ожидает ответ 200 OK для подтверждения приёма уведомления
    return res.status(200).send('OK')
  })

  return router
}
