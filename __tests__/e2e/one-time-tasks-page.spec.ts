import { test, expect } from '@playwright/test'

test.describe('One-Time Tasks Page', () => {
  test('tasks page requires authentication', async ({ page }) => {
    await page.goto('/tasks')
    await expect(page).toHaveURL(/login/)
  })

  // Full paths require a seeded local Supabase instance.
  test.skip('kid nav bar shows Tasks link', async ({ page }) => {
    await page.goto('/kid-login')
    await expect(page.getByRole('link', { name: 'Tasks' })).toBeVisible()
  })

  test.skip('Tasks link navigates to /tasks', async ({ page }) => {
    await page.goto('/kid-login')
    await page.getByRole('link', { name: 'Tasks' }).click()
    await expect(page).toHaveURL(/\/tasks/)
    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible()
  })

  test.skip('Tasks page shows only one-time tasks', async ({ page }) => {
    await page.goto('/tasks')
    await expect(page.getByText('Test One-Time Task')).toBeVisible()
    await expect(page.getByText('Test Repeated Task')).not.toBeVisible()
  })

  test.skip('Today page shows only repeated tasks (no one-time tasks)', async ({ page }) => {
    await page.goto('/kid-login')
    await expect(page.getByText('Test Repeated Task')).toBeVisible()
    await expect(page.getByText('Test One-Time Task')).not.toBeVisible()
  })

  test.skip('completed one-time task appears in Completed section on Tasks page', async ({ page }) => {
    // Complete the one-time task first
    await page.goto('/tasks')
    await page.getByText('Test One-Time Task').click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.getByRole('button', { name: 'Complete Task' }).click()
    // Verify it moves to Completed section
    await expect(page.getByRole('heading', { name: 'Completed' })).toBeVisible()
    await expect(page.getByText('Test One-Time Task')).toBeVisible()
  })

  test.skip('tapping one-time task on Tasks page shows confirmation dialog', async ({ page }) => {
    await page.goto('/tasks')
    await expect(page.getByText('Test One-Time Task')).toBeVisible()
    await page.getByText('Test One-Time Task').click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expect(page.getByRole('alertdialog')).toContainText('Test One-Time Task')
  })

  test.skip('cancelling one-time task dialog leaves it in available section', async ({ page }) => {
    await page.goto('/tasks')
    await page.getByText('Test One-Time Task').click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('alertdialog')).not.toBeVisible()
    await expect(page.getByText('Test One-Time Task')).toBeVisible()
    // Completed section should not be visible
    await expect(page.getByRole('heading', { name: 'Completed' })).not.toBeVisible()
  })
})
