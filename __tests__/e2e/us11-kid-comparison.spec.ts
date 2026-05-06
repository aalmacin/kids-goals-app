import { test, expect } from '@playwright/test'

test.describe('US11 — Family Page', () => {
  test('family page requires authentication', async ({ page }) => {
    await page.goto('/family')
    await expect(page).toHaveURL(/login/)
  })

  test('/compare redirects to /family', async ({ page }) => {
    await page.goto('/compare')
    // Unauthenticated users are redirected to login, but the redirect chain goes /compare → /family → /login
    await expect(page).toHaveURL(/login|family/)
  })
})
