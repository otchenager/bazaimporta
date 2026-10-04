# Инструменты аудита

Нужны Node 22 и Chrome. Один раз: `npm i playwright lighthouse chrome-launcher` в отдельной папке (не в frontend).

```bash
node serve.mjs ../../frontend/dist 4181          # статика + заголовки из dist/.htaccess (CSP) + gzip, как на Apache
node audit.mjs http://localhost:4181/ ../after/home   # скриншоты 375/768/1440 + Lighthouse mobile/desktop
node e2e.mjs http://localhost:4181                # поведение: гидратация, треки, sticky CTA, ссылки, reduced-motion, без JS, 404
node goals.mjs http://localhost:4181              # цели Метрики на CTA (счётчик-заглушка)
```
Путь к Chrome задан в скриптах: `C:/Program Files/Google/Chrome/Application/chrome.exe`.
