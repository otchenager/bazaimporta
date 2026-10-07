// Живая проверка Метрики с настоящим tag.js и ?_ym_debug=1 (metrika.js собран с ALLOW_ANY_HOST = true).
// usage: node ymdebug.mjs http://localhost:4181
import { chromium } from 'playwright';
const base = process.argv[2];
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
// CSP-нарушения и переходы: tel: и t.me не уводят со страницы (обработчики React всё равно срабатывают)
await ctx.addInitScript(() => {
  window.__csp = [];
  document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  document.addEventListener('click', (e) => { if (e.target.closest('a[href^="tel:"], a[href^="https://t.me"]')) e.preventDefault(); });
});
const p = await ctx.newPage();
const log = [], net = [], fails = [];
p.on('console', (m) => log.push(`[${m.type()}] ${m.text()}`));
p.on('requestfailed', (r) => /yandex|yastatic/.test(r.url()) && fails.push(`${r.failure()?.errorText} ${r.url().slice(0, 90)}`));
p.on('response', (r) => /mc\.yandex|yastatic/.test(r.url()) && net.push(`${r.status()} ${r.url().split('?')[0]}`));

await p.goto(base + '/?_ym_debug=1', { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
const state = await p.evaluate(() => ({ id: window.BAZA_YM_ID, dl: Array.isArray(window.dataLayer), tags: [...document.scripts].filter((s) => /metrika|tag\.js/.test(s.src)).map((s) => s.src) }));
// цели: CTA на главной и номер телефона
for (const sel of ['header a[data-goal="cta_header"]', '#hero a[data-goal="cta_hero"]', 'header a[data-goal="phone_click"]:visible', 'footer a[data-goal="phone_click"]', '#final a[data-goal="cta_final"]', 'a[data-goal="cta_pricing_free"]', 'a[data-goal="cta_paid"]']) {
  await p.locator(sel).first().scrollIntoViewIfNeeded();
  await p.locator(sel).first().click();
  await p.waitForTimeout(400);
}
// хиты: переходы по маршрутам
for (const slug of ['/s-nulya/', '/est-opyt/', '/dlya-sebya/']) {
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.click(`header nav a[href="${slug}"]`);
  await p.waitForURL('**' + slug);
  await p.waitForTimeout(1200);
}
await p.click('#hero a[data-goal^="cta_exclusive"]');
await p.waitForTimeout(800);
const csp = await p.evaluate(() => window.__csp);
await b.close();

const ym = log.filter((l) => /counter|113396195|goal|pageview|hit/i.test(l));
console.log('state', JSON.stringify(state));
console.log('--- console (Метрика)\n' + ym.join('\n'));
console.log('--- network mc.yandex / yastatic\n' + [...new Set(net)].join('\n'));
console.log('--- failed requests\n' + (fails.join('\n') || 'нет'));
console.log('--- CSP violations\n' + (csp.join('\n') || 'нет'));
console.log('--- console errors\n' + (log.filter((l) => l.startsWith('[error]')).join('\n') || 'нет'));
