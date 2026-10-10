import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // dev: лид-форма шлёт заявку в PHP-обработчик — PHP_API=http://127.0.0.1:8792 при `php -S 127.0.0.1:8792 -t public`
  server: process.env.PHP_API ? { proxy: { '/api': process.env.PHP_API } } : undefined,
  build: {
    // карты исходников не публикуем: на сервере они только раскрывают код
    sourcemap: false,
    assetsInlineLimit: 0,
  },
})
