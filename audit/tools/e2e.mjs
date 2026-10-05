// Поведенческая проверка собранного сайта. usage: node e2e.mjs http://localhost:4181
import { chromium } from 'playwright';
const base = process.argv[2];
const CHANNEL = 'https://t.me/bazaimporta', BOT = 'https://t.me/bazaimporta_bot';
const results = [];
const check = (name, ok, extra = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`);
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const TRACKS = [['newbie', '/s-nulya/'], ['experienced', '/est-opyt/'], ['personal', '/dlya-sebya/']];
const hydrated = (p) => p.waitForFunction(() => document.documentElement.classList.contains('js'), null, { timeout: 10000 });
const links = (p) => p.$$eval('a[data-goal]', (as) => as.map((a) => ({ goal: a.dataset.goal, href: a.getAttribute('href'), target: a.target, rel: a.rel, text: a.textContent.trim() })));

// Ссылка Бориса — из бандла: на странице трека это href кнопки hero
let BORIS = '';

// 1. CTA → нужные адреса
{
  const p = await b.newPage({ viewport: { width: 375, height: 812 } });
  await p.goto(base + '/', { waitUntil: 'load' });
  const L = await links(p);
  const by = (g) => L.filter((l) => l.goal === g).map((l) => l.href);
  const homeChannel = ['cta_header', 'cta_hero', 'cta_sticky', 'cta_final', 'cta_pricing_free'].every((g) => by(g).length && by(g).every((h) => h === CHANNEL));
  check('home: header/hero/sticky/final/free → канал', homeChannel, JSON.stringify(Object.fromEntries(['cta_header', 'cta_hero', 'cta_sticky', 'cta_final', 'cta_pricing_free'].map((g) => [g, by(g)]))));
  check('home: тариф «Закрытый канал» → бот оплаты', by('cta_paid').length > 0 && by('cta_paid').every((h) => h === BOT));
  check('home: нет CTA треков (cta_exclusive_*)', !L.some((l) => l.goal.startsWith('cta_exclusive')));
  check('все внешние CTA: target=_blank, rel=noopener', L.filter((l) => /^https?:/.test(l.href)).every((l) => l.target === '_blank' && l.rel.includes('noopener')));
  await p.close();
  for (const [id, slug] of TRACKS) {
    const p = await b.newPage({ viewport: { width: 375, height: 812 } });
    await p.goto(base + slug, { waitUntil: 'load' });
    const L = await links(p);
    BORIS ||= L.find((l) => l.goal === `cta_exclusive_${id}`)?.href ?? '';
    const ex = L.filter((l) => l.goal === `cta_exclusive_${id}`);
    const exPlaces = await p.$$eval(`a[data-goal="cta_exclusive_${id}"]`, (as) => as.map((a) => a.closest('header') ? 'header' : a.closest('.sticky-cta') ? 'sticky' : a.closest('section')?.id));
    check(`${slug}: «Вступить в базу» в шапке, hero, липкой кнопке, блоке цены → Борис`, ['header', 'hero', 'sticky', 'track'].every((x) => exPlaces.includes(x)) && ex.every((l) => l.href === BORIS && l.text === 'Вступить в базу'), exPlaces.join(','));
    const wrong = L.filter((l) => !l.goal.startsWith('cta_exclusive') && !['cta_paid', 'cta_pricing_free', 'faq_pay_bot'].includes(l.goal) && !l.goal.startsWith('cta_track_'));
    check(`${slug}: прочих CTA нет (кроме тарифов и карточек треков)`, wrong.length === 0, JSON.stringify(wrong));
    const paid = L.filter((l) => l.goal === 'cta_paid');
    check(`${slug}: тарифы → бот оплаты / бесплатный канал`, paid.every((l) => l.href === BOT) && L.filter((l) => l.goal === 'cta_pricing_free').every((l) => l.href === CHANNEL));
    await p.close();
  }
  check('ссылка на Бориса — @bazaimporta_bot', BORIS === BOT, BORIS);
}

// 2. Тексты, которых быть не должно
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  for (const u of ['/', ...TRACKS.map((t) => t[1])]) {
    await p.goto(base + u, { waitUntil: 'load' });
    const html = (await p.content()).replace(/\u00a0/g, ' ');
    const text = await p.evaluate(() => document.body.innerText.replace(/\u00a0/g, ' '));
    const bad = [];
    if (/Профи/i.test(html)) bad.push('Профи');
    if (/200\+ машин привезено|машин привезено/i.test(text)) bad.push('200+ машин привезено');
    if (/начни бесплатно/i.test(text)) bad.push('НАЧНИ БЕСПЛАТНО');
    if (u !== '/' && /вступить бесплатно/i.test(text)) bad.push('Вступить бесплатно');
    if (/Можно привезти одну машину себе|Гарантируете сроки и цену/.test(html)) bad.push('старый вопрос FAQ');
    if (u !== '/' && /Эксклюзивный канал/.test(text)) bad.push('Эксклюзивный канал');
    if (/НУЖЕН КОНТЕНТ/.test(text)) bad.push('[НУЖЕН КОНТЕНТ] в продакшене');
    check(`${u}: нет старых текстов`, bad.length === 0, bad.join(', '));
    check(`${u}: «Команда с 200+ привезёнными машинами за спиной»`, text.toLowerCase().includes('команда с 200+ привезёнными машинами за спиной'));
  }
  await p.goto(base + '/', { waitUntil: 'load' });
  const faq = await p.$$eval('#faq summary', (s) => s.map((x) => x.textContent.trim()));
  const ld = await p.$$eval('script[type="application/ld+json"]', (s) => s.map((x) => x.textContent).join(' '));
  check('FAQ JSON-LD: новые вопросы, старых нет', ld.includes('А если нет ИП?') && ld.includes('Гарантируете результат?') && !ld.includes('Можно привезти одну машину') && !ld.includes('Гарантируете сроки'));
  check('FAQ: «А если нет ИП?» и «Гарантируете результат?»', faq.includes('А если нет ИП?') && faq.includes('Гарантируете результат?') && !faq.some((q) => q.includes('сроки')), faq.join(' | '));
  const r = await p.goto(base + '/profi/');
  check('/profi/ → 301 → /est-opyt/', r.url().endsWith('/est-opyt/') && r.request().redirectedFrom() !== null && (await r.request().redirectedFrom().response()).status() === 301, r.url());
  check('/est-opyt/: title без «Профи», с «Есть опыт»', /Есть опыт/.test(await p.title()), await p.title());
  await p.close();
}

// 3. Hero: маска сверху вниз 1.6–2.2 с, сканер, контуры раньше деталей, потом статично; reduced-motion — сразу целиком
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(base + '/', { waitUntil: 'commit' });
  await p.waitForSelector('.art-lo');
  await p.waitForTimeout(900);
  const mid = await p.evaluate(() => {
    const cs = (s) => getComputedStyle(document.querySelector(s));
    return { anim: cs('.art-lo').animationName, dur: cs('.art-lo').animationDuration, dO: cs('.art-lo').animationDelay, dD: cs('.art-ld').animationDelay,
      clip: cs('.art-lo').clipPath, scan: cs('.art-scan').animationName, scanOp: cs('.art-scan').opacity };
  });
  await p.waitForTimeout(2600);
  const end = await p.evaluate(() => ({ clipO: getComputedStyle(document.querySelector('.art-lo')).clipPath, clipD: getComputedStyle(document.querySelector('.art-ld')).clipPath,
    scanOp: getComputedStyle(document.querySelector('.art-scan')).opacity,
    running: document.getAnimations().filter((a) => a.playState === 'running' && /art-(reveal|scan)/.test(a.animationName)).length }));
  const bottom = Number((mid.clip.match(/inset\(0px 0px ([\d.]+)%/) || [])[1] ?? -1);
  check('hero: маска art-reveal 1.6–2.2 с', mid.anim === 'art-reveal' && parseFloat(mid.dur) >= 1.6 && parseFloat(mid.dur) <= 2.2, `${mid.anim} ${mid.dur}`);
  check('hero: раскрытие сверху вниз, сканер виден', bottom > 0 && bottom < 100 && mid.scan === 'art-scan' && parseFloat(mid.scanOp) > 0.5, `${mid.clip} scan=${mid.scanOp}`);
  check('hero: контуры раньше деталей', parseFloat(mid.dO) < parseFloat(mid.dD), `${mid.dO} < ${mid.dD}`);
  check('hero: после — целиком и статично, сканер погас', [end.clipO, end.clipD].every((c) => /^(none|inset\(0px( 0px)*( 0%)?\))$/.test(c)) && end.running === 0 && end.scanOp === '0', JSON.stringify(end));
  const svg = await p.$$eval('.art svg path', (ps) => ps.length);
  check('hero: слои рисунка отрисованы', svg >= 9, `paths=${svg}`);
  await p.waitForFunction(() => document.documentElement.classList.contains('js'));
  const box = await p.locator('.art').boundingBox();
  await p.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.1, { steps: 4 });
  await p.waitForTimeout(900);
  const hov = await p.evaluate(() => { const t = new DOMMatrix(getComputedStyle(document.querySelector('.art-tilt')).transform); const el = document.querySelector('.art');
    return { tx: Math.abs(t.m41), ty: Math.abs(t.m42), rot: Math.abs(Math.asin(Math.max(-1, Math.min(1, t.m13))) * 180 / Math.PI), hl: getComputedStyle(document.querySelector('.art-hl')).opacity, hover: el.hasAttribute('data-hover') }; });
  check('hero ховер: наклон ≤ 3°, сдвиг ≤ 6 px, подсветка', hov.hover && hov.rot <= 3 && hov.tx <= 6 && hov.ty <= 6 && Number(hov.hl) > 0, JSON.stringify(hov));
  await p.close();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const q = await ctx.newPage();
  await q.goto(base + '/', { waitUntil: 'commit' });
  await q.waitForSelector('.art-lo');
  await q.waitForTimeout(50);
  const rm = await q.evaluate(() => ({ anim: getComputedStyle(document.querySelector('.art-lo')).animationName, clip: getComputedStyle(document.querySelector('.art-ld')).clipPath, scan: getComputedStyle(document.querySelector('.art-scan')).display }));
  check('reduced-motion: рисунок сразу целиком, без сканера', rm.anim === 'none' && rm.clip === 'none' && rm.scan === 'none', JSON.stringify(rm));
  await ctx.close();
}

// 4. Карточки треков: ховер на десктопе, текст всегда виден на тач-экране
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(base + '/', { waitUntil: 'load' });
  await hydrated(p);
  const card = p.locator('#tracks .track-card').nth(1);
  await card.scrollIntoViewIfNeeded();
  await p.mouse.move(5, 5);
  await p.waitForTimeout(400);
  const rest = await card.evaluate((c) => ({ more: getComputedStyle(c.querySelector('.track-more')).opacity, filter: getComputedStyle(c.querySelector('.track-photo')).filter }));
  await card.hover();
  await p.waitForTimeout(450);
  const hover = await card.evaluate((c) => ({ more: getComputedStyle(c.querySelector('.track-more')).opacity, filter: getComputedStyle(c.querySelector('.track-photo')).filter, tr: getComputedStyle(c.querySelector('.track-photo')).transform, dur: getComputedStyle(c.querySelector('.track-photo')).transitionDuration }));
  check('карточки: в покое подзаголовок скрыт, фото без затемнения', rest.more === '0' && rest.filter === 'none', JSON.stringify(rest));
  check('карточки: ховер — фото тускнеет до 38%, zoom, текст виден, 280 мс', hover.more === '1' && /brightness\(0\.38\)/.test(hover.filter) && hover.tr !== 'none' && /0\.28s/.test(hover.dur), JSON.stringify(hover));
  const sub = await card.locator('.track-more p').textContent();
  check('карточка «Есть опыт»: подзаголовок — текст владельца (tracks.js pain)', sub.startsWith('Для тех, кто уже занимается импортом'), sub);
  await p.close();
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const m = await ctx.newPage();
  await m.goto(base + '/', { waitUntil: 'load' });
  const vis = await m.$$eval('#tracks .track-more', (els) => els.map((e) => getComputedStyle(e).opacity === '1' && e.getBoundingClientRect().height > 20));
  check('карточки на мобильном: подзаголовок виден без ховера', vis.length === 3 && vis.every(Boolean), JSON.stringify(vis));
  await ctx.close();
}

// 5. Кейс Lamborghini (раунд 4): только Huracán — 1 фото + 2 видео; миниатюры помещаются — стрелок нет
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(base + '/', { waitUntil: 'load' });
  await hydrated(p);
  await p.locator('.deal').scrollIntoViewIfNeeded();
  const cur = () => p.$eval('.deal-frame', (f) => (f.querySelector('video') ? f.querySelector('video').getAttribute('src').match(/huracan-(front|walk)/)?.[0] : f.querySelector('img').getAttribute('src').match(/handshake/)?.[0]));
  const n = await p.$$eval('.deal .thumb', (t) => t.length);
  check('кейс: в галерее ровно 3 элемента', n === 3, `n=${n}`);
  const play = await p.$$eval('.deal .thumb', (t) => t.map((x) => !!x.querySelector('svg path[d^="M8 5.5"]')));
  check('кейс: 1 фото + 2 видео (▶ на двух миниатюрах)', JSON.stringify(play) === '[false,true,true]', JSON.stringify(play));
  const ba = await p.$$eval('.deal img, .deal video', (i) => i.map((x) => x.currentSrc || x.getAttribute('src') || '').join(' '));
  check('кейс: BMW и Audi убраны из галереи кейса', !/bmw|audi|cockpit/.test(ba));
  const arrows = await p.$$eval('.deal .carousel-arrow', (a) => a.length);
  check('кейс: 3 миниатюры целиком — стрелки скрыты', arrows === 0, `arrows=${arrows}`);
  const c0 = await cur();
  await p.click('.deal .thumb >> nth=1');
  const c1 = await cur();
  await p.click('.deal .thumb >> nth=2');
  const c2 = await cur();
  check('кейс: миниатюры переключают фото → видео 1 → видео 2', c0 === 'handshake' && c1 === 'huracan-front' && c2 === 'huracan-walk', `${c0}→${c1}→${c2}`);
  await p.focus('.deal .thumb >> nth=2');
  await p.keyboard.press('ArrowRight');
  const k1 = await cur();
  await p.keyboard.press('ArrowLeft');
  const k2 = await cur();
  check('кейс: ← → с клавиатуры на миниатюрах', k1 === 'handshake' && k2 === 'huracan-walk', `${k1}, ${k2}`);
  const h = await p.evaluate(() => {
    const f = document.querySelector('.deal-frame').getBoundingClientRect(), c = document.querySelector('.deal aside').getBoundingClientRect();
    return [Math.round(f.top), Math.round(f.height), Math.round(c.top), Math.round(c.height)];
  });
  check('кейс (1440): карточка по высоте совпадает с фото', Math.abs(h[0] - h[2]) <= 1 && Math.abs(h[1] - h[3]) <= 1, JSON.stringify(h));

  // лента выдач (десктоп): 3 карточки + край 4-й, 4:5, стрелки, клавиатура, ховер, лайтбокс
  const G = '#trust ul.gallery';
  await p.$eval(G, (e) => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await p.waitForTimeout(1200);
  const vis = await p.evaluate((sel) => {
    const ul = document.querySelector(sel); const r = ul.getBoundingClientRect();
    return [...ul.children].slice(0, 5).map((li) => { const b = li.getBoundingClientRect(); return Math.round((Math.max(0, Math.min(b.right, r.right) - Math.max(b.left, r.left)) / b.width) * 100) / 100; });
  }, G);
  check('лента (1440): 3 карточки целиком + край 4-й', vis[0] === 1 && vis[1] === 1 && vis[2] === 1 && vis[3] > 0.1 && vis[3] < 0.6, JSON.stringify(vis));
  const card = await p.$eval(`${G} .gal-card`, (c) => { const r = c.getBoundingClientRect(); return { w: r.width, h: r.height, radius: getComputedStyle(c).borderRadius, border: getComputedStyle(c).borderTopWidth }; });
  check('лента: карточка 4:5, скругление и рамка', Math.abs(card.h / card.w - 1.25) < 0.02 && card.radius !== '0px' && card.border === '1px', JSON.stringify(card));
  const imgOk = await p.$$eval(`${G} img`, (im) => im.every((i) => i.loading === 'lazy' && i.getAttribute('width') && i.getAttribute('height') && i.srcset.includes('960w') && i.parentElement.querySelector('source[type="image/avif"]')));
  check('лента: srcset, AVIF + WebP, lazy, явные размеры', imgOk);
  const alts = await p.$$eval(`${G} img`, (im) => im.slice(0, 2).map((i) => i.alt));
  check('лента: первыми BMW и Audi', /BMW/.test(alts[0]) && /Audi/.test(alts[1]), alts.join(' | '));
  const prevDisabled = await p.$eval('#trust button[aria-label="Предыдущие фото выдач"]', (x) => x.disabled);
  await p.click('#trust button[aria-label="Следующие фото выдач"]');
  await p.waitForTimeout(800);
  const g1 = await p.$eval(G, (e) => e.scrollLeft);
  await p.focus(G);
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(800);
  const g2 = await p.$eval(G, (e) => e.scrollLeft);
  await p.click('#trust button[aria-label="Предыдущие фото выдач"]');
  await p.waitForTimeout(800);
  const g3 = await p.$eval(G, (e) => e.scrollLeft);
  check('лента: стрелки → ←, клавиатура →, в начале «←» неактивна', prevDisabled && g1 > 100 && g2 > g1 + 100 && g3 < g2 - 100, `${prevDisabled} ${g1}→${g2}→${g3}`);
  await p.hover(`${G} li:nth-child(3) .gal-card`);
  await p.waitForTimeout(700);
  const hov = await p.$eval(`${G} li:nth-child(3) .gal-card img`, (i) => [getComputedStyle(i).transform, getComputedStyle(i).filter]);
  check('лента: ховер — zoom 1.03 и ярче', /matrix\(1\.03/.test(hov[0]) && /brightness/.test(hov[1]), hov.join(' '));
  await p.click(`${G} li:nth-child(3) .gal-card`);
  await p.waitForTimeout(400);
  const lb = () => p.evaluate(() => [...document.querySelectorAll('dialog.lightbox')].find((x) => x.open)?.querySelector('img')?.getAttribute('src') ?? null);
  const l0 = await lb();
  await p.keyboard.press('ArrowRight');
  const l1 = await lb();
  await p.click('dialog[open] button[aria-label="Предыдущее фото"]');
  const l2 = await lb();
  const focusIn = await p.evaluate(() => !!document.activeElement?.closest('dialog[open]'));
  await p.keyboard.press('Escape');
  await p.waitForTimeout(200);
  const l3 = await lb();
  const back = await p.evaluate(() => document.activeElement?.className || '');
  check('лайтбокс: открывается, ← → листают, Esc закрывает, фокус возвращается', !!l0 && !!l1 && l1 !== l0 && l2 === l0 && focusIn && l3 === null && /gal-card/.test(back), `${!!l0} ${l1 !== l0} ${l2 === l0} focus=${focusIn} closed=${l3 === null} back=${back}`);
  await p.close();
}
// свайп — настоящим тач-жестом через CDP
{
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  // палец ведёт по элементу: touchStart → 12 × touchMove → touchEnd (synthesizeScrollGesture горизонтальные ленты не листает)
  const swipe = async (sel, dx) => {
    await p.$eval(sel, (e) => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await p.waitForTimeout(300);
    const r = await p.$eval(sel, (e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.left + b.width * 0.7), y: Math.round(b.top + Math.min(b.height / 2, 60)) }; });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [r] });
    for (let i = 1; i <= 12; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: r.x + (dx * i) / 12, y: r.y }] });
      await p.waitForTimeout(16);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await p.waitForTimeout(900);
  };
  await p.goto(base + '/', { waitUntil: 'load' });
  await hydrated(p);
  await swipe('.deal-frame', -200);
  const after = await p.$eval('.deal-frame', (f) => (f.querySelector('video') ? 'video' : 'img'));
  check('кейс (мобильный): свайп по фото листает', after === 'video', after);
  // лента выдач: 1 карточка + край, свайп со scroll-snap; лайтбокс: свайп вбок листает, вниз — закрывает
  const G = '#trust ul.gallery';
  await p.$eval(G, (e) => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const vis = await p.evaluate((sel) => {
    const ul = document.querySelector(sel); const r = ul.getBoundingClientRect();
    return [...ul.children].slice(0, 3).map((li) => { const b = li.getBoundingClientRect(); return Math.round((Math.max(0, Math.min(b.right, r.right) - Math.max(b.left, r.left)) / b.width) * 100) / 100; });
  }, G);
  check('лента (375): 1 карточка + край следующей', vis[0] === 1 && vis[1] > 0.05 && vis[1] < 0.4, JSON.stringify(vis));
  const gs0 = await p.$eval(G, (e) => e.scrollLeft);
  await swipe(G, -200);
  const gs1 = await p.$eval(G, (e) => e.scrollLeft);
  const snapped = await p.evaluate((sel) => { const ul = document.querySelector(sel); return [...ul.children].some((li) => Math.abs(li.offsetLeft - ul.firstElementChild.offsetLeft - ul.scrollLeft) < 3); }, G);
  check('лента (375): свайп листает, scroll-snap по карточке', gs1 > gs0 + 100 && snapped, `${gs0}→${gs1} snapped=${snapped}`);
  await p.tap(`${G} li:nth-child(2) .gal-card`);
  await p.waitForTimeout(400);
  const lbSrc = () => p.evaluate(() => [...document.querySelectorAll('dialog.lightbox')].find((x) => x.open)?.querySelector('img')?.getAttribute('src') ?? null);
  const m0 = await lbSrc();
  await swipe('dialog[open] .lightbox-fig', -160);
  const m1 = await lbSrc();
  const fig = await p.$eval('dialog[open] .lightbox-fig', (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 3) }; });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [fig] });
  for (let i = 1; i <= 12; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: fig.x, y: fig.y + (160 * i) / 12 }] });
    await p.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForTimeout(400);
  const m2 = await lbSrc();
  check('лайтбокс (375): свайп вбок листает, свайп вниз закрывает', !!m0 && !!m1 && m1 !== m0 && m2 === null, `${!!m0} ${m1 !== m0} closed=${m2 === null}`);
  await p.goto(base + '/s-nulya/', { waitUntil: 'load' });
  await hydrated(p);
  const strip = '#track ul.strip';
  const s0 = await p.$eval(strip, (e) => e.scrollLeft);
  await swipe(strip, -220);
  const s1 = await p.$eval(strip, (e) => e.scrollLeft);
  check('444 (мобильный): свайп листает карусель', s1 > s0 + 100, `${s0}→${s1}`);
  await p.click('#track button[aria-label="Следующий материал"]');
  await p.waitForTimeout(700);
  const s2 = await p.$eval(strip, (e) => e.scrollLeft);
  await p.click('#track button[aria-label="Предыдущий материал"]');
  await p.waitForTimeout(700);
  const s3 = await p.$eval(strip, (e) => e.scrollLeft);
  check('444: стрелки → и ← листают', s2 > s1 + 100 && s3 < s2 - 100, `${s1}→${s2}→${s3}`);
  const caps = await p.$$eval('#track figcaption', (f) => f.map((x) => x.textContent));
  check('444: 5 превью с подписями', caps.length === 5 && caps[0].startsWith('Блок 5') && caps[4].startsWith('Текстовые разборы'), caps.length);
  const steps = await p.$$eval('#track ol li', (l) => l.map((x) => x.lastElementChild.textContent.trim()));
  check('С нуля: новая дорожная карта', steps[0] === 'Обучение сайтам (Che168, Guazi, Dongchedi)' && steps[5] === 'Выдача авто клиенту', steps.join(' / '));
  // липкая кнопка
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await p.waitForTimeout(600);
  const hiddenAtTop = await p.$eval('.sticky-cta', (e) => e.dataset.hidden);
  await p.evaluate(() => window.scrollTo({ top: document.getElementById('trust').offsetTop, behavior: 'instant' }));
  await p.waitForTimeout(600);
  const shownMid = await p.$eval('.sticky-cta', (e) => e.dataset.hidden);
  check('липкая кнопка: скрыта на hero, видна в середине', hiddenAtTop === 'true' && shownMid === 'false', `${hiddenAtTop}/${shownMid}`);
  const tapTargets = await p.$$eval('a.btn, summary, .carousel-arrow', (els) => els.filter((e) => e.offsetParent && e.getBoundingClientRect().height < 44).length);
  check('tap targets ≥ 44px', tapTargets === 0, `small=${tapTargets}`);
  await ctx.close();
}

// 6. Ошибки в консоли, клиентский переход по треку, без JS, 404
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto(base + '/', { waitUntil: 'load' });
  await hydrated(p);
  await p.click('#tracks a[href="/est-opyt/"]');
  await p.waitForURL('**/est-opyt/');
  await p.waitForTimeout(1200);
  const h1 = await p.$eval('h1', (e) => e.textContent);
  check('клик по треку → /est-opyt/ с H1 «Уже возишь авто?»', h1 === 'Уже возишь авто?', h1);
  check('нет ошибок в консоли', errs.length === 0, errs.slice(0, 2).join(' | '));
  await p.close();
  const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const q = await ctx.newPage();
  const r = await q.goto(base + '/s-nulya/');
  const nh1 = await q.$eval('h1', (e) => e.textContent);
  const art = await q.$eval('.art', (s) => s.getBoundingClientRect().height);
  check('без JS: трек пререндерен, рисунок на месте', r.status() === 200 && nh1 === 'Хочешь зайти в автобизнес?' && art > 100, `${r.status()} ${nh1} art=${art}`);
  const r404 = await q.goto(base + '/does-not-exist');
  check('404 status + page', r404.status() === 404 && (await q.content()).includes('Такой страницы нет'));
  await ctx.close();
}
// 7. Метрика: hit при смене маршрута (первый не дублируется), reachGoal на CTA. tag.js не грузим — ym подменён.
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route(/mc\.yandex\.(ru|com)/, (r) => r.abort());
  await ctx.addInitScript(() => { window.__ym = []; window.ym = (...a) => window.__ym.push(a); });
  const p = await ctx.newPage();
  ctx.on('page', (np) => np !== p && np.close().catch(() => {}));
  await p.goto(base + '/?_ym_debug=1', { waitUntil: 'load' });
  await hydrated(p);
  await p.waitForTimeout(400);
  const init = await p.evaluate(() => window.__ym.filter((c) => c[1] === 'init').map((c) => [c[0], c[2].ecommerce, c[2].webvisor, c[2].ssr]));
  check('Метрика: init 113396195 (ecommerce dataLayer, webvisor, ssr), dataLayer есть', JSON.stringify(init) === '[[113396195,"dataLayer",true,true]]' && (await p.evaluate(() => Array.isArray(window.dataLayer))), JSON.stringify(init));
  check('Метрика: на загрузке нет лишнего hit', (await p.evaluate(() => window.__ym.filter((c) => c[1] === 'hit').length)) === 0);
  await p.click('#tracks a[href="/est-opyt/"]');
  await p.waitForURL('**/est-opyt/');
  await p.waitForTimeout(500);
  const hits = await p.evaluate(() => window.__ym.filter((c) => c[1] === 'hit').map((c) => [c[2], c[3]?.referer]));
  check('Метрика: hit при смене маршрута с referer', hits.length === 1 && hits[0][0].endsWith('/est-opyt/') && hits[0][1].includes('/?_ym_debug=1'), JSON.stringify(hits));
  await p.click('#hero a[data-goal="cta_exclusive_experienced"]');
  await p.waitForTimeout(300);
  const goals = await p.evaluate(() => window.__ym.filter((c) => c[1] === 'reachGoal').map((c) => c[2]));
  check('Метрика: reachGoal на выбор трека и CTA', goals.includes('cta_track_experienced') && goals.includes('cta_exclusive_experienced'), goals.join(','));
  const counters = await p.evaluate(() => [...document.scripts].filter((s) => /metrika|tag\.js|ym\.js/.test(s.src)).map((s) => s.src.replace(location.origin, '')));
  check('один счётчик: только /metrika.js (+ tag.js?id=113396195)', counters.every((s) => s === '/metrika.js' || s.includes('tag.js?id=113396195')) && counters.includes('/metrika.js'), counters.join(' '));
  await ctx.close();
}

// «Есть опыт»: 5 шагов «Как растёт маржа», 4-й с оранжевой суммой; скриншот переписки в лайтбоксе
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(base + '/est-opyt/', { waitUntil: 'load' });
  await hydrated(p);
  const steps = await p.$$eval('#track ol li', (l) => l.map((x) => x.textContent.replace(/^\d+/, '').replace(/\s+/g, ' ').trim()));
  const acc = await p.$eval('#track ol li:nth-child(4) .text-accent', (e) => [e.textContent, getComputedStyle(e).color]).catch(() => null);
  check('/est-opyt/: 5 шагов, 4-й — «Экономишь на 1 машине ~200 000 ₽»', steps.length === 5 && steps[3] === 'Экономишь на 1 машине ~200 000 ₽' && steps[4] === 'Масштабируешь поток', steps.join(' / '));
  check('/est-opyt/: сумма оранжевым', !!acc && acc[1] === 'rgb(255, 106, 0)', JSON.stringify(acc));
  const chat = await p.$('#track .chat-phone');
  if (!chat) check('/est-opyt/: скриншот переписки открывается в лайтбоксе', false, 'нет файла incoming/est-opyt/supplier-chat.png — карточка не выводится');
  else {
    const cap = await p.$eval('#track .chat-phone + figcaption', (e) => e.textContent);
    await chat.click();
    await p.waitForTimeout(300);
    const open = await p.evaluate(() => !![...document.querySelectorAll('dialog.lightbox')].find((x) => x.open)?.querySelector('img'));
    await p.keyboard.press('Escape');
    check('/est-opyt/: скриншот переписки открывается в лайтбоксе', open && cap === 'Прямой диалог с поставщиком в Китае', `${open} «${cap}»`);
  }
  await p.close();
}
// FAQ «Как оплатить доступ?»: ссылка на бота, цель faq_pay_bot, вопрос в JSON-LD
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route(/mc\.yandex\.(ru|com)/, (r) => r.abort());
  await ctx.addInitScript(() => { window.__ym = []; window.ym = (...a) => window.__ym.push(a); });
  const p = await ctx.newPage();
  ctx.on('page', (np) => np !== p && np.close().catch(() => {}));
  for (const u of ['/', '/est-opyt/']) {
    await p.goto(base + u + '?_ym_debug=1', { waitUntil: 'load' });
    await hydrated(p);
    await p.waitForTimeout(300);
    const ld = await p.$$eval('script[type="application/ld+json"]', (s) => s.map((x) => x.textContent).join(''));
    await p.$eval('#faq a[data-goal="faq_pay_bot"]', (a) => { a.closest('details').open = true; a.scrollIntoView({ block: 'center' }); });
    const attrs = await p.$eval('#faq a[data-goal="faq_pay_bot"]', (e) => ({ href: e.getAttribute('href'), target: e.target, rel: e.rel, text: e.textContent, color: getComputedStyle(e).color, q: e.closest('details').querySelector('summary').textContent }));
    await p.click('#faq a[data-goal="faq_pay_bot"]');
    await p.waitForTimeout(300);
    const hit = await p.evaluate(() => window.__ym.some((c) => c[0] === 113396195 && c[1] === 'reachGoal' && c[2] === 'faq_pay_bot'));
    check(`FAQ ${u}: @bazaimporta_bot → бот, _blank+noopener, оранжевая, цель faq_pay_bot, вопрос в JSON-LD`,
      attrs.href === BOT && attrs.target === '_blank' && attrs.rel.includes('noopener') && attrs.text === '@bazaimporta_bot' && attrs.color === 'rgb(255, 106, 0)' && /Как оплатить доступ\?/.test(attrs.q) && hit && ld.includes('Как оплатить доступ?'),
      JSON.stringify({ ...attrs, hit }));
  }
  await ctx.close();
}
// 8. 360 px: нет горизонтального скролла; карусели на всех треках; лента галереи с «подсказкой»
{
  const ctx = await b.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  for (const u of ['/', ...TRACKS.map((t) => t[1])]) {
    await p.goto(base + u, { waitUntil: 'load' });
    const sw = await p.evaluate(() => document.documentElement.scrollWidth);
    check(`360 px ${u}: нет горизонтального скролла`, sw <= 360, `scrollWidth=${sw}`);
  }
  for (const [, slug] of TRACKS) {
    await p.goto(base + slug, { waitUntil: 'load' });
    await hydrated(p);
    const n = await p.$$eval('#track ul.strip figure', (f) => f.length);
    await p.$eval('#track ul.strip', (e) => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await p.tap('#track button[aria-label="Следующий материал"]');
    await p.waitForTimeout(800);
    const s1 = await p.$eval('#track ul.strip', (e) => e.scrollLeft);
    const list = await p.$$eval('#track h3', (h) => h.map((x) => x.textContent));
    check(`${slug}: карусель «Что внутри закрытого канала» (5) листается, «Внутри тебя ждут» на месте`, n === 5 && s1 > 100 && list.includes('Внутри тебя ждут'), `n=${n} scroll=${s1}`);
  }
  await ctx.close();
}
await b.close();
console.log(results.join('\n'));
console.log(`\n${results.filter((r) => r.startsWith('PASS')).length}/${results.length} PASS`);
