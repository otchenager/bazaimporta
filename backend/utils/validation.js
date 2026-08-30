const TELEGRAM_USERNAME_RE = /^[a-zA-Z0-9_]{5,32}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeTelegramUsername(raw) {
  return String(raw || '').trim().replace(/^@/, '')
}

export function isValidTelegramUsername(username) {
  return TELEGRAM_USERNAME_RE.test(username)
}

export function isValidEmail(email) {
  return EMAIL_RE.test(email)
}
