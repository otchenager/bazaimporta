import { chromium } from 'playwright';
import fs from 'node:fs';
const base = process.argv[2];
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
const ym = fs.readFileSync('C:/projects/cars/bazaimporta/frontend/dist/ym.js', 'utf8').replace('var ID = 0;', 'var ID = 12345;');
await ctx.route('**/ym.js', (r) => r.fulfill({ contentType: 'text/javascript', body: ym }));
await ctx.route('https://mc.yandex.ru/**', (r) => r.fulfill({ contentType: 'text/javascript', body: 'window.__tagLoaded=1' }));
await ctx.route('https://t.me/**', (r) => r.fulfill({ contentType: 'text/html', body: 'tg' }));
const p = await ctx.newPage();
await p.goto(base + '/profi/', { waitUntil: 'load' });
await p.waitForFunction(() => document.documentElement.classList.contains('js'));
const out = [];
for (const goal of ['cta_hero', 'cta_track_pro', 'cta_paid', 'cta_header']) {
  await p.evaluate(() => { window.ym.a = []; });
  const [popup] = await Promise.all([ctx.waitForEvent('page'), p.locator(`a[data-goal="${goal}"]`).first().click()]);
  await popup.close();
  const calls = await p.evaluate(() => window.ym.a.map((a) => Array.from(a)));
  const hit = calls.find((c) => c[0] === 12345 && c[1] === 'reachGoal' && c[2] === goal);
  out.push(`${hit ? 'PASS' : 'FAIL'}  goal ${goal}${hit ? '' : ' ' + JSON.stringify(calls)}`);
}
console.log(out.join('\n'));
await b.close();
