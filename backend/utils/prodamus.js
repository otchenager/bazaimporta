import crypto from 'crypto'

const PRODAMUS_TEST_MODE = String(process.env.PRODAMUS_TEST_MODE || 'true') === 'true'

function sortRecursive(data) {
  if (Array.isArray(data)) {
    return data.map(sortRecursive)
  }
  if (data && typeof data === 'object') {
    const sorted = {}
    for (const key of Object.keys(data).sort()) {
      sorted[key] = sortRecursive(data[key])
    }
    return sorted
  }
  return data
}

// Prodamus-совместимая подпись: HMAC-SHA256 от JSON рекурсивно отсортированных
// по ключу данных (см. документацию Prodamus по проверке подписи вебхука).
export function computeSignature(data, secretKey) {
  const sorted = sortRecursive(data)
  const json = JSON.stringify(sorted)
  return crypto.createHmac('sha256', secretKey).update(json, 'utf8').digest('hex')
}

export function verifySignature(data, signature, secretKey) {
  if (!signature) return false
  const expected = computeSignature(data, secretKey)
  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(String(signature), 'hex')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

// PHP-style query string сериализация (нужна для products[0][name]=... и т.п.)
function buildQueryString(params, prefix = '') {
  const parts = []
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    const paramKey = prefix ? `${prefix}[${key}]` : key
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (item && typeof item === 'object') {
          parts.push(buildQueryString(item, `${paramKey}[${i}]`))
        } else {
          parts.push(`${encodeURIComponent(`${paramKey}[${i}]`)}=${encodeURIComponent(item)}`)
        }
      })
    } else if (typeof value === 'object') {
      parts.push(buildQueryString(value, paramKey))
    } else {
      parts.push(`${encodeURIComponent(paramKey)}=${encodeURIComponent(value)}`)
    }
  }
  return parts.filter(Boolean).join('&')
}

export function buildPaymentUrl({ orderId, tariff, telegramUsername, email }) {
  const shopId = process.env.PRODAMUS_SHOP_ID
  const secretKey = process.env.PRODAMUS_SECRET_KEY
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

  if (!shopId) {
    throw new Error('PRODAMUS_SHOP_ID is not configured')
  }

  const params = {
    do: 'link',
    order_id: orderId,
    customer_email: email || undefined,
    customer_extra: `Telegram: @${telegramUsername}`,
    products: [
      {
        name: `AJ import — доступ к каналу, ${tariff.title}`,
        price: tariff.price,
        quantity: 1,
      },
    ],
    urlReturn: `${frontendUrl}/payment?tariff=${tariff.id}`,
    urlSuccess: `${frontendUrl}/thank-you`,
    demo_mode: PRODAMUS_TEST_MODE ? 1 : 0,
  }

  if (secretKey) {
    params.signature = computeSignature(params, secretKey)
  }

  const baseUrl = `https://${shopId}.payform.ru/`
  return `${baseUrl}?${buildQueryString(params)}`
}

export { PRODAMUS_TEST_MODE }
