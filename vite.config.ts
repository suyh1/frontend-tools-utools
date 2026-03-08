import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (id.includes('/@codemirror/')) {
            return 'codemirror'
          }

          if (id.includes('/naive-ui/') || id.includes('/vueuc/') || id.includes('/vooks/')) {
            return 'ui'
          }

          return 'vendor'
        }
      }
    }
  },
  base: './'
})
