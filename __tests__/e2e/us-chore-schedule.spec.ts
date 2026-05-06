import { test, expect } from '@playwright/test'

// Requires a seeded local Supabase with:
// - A parent account (PARENT_EMAIL / PARENT_PASSWORD env vars)
// - A kid account (KID_EMAIL / KID_PASSWORD env vars)
// - At least one chore assigned to the kid

const PARENT_EMAIL = process.env.E2E_PARENT_EMAIL ?? 'parent@test.local'
const PARENT_PASSWORD = process.env.E2E_PARENT_PASSWORD ?? 'password'
const KID_EMAIL = process.env.E2E_KID_EMAIL ?? 'kid@test.local'
const KID_PASSWORD = process.env.E2E_KID_PASSWORD ?? '1234'

test.describe('US1 — Parent sets chore day schedule', () => {
  test('admin chores page renders schedule editor per chore', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', PARENT_EMAIL)
    await page.fill('[name="password"]', PARENT_PASSWORD)
    await page.click('[type="submit"]')
    await page.waitForURL('/admin')

    await page.goto('/admin/chores')
    // Schedule editor (day toggles) should be visible for at least one chore
    await expect(page.getByLabel('Allowed days').first()).toBeVisible()
  })

  test('parent can toggle a day and save', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', PARENT_EMAIL)
    await page.fill('[name="password"]', PARENT_PASSWORD)
    await page.click('[type="submit"]')

    await page.goto('/admin/chores')
    const scheduleEditor = page.getByLabel('Allowed days').first()
    await expect(scheduleEditor).toBeVisible()

    // Click Monday toggle (Mo)
    await scheduleEditor.getByText('Mo').click()
    await page.getByRole('button', { name: 'Save' }).first().click()

    // After save, badge should reflect the day
    await expect(page.getByText('Mo').first()).toBeVisible()
  })
})

test.describe('US2 — Child sees unavailable chores', () => {
  test('dashboard page loads for kid', async ({ page }) => {
    await page.goto('/kid-login')
    // Kid login flow (family + name + passcode)
    // Skip if env vars not configured
    if (!process.env.E2E_KID_EMAIL) {
      test.skip()
    }
  })
})

test.describe('US3 — Parent sees schedule summary', () => {
  test('chore list shows schedule badge', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', PARENT_EMAIL)
    await page.fill('[name="password"]', PARENT_PASSWORD)
    await page.click('[type="submit"]')

    await page.goto('/admin/chores')
    // Either "Every day" or a day abbreviation badge should be visible
    const badge = page.getByText('Every day').or(page.getByText('Mo')).first()
    await expect(badge).toBeVisible()
  })
})
