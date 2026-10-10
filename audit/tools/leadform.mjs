// e2e лид-формы и видео в hero на собранном dist с настоящим PHP-обработчиком.
// Поднимает сам: заглушку Bot API, php -S (HOME — временная папка с ~/config и ~/leads), serve.mjs с прокси на PHP.
//   PHP_BIN=путь/к/php node leadform.mjs ../../frontend/dist ../leadform-video
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const [distArg = '../../frontend/dist', outArg = '../leadform-video'] = process.argv.slice(2)
const dist = path.resolve(here, distArg), out = path.resolve(here, outArg, 'screens')
fs.mkdirSync(out, { recursive: true })
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PHP = process.env.PHP_BIN || 'php'
const [TG, PHPP, WEB] = [8795, 8794, 4182] // 8792 занят PHP dev-сервера (vite PHP_API)
const BASE = `http://localhost:${WEB}`

// ——— окружение ———
const home = fs.mkdtempSync(path.join(os.tmpdir(), 'lead-e2e-'))
fs.mkdirSync(path.join(home, 'config'))
fs.writeFileSync(path.join(home, 'config/lead-config.php'), `<?php return ['BOT_TOKEN' => 'T:K', 'CHAT_ID' => '1', 'API_BASE' => 'http://127.0.0.1:${TG}'];`)
const tgSent = []
const tg = http.createServer((q, r) => { let b = ''; q.on('data', (c) => (b += c)); q.on('end', () => { tgSent.push(JSON.parse(b)); r.end('{"ok":true}') }) }).listen(TG)
const php = spawn(PHP, ['-S', `127.0.0.1:${PHPP}`, '-t', dist], { env: { ...process.env, HOME: home }, stdio: 'ignore' })
const web = spawn(process.execPath, [path.join(here, 'serve.mjs'), dist, String(WEB)], { env: { ...process.env, PHP_API: `http://127.0.0.1:${PHPP}` }, stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 1200))
const csvRows = () => { const f = path.join(home, 'leads/leads.csv'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim().split('\n').length - 1 : 0 }
const resetRate = () => { const d = path.join(home, 'leads/state'); if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) if (f.startsWith('rl-')) fs.rmSync(path.join(d, f)) }

let fails = 0
const ok = (cond, msg) => { console.log(`${cond ? 'OK  ' : 'FAIL'} ${msg}`); if (!cond) fails++ }

const browser = await chromium.launch({ executablePath: CHROME })
async function open(url, { width = 375, reduced = false } = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height: width < 768 ? 812 : 900 }, deviceScaleFactor: 2, isMobile: width < 768, hasTouch: width < 768,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  })
  // заглушка Метрики: вызовы ym(id, 'reachGoal', goal, params) копятся в window.__goals
  await ctx.addInitScript(() => { window.__goals = []; window.BAZA_YM_ID = 1; window.ym = (...a) => window.__goals.push(a) })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  const posts = []
  page.on('request', (r) => r.url().includes('/api/lead.php') && posts.push(r))
  await page.goto(BASE + url, { waitUntil: 'load' })
  await page.waitForFunction(() => document.documentElement.classList.contains('js'), null, { timeout: 15000 }) // гидратация
  return { ctx, page, errors, posts, goals: () => page.evaluate(() => window.__goals.filter((g) => g[1] === 'reachGoal').map((g) => g[2])) }
}
const shot = (page, name, el) => (el ? page.locator(el).screenshot({ path: path.join(out, name) }) : page.screenshot({ path: path.join(out, name) }))
const noCV = (page) => page.addStyleTag({ content: 'main > section { content-visibility: visible !important; }' })

