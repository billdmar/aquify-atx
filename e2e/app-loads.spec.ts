import { test, expect } from '@playwright/test'

test.describe('app shell', () => {
  test('home renders the map container and the main heading', async ({
    page,
  }) => {
    await page.goto('/')

    // The product heading is server-deterministic and present immediately.
    await expect(
      page.getByRole('heading', { name: 'Austin Water Fountains' }),
    ).toBeVisible()

    // The Leaflet map is lazy-loaded; wait for the container to mount.
    await expect(page.locator('.leaflet-container')).toBeVisible({
      timeout: 15_000,
    })
  })
})
