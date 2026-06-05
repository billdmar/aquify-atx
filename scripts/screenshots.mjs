// Capture README screenshots of the running app with Playwright.
//
// Usage:
//   npm run build && npm run screenshots
//
// Boots `vite preview` on a fixed port, drives headless Chromium through the
// key views, and writes PNGs to docs/screenshots/. Runs against the app's demo
// mode (local seed data) so it needs no Firebase credentials.

import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { chromium } from 'playwright'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const outDir = resolve(root, 'docs/screenshots')
const PORT = 4317
const BASE = `http://localhost:${PORT}`

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return true
    } catch {
      // server not up yet
    }
    await sleep(400)
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`)
}

async function main() {
  await mkdir(outDir, { recursive: true })

  // Start the preview server serving the production build in dist/.
  const server = spawn(
    'npx',
    ['vite', 'preview', '--port', String(PORT), '--strictPort'],
    { cwd: root, stdio: 'inherit' },
  )

  let browser
  try {
    await waitForServer(BASE)

    browser = await chromium.launch()

    // ---- Desktop captures (1440x900) ----
    const desktop = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
      // Grant geolocation (downtown Austin) so the hydration page can show a
      // full recommendation with nearest fountains rather than the empty state.
      permissions: ['geolocation'],
      geolocation: { latitude: 30.2672, longitude: -97.7431 },
    })
    const page = await desktop.newPage()

    // Home / map view — wait for Leaflet tiles + markers.
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.waitForSelector('.leaflet-container', { timeout: 15000 })
    // Markers render as Leaflet marker panes; wait for at least one.
    await page
      .waitForSelector('.leaflet-marker-icon', { timeout: 15000 })
      .catch(() => {})
    await sleep(2500) // let tiles finish painting
    await page.screenshot({ path: resolve(outDir, 'map.png') })

    // List view.
    const listBtn = page.getByRole('button', { name: /^List$/ })
    if (await listBtn.count()) {
      await listBtn.first().click()
      await sleep(800)
      await page.screenshot({ path: resolve(outDir, 'list.png') })
    }

    // Hydration recommendation page — trigger a real recommendation so the
    // screenshot shows live weather + cups + nearest fountains, not the empty
    // initial state.
    await page.goto(`${BASE}/recommend`, { waitUntil: 'networkidle' })
    const getRec = page.getByRole('button', { name: /Get My Recommendation/i })
    if (await getRec.count()) {
      await getRec.first().click()
      // Wait for the Open-Meteo fetch + render (falls back to averages offline).
      await page
        .getByText(/cups|liters|recommend/i)
        .first()
        .waitFor({ timeout: 8000 })
        .catch(() => {})
      await sleep(2500)
    }
    await page.screenshot({ path: resolve(outDir, 'hydration.png'), fullPage: true })

    // About page (clean text page — shows polish).
    await page.goto(`${BASE}/about`, { waitUntil: 'networkidle' })
    await sleep(600)
    await page.screenshot({ path: resolve(outDir, 'about.png') })

    await desktop.close()

    // ---- Mobile capture (iPhone 12-ish) ----
    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
    })
    const mpage = await mobile.newPage()
    await mpage.goto(BASE, { waitUntil: 'networkidle' })
    await mpage.waitForSelector('.leaflet-container', { timeout: 15000 })
    await sleep(2500)
    await mpage.screenshot({ path: resolve(outDir, 'mobile-map.png') })
    await mobile.close()

    console.log(`✓ Screenshots written to ${outDir}`)
  } finally {
    if (browser) await browser.close()
    server.kill('SIGTERM')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
