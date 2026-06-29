import { test, expect } from '@playwright/test'

test.describe('search / filter', () => {
  test('typing a known fountain name narrows the list', async ({ page }) => {
    await page.goto('/')

    // Switch to list view for a deterministic, assertion-friendly DOM
    // (the map renders markers in a canvas/pane that is awkward to count).
    await page.getByRole('button', { name: /^List$/ }).click()

    const status = page.getByText(/Showing \d+ of \d+ fountains/)
    await expect(status).toBeVisible()

    // Capture the unfiltered total from the live-region status line.
    const before = await status.innerText()
    const totalMatch = before.match(/Showing \d+ of (\d+) fountains/)
    expect(totalMatch).not.toBeNull()
    const total = Number(totalMatch![1])
    expect(total).toBeGreaterThan(1)

    // "Barton" matches a small handful of seed fountains by name OR address
    // (e.g. Barton Springs Pool Entrance, plus one on Barton Springs Rd).
    await page.getByLabel('Search by name or address').fill('Barton')

    // Search is debounced (300ms); poll the status line until it narrows to a
    // small, non-empty subset of the total.
    await expect(status).toHaveText(/Showing [1-9] of \d+ fountains/, {
      timeout: 5_000,
    })

    // The narrowed count must be strictly fewer than the unfiltered total.
    const after = await status.innerText()
    const shown = Number(after.match(/Showing (\d+) of/)![1])
    expect(shown).toBeGreaterThan(0)
    expect(shown).toBeLessThan(total)

    // And the by-name match is in the list.
    await expect(
      page.getByText('Barton Springs Pool Entrance'),
    ).toBeVisible()
  })
})