// ——— 1. hero: порядок на телефоне, постер, видео ———
{
  const { ctx, page, errors } = await open('/')
  const pos = await page.evaluate(() => ['h1', '#hero a[href="#lead"]', '.hero-video'].map((s) => document.querySelector(s).getBoundingClientRect().top))
  ok(pos[0] < pos[1] && pos[1] < pos[2], `375: заголовок → CTA → видео (${pos.map(Math.round).join(' < ')})`)
  ok(await page.evaluate(() => { const i = document.querySelector('.hero-video img'); return i.complete && i.naturalWidth > 0 }), 'постер загружен сразу')
  await page.waitForSelector('.hero-video[data-playing="true"]', { timeout: 15000 }).then(() => ok(true, 'видео пошло (data-playing)'), () => ok(false, 'видео не запустилось'))
  const src = await page.evaluate(() => document.querySelector('.hero-video video').currentSrc)
  ok(/hero-540\./.test(src), `375: мобильная версия ${src.split('/').pop()}`)
  await page.evaluate(() => window.scrollTo(0, 3000))
  await page.waitForTimeout(500)
  ok(await page.evaluate(() => document.querySelector('.hero-video video').paused), 'hero ушёл с экрана — пауза')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(800)
  const head = await page.evaluate(() => { const a = document.querySelector('header a.btn'); return { href: a.getAttribute('href'), text: a.innerText.trim() } })
  ok(head.href === '#lead' && /консультац/i.test(head.text), `шапка справа → лид-форма («${head.text}»)`)
  const film = await page.evaluate(() => document.querySelector('.hero-film')?.getAttribute('href'))
  ok(film === 'https://t.me/bazaimporta_bot', `«Смотреть ролик» → бот Бориса (${film})`)
  ok(Math.round(await page.evaluate(() => document.querySelector('.hero-video video').duration)) === 60, 'луп 60 с')
  await shot(page, '375-home-hero.png')
  ok(errors.length === 0, `без ошибок в консоли ${errors.join(' | ')}`)
  await ctx.close()
}
{
  const { ctx, page } = await open('/', { width: 1440 })
  await page.waitForSelector('.hero-video[data-playing="true"]', { timeout: 15000 }).catch(() => {})
  ok(/hero-720\./.test(await page.evaluate(() => document.querySelector('.hero-video video').currentSrc)), '1440: версия 720p')
  await shot(page, '1440-home-hero.png')
  await ctx.close()
}
{
  const { ctx, page } = await open('/', { reduced: true })
  await page.waitForTimeout(3000)
  const v = await page.evaluate(() => ({ sources: document.querySelectorAll('.hero-video video source').length, playing: document.querySelector('.hero-video').dataset.playing }))
  ok(v.sources === 0 && v.playing === 'false', 'reduced-motion: только постер, видео не грузится')
  await ctx.close()
}

// ——— 2. форма на главной ———
{
  resetRate()
  const { ctx, page, posts, goals } = await open('/')
  await page.click('header a[href="#lead"]')
  await page.waitForTimeout(1200)
  ok((await goals()).includes('lead_cta_header'), 'цель lead_cta_header')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(600)
  await page.click('#hero a[href="#lead"]')
  await page.waitForTimeout(1200)
  ok((await page.evaluate(() => document.getElementById('lead').getBoundingClientRect().top)) < 200, 'кнопка в hero плавно ведёт к форме')
  ok((await goals()).includes('lead_cta_hero') && (await goals()).includes('lead_form_open'), 'цели lead_cta_hero и lead_form_open')
  ok(await page.evaluate(() => document.querySelector('.sticky-cta').dataset.hidden === 'true'), 'липкая CTA спрятана, пока видна форма')

  await page.click('#lead button[type=submit]')
  await page.waitForTimeout(300)
  const errs = await page.locator('#lead .text-danger').allTextContents()
  ok(errs.length === 4 && posts.length === 0, `пустая форма: ${errs.length} ошибки, запросов ${posts.length}`)
  await noCV(page)
  await shot(page, '375-home-form-errors.png', '#lead')

  await page.fill('#lead-name', 'Т')
  await page.fill('#lead-phone', '912')
  await page.locator('#lead-phone').blur()
  ok((await page.locator('#lead-phone-err').count()) === 1 && (await page.locator('#lead-phone').getAttribute('aria-invalid')) === 'true', 'неполный телефон: ошибка при потере фокуса')
  ok((await goals()).includes('lead_form_start'), 'цель lead_form_start на первый ввод')

  await page.fill('#lead-name', 'ТЕСТ e2e')
  await page.fill('#lead-phone', '89123456789')
  ok((await page.inputValue('#lead-phone')) === '(912) 345-67-89', `маска: ${await page.inputValue('#lead-phone')}`)
  ok((await page.locator('#lead-car').count()) === 0, 'поле «Какую машину ищете?» скрыто, пока не выбран «Для себя»')
  await page.click('label.lead-choice:has-text("Для себя")')
  ok((await page.locator('#lead-car').count()) === 1, '«Для себя» → поле машины появилось')
  await page.fill('#lead-car', 'Kia Sorento')
  await page.check('input[name=consent]')
  ok((await page.locator('#lead .text-danger').count()) === 0, 'ошибки снялись после исправления')
  const before = csvRows()
  await page.dblclick('#lead button[type=submit]')
  await page.waitForSelector('#lead [role=status]', { timeout: 10000 })
  await page.waitForTimeout(600)
  ok(posts.length === 1 && csvRows() === before + 1, `двойной клик → одна заявка (запросов ${posts.length}, строк CSV +${csvRows() - before})`)
  const submitGoal = await page.evaluate(() => window.__goals.find((g) => g[2] === 'lead_submit'))
  ok(submitGoal && submitGoal[3]?.track === 'personal', `цель lead_submit {track: ${submitGoal?.[3]?.track}}`)
  ok(tgSent.length >= 1 && /ТЕСТ/.test(tgSent.at(-1).text), 'уведомление ушло в Telegram (заглушка)')
  ok(await page.locator('#lead a[href="https://t.me/bazaimporta"]').count() === 1, 'после успеха — кнопка в канал')
  await shot(page, '375-home-thanks.png', '#lead')
  await ctx.close()
}

