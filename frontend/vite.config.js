import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    // карты исходников не публикуем: на сервере они только раскрывают код
    sourcemap: false,
    assetsInlineLimit: 0,
  },
})
