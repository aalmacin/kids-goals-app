import { test, expect } from '@playwright/test'

test.describe('US5 — Rest Day', () => {
  test('dashboard with rest day requires authentication', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/login/)
  })
})
