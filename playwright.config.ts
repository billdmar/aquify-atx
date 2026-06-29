import { defineConfig, devices } from '@playwright/test'

// E2E config for Aquify ATX. Runs against the production build served by
// `vite preview` (no Firebase env → graceful demo mode on local seed data),
// so the journeys are deterministic and need no credentials.

const PORT = 4318
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: 'e2e',
  // Demo mode is fully deterministic, but allow one retry on CI to absorb the
  // occasional cold-start hiccup; locally, surface flakiness immediately.
  retries: process.env.CI ? 1 : 0,
  // Serial workers keep the single preview server's behaviour predictable.
  workers: process.env.CI ? 1 : undefined,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    // Grant geolocation (downtown Austin) so the recommend flow can show the
    // nearest fountains; the weather call falls back to averages offline.
    permissions: ['geolocation'],
    geolocation: { latitude: 30.2672, longitude: -97.7431 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
