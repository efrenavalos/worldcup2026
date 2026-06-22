import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api-football': {
        target: 'https://api.football-data.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-football/, ''),
        headers: {
          'X-Auth-Token': '867ea20a55de4f2a9c099eff344695eb',
        },
      },
    },
  },
})