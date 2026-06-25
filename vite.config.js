import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Cachear assets estáticos — JS, CSS, imágenes
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // No cachear llamadas a Supabase ni API
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Logos de equipos — cachear agresivamente
            urlPattern: /^https:\/\/crests\.football-data\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'team-logos',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7 días
            },
          },
        ],
      },
      manifest: {
        name: 'World Cup Pool 2026',
        short_name: 'Quiniela 2026',
        description: 'Quiniela del Mundial 2026',
        theme_color: '#0b1f3a',
        background_color: '#08121f',
        display: 'standalone',      // ← clave para iPhone — se ve como app nativa
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  server: { port: 3000 }
})