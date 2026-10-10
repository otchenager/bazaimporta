import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import Reveal from './Reveal.jsx'
import CtaButton from './CtaButton.jsx'
import { COPY, LEGAL, LINKS } from '../content/copy.js'
import { TRACKS } from '../content/tracks.js'
import { track as reachGoal } from '../lib/analytics.js'
import { readUtm } from '../lib/utm.js'
import { COUNTRIES, countryById, formatPhone, phoneComplete, phoneDigits, phoneE164 } from '../lib/phone.js'

const API = '/api/lead.php'
const KEY_STORE = 'baza_lead_key'
const L = COPY.lead

// Ключ идемпотентности живёт в рамках сессии: повторная отправка (двойной клик, ретрай после сбоя сети,
// перезагрузка) приходит с тем же ключом, и сервер не создаёт вторую заявку. После успеха ключ меняется.
function newKey() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('')
}
function sessionKey(rotate = false) {
  try {
    let k = !rotate && sessionStorage.getItem(KEY_STORE)
    if (!k) sessionStorage.setItem(KEY_STORE, (k = newKey()))
    return k
  } catch {
    return null
  }
}

const VALIDATE = {
  name: (v) => {
    const s = v.name.trim()
    return s.length >= 2 && s.length <= 60 && /\p{L}/u.test(s)
  },
  phone: (v) => phoneComplete(v.phone, countryById(v.country)),
  track: (v) => TRACKS.some((t) => t.id === v.track),
  consent: (v) => v.consent,
}
const FIELDS = Object.keys(VALIDATE)

/**
 * Лид-форма «Бесплатная консультация». Без JS (до гидратации) кнопка неактивна: обработчик принимает только JSON.
 * Цели Метрики: lead_form_open (форма на экране), lead_form_start (первый ввод), lead_submit {track} — только при ok от сервера.
 */
