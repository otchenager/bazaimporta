import { useEffect, useId, useRef, useState } from 'react'
import { COPY } from '../content/copy.js'
import { PATHS } from '../legal/documents.js'
import { onOpenCookieSettings, readConsent, saveConsent } from '../lib/consent.js'

const C = COPY.cookies

/**
 * Баннер cookie: фиксированная плашка снизу, без сторонних CMP.
 * Показывается, пока нет выбора текущей версии (src/lib/consent.js); «Настройки cookie» в футере открывает его снова.
 * Не модальный: страницу не блокирует. Пока виден — высота уходит в --consent-h, и липкая CTA поднимается над ним.
 * В SSR не рендерится: выбор хранится в cookie браузера, баннер появляется после гидратации (fixed — без сдвига макета).
 */
export default function CookieBanner() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [choice, setChoice] = useState({ analytics: false, marketing: false })
  const [reopened, setReopened] = useState(false)
  const box = useRef(null)
  const title = useRef(null)
  const returnTo = useRef(null)
  const panelId = useId()

  // первый заход или устаревшая версия — показать
  useEffect(() => {
    if (!readConsent()) setOpen(true)
    return onOpenCookieSettings(() => {
      returnTo.current = document.activeElement
      setChoice(readConsent() ?? { analytics: false, marketing: false })
      setExpanded(true)
      setReopened(true)
      setOpen(true)
      requestAnimationFrame(() => title.current?.focus())
    })
  }, [])

  // высота плашки → --consent-h: липкая CTA и низ страницы поднимаются над ней
  useEffect(() => {
    const root = document.documentElement
    const el = box.current
    if (!open || !el) {
      root.style.removeProperty('--consent-h')
      return
    }
    const ro = new ResizeObserver(() => root.style.setProperty('--consent-h', `${el.offsetHeight}px`))
    ro.observe(el)
    return () => {
      ro.disconnect()
      root.style.removeProperty('--consent-h')
    }
  }, [open])

  const close = () => {
    setOpen(false)
    setExpanded(false)
    // фокус — туда, откуда открывали (ссылка в футере)
    const back = returnTo.current
    returnTo.current = null
    if (back && document.contains(back)) requestAnimationFrame(() => back.focus())
  }
  const decide = (c) => {
    saveConsent(c)
    close()
  }

  // Esc закрывает только повторно открытый баннер: при первом показе выбор нужен
  const onKeyDown = (e) => {
    if (e.key === 'Escape' && reopened && readConsent()) {
      e.stopPropagation()
      close()
    }
  }

  if (!open) return null

  return (
    <div
      ref={box}
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-desc"
      onKeyDown={onKeyDown}
      className="cookie-banner fixed inset-x-0 bottom-0 z-[45] border-t border-line-strong bg-surface/95 backdrop-blur-md"
      data-expanded={expanded}
    >
      <div className="cookie-scroll mx-auto max-w-7xl px-4 py-3 sm:px-8 md:py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-8">
          <div className="min-w-0 flex-1 text-sm leading-snug">
            <h2 id="cookie-title" ref={title} tabIndex={-1} className="font-semibold text-text">
              {C.title}
            </h2>
            <p id="cookie-desc" className="mt-1 text-muted">
              {C.text}{' '}
              <a href={PATHS.cookies} className="link whitespace-nowrap">{C.more}</a>
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:items-center">
            <button type="button" className="btn btn-primary cookie-btn" onClick={() => decide({ analytics: true, marketing: true })}>
              {C.acceptAll}
            </button>
            <button type="button" className="btn btn-ghost cookie-btn" onClick={() => decide({ analytics: false, marketing: false })}>
              {C.necessary}
            </button>
            <button
              type="button"
              className="link col-span-2 min-h-11 justify-self-center px-2 text-sm sm:col-span-1"
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => setExpanded((x) => !x)}
            >
              {C.customize}
            </button>
          </div>
        </div>

        {expanded && (
          <div id={panelId} className="mt-3 border-t border-line pt-3">
            <ul className="grid gap-2 md:grid-cols-3 md:gap-4">
              <li className="cookie-cat">
                <div>
                  <p className="font-semibold">{C.cats.necessary.name}</p>
                  <p className="text-muted">{C.cats.necessary.desc}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-muted">{C.always}</span>
              </li>
              {['analytics', 'marketing'].map((k) => (
                <li key={k} className="cookie-cat">
                  <label htmlFor={`cookie-${k}`} className="cursor-pointer">
                    <span className="block font-semibold">{C.cats[k].name}</span>
                    <span className="block text-muted">{C.cats[k].desc}</span>
                  </label>
                  <input
                    id={`cookie-${k}`}
                    type="checkbox"
                    role="switch"
                    className="cookie-switch"
                    checked={choice[k]}
                    aria-checked={choice[k]}
                    onChange={(e) => setChoice((c) => ({ ...c, [k]: e.target.checked }))}
                  />
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-ghost cookie-btn mt-3 w-full sm:w-auto" onClick={() => decide(choice)}>
              {C.save}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
