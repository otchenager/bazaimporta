import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import { getTariffById, formatPrice, TARIFFS } from '../config/tariffs.js'
import { API_BASE_URL } from '../config/api.js'

const TELEGRAM_USERNAME_RE = /^[a-zA-Z0-9_]{5,32}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Payment() {
  const [searchParams] = useSearchParams()
  const tariffId = searchParams.get('tariff')
  const tariff = getTariffById(tariffId)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  if (!tariff) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center gap-6">
        <Logo />
        <p className="normal-case text-text-muted font-sans">Тариф не найден. Выберите тариф на главной странице.</p>
        <div className="flex flex-wrap justify-center gap-3">
          {TARIFFS.map((t) => (
            <Link key={t.id} to={`/payment?tariff=${t.id}`} className="text-sm text-accent-light hover:underline">
              {t.title}
            </Link>
          ))}
        </div>
        <Link to="/" className="text-sm text-text-muted hover:text-chrome transition-colors mt-4">
          &larr; На главную
        </Link>
      </div>
    )
  }

  const validate = () => {
    const next = {}
    const cleanUsername = username.trim().replace(/^@/, '')
    if (!TELEGRAM_USERNAME_RE.test(cleanUsername)) {
      next.username = 'Введите корректный Telegram username (5–32 символа: латиница, цифры, "_"), без @'
    }
    if (email.trim() && !EMAIL_RE.test(email.trim())) {
      next.email = 'Введите корректный email или оставьте поле пустым'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    if (!validate()) return

    setLoading(true)
    try {
      const cleanUsername = username.trim().replace(/^@/, '')
      const res = await fetch(`${API_BASE_URL}/api/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tariffId: tariff.id,
          telegramUsername: cleanUsername,
          email: email.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Не удалось создать заказ. Попробуйте ещё раз.')
      }

      const data = await res.json()
      if (!data.paymentUrl) throw new Error('Сервер не вернул ссылку на оплату.')

      window.location.href = data.paymentUrl
    } catch (err) {
      setSubmitError(err.message || 'Произошла ошибка. Попробуйте ещё раз.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-20 flex items-center">
          <Link to="/" aria-label="AJ import — на главную">
            <Logo />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <span className="text-xs tracking-[0.3em] uppercase text-accent-light font-semibold">Оформление доступа</span>
            <h1 className="text-3xl mt-3 text-gradient-chrome normal-case">{tariff.title}</h1>
            <p className="normal-case text-2xl font-display font-semibold text-chrome mt-2">{formatPrice(tariff.price)}</p>
          </div>

          <form onSubmit={handleSubmit} className="card-surface rounded-2xl p-8 space-y-5 text-left" noValidate>
            <div>
              <label htmlFor="username" className="block normal-case text-sm text-text-muted font-sans mb-2">
                Telegram username <span className="text-accent-light">*</span>
              </label>
              <div className="flex items-center gap-0">
                <span className="normal-case bg-surface-2 border border-r-0 border-border rounded-l-lg px-3 py-3 text-text-muted font-sans">@</span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ivanov"
                  autoComplete="off"
                  className="w-full bg-surface-2 border border-border rounded-r-lg px-3 py-3 normal-case font-sans text-text focus:outline-none focus:border-accent/60 transition-colors"
                />
              </div>
              {errors.username && <p className="normal-case text-xs text-accent-light mt-2 font-sans">{errors.username}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block normal-case text-sm text-text-muted font-sans mb-2">
                Email <span className="text-text-muted">(необязательно)</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="off"
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-3 normal-case font-sans text-text focus:outline-none focus:border-accent/60 transition-colors"
              />
              {errors.email && <p className="normal-case text-xs text-accent-light mt-2 font-sans">{errors.email}</p>}
            </div>

            {submitError && <p className="normal-case text-sm text-accent-light font-sans">{submitError}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-accent text-white font-display uppercase tracking-wide py-3 rounded-lg transition-all disabled:opacity-60"
            >
              {loading ? 'Переходим к оплате…' : 'Перейти к оплате'}
            </button>

            <p className="normal-case text-xs text-text-muted font-sans text-center">
              Мы не сохраняем ваши данные — они передаются напрямую в платёжный сервис Prodamus.
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
