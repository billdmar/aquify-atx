import { test, expect } from '@playwright/test'

test.describe('theme toggle', () => {
  test('dark mode applies and persists across reload', async ({ page }) => {
    await page.goto('/')

    const html = page.locator('html')
    const toggle = page.getByRole('button', {
      name: /Switch to (dark|light) mode/,
    })

    // Normalize to a known starting point: ensure we are in light mode first.
    if (await html.evaluate((el) => el.classList.contains('dark'))) {
      await toggle.click()
      await expect(html).not.toHaveClass(/dark/)
    }

    // Toggle to dark.
    await page.getByRole('button', { name: /Switch to dark mode/ }).click()
    await expect(html).toHaveClass(/dark/)

    // Persisted via localStorage → still dark after a reload.
    await page.reload()
    await expect(html).toHaveClass(/dark/)
  })
})
