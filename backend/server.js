import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import orderRouter from './routes/order.js'
import webhookRouter from './routes/webhook.js'

const app = express()

const corsOrigin = process.env.CORS_ORIGIN || '*'
app.use(cors({ origin: corsOrigin }))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api', orderRouter)
app.use('/webhook', webhookRouter)

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`AJ import backend listening on port ${PORT}`)
})
