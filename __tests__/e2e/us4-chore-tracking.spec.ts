import { test, expect } from '@playwright/test'

test.describe('US4 — Kid Daily Chore Tracking', () => {
  test('dashboard requires authentication', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/login/)
  })
})
