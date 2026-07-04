import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa/favicon.svg'],
      manifest: {
        name: '周易学习',
        short_name: '周易',
        description: '六十四卦学习与占卜 · 离线可用',
        theme_color: '#0D0D0D',
        background_color: '#0D0D0D',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        lang: 'zh-CN',
        icons: [
          {
            src: 'pwa/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa/icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'pwa/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // 预缓存：App Shell + 静态数据
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // 运行时缓存：后端 API（网络优先，失败回退缓存）
        runtimeCaching: [
          {
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'zhouyi-api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 天
              },
            },
          },
          {
            // 静态数据（hexagrams.json 等）永久缓存
            urlPattern: /\.(json)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'zhouyi-data-cache',
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
