import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    // Dev proxy — routes /api/* to the local XAMPP backend
    // (Only used during local development; production uses API_BASE_URL from config.js)
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
        rewrite: (path) => {
          const [pathPart, qsPart] = path.split('?')
          const route = pathPart.replace(/^\/api\/?/, '').replace(/\/$/, '')
          const qs    = qsPart ? `&${qsPart}` : ''
          return `/grade_guru/gradeguru/backend/api/router.php?route=${route}${qs}`
        }
      }
    }
  },
  // Ensures React Router works with direct URL access after build
  build: {
    outDir: 'dist',
  }
})
