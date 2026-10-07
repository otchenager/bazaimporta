# Инструменты аудита

Нужны Node 22 и Chrome. Один раз: `npm i playwright lighthouse chrome-launcher` в отдельной папке (не в frontend).

```bash
node serve.mjs ../../frontend/dist 4181          # статика + заголовки из dist/.htaccess (CSP) + gzip, как на Apache
node audit.mjs http://localhost:4181/ ../after/home   # скриншоты 375/768/1440 + Lighthouse mobile/desktop
node e2e.mjs http://localhost:4181                # CTA→адреса, старые тексты, 301 /profi/, hero-рисунок, ховер карточек, карусели (стрелки, клавиатура, свайп), без JS, 404
node goals.mjs http://localhost:4181              # цели Метрики на CTA (счётчик-заглушка)
node round5.mjs http://localhost:4181 ../round-5   # раунд 5: телефон, «Вступить в базу», цели ×1, SPA-хиты, 360 px, скриншоты
node ymdebug.mjs http://localhost:4181            # живой tag.js + ?_ym_debug=1 (собрать с ALLOW_ANY_HOST = true): init, хиты, цели, CSP
```
Путь к Chrome задан в скриптах: `C:/Program Files/Google/Chrome/Application/chrome.exe`.
