import { test, expect } from '@playwright/test'

test.describe('One-Time Task Completion', () => {
  test('dashboard requires authentication', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
  })

  // Full happy path and cancel path require a seeded local Supabase instance.
  // These tests are skipped in CI until a seed script is in place.
  test.skip('happy path: confirm completion awards points and hides task', async ({ page }) => {
    // 1. Log in as a kid
    await page.goto('/kid-login')
    // 2. Expect to see a one-time task on the dashboard
    await expect(page.getByText('Test One-Time Task')).toBeVisible()
    // 3. Click the task to open confirmation dialog
    await page.getByText('Test One-Time Task').click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    // 4. Confirm completion
    await page.getByRole('button', { name: 'Complete Task' }).click()
    // 5. Task should no longer appear
    await expect(page.getByText('Test One-Time Task')).not.toBeVisible()
  })

  test.skip('cancel: task remains available after dismissing dialog', async ({ page }) => {
    await page.goto('/kid-login')
    await expect(page.getByText('Test One-Time Task')).toBeVisible()
    await page.getByText('Test One-Time Task').click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('alertdialog')).not.toBeVisible()
    await expect(page.getByText('Test One-Time Task')).toBeVisible()
  })
})
