import { Router } from 'express'
import crypto from 'crypto'
import { getTariff } from '../utils/tariffs.js'
import { normalizeTelegramUsername, isValidTelegramUsername, isValidEmail } from '../utils/validation.js'
import { buildPaymentUrl } from '../utils/prodamus.js'

const router = Router()

router.post('/order', (req, res) => {
  const { tariffId, telegramUsername, email } = req.body || {}

  const tariff = getTariff(tariffId)
  if (!tariff) {
    return res.status(400).json({ error: 'Некорректный тариф' })
  }

  const username = normalizeTelegramUsername(telegramUsername)
  if (!isValidTelegramUsername(username)) {
    return res.status(400).json({ error: 'Некорректный Telegram username' })
  }

  if (email && !isValidEmail(String(email).trim())) {
    return res.status(400).json({ error: 'Некорректный email' })
  }

  const orderId = `${tariff.id}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`

  try {
    const paymentUrl = buildPaymentUrl({
      orderId,
      tariff,
      telegramUsername: username,
      email: email ? String(email).trim() : undefined,
    })

    return res.json({ orderId, paymentUrl })
  } catch (error) {
    console.error('Failed to build Prodamus payment URL:', error)
    return res.status(500).json({ error: 'Не удалось создать ссылку на оплату' })
  }
})

export default router
