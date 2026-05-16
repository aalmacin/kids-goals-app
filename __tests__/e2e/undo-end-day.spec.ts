import { test, expect } from '@playwright/test'

test.describe('Undo End Day', () => {
  test('dashboard requires authentication', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
  })

  test.skip('kid ends day, clicks Undo, verifies day reopened and chores toggleable', async ({ page }) => {
    // Requires seeded local Supabase with a kid account and chores assigned
    // 1. Log in as kid
    await page.goto('/kid-login')
    // 2. End the day (select effort level, confirm)
    await page.getByRole('button', { name: /end day/i }).click()
    await page.getByRole('alertdialog').waitFor()
    await page.getByRole('button', { name: /end day/i }).last().click()
    // 3. Verify "Day Ended" badge visible
    await expect(page.getByText('Day Ended')).toBeVisible()
    // 4. Click "Undo End Day"
    await expect(page.getByText('Undo End Day')).toBeVisible()
    await page.getByText('Undo End Day').click()
    // 5. Confirm in dialog
    await page.getByRole('alertdialog').waitFor()
    await page.getByRole('button', { name: /undo end day/i }).click()
    // 6. Verify day is reopened — "Day Ended" badge gone, chores toggleable
    await expect(page.getByText('Day Ended')).not.toBeVisible()
    // 7. Verify checkboxes are interactive (not disabled)
    const checkbox = page.locator('[role="checkbox"]').first()
    await expect(checkbox).not.toBeDisabled()
  })

  test.skip('after using undo once, undo button does not appear on second end', async ({ page }) => {
    // Requires seeded local Supabase with a kid who has already used undo once today
    // 1. Log in as kid (who has undo_end_count = 1)
    await page.goto('/kid-login')
    // 2. End the day again
    await page.getByRole('button', { name: /end day/i }).click()
    await page.getByRole('alertdialog').waitFor()
    await page.getByRole('button', { name: /end day/i }).last().click()
    // 3. Verify "Day Ended" badge visible but NO "Undo End Day" button
    await expect(page.getByText('Day Ended')).toBeVisible()
    await expect(page.getByText('Undo End Day')).not.toBeVisible()
  })
})
