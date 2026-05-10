import { test, expect } from '@playwright/test'

test.describe('US11 — Chore Completion Reward Points', () => {
  // Auth redirect guards (run without credentials)
  test('admin chores page redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/admin/chores')
    await expect(page).toHaveURL(/login/)
  })

  test('kid dashboard redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
  })

  test('activity log redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/activity')
    await expect(page).toHaveURL(/login/)
  })

  // Happy path — full reward flow
  // Requires: seeded parent account, kid account, and a chore with reward_points > 0.
  // Set TEST_PARENT_EMAIL, TEST_PARENT_PASSWORD, TEST_KID_EMAIL, TEST_KID_PASSWORD in env.
  test.fixme(
    'US1 happy path: parent creates chore with reward points and it appears in the library',
    async ({ page }) => {
      // Login as parent
      await page.goto('/login')
      await page.getByLabel(/email/i).fill(process.env.TEST_PARENT_EMAIL ?? '')
      await page.getByLabel(/password/i).fill(process.env.TEST_PARENT_PASSWORD ?? '')
      await page.getByRole('button', { name: /sign in/i }).click()
      await expect(page).toHaveURL(/admin/)

      // Navigate to chore library
      await page.goto('/admin/chores')

      // Add chore with reward
      await page.getByLabel(/chore name/i).fill('Reward Test Chore')
      await page.getByLabel(/reward points/i).fill('10')
      await page.getByRole('button', { name: /add chore/i }).click()

      // Verify reward badge appears in library
      await expect(page.getByText('+10 pts')).toBeVisible()
    }
  )

  test.fixme(
    'US1 happy path: parent edits reward points on existing chore',
    async ({ page }) => {
      await page.goto('/login')
      await page.getByLabel(/email/i).fill(process.env.TEST_PARENT_EMAIL ?? '')
      await page.getByLabel(/password/i).fill(process.env.TEST_PARENT_PASSWORD ?? '')
      await page.getByRole('button', { name: /sign in/i }).click()

      await page.goto('/admin/chores')
      // Expand edit form for first chore
      await page.getByText('Edit').first().click()
      await page.getByLabel(/reward points/i).last().fill('20')
      await page.getByRole('button', { name: /save/i }).first().click()

      await expect(page.getByText('+20 pts')).toBeVisible()
    }
  )

  test.fixme(
    'US2 happy path: kid sees reward badge on chore tile and earns points after End Day',
    async ({ page }) => {
      // Login as kid
      await page.goto('/kid-login')
      // Kid login flow (family + name + passcode)
      await expect(page).toHaveURL(/kid-login/)

      await page.goto('/')
      // Verify reward badge is visible on the chore tile
      await expect(page.getByText('+10 pts')).toBeVisible()

      // Complete the chore
      await page.getByRole('checkbox').first().check()
      // Badge should still be visible on completed tile
      await expect(page.getByText('+10 pts')).toBeVisible()

      // Trigger End Day
      await page.getByRole('button', { name: /end day/i }).click()
      await page.getByRole('button', { name: /confirm/i }).click()

      // Balance should have increased
      await expect(page.getByText(/\+10/)).toBeVisible()
    }
  )

  test.fixme(
    'US2 failure path: uncheck chore before End Day — no reward granted',
    async ({ page }) => {
      await page.goto('/')
      // Check then uncheck chore
      await page.getByRole('checkbox').first().check()
      await page.getByRole('checkbox').first().uncheck()

      // Trigger End Day
      await page.getByRole('button', { name: /end day/i }).click()
      await page.getByRole('button', { name: /confirm/i }).click()

      // Activity log should have no chore_completion_reward event
      await page.goto('/activity')
      await expect(page.getByText('Chore Reward')).not.toBeVisible()
    }
  )

  test.fixme(
    'US3 happy path: chore_completion_reward event visible in activity log with chore name',
    async ({ page }) => {
      await page.goto('/activity')
      await expect(page.getByText('Chore Reward 🏆')).toBeVisible()
      await expect(page.getByText('Reward Test Chore')).toBeVisible()
      // Points delta should be positive
      await expect(page.getByText('+10')).toBeVisible()
    }
  )
})