export default function LeadForm({ track }) {
  const [v, setV] = useState({ name: '', country: 'ru', phone: '', track: track?.id ?? '', car: '', consent: false, website: '' })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | done
  const [formError, setFormError] = useState('')
  const [ready, setReady] = useState(false)
  const section = useRef(null)
  const form = useRef(null)
  const submitBtn = useRef(null)
  const doneHeading = useRef(null)
  const inflight = useRef(false)
  const started = useRef(false)
  const keyRef = useRef(null)
  const country = countryById(v.country)

  // гидратация: забрать то, что успели ввести до загрузки JS, и включить кнопку
  useEffect(() => {
    const f = form.current
    if (f) {
      const el = f.elements
      setV((s) => ({
        ...s,
        name: el.name?.value ?? s.name,
        phone: phoneDigits(el.phone?.value ?? '', countryById(el.country?.value ?? s.country)),
        country: el.country?.value || s.country,
        car: el.car?.value ?? s.car,
        consent: el.consent?.checked ?? s.consent,
      }))
    }
    keyRef.current = sessionKey() ?? newKey()
    setReady(true)
  }, [])

  // форма показалась на экране — цель один раз
  useEffect(() => {
    const el = section.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          reachGoal('lead_form_open')
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // экранная клавиатура не должна закрывать кнопку: поднимаем страницу, если поле в фокусе остаётся видимым
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const onResize = () => {
      const f = form.current, btn = submitBtn.current, active = document.activeElement
      if (!f || !btn || !f.contains(active) || active === btn) return
      const over = btn.getBoundingClientRect().bottom + 12 - (vv.height + vv.offsetTop)
      const room = active.getBoundingClientRect().top - 80 // под липкой шапкой
      if (over > 0 && room > 0) window.scrollBy({ top: Math.min(over, room) })
    }
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [])

  const markStarted = () => {
    if (started.current) return
    started.current = true
    reachGoal('lead_form_start')
  }
  const set = (field, value) => {
    markStarted()
    const next = { ...v, [field]: value }
    setV(next)
    // ошибку, которую уже показали, снимаем, как только поле исправлено
    if (errors[field] && VALIDATE[field]?.(next)) setErrors((e) => ({ ...e, [field]: false }))
  }
  const check = (field) => setErrors((e) => ({ ...e, [field]: !VALIDATE[field](v) }))

  async function submit(e) {
    e.preventDefault()
    if (inflight.current || status === 'done') return
    const bad = FIELDS.filter((f) => !VALIDATE[f](v))
    setErrors(Object.fromEntries(FIELDS.map((f) => [f, bad.includes(f)])))
    setFormError('')
    if (bad.length) {
      form.current?.querySelector(`[data-field="${bad[0]}"]`)?.focus()
      return
    }
    inflight.current = true
    setStatus('sending')
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 15000)
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          name: v.name.trim(),
          phone: phoneE164(v.phone, country),
          track: v.track,
          car: v.track === 'personal' ? v.car.trim() : '',
          consent: v.consent,
          website: v.website,
          elapsed: Math.round(performance.now()),
          key: keyRef.current,
          page: window.location.pathname,
          utm: readUtm(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        reachGoal('lead_submit', { track: v.track })
        sessionKey(true)
        setStatus('done')
        requestAnimationFrame(() => doneHeading.current?.focus())
        return
      }
      if (res.status === 422 && typeof data.error === 'string') {
        const fields = data.error.replace('invalid:', '').split(',')
        setErrors(Object.fromEntries(FIELDS.map((f) => [f, fields.includes(f)])))
        if (fields.some((f) => FIELDS.includes(f))) {
          form.current?.querySelector(`[data-field="${fields.find((f) => FIELDS.includes(f))}"]`)?.focus()
        } else setFormError(L.errors.server)
      } else setFormError(res.status === 429 ? L.errors.rate : L.errors.server)
      setStatus('idle')
    } catch {
      setFormError(L.errors.server)
      setStatus('idle')
    } finally {
      clearTimeout(timer)
      inflight.current = false
    }
  }

  const err = (field) => errors[field] && (
    <p id={`lead-${field}-err`} className="mt-1.5 text-sm text-danger">
      {L.errors[field]}
    </p>
  )
  const aria = (field) => ({ 'aria-invalid': errors[field] || undefined, 'aria-describedby': errors[field] ? `lead-${field}-err` : undefined })

  return (
    <section id="lead" ref={section} className="border-b border-line bg-bg-alt" aria-labelledby="lead-title">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-8 md:py-24 lg:grid-cols-12 lg:gap-12">
        <Reveal className="lg:col-span-5">
          <p className="kicker">{L.kicker}</p>
          <h2 id="lead-title" className="h-section mt-4">{L.title}</h2>
          <p className="mt-4 max-w-[36ch] text-lg leading-snug text-muted sm:text-xl">{L.sub}</p>
          <ul className="mt-6 hidden space-y-3 sm:block">
            {L.points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <Icon name="check" size={22} className="mt-0.5 shrink-0 text-accent" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="lg:col-span-7">
          <div className="rounded-xl border border-line bg-surface p-5 sm:p-8">
            {status === 'done' ? (
              <div role="status" className="flex flex-col items-start gap-6 py-4">
                <Icon name="check" size={40} className="text-accent" />
                <h3 ref={doneHeading} tabIndex={-1} className="text-3xl leading-tight md:text-4xl">
                  {L.success}
                </h3>
                <CtaButton href={LINKS.channel} goal="lead_thanks_channel" variant="ghost" className="w-full sm:w-auto">
                  {L.successCta}
                </CtaButton>
              </div>
            ) : (
              <form ref={form} onSubmit={submit} noValidate className="grid gap-5" aria-describedby={formError ? 'lead-form-err' : undefined}>
                <div>
                  <label htmlFor="lead-name" className="lead-label">{L.name}</label>
                  <input
                    id="lead-name"
                    name="name"
                    data-field="name"
                    className="lead-input"
                    autoComplete="name"
                    enterKeyHint="next"
                    maxLength={60}
                    value={v.name}
                    onChange={(e) => set('name', e.target.value)}
                    onBlur={() => check('name')}
                    {...aria('name')}
                  />
                  {err('name')}
                </div>

                <div>
                  <label htmlFor="lead-phone" className="lead-label">{L.phone}</label>
                  <div className="flex gap-2">
                    <select
                      name="country"
                      aria-label={L.country}
                      className="lead-input lead-select !w-[6.75rem] shrink-0"
                      value={v.country}
                      onChange={(e) => {
                        const c = countryById(e.target.value)
                        markStarted()
                        setV((s) => ({ ...s, country: c.id, phone: phoneDigits(s.phone, c) }))
                      }}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.id} value={c.id}>{`${c.label} +${c.code}`}</option>
                      ))}
                    </select>
                    <input
                      id="lead-phone"
                      name="phone"
                      data-field="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      enterKeyHint={v.track === 'personal' ? 'next' : 'send'}
                      className="lead-input num-input min-w-0 flex-1"
                      placeholder={country.mask}
                      value={formatPhone(v.phone, country)}
                      onChange={(e) => set('phone', phoneDigits(e.target.value, country))}
                      onBlur={() => check('phone')}
                      {...aria('phone')}
                    />
                  </div>
                  {err('phone')}
                </div>

                <fieldset aria-describedby={errors.track ? 'lead-track-err' : undefined}>
                  <legend className="lead-label">{L.track}</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {TRACKS.map((t, i) => (
                      <label key={t.id} className="lead-choice">
                        <input
                          type="radio"
                          name="track"
                          value={t.id}
                          data-field={i === 0 ? 'track' : undefined}
                          className="sr-only"
                          checked={v.track === t.id}
                          onChange={() => set('track', t.id)}
                        />
                        {t.label}
                      </label>
                    ))}
                  </div>
                  {err('track')}
                </fieldset>

                {v.track === 'personal' && (
                  <div>
                    <label htmlFor="lead-car" className="lead-label">
                      {L.car} <span className="font-normal text-muted">· {L.carHint}</span>
                    </label>
                    <input
                      id="lead-car"
                      name="car"
                      className="lead-input"
                      maxLength={120}
                      enterKeyHint="send"
                      placeholder="Например, Kia Sorento 2023"
                      value={v.car}
                      onChange={(e) => set('car', e.target.value)}
                    />
                  </div>
                )}

                {/* ловушка для ботов: человеку не видна и недоступна с клавиатуры */}
                <div className="lead-trap" aria-hidden="true">
                  <label htmlFor="lead-website">Сайт</label>
                  <input id="lead-website" name="website" tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => setV((s) => ({ ...s, website: e.target.value }))} />
                </div>

                <div>
                  <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-relaxed text-muted">
                    <input
                      type="checkbox"
                      name="consent"
                      data-field="consent"
                      className="lead-check"
                      checked={v.consent}
                      onChange={(e) => set('consent', e.target.checked)}
                      {...aria('consent')}
                    />
                    <span>
                      {L.consent[0]}
                      <a href="/soglasie/" target="_blank" rel="noopener" className="link">{L.consent[1]}</a>
                      {L.consent[2]}
                      <a href="/privacy/" target="_blank" rel="noopener" className="link">{L.consent[3]}</a>
                    </span>
                  </label>
                  {err('consent')}
                </div>

                {formError && (
                  <p id="lead-form-err" role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm">
                    {formError}{' '}
                    <a href={LEGAL.phoneHref} className="link whitespace-nowrap">{LEGAL.phone}</a>
                  </p>
                )}

                <button ref={submitBtn} type="submit" className="btn btn-primary w-full" disabled={!ready || status === 'sending'} aria-busy={status === 'sending'}>
                  <span>{status === 'sending' ? L.sending : L.cta}</span>
                  {status !== 'sending' && <Icon name="arrow" size={20} className="arrow" />}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
