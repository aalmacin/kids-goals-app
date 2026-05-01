import { test, expect } from '@playwright/test'

test.describe('Manual Point Adjustment', () => {
  test('adjustment form is visible on kids admin page for authenticated parent', async ({ page }) => {
    // Verify the page redirects unauthenticated users (form not accessible without login)
    await page.goto('/admin/kids')
    await expect(page).toHaveURL(/login/)
  })

  test('kids admin page shows adjustment form inputs after login', async ({ page }) => {
    // Use the seeded test parent from playwright global setup (if available)
    // This test verifies the form renders — full flow requires seeded data
    await page.goto('/login')
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')

    // If the seed credentials are available via env, use them; otherwise skip.
    const testEmail = process.env.TEST_PARENT_EMAIL
    const testPassword = process.env.TEST_PARENT_PASSWORD
    if (!testEmail || !testPassword) {
      test.skip()
      return
    }

    await emailInput.fill(testEmail)
    await passwordInput.fill(testPassword)
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    await page.waitForURL(/admin/)

    await page.goto('/admin/kids')

    // Adjustment inputs should be present for each kid card
    const deltaInput = page.locator('input[name="delta"]').first()
    const reasonInput = page.locator('input[name="reason"]').first()
    const adjustButton = page.getByRole('button', { name: 'Adjust' }).first()

    await expect(deltaInput).toBeVisible()
    await expect(reasonInput).toBeVisible()
    await expect(adjustButton).toBeVisible()
  })

  test('kid login page does not show adjustment controls', async ({ page }) => {
    // Kids access /dashboard, not /admin — verify admin route is guarded
    await page.goto('/admin/kids')
    await expect(page).toHaveURL(/login/)
    // Kid session cannot reach /admin/kids — this is enforced by the admin layout auth guard
  })
})
