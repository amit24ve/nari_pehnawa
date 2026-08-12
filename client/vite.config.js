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
    ]
  },

  preview: {
    host: '0.0.0.0',
    port: 2300,
    allowedHosts: [
      'naripehnawa.com',
      'www.naripehnawa.com'
    ]
  }
})