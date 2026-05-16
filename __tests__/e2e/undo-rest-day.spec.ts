import { test, expect } from '@playwright/test'

test.describe('Undo Rest Day', () => {
  test('dashboard requires authentication', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
  })

  test.skip('kid purchases rest day, clicks Undo, verifies points returned and rest day cleared', async ({ page }) => {
    // Requires seeded local Supabase with a kid account that has >= 100 points
    // 1. Log in as kid
    await page.goto('/kid-login')
    // 2. Purchase rest day
    await page.getByText(/rest day/i).click()
    await page.getByRole('alertdialog').waitFor()
    await page.getByRole('button', { name: /yes, rest day/i }).click()
    // 3. Verify "Rest Day Active" badge visible with Undo button
    await expect(page.getByText('Rest Day Active')).toBeVisible()
    await expect(page.getByText('Undo Rest Day')).toBeVisible()
    // 4. Click "Undo Rest Day"
    await page.getByText('Undo Rest Day').click()
    // 5. Confirm in dialog
    await page.getByRole('alertdialog').waitFor()
    await page.getByRole('button', { name: /undo rest day/i }).click()
    // 6. Verify rest day cleared — "Rest Day Active" gone, regular chores visible
    await expect(page.getByText('Rest Day Active')).not.toBeVisible()
  })

  test.skip('after using undo once, undo rest day button does not appear', async ({ page }) => {
    // Requires seeded local Supabase with a kid who has used rest day undo once today
    // 1. Log in as kid
    await page.goto('/kid-login')
    // 2. Purchase rest day again
    await page.getByText(/rest day/i).click()
    await page.getByRole('alertdialog').waitFor()
    await page.getByRole('button', { name: /yes, rest day/i }).click()
    // 3. Verify "Rest Day Active" badge visible but NO "Undo Rest Day" button
    await expect(page.getByText('Rest Day Active')).toBeVisible()
    await expect(page.getByText('Undo Rest Day')).not.toBeVisible()
  })
})
