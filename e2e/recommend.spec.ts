import { test, expect } from '@playwright/test'

test.describe('hydration recommendation', () => {
  test('produces a cups number and weather panel', async ({ page }) => {
    await page.goto('/recommend')

    await expect(
      page.getByRole('heading', { name: 'Hydration Recommendation' }),
    ).toBeVisible()

    await page
      .getByRole('button', { name: /Get My Recommendation/i })
      .click()

    // The big result number renders a cups value (rule-based engine is
    // deterministic; weather falls back to averages when offline).
    await expect(page.getByText('cups per day')).toBeVisible({
      timeout: 15_000,
    })

    // The weather strip ("Current Conditions") always renders with the result.
    await expect(page.getByText('Current Conditions')).toBeVisible()
    // The Temperature term label in the weather panel (exact: there are also
    // factor lines like "high temperature (97°F)" that contain the word).
    await expect(page.getByText('Temperature', { exact: true })).toBeVisible()
  })
})
