import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'AfterGrow — 러닝 심박 코치',
        short_name: 'AfterGrow',
        description: '러닝 후 UV 노출·심박수를 측정하고 회복 가이드를 받는 앱',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // 앱 셸(정적 자산)만 프리캐시. API 응답은 절대 캐싱하지 않는다 —
        // 러닝 폴링·심박수 같은 실시간 데이터가 오래된 캐시로 보이면 안 됨.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
})
