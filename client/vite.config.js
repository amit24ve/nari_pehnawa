import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 2300,
    strictPort: true,
    cors: true,
    allowedHosts: [
      'naripehnawa.com',
      'www.naripehnawa.com'
    ],
    proxy: {
      '/uploads': {
        target: 'http://127.0.0.1:7100',
        changeOrigin: true,
      },
      '/api/uploads': {
        target: 'http://127.0.0.1:7100',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:7100',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  },

  preview: {
    host: '0.0.0.0',
    port: 2300,
    allowedHosts: [
      'naripehnawa.com',
      'www.naripehnawa.com'
    ],
    proxy: {
      '/uploads': {
        target: 'http://127.0.0.1:7100',
        changeOrigin: true,
      },
      '/api/uploads': {
        target: 'http://127.0.0.1:7100',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:7100',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
})