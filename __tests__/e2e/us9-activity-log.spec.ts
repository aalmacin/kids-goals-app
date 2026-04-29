import { test, expect } from '@playwright/test'

test.describe('US9 — Activity Log', () => {
  test('activity page requires authentication', async ({ page }) => {
    await page.goto('/dashboard/activity')
    await expect(page).toHaveURL(/login/)
  })
})
