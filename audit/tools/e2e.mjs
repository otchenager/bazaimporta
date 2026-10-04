// Поведенческая проверка собранного сайта. usage: node e2e.mjs http://localhost:4181
import { chromium } from 'playwright';
const base = process.argv[2];
const results = [];
const check = (name, ok, extra = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`);
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });

// 1. Десктоп: гидратация, частицы, переход по треку
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto(base + '/', { waitUntil: 'load' });
  await p.waitForFunction(() => document.documentElement.classList.contains('js'), null, { timeout: 8000 }).then(() => check('hydration after load (.js class)', true)).catch(() => check('hydration after load (.js class)', false));
  const canvas = await p.waitForSelector('#hero canvas', { timeout: 8000 }).catch(() => null);
  check('particle canvas mounted on desktop', !!canvas);
  await p.waitForTimeout(2500);
  const posterOpacity = await p.$eval('#hero svg[role=img]', (e) => getComputedStyle(e).opacity).catch(() => 'n/a');
  check('poster faded after WebGL ready', posterOpacity === '0', `opacity=${posterOpacity}`);
  // клиентский переход на трек
  const navs = []; p.on('framenavigated', (f) => f === p.mainFrame() && navs.push(f.url()));
  await p.click('#tracks a[href="/profi/"]');
  await p.waitForURL('**/profi/');
  await p.waitForTimeout(1200);
  const h1 = await p.$eval('h1', (e) => e.textContent);
  const trackTop = await p.$eval('#track', (e) => Math.round(e.getBoundingClientRect().top));
  check('track click → /profi/ with track H1', h1.includes('Поставщики'), h1);
  check('scrolled to #track block', trackTop >= 0 && trackTop < 200, `top=${trackTop}`);
  check('client-side navigation (no full reload)', navs.length <= 1, `navs=${navs.length}`);
  const title = await p.title();
  check('document.title updated', title.startsWith('Поставщики'), title);
  check('no console errors (desktop)', errs.length === 0, errs.slice(0, 2).join(' | '));
  await p.close();
}

// 2. Мобильный: sticky CTA, ссылки, цели
{
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(base + '/dlya-sebya/', { waitUntil: 'load' });
  await p.waitForFunction(() => document.documentElement.classList.contains('js'), null, { timeout: 8000 });
  const hiddenAtTop = await p.$eval('.sticky-cta', (e) => e.dataset.hidden);
  await p.evaluate(() => window.scrollTo(0, document.getElementById('trust').offsetTop));
  await p.waitForTimeout(600);
  const shownMid = await p.$eval('.sticky-cta', (e) => e.dataset.hidden);
  await p.evaluate(() => document.getElementById('final').scrollIntoView());
  await p.waitForTimeout(600);
  const hiddenAtFinal = await p.$eval('.sticky-cta', (e) => e.dataset.hidden);
  check('sticky CTA: hidden on hero, shown mid-page, hidden at final', hiddenAtTop === 'true' && shownMid === 'false' && hiddenAtFinal === 'true', `${hiddenAtTop}/${shownMid}/${hiddenAtFinal}`);
  const links = await p.$$eval('a[data-goal]', (as) => as.map((a) => [a.dataset.goal, a.getAttribute('href'), a.target, a.rel]));
  const allowed = new Set(['https://t.me/bazaimporta', 'https://t.me/bazaimporta_bot']);
  check('all CTA hrefs are channel/bot', links.every(([, h]) => allowed.has(h)), JSON.stringify([...new Set(links.map((l) => l[1]))]));
  check('CTAs open in new tab with rel=noopener', links.every(([, , t, r]) => t === '_blank' && r.includes('noopener')));
  const goals = [...new Set(links.map((l) => l[0]))].sort();
  check('track goal present on /dlya-sebya/', goals.includes('cta_track_personal'), goals.join(','));
  const tapTargets = await p.$$eval('a.btn, summary', (els) => els.filter((e) => e.offsetParent && e.getBoundingClientRect().height < 44).length);
  check('tap targets ≥ 44px', tapTargets === 0, `small=${tapTargets}`);
  // tracking with a fake counter
  await p.evaluate(() => { window.__goals = []; window.ym = (...a) => window.__goals.push(a); });
  await ctx.close();
}

// 3. Reduced motion: без WebGL
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(base + '/', { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  check('reduced-motion: no canvas, poster only', (await p.$('#hero canvas')) === null);
  await ctx.close();
}

// 4. 404 и прямой заход на трек без JS
{
  const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const p = await ctx.newPage();
  const r = await p.goto(base + '/s-nulya/');
  const h1 = await p.$eval('h1', (e) => e.textContent);
  const visibleTrack = await p.$eval('#track .reveal', (e) => getComputedStyle(e).opacity);
  check('no-JS: track page prerendered + content visible', r.status() === 200 && h1.includes('Первая') && visibleTrack === '1', `${r.status()} ${h1} op=${visibleTrack}`);
  const r404 = await p.goto(base + '/does-not-exist');
  check('404 status + page', r404.status() === 404 && (await p.content()).includes('Такой страницы нет'));
  await ctx.close();
}
await b.close();
console.log(results.join('\n'));
