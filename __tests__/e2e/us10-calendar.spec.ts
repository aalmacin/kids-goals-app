import { test, expect } from '@playwright/test'

test.describe('US10 — Calendar & Past Dates', () => {
  test('calendar page requires authentication', async ({ page }) => {
    await page.goto('/dashboard/calendar')
    await expect(page).toHaveURL(/login/)
  })
})
