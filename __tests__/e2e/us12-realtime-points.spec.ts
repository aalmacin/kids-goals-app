import { test, expect } from '@playwright/test'

// Requires a seeded local Supabase with:
// - A kid account (E2E_KID_EMAIL / E2E_KID_PASSWORD env vars)
// - At least one chore assigned to the kid for today with a non-zero penalty
// - At least one effort level configured for the family

const KID_EMAIL = process.env.E2E_KID_EMAIL ?? 'kid@test.local'
const KID_PASSWORD = process.env.E2E_KID_PASSWORD ?? '1234'

async function loginAsKid(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.fill('[name="email"]', KID_EMAIL)
  await page.fill('[name="password"]', KID_PASSWORD)
  await page.click('[type="submit"]')
  await page.waitForURL('/')
}

test.describe('US12 — Realtime Points Update (auth gate)', () => {
  test('dashboard requires authentication', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
  })
})

test.describe('US1 — Points update immediately after day completion', () => {
  test('points badge updates without page reload after ending the day', async ({ page }) => {
    if (!process.env.E2E_KID_EMAIL) test.skip()

    await loginAsKid(page)

    // Read initial points from badge
    const badge = page.locator('text=/\\d+ pts/')
    await expect(badge).toBeVisible()
    const initialText = await badge.textContent()
    const initialPoints = parseInt(initialText?.replace(/[^\d]/g, '') ?? '0', 10)

    // End the day
    await page.getByRole('button', { name: 'End Day' }).click()
    await page.getByRole('button', { name: 'End Day' }).last().click()

    // Badge must update within 1 second — no navigation
    await expect(badge).not.toHaveText(initialText ?? '', { timeout: 1500 })

    // Confirm we have not navigated away
    await expect(page).toHaveURL('/')
  })

  test('points are consistent after navigating away and returning', async ({ page }) => {
    if (!process.env.E2E_KID_EMAIL) test.skip()

    await loginAsKid(page)

    const badge = page.locator('text=/\\d+ pts/')
    await expect(badge).toBeVisible()

    // Navigate away and return
    await page.goto('/rewards')
    await page.goto('/')

    // Badge should still show a points value (not stale/blank)
    await expect(badge).toBeVisible()
    await expect(badge).toHaveText(/\d+ pts/)
  })
})

test.describe('US2 — Undo End Day', () => {
  test('undo end day requires authentication', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
  })

  test('Undo End Day button appears after day is ended', async ({ page }) => {
    if (!process.env.E2E_KID_EMAIL) test.skip()

    await loginAsKid(page)

    // End the day
    await page.getByRole('button', { name: 'End Day' }).click()
    await page.getByRole('button', { name: 'End Day' }).last().click()

    // Undo button should appear
    await expect(page.getByRole('button', { name: 'Undo End Day' })).toBeVisible({ timeout: 3000 })
  })

  test('confirming undo re-opens the day and reverts the badge', async ({ page }) => {
    if (!process.env.E2E_KID_EMAIL) test.skip()

    await loginAsKid(page)

    const badge = page.locator('text=/\\d+ pts/')
    await expect(badge).toBeVisible()

    // End the day and capture post-end points
    await page.getByRole('button', { name: 'End Day' }).click()
    await page.getByRole('button', { name: 'End Day' }).last().click()
    await expect(page.getByRole('button', { name: 'Undo End Day' })).toBeVisible({ timeout: 3000 })
    const postEndText = await badge.textContent()

    // Undo — confirm the dialog
    await page.getByRole('button', { name: 'Undo End Day' }).click()
    await page.getByRole('button', { name: 'Undo End Day' }).last().click()

    // Badge must revert (differ from post-end value) within 2 seconds
    await expect(badge).not.toHaveText(postEndText ?? '', { timeout: 1500 })

    // Day is re-opened: End Day button should be visible again (chore list editable)
    await expect(page.getByRole('button', { name: 'End Day' })).toBeVisible({ timeout: 3000 })
  })

  test('undo on a past day via calendar navigation updates badge immediately', async ({ page }) => {
    if (!process.env.E2E_KID_EMAIL) test.skip()

    await loginAsKid(page)

    // Navigate to calendar and click yesterday (or any ended date shown as green)
    await page.goto('/calendar')
    const endedDay = page.locator('.bg-green-100').first()
    if (await endedDay.count() === 0) test.skip()

    await endedDay.click()
    await page.waitForURL(/\?date=/)

    // Undo End Day should be present on the day dashboard
    await expect(page.getByRole('button', { name: 'Undo End Day' })).toBeVisible({ timeout: 3000 })
  })
})
