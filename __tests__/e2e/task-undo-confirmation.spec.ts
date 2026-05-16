import { test, expect } from '@playwright/test'

test.describe('Task Undo Confirmation', () => {
  test('dashboard requires authentication', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
  })

  // Full paths require a seeded local Supabase instance.
  test.skip('tapping undo on a completed task shows confirmation dialog', async ({ page }) => {
    await page.goto('/kid-login')
    // Complete a repeated task first
    await page.getByText('Test Repeated Task').click()
    await page.getByRole('button', { name: 'Complete Task' }).click()
    // Undo button should now be visible
    await expect(page.getByLabel(/Undo last completion/)).toBeVisible()
    await page.getByLabel(/Undo last completion/).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expect(page.getByRole('alertdialog')).toContainText('Undo')
  })

  test.skip('confirming undo reverses completion and deducts points', async ({ page }) => {
    await page.goto('/kid-login')
    // Complete task
    await page.getByText('Test Repeated Task').click()
    await page.getByRole('button', { name: 'Complete Task' }).click()
    const pointsBefore = await page.getByTestId('points-badge').textContent()
    // Undo
    await page.getByLabel(/Undo last completion/).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(page.getByRole('alertdialog')).not.toBeVisible()
    const pointsAfter = await page.getByTestId('points-badge').textContent()
    expect(pointsAfter).not.toBe(pointsBefore)
  })

  test.skip('cancelling undo dialog leaves completion intact', async ({ page }) => {
    await page.goto('/kid-login')
    // Complete task
    await page.getByText('Test Repeated Task').click()
    await page.getByRole('button', { name: 'Complete Task' }).click()
    const pointsBefore = await page.getByTestId('points-badge').textContent()
    // Try to undo, then cancel
    await page.getByLabel(/Undo last completion/).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('alertdialog')).not.toBeVisible()
    const pointsAfter = await page.getByTestId('points-badge').textContent()
    expect(pointsAfter).toBe(pointsBefore)
  })
})
