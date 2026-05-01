import { test, expect } from '@playwright/test'

test.describe('US2 — Kid Account Management', () => {
  test('kid login page renders with all fields', async ({ page }) => {
    await page.goto('/kid-login')
    await expect(page.locator('input[name="familyName"]')).toBeVisible()
    await expect(page.locator('input[name="kidName"]')).toBeVisible()
    await expect(page.locator('input[name="passcode"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /go/i })).toBeVisible()
  })

  test('kid login with wrong family shows error', async ({ page }) => {
    await page.goto('/kid-login')
    await page.fill('input[name="familyName"]', 'NonExistentFamily123')
    await page.fill('input[name="kidName"]', 'Alex')
    await page.fill('input[name="passcode"]', '1234')
    await page.click('button[type="submit"]')
    // Should stay on kid-login page
    await expect(page).toHaveURL(/kid-login/)
  })

  test('admin kids page requires authentication', async ({ page }) => {
    await page.goto('/admin/kids')
    await expect(page).toHaveURL(/login/)
  })
})
