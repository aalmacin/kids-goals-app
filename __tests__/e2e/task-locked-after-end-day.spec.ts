import { test, expect } from '@playwright/test'

test.describe('Task Section Locked After End Day', () => {
  test('dashboard requires authentication', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
  })

  test.skip('tasks section is hidden after ending the day and reappears after undo', async ({ page }) => {
    // Requires seeded local Supabase with a kid account and at least one repeated task assigned
    // 1. Log in as kid
    await page.goto('/kid-login')
    // 2. Verify Tasks section is visible before ending
    await expect(page.getByRole('button', { name: /tasks/i })).toBeVisible()
    // 3. End the day
    await page.getByRole('button', { name: /end day/i }).click()
    await page.getByRole('alertdialog').waitFor()
    await page.getByRole('button', { name: /end day/i }).last().click()
    // 4. Verify "Day Ended" badge is visible
    await expect(page.getByText('Day Ended')).toBeVisible()
    // 5. Verify Tasks section is no longer visible
    await expect(page.getByRole('button', { name: /tasks/i })).not.toBeVisible()
    // 6. Undo end day
    await page.getByRole('button', { name: /undo end day/i }).click()
    await page.getByRole('alertdialog').waitFor()
    await page.getByRole('button', { name: /undo end day/i }).last().click()
    // 7. Verify Tasks section is visible again
    await expect(page.getByRole('button', { name: /tasks/i })).toBeVisible()
  })
})
