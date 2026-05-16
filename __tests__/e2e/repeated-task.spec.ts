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

  // US1: Daily task resets after midnight
  test.skip('once-per-day task is available again the next calendar day', async ({ page }) => {
    // Requires: task_completion row seeded with completed_at = yesterday midnight - 1 minute
    // in the family's timezone, and family timezone set to America/New_York.
    // The seed script sets completed_at to yesterday's date in the family timezone.
    await page.goto('/kid-login')
    // Task completed yesterday must appear as available today (not completed)
    await expect(page.getByText('Test Once Per Day Task')).toBeVisible()
    // The task must NOT show a completed/greyed state from yesterday
    await expect(page.getByText('Test Once Per Day Task').locator('..')).not.toHaveAttribute(
      'data-completed',
      'true'
    )
    // And must NOT show an undo button from yesterday
    await expect(page.getByLabel(/Undo last completion for Test Once Per Day Task/)).not.toBeVisible()
  })

  // US2: Completed state does not persist across days
  test.skip('completed state and undo button do not persist to the next calendar day', async ({ page }) => {
    // Requires: task_completion row seeded with completed_at = yesterday (family timezone).
    // Family timezone: America/New_York. The seed inserts completed_at as
    // yesterday 10 PM New York = yesterday 02:00 UTC (next UTC day).
    // This validates that the NY-timezone boundary is used, not UTC midnight.
    await page.goto('/kid-login')
    // Task should appear in its uncompleted state
    await expect(page.getByText('Test Once Per Day Task')).toBeVisible()
    // No undo button from yesterday's session
    await expect(page.getByLabel(/Undo last completion for Test Once Per Day Task/)).not.toBeVisible()
    // Kid can complete it again today
    await page.getByText('Test Once Per Day Task').click()
    await expect(page.getByText('Test Once Per Day Task')).not.toBeVisible()
  })
})
