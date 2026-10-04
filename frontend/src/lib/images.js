// key ('bmw', 'p20-27-45', …) → { small, large } — оптимизированные WebP из src/assets/img.
const files = import.meta.glob('../assets/img/*.webp', { eager: true, query: '?url', import: 'default' })

const map = {}
for (const [path, url] of Object.entries(files)) {
  const m = path.match(/\/([^/]+)-(480|960)\.webp$/)
  if (!m) continue
  map[m[1]] ??= {}
  map[m[1]][m[2] === '480' ? 'small' : 'large'] = url
}

export const photo = (key) => map[key]

/** srcset для <img>; размеры кадра 4:5. */
export function photoProps(key, sizes = '(max-width: 768px) 90vw, 400px') {
  const p = map[key]
  if (!p) return {}
  return { src: p.small, srcSet: `${p.small} 480w, ${p.large} 960w`, sizes, width: 480, height: 600 }
}

export const ALL_PHOTOS = Object.keys(map).sort()
