import sizes from '../assets/img/sizes.json'

// key ('bmw', 'p20-27-45', …) → { webp: { 480, 960 }, avif: { 480, 960 } } — оптимизированные фото 4:5 из src/assets/img.
const files = import.meta.glob('../assets/img/*.{webp,avif}', { eager: true, query: '?url', import: 'default' })

const map = {}
for (const [path, url] of Object.entries(files)) {
  const m = path.match(/\/([^/]+)-(480|960)\.(webp|avif)$/) // -full.webp сюда не попадает
  if (!m) continue
  map[m[1]] ??= { webp: {}, avif: {} }
  map[m[1]][m[3]][m[2]] = url
}

const set = (urls) => `${urls[480]} 480w, ${urls[960]} 960w`

/** srcset для <img>; размеры кадра 4:5. */
export function photoProps(key, sizes = '(max-width: 768px) 90vw, 400px') {
  const p = map[key]
  if (!p) return {}
  return { src: p.webp[480], srcSet: set(p.webp), sizes, width: 480, height: 600 }
}

/** srcset AVIF для <source type="image/avif"> (если есть). */
export const photoAvif = (key) => (map[key]?.avif[480] ? set(map[key].avif) : undefined)

// Полные кадры без кадрирования (name-full.webp) и их размеры — для лайтбокса
const full = import.meta.glob('../assets/img/*-full.webp', { eager: true, query: '?url', import: 'default' })

/** Фото целиком (не 4:5) — для лайтбокса: { src, width, height }. */
export function photoFull(key) {
  const src = full[`../assets/img/${key}-full.webp`]
  const [width, height] = sizes[key] ?? [960, 1200]
  return { src: src ?? map[key]?.webp[960], width, height }
}

export const ALL_PHOTOS = Object.keys(map).sort()
