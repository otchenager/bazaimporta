// Раунд 5: телефон, главный CTA, цели и хиты Метрики (счётчик-заглушка), горизонтальный скролл, скриншоты.
// usage: node round5.mjs http://localhost:4181 ../round-5
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const [base, out] = process.argv.slice(2);
const PAGES = [['home', '/'], ['newbie', '/s-nulya/'], ['experienced', '/est-opyt/'], ['personal', '/dlya-sebya/']];
const TEL = 'tel:+79855266961', BOT = 'https://t.me/bazaimporta_bot';
const results = [];
const check = (name, ok, extra = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`);
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });

// заглушка счётчика: metrika.js на localhost молчит, приложение пишет вызовы в window.__ym; переходы по ссылкам гасим
const stub = () => {
  window.BAZA_YM_ID = 113396195;
  window.__ym = [];
  window.ym = (...a) => window.__ym.push(a);
  document.addEventListener('click', (e) => { if (e.target.closest('a[href^="tel:"], a[href^="https://t.me"]')) e.preventDefault(); });
};
const hydrated = (p) => p.waitForFunction(() => document.documentElement.classList.contains('js'), null, { timeout: 10000 });

// 1. Горизонтальный скролл и шапка на узких экранах; телефон в шапке и подвале
for (const w of [360, 375, 430, 1024, 1440]) {
  for (const [name, url] of PAGES) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 }, isMobile: w < 1024, hasTouch: w < 1024 });
    const p = await ctx.newPage();
    const errors = [];
    p.on('pageerror', (e) => errors.push(String(e)));
    p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await p.goto(base + url, { waitUntil: 'networkidle' });
    await hydrated(p);
    const r = await p.evaluate(() => {
      const vis = (el) => { const s = getComputedStyle(el); const b = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && b.width > 0 ? b : null; };
      const head = [...document.querySelectorAll('header a[href^="tel:"]')].map((a) => ({ href: a.getAttribute('href'), box: vis(a), text: a.textContent.trim() })).filter((x) => x.box);
      const foot = [...document.querySelectorAll('footer a[href^="tel:"]')].map((a) => ({ href: a.getAttribute('href'), box: vis(a), text: a.textContent.trim(), font: getComputedStyle(a).fontFamily, color: getComputedStyle(a).color, size: getComputedStyle(a).fontSize })).filter((x) => x.box);
      const hdr = document.querySelector('header > div');
      const kids = [...hdr.querySelectorAll(':scope > a, :scope > nav, :scope > div > a')].map(vis).filter(Boolean);
      return {
        hscroll: document.documentElement.scrollWidth - window.innerWidth,
        head, foot,
        headerFits: kids.every((k) => k.right <= window.innerWidth + 0.5 && k.left >= -0.5),
        overlap: (() => { const a = kids.filter((k) => k.height > 20).sort((x, y) => x.left - y.left); return a.some((k, i) => i && k.left < a[i - 1].right - 0.5); })(),
        footTitle: document.querySelector('footer h2')?.textContent,
      };
    });
    check(`${w}px ${url}: нет горизонтального скролла`, r.hscroll <= 0, `${r.hscroll}px`);
    check(`${w}px ${url}: шапка не ломается (всё в экране, без наложений)`, r.headerFits && !r.overlap);
    const h = r.head[0];
    check(`${w}px ${url}: номер в шапке → ${TEL}${w >= 1024 ? ' (текстом)' : ' (трубка ≥ 44 px)'}`, r.head.length === 1 && h.href === TEL && (w >= 1024 ? h.text === '+7 (985) 526-69-61' : h.box.width >= 44 && h.box.height >= 44), JSON.stringify(r.head.map((x) => [x.text, Math.round(x.box.width), Math.round(x.box.height)])));
    if (w === 375 || w === 1440) {
      const f = r.foot[0];
      check(`${w}px ${url}: подвал «${r.footTitle}» + номер крупно, акцентом, ${TEL}`, r.footTitle === 'База всегда на связи' && f && f.href === TEL && f.text === '+7 (985) 526-69-61' && /Oswald/.test(f.font) && f.color === 'rgb(255, 106, 0)' && parseFloat(f.size) >= 30, f && `${f.size} ${f.color}`);
      check(`${w}px ${url}: ноль ошибок в консоли`, errors.length === 0, errors.slice(0, 3).join(' | '));
    }
    await ctx.close();
  }
}

// 2. Главная: hero, шапка, липкая — «Вступить в базу» → Борис
{
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(base + '/', { waitUntil: 'load' });
  await hydrated(p);
  const get = (sel) => p.$eval(sel, (a) => ({ text: a.textContent.trim(), href: a.getAttribute('href') }));
  const hero = await get('#hero a[data-goal="cta_hero"]'), head = await get('header a[data-goal="cta_header"]'), sticky = await get('.sticky-cta a[data-goal="cta_sticky"]');
  for (const [n, x] of [['hero', hero], ['шапка', head], ['липкая', sticky]]) check(`главная: ${n} «Вступить в базу» → Борис`, x.text === 'Вступить в базу' && x.href === BOT, JSON.stringify(x));
  await p.evaluate(() => window.scrollTo(0, 1600));
  await p.waitForTimeout(700);
  check('главная: липкая CTA появляется после hero', await p.$eval('.sticky-cta', (e) => e.dataset.hidden === 'false'));
  const html = await p.content();
  check('главная: «Вступить бесплатно» — только в карточке бесплатного канала', (html.match(/Вступить бесплатно/g) || []).length === 1 && (await p.$eval('a[data-goal="cta_pricing_free"]', (a) => a.textContent.trim())) === 'Вступить бесплатно');
  await ctx.close();
}

// 3. Цели: ровно один reachGoal на клик (все a[data-goal] на всех страницах + телефон)
const goalsSeen = new Set();
for (const [, url] of PAGES) {
  for (const w of [375, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, isMobile: w < 1024, hasTouch: w < 1024 });
    await ctx.addInitScript(stub);
    const p = await ctx.newPage();
    await p.goto(base + url, { waitUntil: 'load' });
    await hydrated(p);
    const n = await p.$$eval('a[data-goal]', (as) => as.length);
    const bad = [];
    for (let i = 0; i < n; i++) {
      const r = await p.evaluate((i) => {
        const a = document.querySelectorAll('a[data-goal]')[i];
        if (a.closest('[aria-hidden="true"]') || !a.getClientRects().length) return null;
        // ссылки треков — внутренняя навигация; кликаем, но без перехода
        const stop = (e) => e.preventDefault();
        a.addEventListener('click', stop, { once: true });
        window.__ym.length = 0;
        a.click();
        return { goal: a.dataset.goal, calls: window.__ym.filter((c) => c[1] === 'reachGoal').map((c) => c[2]) };
      }, i);
      if (!r) continue;
      goalsSeen.add(r.goal);
      if (r.calls.length !== 1 || r.calls[0] !== r.goal) bad.push(`${r.goal}:${JSON.stringify(r.calls)}`);
    }
    check(`${w}px ${url}: каждый клик по CTA/номеру — ровно одна цель`, bad.length === 0, bad.join(' '));
    await ctx.close();
  }
}
check('цели: phone_click срабатывает', goalsSeen.has('phone_click'), [...goalsSeen].sort().join(', '));

// 4. SPA-хиты: первый заход — без hit; переход по маршруту — hit с title и referer; якорь — без hit
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(stub);
  const p = await ctx.newPage();
  await p.goto(base + '/', { waitUntil: 'load' });
  await hydrated(p);
  await p.waitForTimeout(300);
  const hits = () => p.evaluate(() => window.__ym.filter((c) => c[1] === 'hit'));
  check('хиты: первый заход не дублируется (init уже засчитал)', (await hits()).length === 0);
  await p.click('header nav a[href="/s-nulya/"]');
  await p.waitForURL('**/s-nulya/');
  await p.waitForTimeout(300);
  const h1 = await hits();
  check('хиты: переход / → /s-nulya/ — один hit с url, title, referer', h1.length === 1 && h1[0][2] === base + '/s-nulya/' && h1[0][3].referer === base + '/' && /С нуля|BAZA/.test(h1[0][3].title), JSON.stringify(h1));
  await p.click('#hero a[href="#track"]');
  await p.waitForTimeout(600);
  check('хиты: якорь #track — без hit', (await hits()).length === 1);
  await p.goBack(); // #track → /s-nulya/ (тот же маршрут — без hit)
  await p.goBack(); // → /
  await p.waitForTimeout(400);
  const h2 = await hits();
  check('хиты: «назад» на / — ещё один hit', h2.length === 2 && h2[1][2] === base + '/', JSON.stringify(h2.map((h) => h[2])));
  await ctx.close();
}

// 5. Анимация hero: reduced-motion — рисунок сразу целиком
{
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(base + '/', { waitUntil: 'load' });
  const rm = await p.evaluate(() => ({ anim: getComputedStyle(document.querySelector('.art-lo')).animationName, clip: getComputedStyle(document.querySelector('.art-ld')).clipPath, scan: getComputedStyle(document.querySelector('.art-scan')).display }));
  check('reduced-motion: без анимации, рисунок виден сразу', rm.anim === 'none' && rm.clip === 'none' && rm.scan === 'none', JSON.stringify(rm));
  await ctx.close();
}

// 6. Скриншоты: главная и треки на 375 и 1440 (первый экран + вся страница), hero крупно
if (out) {
  for (const [name, url] of PAGES) {
    for (const w of [375, 1440]) {
      const dir = path.join(out, name);
      fs.mkdirSync(dir, { recursive: true });
      const ctx = await b.newContext({ viewport: { width: w, height: w === 375 ? 812 : 900 }, isMobile: w === 375, hasTouch: w === 375 });
      const p = await ctx.newPage();
      await p.goto(base + url, { waitUntil: 'networkidle' });
      await p.waitForTimeout(2600); // раскрытие рисунка + заливка
      await p.screenshot({ path: path.join(dir, `${w}-fold.png`) });
      await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 100)); } window.scrollTo(0, 0); });
      await p.addStyleTag({ content: 'main > section { content-visibility: visible !important; }' });
      await p.waitForTimeout(800);
      await p.screenshot({ path: path.join(dir, `${w}-full.png`), fullPage: true });
      if (name === 'home') {
        fs.mkdirSync(path.join(out, 'hero'), { recursive: true });
        await p.evaluate(() => window.scrollTo(0, 0));
        await p.waitForTimeout(300);
        await p.locator('#hero').screenshot({ path: path.join(out, 'hero', `${w}.png`) });
      }
      await ctx.close();
    }
  }
}

await b.close();
console.log(results.join('\n'));
console.log(`\n${results.filter((r) => r.startsWith('PASS')).length} PASS, ${results.filter((r) => r.startsWith('FAIL')).length} FAIL`);