// ——— 3. сервер ответил ошибкой → цели нет, сообщение есть ———
{
  const { ctx, page, goals } = await open('/s-nulya/')
  await page.route('**/api/lead.php', (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{"ok":false,"error":"server"}' }))
  await page.locator('#lead').scrollIntoViewIfNeeded()
  ok((await page.locator('input[name=track][value=newbie]').isChecked()), '«С нуля»: трек предзаполнен')
  await page.fill('#lead-name', 'Иван')
  await page.fill('#lead-phone', '9123456789')
  await page.check('input[name=consent]')
  await page.click('#lead button[type=submit]')
  await page.waitForSelector('#lead-form-err')
  ok(!(await goals()).includes('lead_submit'), 'при ошибке сервера lead_submit не отправляется')
  ok(await page.locator('#lead button[type=submit]').isEnabled(), 'кнопка снова активна для повтора')
  await ctx.close()
}

// ——— 4. «Для себя»: форма — сразу под hero ———
{
  const { ctx, page } = await open('/dlya-sebya/')
  const order = await page.evaluate(() => [...document.querySelectorAll('main > section')].map((s) => s.id).slice(0, 3))
  ok(order[0] === 'hero' && order[1] === 'lead', `«Для себя»: порядок ${order.join(' → ')}`)
  ok(await page.locator('input[name=track][value=personal]').isChecked() && (await page.locator('#lead-car').count()) === 1, '«Для себя»: трек выбран, поле машины видно')
  await ctx.close()
}

// ——— 5. 360 px без горизонтального скролла, скриншоты всех страниц ———
for (const url of ['/', '/s-nulya/', '/est-opyt/', '/dlya-sebya/', '/privacy/', '/soglasie/']) {
  const { ctx, page } = await open(url, { width: 360 })
  await noCV(page)
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  ok(over <= 0, `360 px ${url}: горизонтальный скролл ${over}px`)
  await ctx.close()
}
const slug = (u) => (u === '/' ? 'home' : u.replaceAll('/', ''))
for (const width of [375, 1440]) {
  for (const url of ['/', '/s-nulya/', '/est-opyt/', '/dlya-sebya/']) {
    const { ctx, page } = await open(url, { width })
    await page.waitForSelector('.hero-video[data-playing="true"]', { timeout: 10000 }).catch(() => {})
    await shot(page, `${width}-${slug(url)}-hero.png`)
    await noCV(page)
    await page.locator('#lead').scrollIntoViewIfNeeded()
    await page.waitForTimeout(900)
    await shot(page, `${width}-${slug(url)}-form.png`, '#lead')
    await ctx.close()
  }
}
// «Спасибо» на десктопе
{
  resetRate()
  const { ctx, page } = await open('/est-opyt/', { width: 1440 })
  await noCV(page)
  await page.locator('#lead').scrollIntoViewIfNeeded()
  await page.fill('#lead-name', 'ТЕСТ десктоп')
  await page.fill('#lead-phone', '9123456789')
  await page.check('input[name=consent]')
  await page.click('#lead button[type=submit]')
  await page.waitForSelector('#lead [role=status]')
  await page.waitForTimeout(500)
  await shot(page, '1440-est-opyt-thanks.png', '#lead')
  await ctx.close()
}
{
  const { ctx, page } = await open('/privacy/', { width: 375 })
  ok((await page.locator('header a.btn').getAttribute('href')) === '/#lead', 'на /privacy/ кнопка шапки ведёт на /#lead')
  await shot(page, '375-privacy.png')
  await ctx.close()
}

await browser.close()
web.kill(); php.kill(); tg.close()
fs.rmSync(home, { recursive: true, force: true })
console.log(fails ? `\n${fails} FAIL` : '\nвсе проверки пройдены')
process.exit(fails ? 1 : 0)
