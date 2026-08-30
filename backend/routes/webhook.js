import { Router } from 'express'
import { verifySignature } from '../utils/prodamus.js'
import { sendAdminNotification } from '../utils/telegram.js'
import { getTariff } from '../utils/tariffs.js'

const router = Router()

function extractTelegramUsername(payload) {
  const source = String(payload.customer_extra || payload.comment || payload.order_comment || '')
  const match = source.match(/@([a-zA-Z0-9_]{5,32})/)
  return match ? match[1] : source.trim() || 'не указан'
}

function isSuccessfulStatus(status) {
  if (!status) return false
  const normalized = String(status).toLowerCase()
  return ['success', 'succeeded', 'paid', 'payed', 'completed', 'оплачено'].includes(normalized)
}

router.post('/prodamus', async (req, res) => {
  const payload = { ...(req.body || {}) }
  const signature = payload.signature || req.get('Sign') || req.get('sign')
  delete payload.signature

  const secretKey = process.env.PRODAMUS_SECRET_KEY
  if (secretKey) {
    const isValid = verifySignature(payload, signature, secretKey)
    if (!isValid) {
      console.warn('Prodamus webhook: invalid signature', { orderId: payload.order_id })
      return res.status(400).send('Invalid signature')
    }
  } else {
    console.warn('PRODAMUS_SECRET_KEY is not configured — skipping signature verification')
  }

  const orderId = payload.order_id || payload.order_num || 'неизвестен'
  const status = payload.payment_status || payload.status || ''
  const sum = payload.sum || payload.amount || '—'
  const email = payload.customer_email || payload.email || ''
  const telegramUsername = extractTelegramUsername(payload)
  const tariff = getTariff(String(orderId).split('-')[0])

  if (isSuccessfulStatus(status)) {
    const lines = [
      '<b>Новый платёж!</b>',
      `Пользователь: @${telegramUsername}`,
      `Тариф: ${tariff ? tariff.title : `заказ ${orderId}`}`,
      `Сумма: ${sum} ₽`,
    ]
    if (email) lines.push(`Email: ${email}`)

    await sendAdminNotification(lines.join('\n'))
  } else {
    console.log('Prodamus webhook: non-success status, notification skipped', { orderId, status })
  }

  // Prodamus ожидает ответ 200 OK для подтверждения приёма уведомления
  return res.status(200).send('OK')
})

export default router
