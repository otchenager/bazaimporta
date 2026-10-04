import express from 'express'
import cors from 'cors'
import createOrderRouter from './routes/order.js'
import createWebhookRouter from './routes/webhook.js'

/** В production разрешён только явный origin сайта; `*` или пусто — ошибка запуска. */
export function resolveCorsOrigin(env) {
  const origin = (env.CORS_ORIGIN || '').trim()
  if (env.NODE_ENV === 'production' && (!origin || origin === '*')) {
    throw new Error('CORS_ORIGIN must be set to the site origin in production (not "*")')
  }
  return origin || '*'
}

export function createApp(env = process.env) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', env.TRUST_PROXY === '1')

  app.use(cors({ origin: resolveCorsOrigin(env) }))
  // Платёжке и форме хватает пары килобайт; большой body — это мусор или атака
  app.use(express.json({ limit: '10kb' }))
  app.use(express.urlencoded({ extended: true, limit: '10kb' }))

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api', createOrderRouter(env))
  app.use('/webhook', createWebhookRouter(env))

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Payload too large' })
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid body' })
    console.error('Unhandled error:', err)
    res.status(500).json({ error: 'Internal server error' })
  })

  return app
}
