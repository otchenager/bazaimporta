// Мини-Apache для проверки: статика из dist, index.html в папках, 404.html, заголовки из dist/.htaccess.
// PHP_API=http://127.0.0.1:8792 — запросы к *.php проксируются туда (php -S -t dist 127.0.0.1:8792), как PHP на reg.ru.
// Видео отдаётся с Range (206), как у Apache.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
const root = process.argv[2], port = Number(process.argv[3] || 4180);
function readHeaders() {
  const htPath = path.join(root, '.htaccess');
  const ht = fs.existsSync(htPath) ? fs.readFileSync(htPath, 'utf8') : '';
  const h = {};
  for (const m of ht.matchAll(/Header always set ([\w-]+) "([^"]+)"/g)) h[m[1]] = m[2];
  if (h['Content-Security-Policy']) h['Content-Security-Policy'] = h['Content-Security-Policy'].replace(' upgrade-insecure-requests', '');
  return h;
}
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.jpg': 'image/jpeg', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain', '.avif': 'image/avif', '.mp4': 'video/mp4', '.webm': 'video/webm' };
const PHP_API = process.env.PHP_API;
http.createServer((req, res) => {
  const headers = readHeaders();
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  // 301 из .htaccess (RewriteRule … [R=301,…])
  const ht = fs.existsSync(path.join(root, '.htaccess')) ? fs.readFileSync(path.join(root, '.htaccess'), 'utf8') : '';
  // RewriteCond %{HTTP_HOST} перед правилом — условие по хосту (www → без www)
  for (const [, host, from, to] of ht.matchAll(/^(?:\s*RewriteCond\s+%\{HTTP_HOST\}\s+(\S+)\s+\[NC\]\s*\n)?\s*RewriteRule\s+(\S+)\s+(\S+)\s+\[R=301[^\]]*\]/gm)) {
    if (host && !new RegExp(host, 'i').test((req.headers.host || '').split(':')[0])) continue;
    const re = new RegExp(from), hit = p.slice(1).match(re);
    if (hit) { res.writeHead(301, { Location: to.replace(/\$(\d)/g, (_, n) => hit[n]) }); return res.end(); }
  }
  if (/(^|\/)\./.test(p)) { res.writeHead(403); return res.end(); }
  if (PHP_API && p.endsWith('.php')) {
    const up = http.request(PHP_API + req.url, { method: req.method, headers: req.headers }, (r) => { res.writeHead(r.statusCode, { ...headers, ...r.headers }); r.pipe(res); });
    up.on('error', () => { res.writeHead(502); res.end(); });
    return req.pipe(up);
  }
  let f = path.join(root, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) {
    if (!p.endsWith('/')) { res.writeHead(301, { Location: p + '/' }); return res.end(); }
    f = path.join(f, 'index.html');
  }
  let status = 200;
  if (!fs.existsSync(f)) { f = path.join(root, '404.html'); status = 404; }
  const type = types[path.extname(f)] || 'application/octet-stream';
  const cache = /\/(assets|media)\//.test(p) ? 'public, max-age=31536000, immutable' : 'no-cache';
  const range = /^video\//.test(type) && /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
  if (range) {
    const size = fs.statSync(f).size, start = Number(range[1] || 0), end = range[2] ? Number(range[2]) : size - 1;
    res.writeHead(206, { ...headers, 'Content-Type': type, 'Cache-Control': cache, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
    return fs.createReadStream(f, { start, end }).pipe(res);
  }
  const gz = /text|javascript|svg|xml/.test(type) && /gzip/.test(req.headers['accept-encoding'] || '');
  res.writeHead(status, { ...headers, 'Content-Type': type, 'Cache-Control': cache, ...(gz ? { 'Content-Encoding': 'gzip' } : {}) });
  const s = fs.createReadStream(f); gz ? s.pipe(zlib.createGzip()).pipe(res) : s.pipe(res);
}).listen(port, () => console.log('serving', root, 'on', port));
