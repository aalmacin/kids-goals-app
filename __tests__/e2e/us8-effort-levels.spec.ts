import { test, expect } from '@playwright/test'

test.describe('US8 — Effort Levels', () => {
  test('effort levels admin page requires authentication', async ({ page }) => {
    await page.goto('/admin/effort')
    await expect(page).toHaveURL(/login/)
  })
})
