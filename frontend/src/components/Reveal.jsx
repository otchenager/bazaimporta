import { useEffect, useRef } from 'react'

/**
 * Появление при скролле. До загрузки JS и при reduced-motion всё видно сразу:
 * анимация включается классом .js, который App ставит после гидратации (см. index.css).
 * Элементы, уже видимые на экране в момент гидратации, помечаются сразу — без мигания.
 */
export default function Reveal({ as: Tag = 'div', children, className = '', delay = 0, ...rest }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (el.getBoundingClientRect().top < window.innerHeight) {
      el.classList.add('is-visible')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add('is-visible')
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined} {...rest}>
      {children}
    </Tag>
  )
}
