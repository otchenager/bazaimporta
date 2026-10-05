// Converts the original photos in src/assets/media into small WebP + AVIF files in src/assets/img (4:5, 480/960 px).
// Run after adding photos: `npm run media`. Originals are never shipped to the browser.
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const src = path.join(root, 'src/assets/media')
const out = path.join(root, 'src/assets/img')
fs.mkdirSync(out, { recursive: true })

const slug = (f) =>
  path.parse(f).name.replace(/^photo_2026-08-30_/, 'p').replace(/[^a-z0-9]+/gi, '-').replace(/-+$/, '').toLowerCase()

// блоки*.jpg — скриншоты закрытого канала, их режет scripts/prepare-case-media.py
const files = fs.readdirSync(src).filter((f) => /\.(jpe?g|png)$/i.test(f) && !f.startsWith('блоки'))
for (const f of files) {
  const name = slug(f)
  for (const w of [480, 960]) {
    const img = sharp(path.join(src, f)).rotate().resize({ width: w, height: Math.round(w * 1.25), fit: 'cover', position: 'attention' })
    await img.clone().webp({ quality: 72, effort: 6 }).toFile(path.join(out, `${name}-${w}.webp`))
    await img.clone().avif({ quality: 50, effort: 6 }).toFile(path.join(out, `${name}-${w}.avif`))
  }
}

// Open Graph image source: wide crop of the Huracán handover photo
await sharp(path.join(src, 'lamb.jpg'))
  .rotate()
  .resize({ width: 1200, height: 630, fit: 'cover', position: 'attention' })
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile(path.join(root, 'scripts/og-photo.jpg'))

console.log(`optimized ${files.length} photos → ${path.relative(root, out)}`)
