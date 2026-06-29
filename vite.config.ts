/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import type { PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

// Opt-in bundle analysis: `npm run analyze` (ANALYZE=true) emits stats.html so
// the treemap of the production bundle can be inspected. Off for normal
// builds/CI so they stay unaffected.
const analyzePlugins: PluginOption[] =
  process.env.ANALYZE === 'true'
    ? [
        visualizer({
          filename: 'stats.html',
          gzipSize: true,
          brotliSize: true,
        }) as PluginOption,
      ]
    : []

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'Aquify ATX — Austin Water Fountain Map',
        short_name: 'Aquify ATX',
        description:
          'Find public water fountains across Austin and get a climate-aware hydration recommendation.',
        theme_color: '#0084cc',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // Keep the app shell + last-seen map tiles + weather usable offline,
        // serving the "hot Austin trail, no signal" case.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.host.endsWith('tile.openstreetmap.org'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.host === 'api.open-meteo.com',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'open-meteo',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
    ...analyzePlugins,
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
    // Vitest owns the unit tests under src/ only. Playwright E2E specs live in
    // e2e/ and use @playwright/test — keep them out of Vitest's runner so the
    // two suites never collide.
    include: ['{src,api}/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/types.ts',
        'src/vite-env.d.ts',
        // Leaflet-bound UI is exercised manually / in E2E, not jsdom units.
        'src/components/Map/**',
      ],
      // Gate set just below current coverage so regressions fail CI but the
      // bar is honest. Raise as coverage grows.
      thresholds: {
        statements: 76,
        branches: 68,
        functions: 75,
        lines: 79,
      },
    },
  },
})
