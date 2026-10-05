// Пререндер: каждый маршрут → dist/<route>/index.html со своим <head>. Плюс 404.html, sitemap.xml,
// .htaccess с CSP-хешем инлайн-скрипта. Метрика — public/metrika.js (подключена в index.html).
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const dist = path.join(root, 'dist')
const ssrEntry = path.join(root, 'dist-ssr', 'entry-server.js')
const { render, PRERENDER_ROUTES } = await import(pathToFileURL(ssrEntry).href)

const SITE = 'https://bazaimporta.ru'
// CSS (≈8 КБ gzip) встраиваем в страницу: минус один блокирующий запрос до первой отрисовки
const template = fs
  .readFileSync(path.join(dist, 'index.html'), 'utf8')
  .replace(/<link rel="stylesheet" crossorigin href="\/assets\/([^"]+\.css)">/, (_, file) => {
    const css = fs.readFileSync(path.join(dist, 'assets', file), 'utf8')
    return `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`
  })
if (template.includes('rel="stylesheet"')) throw new Error('CSS не встроен: проверьте шаблон ссылки на стили')
// Гидратация не срочная (все CTA — обычные ссылки, карточки треков — обычные ссылки на пререндеренные страницы,
// контент виден без JS): бандл грузим через 1,2 с после load, чтобы он не отнимал канал и процессор у первого экрана (LCP)
const entry = template.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/)
if (!entry) throw new Error('не найден <script type=module> в шаблоне')
const loader = `<script>addEventListener('load',function(){setTimeout(function(){var s=document.createElement('script');s.type='module';s.src='${entry[1]}';document.head.appendChild(s)},1200)})</script>`
const templateLowJs = template.replace(entry[0], loader)

// Яндекс Метрика: <script src="/metrika.js"> и <noscript> уже в index.html (public/metrika.js)

// Предзагрузка шрифтов первого экрана: Oswald 700 (H1) и Manrope 400 (текст), кириллица
const assetFiles = fs.readdirSync(path.join(dist, 'assets'))
const preload = ['oswald-cyrillic-700-normal', 'oswald-latin-700-normal', 'manrope-cyrillic-400-normal']
  .map((name) => assetFiles.find((f) => f.startsWith(name) && f.endsWith('.woff2')))
  .filter(Boolean)
  .map((f) => `<link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin>`)
  .join('\n    ')

function page(url, outFile) {
  const { html, head } = render(url)
  const doc = templateLowJs
    .replace('<!--app-head-->', preload + '\n    ' + head)
    .replace('<!--app-html-->', html)
  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  fs.writeFileSync(outFile, doc)
  return doc
}

for (const route of PRERENDER_ROUTES) {
  const out = route === '/' ? path.join(dist, 'index.html') : path.join(dist, route, 'index.html')
  page(route, out)
  console.log('prerendered', route)
}
page('/404', path.join(dist, '404.html'))
console.log('prerendered 404.html')

const indexable = PRERENDER_ROUTES.filter((r) => r !== '/thank-you/')
const today = new Date().toISOString().slice(0, 10)
fs.writeFileSync(
  path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    indexable.map((r) => `  <url><loc>${SITE}${r}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
    `\n</urlset>\n`,
)

// CSP: хеши всех инлайн-скриптов страницы (сейчас один — загрузчик бандла)
const inline = [...templateLowJs.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1])
const hashes = inline.map((s) => `'sha256-${crypto.createHash('sha256').update(s).digest('base64')}'`).join(' ')
const htaccessPath = path.join(dist, '.htaccess')
fs.writeFileSync(htaccessPath, fs.readFileSync(htaccessPath, 'utf8').replaceAll('__INLINE_SCRIPT_HASHES__', hashes))
console.log('csp hashes', hashes)

fs.rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true })
