// Фоновый луп hero из ролика «ПРИВЕЗЛИ LAMBORGHINI ИЗ КОРЕИ» → public/media/ (не в src/assets: видео не идёт через сборку).
//   FFMPEG=путь/к/ffmpeg node scripts/hero-video.mjs
// Без звука, 25 к/с. Кусок 7:43–7:55: Huracán во дворе склада (корма, разворот, борт) — без людей в кадре и плашек канала.
// Шов лупа незаметен: последние LOOP_FADE с плавно переходят в первый кадр.
// Выход: hero-{540,720}.<хеш>.{mp4,webm} и постер hero-poster-{960,1280}.<хеш>.{webp,avif} (первый кадр лупа = LCP).
// Хеш в имени — файлы можно кешировать навсегда (.htaccess); имена для HeroVideo.jsx — в src/visual/hero-media.json.
// Исходник — 720p, поэтому «десктопная» версия 720p: апскейл до 1080p только раздул бы файл.
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const SRC = path.join(root, 'src/assets/media/ПРИВЕЗЛИ LAMBORGHINI ИЗ КОРЕИ _720p50.mp4')
const OUT = path.join(root, 'public/media')
const FF = process.env.FFMPEG || 'ffmpeg'
const START = 463
const LEN = 11.6
const LOOP_FADE = 0.6
const FPS = 25

const loop =
  `[0:v]fps=${FPS},setpts=PTS-STARTPTS,split[a][b];` +
  `[a]trim=${LOOP_FADE}:${LEN},setpts=PTS-STARTPTS,fps=${FPS}[main];` +
  `[b]trim=0:${LOOP_FADE},setpts=PTS-STARTPTS,fps=${FPS}[head];` +
  `[main][head]xfade=transition=fade:duration=${LOOP_FADE}:offset=${(LEN - 2 * LOOP_FADE).toFixed(2)}`

const run = (args) => execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })
fs.mkdirSync(OUT, { recursive: true })

for (const [h, crf264, crfVp9] of [
  [540, 28, 43],
  [720, 26, 41],
]) {
  const vf = `${loop},scale=-2:${h}:flags=lanczos,format=yuv420p`
  const input = ['-ss', String(START), '-t', String(LEN), '-i', SRC, '-an', '-filter_complex', vf]
  run([...input, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf264), '-profile:v', 'high', '-movflags', '+faststart', path.join(OUT, `hero-${h}.mp4`)])
  run([...input, '-c:v', 'libvpx-vp9', '-crf', String(crfVp9), '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', path.join(OUT, `hero-${h}.webm`)])
}

// постер — первый кадр лупа (после trim он сдвинут на LOOP_FADE): видео стартует с той же картинки, без скачка
const png = path.join(OUT, 'poster.tmp.png')
run(['-ss', String(START + LOOP_FADE), '-i', SRC, '-frames:v', '1', png])
for (const w of [960, 1280]) {
  const img = sharp(png).resize({ width: w })
  await img.clone().webp({ quality: 74 }).toFile(path.join(OUT, `hero-poster-${w}.webp`))
  await img.clone().avif({ quality: 52 }).toFile(path.join(OUT, `hero-poster-${w}.avif`))
}
fs.rmSync(png)

// хеш содержимого в имени; старые версии удаляем
const manifest = {}
for (const f of fs.readdirSync(OUT).sort()) {
  const m = f.match(/^(hero-(?:poster-)?\d+)\.(mp4|webm|webp|avif)$/)
  if (!m) continue
  const file = path.join(OUT, f)
  const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 8)
  const name = `${m[1]}.${hash}.${m[2]}`
  for (const old of fs.readdirSync(OUT)) if (old !== f && old.startsWith(`${m[1]}.`) && old.endsWith(`.${m[2]}`)) fs.rmSync(path.join(OUT, old))
  fs.renameSync(file, path.join(OUT, name))
  manifest[`${m[1]}.${m[2]}`] = `/media/${name}`
  console.log(name.padEnd(32), (fs.statSync(path.join(OUT, name)).size / 1024).toFixed(0), 'КБ')
}
fs.writeFileSync(path.join(root, 'src/visual/hero-media.json'), `${JSON.stringify(manifest, null, 2)}\n`)
