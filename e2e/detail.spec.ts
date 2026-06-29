import { test, expect } from '@playwright/test'

test.describe('fountain detail', () => {
  test('renders the fountain name and the Reviews section', async ({
    page,
  }) => {
    // ladybird-s1st is a real seed id (src/data/fountains.json).
    await page.goto('/fountain/ladybird-s1st')

    await expect(
      page.getByRole('heading', {
        name: 'Lady Bird Lake Trail — S. 1st St Bridge',
      }),
    ).toBeVisible()

    await expect(
      page.getByRole('heading', { name: 'Reviews' }),
    ).toBeVisible()

    // Demo mode → no backend reviews.
    await expect(page.getByText('No reviews yet')).toBeVisible()
  })
})
