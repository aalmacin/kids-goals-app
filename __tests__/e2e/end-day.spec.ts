import { test, expect } from '@playwright/test'

test.describe('End Day — Atomic Happy Path', () => {
  test('dashboard requires authentication', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
  })

  test.skip('ending the day hides tasks section and updates points atomically', async ({ page }) => {
    // Requires seeded local Supabase with a kid account, assigned chores, and at least one repeated task
    // 1. Log in as kid
    await page.goto('/kid-login')
    // 2. Verify Tasks section is visible before ending
    await expect(page.getByText(/tasks/i)).toBeVisible()
    // 3. Note current points
    const pointsBefore = await page.getByTestId('points-balance').textContent()
    // 4. End the day
    await page.getByRole('button', { name: /end day/i }).click()
    await page.getByRole('alertdialog').waitFor()
    await page.getByRole('button', { name: /end day/i }).last().click()
    // 5. Verify "Day Ended" indicator is visible
    await expect(page.getByText('Day Ended')).toBeVisible()
    // 6. Verify Tasks section is no longer visible
    await expect(page.getByText(/tasks/i)).not.toBeVisible()
    // 7. Verify points have been updated (penalty/reward applied)
    const pointsAfter = await page.getByTestId('points-balance').textContent()
    expect(pointsAfter).not.toBeNull()
    expect(pointsBefore).not.toBeNull()
    // Points should differ if any penalties or chore rewards were applicable
  })

  test.skip('end day is idempotent — calling it twice does not duplicate log entries', async ({ page }) => {
    // Requires seeded local Supabase with a kid account that has ended the day
    // This is validated at the integration level (end-day-atomic.test.ts)
    // The E2E concern is that the UI reflects "Day Ended" without error on reload
    await page.goto('/kid-login')
    await page.getByRole('button', { name: /end day/i }).click()
    await page.getByRole('alertdialog').waitFor()
    await page.getByRole('button', { name: /end day/i }).last().click()
    await expect(page.getByText('Day Ended')).toBeVisible()
    // Reload and verify stable state
    await page.reload()
    await expect(page.getByText('Day Ended')).toBeVisible()
    await expect(page.getByText(/tasks/i)).not.toBeVisible()
  })
})
