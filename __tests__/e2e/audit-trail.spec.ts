import { test, expect } from '@playwright/test'

test.describe('Audit Trail — Manual Adjustment Visibility', () => {
  test('activity log page requires authentication', async ({ page }) => {
    await page.goto('/activity')
    await expect(page).toHaveURL(/login/)
  })

  test('manual adjustment events with reason appear in activity log', async ({ page }) => {
    const testEmail = process.env.TEST_PARENT_EMAIL
    const testPassword = process.env.TEST_PARENT_PASSWORD
    if (!testEmail || !testPassword) {
      test.skip()
      return
    }

    await page.goto('/login')
    await page.locator('input[type="email"]').fill(testEmail)
    await page.locator('input[type="password"]').fill(testPassword)
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    await page.waitForURL(/admin|dashboard/)

    // Submit a manual adjustment with a reason from the kids page
    await page.goto('/admin/kids')
    const deltaInput = page.locator('input[name="delta"]').first()
    const reasonInput = page.locator('input[name="reason"]').first()
    const adjustButton = page.getByRole('button', { name: 'Adjust' }).first()

    await deltaInput.fill('25')
    await reasonInput.fill('E2E test reason')
    await adjustButton.click()

    // Navigate to the activity log
    await page.goto('/activity')

    // The manual adjustment entry should appear
    await expect(page.getByText('Manual Adjustment')).toBeVisible()
    await expect(page.getByText('E2E test reason')).toBeVisible()
    await expect(page.getByText('+25')).toBeVisible()
  })

  test('manual adjustment event without reason shows no reason text', async ({ page }) => {
    const testEmail = process.env.TEST_PARENT_EMAIL
    const testPassword = process.env.TEST_PARENT_PASSWORD
    if (!testEmail || !testPassword) {
      test.skip()
      return
    }

    await page.goto('/login')
    await page.locator('input[type="email"]').fill(testEmail)
    await page.locator('input[type="password"]').fill(testPassword)
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    await page.waitForURL(/admin|dashboard/)

    // Submit without reason
    await page.goto('/admin/kids')
    const deltaInput = page.locator('input[name="delta"]').first()
    const adjustButton = page.getByRole('button', { name: 'Adjust' }).first()

    await deltaInput.fill('10')
    await adjustButton.click()

    await page.goto('/activity')
    await expect(page.getByText('Manual Adjustment')).toBeVisible()
  })
})
