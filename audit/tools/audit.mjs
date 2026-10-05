// usage: node audit.mjs <url> <outDir> [--no-lh]
import { chromium } from 'playwright';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'node:fs';
import path from 'node:path';

const [url, outDir] = process.argv.slice(2);
const noLh = process.argv.includes('--no-lh');
fs.mkdirSync(outDir, { recursive: true });
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await chromium.launch({ executablePath: CHROME });
for (const w of [375, 768, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w === 375 ? 812 : 900 }, deviceScaleFactor: 1, hasTouch: w < 1024, isMobile: w === 375 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  // trigger reveal animations by scrolling through the page
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 300) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 1300));
  });
  await page.screenshot({ path: path.join(outDir, `${w}-fold.png`) });
  // content-visibility: auto не рисует секции вне экрана — для полного скриншота отключаем
  await page.addStyleTag({ content: 'main > section { content-visibility: visible !important; }' });
  await page.screenshot({ path: path.join(outDir, `${w}-full.png`), fullPage: true });
  const hscroll = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  console.log(`${w}px: h-overflow=${hscroll}px errors=${errors.length}${errors.length ? ' ' + errors.slice(0, 3).join(' | ') : ''}`);
  await ctx.close();
}
await browser.close();

if (!noLh) {
  const chrome = await chromeLauncher.launch({ chromePath: CHROME, chromeFlags: ['--headless=new'] });
  const summary = {};
  for (const preset of ['mobile', 'desktop']) {
    const cfg = preset === 'desktop' ? (await import('lighthouse/core/config/desktop-config.js')).default : undefined;
    const r = await lighthouse(url, { port: chrome.port, output: 'html', logLevel: 'error' }, cfg);
    fs.writeFileSync(path.join(outDir, `lighthouse-${preset}.html`), r.report);
    const c = r.lhr.categories, a = r.lhr.audits;
    summary[preset] = {
      performance: Math.round(c.performance.score * 100), accessibility: Math.round(c.accessibility.score * 100),
      bestPractices: Math.round(c['best-practices'].score * 100), seo: Math.round(c.seo.score * 100),
      LCP: a['largest-contentful-paint'].displayValue, CLS: a['cumulative-layout-shift'].displayValue,
      TBT: a['total-blocking-time'].displayValue, weight: a['total-byte-weight'].displayValue,
    };
  }
  await chrome.kill();
  fs.writeFileSync(path.join(outDir, 'lighthouse-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}
