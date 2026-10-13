import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VERSIONS } from './src/legal/requisites.js'

// версия политики cookie → тег /metrika.js?v=… в index.html: счётчик сверяет её с cookie consent
const consentVersion = {
  name: 'consent-version',
  transformIndexHtml: (html) => html.replaceAll('__CONSENT_VERSION__', VERSIONS.cookies),
}

export default defineConfig({
  plugins: [react(), consentVersion],
  // dev: лид-форма шлёт заявку в PHP-обработчик — PHP_API=http://127.0.0.1:8792 при `php -S 127.0.0.1:8792 -t public`
  server: process.env.PHP_API ? { proxy: { '/api': process.env.PHP_API } } : undefined,
  build: {
    // карты исходников не публикуем: на сервере они только раскрывают код
    sourcemap: false,
    assetsInlineLimit: 0,
  },
})
