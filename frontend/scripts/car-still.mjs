// Статичный кадр 3D-модели на прозрачном фоне → src/visual/car-still.webp (1600×640).
// Это заглушка hero без WebGL / при Save-Data и картинка для scripts/og.html.
// Нужен запущенный dev-сервер (npm run dev) и Playwright:
//   DEV_URL=http://127.0.0.1:5173 CHROME_PATH=... node scripts/car-still.mjs
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const DEV = process.env.DEV_URL || 'http://127.0.0.1:5173'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
// 800×320 CSS-пикселей при DPR 2 → 1600×640
const page = await browser.newPage({ viewport: { width: 800, height: 320 }, deviceScaleFactor: 2 })
await page.goto(DEV + '/')
await page.evaluate(async () => {
  document.documentElement.style.background = document.body.style.background = 'transparent'
  document.body.innerHTML = '<div id="still" style="position:fixed;inset:0"></div>'
  const { startCar3D } = await import('/src/visual/car3d.js')
  const car = await startCar3D(document.getElementById('still'), { url: '/models/huracan.glb', staticFrame: true })
  document.querySelector('.art-3d').style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:1'
  car.render()
  await new Promise(requestAnimationFrame)
})
const png = await page.locator('#still').screenshot({ omitBackground: true })
await browser.close()
const out = path.join(root, 'src/visual/car-still.webp')
await sharp(png).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile(out)
console.log(path.relative(root, out), 'written')
