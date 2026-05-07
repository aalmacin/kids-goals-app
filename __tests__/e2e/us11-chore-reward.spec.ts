import { test, expect } from '@playwright/test'

test.describe('US11 — Chore Completion Reward Points', () => {
  test('admin chores page requires authentication', async ({ page }) => {
    await page.goto('/admin/chores')
    await expect(page).toHaveURL(/login/)
  })

  test('dashboard requires authentication', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
  })

  test('activity log requires authentication', async ({ page }) => {
    await page.goto('/activity')
    await expect(page).toHaveURL(/login/)
  })
})
