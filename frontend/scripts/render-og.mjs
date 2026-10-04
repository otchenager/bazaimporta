// Рендерит scripts/og.html в public/og.jpg (1200×630). Нужен Playwright и Chrome:
//   npx -y playwright@1 ... или CHROME_PATH=... node scripts/render-og.mjs
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import sharp from 'sharp'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--allow-file-access-from-files'],
})
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.goto(pathToFileURL(path.join(root, 'scripts/og.html')).href)
await page.waitForTimeout(600)
const png = await page.screenshot({ type: 'png' })
await browser.close()
await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(root, 'public/og.jpg'))
console.log('public/og.jpg written')
