import { test, expect } from '@playwright/test'

test.describe('auth gate', () => {
  test('visiting /submit while logged out redirects to /login', async ({
    page,
  }) => {
    await page.goto('/submit')

    // PrivateRoute redirects unauthenticated users to /login (replace).
    await expect(page).toHaveURL(/\/login$/)
    await expect(
      page.getByRole('heading', { name: 'SIGN IN' }),
    ).toBeVisible()
  })
})
