import { test, expect } from '@playwright/test'

test.describe('US3 — Chore Library & Per-Kid Assignment', () => {
  test('admin chores page requires authentication', async ({ page }) => {
    await page.goto('/admin/chores')
    await expect(page).toHaveURL(/login/)
  })
})
