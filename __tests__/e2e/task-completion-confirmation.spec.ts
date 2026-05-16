import { test, expect } from '@playwright/test'

test.describe('Repeated Task Completion Confirmation', () => {
  test('dashboard requires authentication', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
  })

  // Full paths require a seeded local Supabase instance.
  test.skip('happy path: tapping a repeated task shows confirmation dialog', async ({ page }) => {
    await page.goto('/kid-login')
    await expect(page.getByText('Test Repeated Task')).toBeVisible()
    await page.getByText('Test Repeated Task').click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expect(page.getByRole('alertdialog')).toContainText('Test Repeated Task')
  })

  test.skip('confirming dialog records completion and awards points', async ({ page }) => {
    await page.goto('/kid-login')
    const pointsBefore = await page.getByTestId('points-badge').textContent()
    await page.getByText('Test Repeated Task').click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.getByRole('button', { name: 'Complete Task' }).click()
    await expect(page.getByRole('alertdialog')).not.toBeVisible()
    // Points badge should have increased
    const pointsAfter = await page.getByTestId('points-badge').textContent()
    expect(pointsAfter).not.toBe(pointsBefore)
  })

  test.skip('cancelling dialog leaves task state unchanged', async ({ page }) => {
    await page.goto('/kid-login')
    const pointsBefore = await page.getByTestId('points-badge').textContent()
    await page.getByText('Test Repeated Task').click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('alertdialog')).not.toBeVisible()
    // Task still visible and points unchanged
    await expect(page.getByText('Test Repeated Task')).toBeVisible()
    const pointsAfter = await page.getByTestId('points-badge').textContent()
    expect(pointsAfter).toBe(pointsBefore)
  })
})
