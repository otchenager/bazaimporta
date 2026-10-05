import { useEffect, useRef } from 'react'
import ArrowButton from './ArrowButton.jsx'
import Icon from './Icon.jsx'

/**
 * Просмотр фото на весь экран. Нативный <dialog>: фокус внутри, Esc закрывает, фокус возвращается на кнопку-превью.
 * items: [{ src, alt, width, height }]; index — открытый кадр или null; onChange(n | null).
 * ← → и свайп вбок листают, свайп вниз и клик по фону закрывают.
 */
export default function Lightbox({ items, index, onChange, label = 'Просмотр фото' }) {
  const ref = useRef(null)
  const fig = useRef(null)
  const drag = useRef(null)
  const open = index != null
  const many = items.length > 1
  const go = (n) => onChange((index + n + items.length) % items.length)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  // страница под лайтбоксом не прокручивается
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const prev = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = prev
    }
  }, [open])

  const onKeyDown = (e) => {
    if (!many) return
    if (e.key === 'ArrowLeft') go(-1)
    if (e.key === 'ArrowRight') go(1)
  }

  const setDrag = (dy) => {
    const el = fig.current
    if (!el) return
    el.style.transform = dy ? `translateY(${dy}px)` : ''
    el.style.opacity = dy ? String(Math.max(0.4, 1 - dy / 400)) : ''
  }
  const down = (e) => {
    drag.current = { x: e.clientX, y: e.clientY }
  }
  const move = (e) => {
    const s = drag.current
    if (!s) return
    const dy = e.clientY - s.y
    if (dy > 0 && dy > Math.abs(e.clientX - s.x)) setDrag(dy)
  }
  const up = (e) => {
    const s = drag.current
    drag.current = null
    setDrag(0)
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (dy > 80 && dy > Math.abs(dx)) onChange(null)
    else if (many && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1)
  }

  const item = open ? items[index] : null
  return (
    <dialog
      ref={ref}
      className="lightbox"
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault()
        onChange(null)
      }}
      onClick={(e) => e.target === e.currentTarget && onChange(null)}
      onKeyDown={onKeyDown}
    >
      {item && (
        <>
          <figure
            ref={fig}
            className="lightbox-fig"
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={() => {
              drag.current = null
              setDrag(0)
            }}
          >
            <img key={item.src} src={item.src} alt={item.alt} width={item.width} height={item.height} decoding="async" draggable="false" />
            {many && (
              <figcaption className="num mt-3 text-center text-sm text-muted" aria-live="polite">
                {index + 1} / {items.length}
              </figcaption>
            )}
          </figure>
          <button type="button" className="carousel-arrow lightbox-close" aria-label="Закрыть" onClick={() => onChange(null)}>
            <Icon name="close" size={20} strokeWidth={2} />
          </button>
          {many && (
            <>
              <ArrowButton dir="prev" label="Предыдущее фото" onClick={() => go(-1)} className="lightbox-prev" />
              <ArrowButton dir="next" label="Следующее фото" onClick={() => go(1)} className="lightbox-next" />
            </>
          )}
        </>
      )}
    </dialog>
  )
}
