import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { hasValue } from '../components/Todo.jsx'
import { isTodo } from '../content/copy.js'
import { track } from '../lib/analytics.js'
import MEDIA from './hero-media.json'

// Фоновый луп в hero вместо 3D-модели. Файлы — public/media (scripts/hero-video.mjs), мимо сборки;
// имена с хешем — из hero-media.json, который пишет тот же скрипт.
// Постер — LCP: <img> в пререндере, виден сразу. Видео (preload="none") начинает грузиться только после load
// и когда hero на экране; уходит с экрана — пауза. При prefers-reduced-motion и Save-Data — только постер.
// Версия: 720p — экран от 768 px, иначе 540p (≤ 1 МБ). WebM (VP9) первым, MP4 (H.264) — для Safari.
function pickSize() {
  return window.matchMedia('(min-width: 768px)').matches ? 720 : 540
}

export default function HeroVideo({ alt, film, pauseLabel, playLabel, className = '' }) {
  const box = useRef(null)
  const video = useRef(null)
  const [enabled, setEnabled] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false) // остановил сам пользователь
  const userPaused = useRef(false)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || navigator.connection?.saveData) return
    const el = box.current, v = video.current
    if (!el || !v) return
    let io = null
    let loaded = false
    const start = () => {
      io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) {
          if (!loaded) {
            loaded = true
            const h = pickSize()
            for (const [ext, type] of [['webm', 'video/webm; codecs=vp9'], ['mp4', 'video/mp4']]) {
              const s = document.createElement('source')
              s.src = MEDIA[`hero-${h}.${ext}`]
              s.type = type
              v.appendChild(s)
            }
            v.load()
            setEnabled(true)
          }
          if (!userPaused.current) v.play().catch(() => {})
        } else v.pause()
      })
      io.observe(el)
    }
    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })
    return () => {
      window.removeEventListener('load', start)
      io?.disconnect()
    }
  }, [])

  const toggle = () => {
    const v = video.current
    if (!v) return
    userPaused.current = !v.paused
    setPaused(userPaused.current)
    if (v.paused) v.play().catch(() => {})
    else v.pause()
  }

  const showFilm = hasValue(film?.url)
  return (
    <div ref={box} className={`hero-video ${className}`} data-playing={playing}>
      <picture>
        <source type="image/avif" srcSet={`${MEDIA['hero-poster-960.avif']} 960w, ${MEDIA['hero-poster-1280.avif']} 1280w`} sizes="(min-width: 1024px) 40vw, 100vw" />
        <source type="image/webp" srcSet={`${MEDIA['hero-poster-960.webp']} 960w, ${MEDIA['hero-poster-1280.webp']} 1280w`} sizes="(min-width: 1024px) 40vw, 100vw" />
        <img src={MEDIA['hero-poster-960.webp']} width="1280" height="720" alt={alt} fetchPriority="high" />
      </picture>
      <video
        ref={video}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        tabIndex={-1}
        disablePictureInPicture
        onPlaying={() => setPlaying(true)}
      />
      {(showFilm || enabled) && (
        <div className="hero-video-ui">
          {showFilm && (
            <a
              href={isTodo(film.url) ? '#' : film.url}
              target="_blank"
              rel="noopener"
              className="hero-film"
              data-goal="hero_film"
              onClick={() => track('hero_film')}
            >
              <span className="play">
                <Icon name="play" size={14} />
              </span>
              {film.label}
              <span className="text-muted">· {film.meta}</span>
            </a>
          )}
          {enabled && (
            <button type="button" className="hero-pause" onClick={toggle} aria-label={paused ? playLabel : pauseLabel}>
              <Icon name={paused ? 'play' : 'pause'} size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
