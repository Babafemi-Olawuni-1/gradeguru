import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
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
  }
})
