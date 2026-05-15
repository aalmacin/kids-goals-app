import { test, expect } from '@playwright/test'

test.describe('Admin Task Management', () => {
  test('admin area requires authentication', async ({ page }) => {
    await page.goto('/admin/tasks')
    await expect(page).toHaveURL(/login/)
  })

  // Full paths require a seeded local Supabase instance with a parent account.
  test.skip('happy path: create a one-time task and verify it appears', async ({ page }) => {
    await page.goto('/login')
    // log in as parent ...
    await page.goto('/admin/tasks')
    await page.getByLabel('Task Name').fill('Read a book')
    await page.getByLabel('Points Reward').fill('20')
    // task type defaults to one_time
    await page.getByRole('button', { name: 'Add Task' }).click()
    await expect(page.getByText('Read a book')).toBeVisible()
    await expect(page.getByText('One-Time')).toBeVisible()
  })

  test.skip('Tasks link appears in admin navbar', async ({ page }) => {
    await page.goto('/login')
    // log in as parent ...
    await expect(page.getByRole('link', { name: 'Tasks' })).toBeVisible()
    await page.getByRole('link', { name: 'Tasks' }).click()
    await expect(page).toHaveURL(/\/admin\/tasks/)
  })

  test.skip('error: repeated task with max_completions = 0 is rejected', async ({ page }) => {
    await page.goto('/admin/tasks')
    await page.getByLabel('Task Name').fill('Bad Task')
    await page.getByLabel('Points Reward').fill('10')
    // select repeated type
    await page.getByRole('combobox').selectOption('repeated')
    await page.getByLabel('Max Completions').fill('0')
    await page.getByRole('button', { name: 'Add Task' }).click()
    // Expect validation error — HTML5 min=1 prevents submission
    await expect(page.getByText('Bad Task')).not.toBeVisible()
  })

  test.skip('create repeated task with once-per-day checked', async ({ page }) => {
    await page.goto('/admin/tasks')
    await page.getByLabel('Task Name').fill('Daily Reading')
    await page.getByLabel('Points Reward').fill('15')
    // select repeated type
    await page.getByRole('combobox').selectOption('repeated')
    await page.getByLabel('Once per day').check()
    await page.getByRole('button', { name: 'Add Task' }).click()
    // Verify the task appears with once/day badge
    await expect(page.getByText('Daily Reading')).toBeVisible()
    await expect(page.getByText('once/day')).toBeVisible()
  })
})
