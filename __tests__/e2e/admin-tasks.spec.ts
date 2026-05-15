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

  test.skip('edit task: update name and points, verify in admin list', async ({ page }) => {
    await page.goto('/admin/tasks')
    // Create a task first
    await page.getByLabel('Task Name').fill('Original Name')
    await page.getByLabel('Points Reward').fill('10')
    await page.getByRole('button', { name: 'Add Task' }).click()
    await expect(page.getByText('Original Name')).toBeVisible()

    // Click edit button on the task
    await page.getByRole('button', { name: /edit/i }).first().click()

    // Update name and points in dialog
    await page.getByLabel('Task Name').fill('Updated Name')
    await page.getByLabel('Points Reward').fill('25')
    await page.getByRole('button', { name: 'Save Changes' }).click()

    // Verify updated values appear in list
    await expect(page.getByText('Updated Name')).toBeVisible()
    await expect(page.getByText('+25 pts')).toBeVisible()
    await expect(page.getByText('Original Name')).not.toBeVisible()
  })

  test.skip('edit dialog: does not show type, once_per_day, or max_completions fields', async ({ page }) => {
    await page.goto('/admin/tasks')
    await page.getByRole('button', { name: /edit/i }).first().click()

    // Only name and points fields should be present
    await expect(page.getByLabel('Task Name')).toBeVisible()
    await expect(page.getByLabel('Points Reward')).toBeVisible()
    await expect(page.getByLabel(/task type/i)).not.toBeVisible()
    await expect(page.getByLabel(/once per day/i)).not.toBeVisible()
    await expect(page.getByLabel(/max completion/i)).not.toBeVisible()
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
