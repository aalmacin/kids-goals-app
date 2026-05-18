import { test, expect } from '@playwright/test'

test.describe('Task Section Locked After End Day', () => {
  test('dashboard requires authentication', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
  })

  test.skip('tasks section is hidden after ending the day', async ({ page }) => {
    // Requires seeded local Supabase with a kid account and at least one repeated task assigned
    // End Day is a permanent terminal action — there is no undo
    // 1. Log in as kid
    await page.goto('/kid-login')
    // 2. Verify Tasks section is visible before ending
    await expect(page.getByText(/tasks/i)).toBeVisible()
    // 3. End the day
    await page.getByRole('button', { name: /end day/i }).click()
    await page.getByRole('alertdialog').waitFor()
    await page.getByRole('button', { name: /end day/i }).last().click()
    // 4. Verify "Day Ended" badge is visible
    await expect(page.getByText('Day Ended')).toBeVisible()
    // 5. Verify Tasks section is no longer visible
    await expect(page.getByText(/tasks/i)).not.toBeVisible()
  })
})
