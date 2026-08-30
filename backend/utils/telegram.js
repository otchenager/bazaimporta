import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOG_DIR = path.join(__dirname, '..', 'logs')
const LOG_FILE = path.join(LOG_DIR, 'failed-notifications.log')

function logFailure(message, error) {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true })
    }
    const line = `[${new Date().toISOString()}] ${message} | error: ${error?.message || error}\n`
    fs.appendFileSync(LOG_FILE, line, 'utf8')
  } catch (fsError) {
    console.error('Failed to write fallback notification log:', fsError)
  }
}

export async function sendAdminNotification(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID

  if (!token || !chatId) {
    logFailure(text, new Error('TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID is not configured'))
    return false
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`Telegram API responded ${res.status}: ${body}`)
    }

    return true
  } catch (error) {
    logFailure(text, error)
    return false
  }
}
