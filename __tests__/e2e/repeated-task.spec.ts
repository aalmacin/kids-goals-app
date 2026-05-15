import { test, expect } from '@playwright/test'

test.describe('Repeated Task Completion', () => {
  test('dashboard requires authentication', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
  })

  // Full paths require a seeded local Supabase instance.
  test.skip('happy path: repeated task awards points and stays visible', async ({ page }) => {
    await page.goto('/kid-login')
    await expect(page.getByText('Test Repeated Task')).toBeVisible()
    // Click without a confirmation dialog
    await page.getByText('Test Repeated Task').click()
    await expect(page.getByRole('alertdialog')).not.toBeVisible()
    // Task still visible after completion
    await expect(page.getByText('Test Repeated Task')).toBeVisible()
  })

  test.skip('capped repeated task disappears after reaching max completions', async ({ page }) => {
    // Task seeded with max_completions = 1
    await page.goto('/kid-login')
    await expect(page.getByText('Test Capped Task')).toBeVisible()
    await page.getByText('Test Capped Task').click()
    // After 1 completion (the limit), task should no longer appear
    await expect(page.getByText('Test Capped Task')).not.toBeVisible()
  })

  test.skip('daily count badge appears after completing a repeated task', async ({ page }) => {
    await page.goto('/kid-login')
    await expect(page.getByText('Test Repeated Task')).toBeVisible()
    await page.getByText('Test Repeated Task').click()
    await expect(page.getByText('done 1 today')).toBeVisible()
    await page.getByText('Test Repeated Task').click()
    await expect(page.getByText('done 2 today')).toBeVisible()
  })

  test.skip('undo button reduces count and deducts points', async ({ page }) => {
    await page.goto('/kid-login')
    // Complete the task first
    await page.getByText('Test Repeated Task').click()
    await expect(page.getByText('done 1 today')).toBeVisible()
    // Click undo (minus button)
    await page.getByLabel(/Undo last completion/).click()
    // Count badge should disappear since todayCount is back to 0
    await expect(page.getByText('done 1 today')).not.toBeVisible()
  })

  test.skip('once-per-day task disappears after completion', async ({ page }) => {
    // Task seeded with once_per_day = true
    await page.goto('/kid-login')
    await expect(page.getByText('Test Once Per Day Task')).toBeVisible()
    await page.getByText('Test Once Per Day Task').click()
    // Task should no longer be visible for the rest of the day
    await expect(page.getByText('Test Once Per Day Task')).not.toBeVisible()
  })
})
