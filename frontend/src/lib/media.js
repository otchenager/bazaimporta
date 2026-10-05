// Медиа кейса Lamborghini (src/assets/case) и блока 444 (src/assets/444) — готовит scripts/prepare-case-media.py.
// Файлы вида name-<ширина>.webp → { name: { 640: url, 960: url } }.
const files = import.meta.glob(['../assets/case/*.{webp,mp4}', '../assets/444/*.webp'], { eager: true, query: '?url', import: 'default' })

const map = {}
for (const [path, url] of Object.entries(files)) {
  const m = path.match(/\/([^/]+?)(?:-(\d+))?\.(webp|mp4)$/)
  if (!m) continue
  map[m[1]] ??= {}
  map[m[1]][m[2] ?? m[3]] = url
}

export const mediaUrl = (name, key) => map[name]?.[key]

/** src/srcset для <img> из набора ширин; width/height — пропорции кадра (против сдвига вёрстки). */
export function mediaProps(name, sizes, ratio) {
  const set = map[name]
  if (!set) return {}
  const widths = Object.keys(set).filter((k) => /^\d+$/.test(k)).map(Number).sort((a, b) => a - b)
  const [w, h] = ratio
  return {
    src: set[widths[0]],
    srcSet: widths.map((x) => `${set[x]} ${x}w`).join(', '),
    sizes,
    width: w,
    height: h,
  }
}
