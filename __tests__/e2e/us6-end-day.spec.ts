import { test, expect } from '@playwright/test'

test.describe('US6 — End Day & Penalties', () => {
  test('end day flow requires authentication', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/login/)
  })
})
