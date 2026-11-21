import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The SPA is served by the ASP.NET Core host in production, so the dev server
// proxies /api to the local API (running on http://localhost:5080).
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY || 'http://localhost:5080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})
