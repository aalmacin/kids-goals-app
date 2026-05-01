import { test, expect } from '@playwright/test'

test.describe('US7 — Rewards System', () => {
  test('rewards page requires authentication', async ({ page }) => {
    await page.goto('/dashboard/rewards')
    await expect(page).toHaveURL(/login/)
  })
})
