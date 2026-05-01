import { test, expect } from '@playwright/test'

const FAMILY_NAME = `E2E Family ${Date.now()}`
const PARENT_EMAIL = `e2e-parent-${Date.now()}@example.com`
const PARENT_PASSWORD = 'TestPassword123!'

test.describe('US1 — Parent Authentication & Family Setup', () => {
  test('wrong password shows error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'nonexistent@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    // Should stay on login page or show error
    await expect(page).toHaveURL(/login/)
  })

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Parent Login')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    await expect(page.getByText('Kid Login')).toBeVisible()
  })

  test('kid login page renders correctly', async ({ page }) => {
    await page.goto('/kid-login')
    await expect(page.getByText('Kid Login')).toBeVisible()
    await expect(page.locator('input[name="familyName"]')).toBeVisible()
    await expect(page.locator('input[name="kidName"]')).toBeVisible()
    await expect(page.locator('input[name="passcode"]')).toBeVisible()
  })

  test('family setup page requires authentication', async ({ page }) => {
    await page.goto('/family')
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/login/)
  })

  test('admin dashboard requires authentication', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/login/)
  })
})
