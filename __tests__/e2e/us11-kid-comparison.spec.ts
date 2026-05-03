import { test, expect } from '@playwright/test'

test.describe('US11 — Kid Comparison', () => {
  test('compare page requires authentication', async ({ page }) => {
    await page.goto('/compare')
    await expect(page).toHaveURL(/login/)
  })
})
