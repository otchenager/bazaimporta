import { useEffect, useRef } from 'react'
import outlines from './car-o.svg?raw'
import details from './car-d.svg?raw'
import fillUrl from './car-fill.svg?url'

// Линейный рисунок Lamborghini Huracán (scripts/car-lineart.py). Передок, закрытый на исходном фото людьми,
// восстановлен по симметрии (scripts/hero-car-restore.py).
// Встроен в HTML, а не <img>: не становится LCP-картинкой и не ждёт отдельного запроса.
//
// Появление — чистый CSS (работает до загрузки JS): маска раскрывает рисунок сверху вниз, по кромке идёт оранжевый «сканер»;
// контуры проявляются чуть раньше деталей. Дальше рисунок статичен, изредка по машине пробегает блик.
// Цветная заливка (scripts/car-fill.py, ~15 КБ gzip) грузится после загрузки страницы и плавно проявляется под линиями;
// пока её нет (или без JS) — тот же рисунок светлыми линиями.
// Ховер (только мышь): наклон ≤ 2.5°, сдвиг ≤ 5 px, линии под курсором ярче. prefers-reduced-motion — всё выключено.
export const VIEWBOX = '0 0 618 294'
const prep = (svg) => ({ __html: svg.replace('<svg ', '<svg width="100%" height="100%" aria-hidden="true" focusable="false" ') })
const OUTLINES = prep(outlines)
const DETAILS = prep(details)

export default function CarArt({ label, className = '' }) {
  const ref = useRef(null)

  const fillRef = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let alive = true
    fetch(fillUrl)
      .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then((svg) => {
        if (!alive || !fillRef.current) return
        fillRef.current.innerHTML = svg.replace('<svg ', '<svg width="100%" height="100%" aria-hidden="true" focusable="false" ')
        requestAnimationFrame(() => el.classList.add('is-filled'))
      })
      .catch(() => {}) // без заливки остаётся линейный рисунок
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const off = []

    // Рисунок ниже первого экрана (телефон): к гидратации анимация уже прошла впустую — повторим, когда он появится
    if (el.getBoundingClientRect().top > window.innerHeight) {
      el.classList.add('art-wait')
      const io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return
          el.classList.remove('art-wait')
          io.disconnect()
        },
        { threshold: 0.2 },
      )
      io.observe(el)
      off.push(() => io.disconnect())
    }

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      let frame = 0
      const move = (e) => {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect()
          const x = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1)
          const y = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1)
          el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
          el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
          el.style.setProperty('--ry', `${((x - 0.5) * 5).toFixed(2)}deg`)
          el.style.setProperty('--rx', `${((0.5 - y) * 4).toFixed(2)}deg`)
          el.style.setProperty('--tx', `${((x - 0.5) * 10).toFixed(1)}px`)
          el.style.setProperty('--ty', `${((y - 0.5) * 6).toFixed(1)}px`)
          el.dataset.hover = ''
        })
      }
      const leave = () => {
        cancelAnimationFrame(frame)
        for (const v of ['--rx', '--ry', '--tx', '--ty']) el.style.removeProperty(v)
        delete el.dataset.hover
      }
      el.addEventListener('pointermove', move)
      el.addEventListener('pointerleave', leave)
      off.push(() => {
        el.removeEventListener('pointermove', move)
        el.removeEventListener('pointerleave', leave)
      })
    }
    return () => off.forEach((f) => f())
  }, [])

  return (
    <div ref={ref} role="img" aria-label={label} className={`art ${className}`}>
      <div className="art-tilt">
        <div ref={fillRef} className="art-l art-lf" />
        <div className="art-l art-lo" dangerouslySetInnerHTML={OUTLINES} />
        <div className="art-l art-ld" dangerouslySetInnerHTML={DETAILS} />
        {/* блик по линиям машины — те же пути через <use>, без копии данных */}
        <svg className="art-l art-glint" viewBox={VIEWBOX} aria-hidden="true" focusable="false" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round">
          <use href="#art-car-o" />
          <use href="#art-car-d" />
        </svg>
        {/* подсветка линий под курсором */}
        <svg className="art-l art-hl" viewBox={VIEWBOX} aria-hidden="true" focusable="false" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round">
          <use href="#art-car-o" />
          <use href="#art-car-d" />
        </svg>
        <span className="art-scan" aria-hidden="true" />
      </div>
    </div>
  )
}
