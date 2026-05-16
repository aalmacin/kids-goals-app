import { test, expect } from '@playwright/test'

test.describe('Chore Uncheck Limit', () => {
  test('dashboard requires authentication', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
  })

  test.skip('kid completes chore, unchecks it, re-completes it, checkbox is locked', async ({ page }) => {
    // Requires seeded local Supabase with a kid account and chores assigned
    // 1. Log in as kid
    await page.goto('/kid-login')
    // 2. Find a chore checkbox and complete it
    const checkbox = page.locator('[role="checkbox"]').first()
    await checkbox.click()
    await expect(checkbox).toBeChecked()
    // 3. Uncheck the chore (first uncheck — allowed)
    await checkbox.click()
    await expect(checkbox).not.toBeChecked()
    // 4. Re-complete the chore
    await checkbox.click()
    await expect(checkbox).toBeChecked()
    // 5. Verify checkbox is now locked (disabled for unchecking)
    await expect(checkbox).toBeDisabled()
  })

  test.skip('chore that has never been unchecked can still be toggled freely', async ({ page }) => {
    // Requires seeded local Supabase with a kid account and fresh chores
    // 1. Log in as kid
    await page.goto('/kid-login')
    // 2. Complete a chore
    const checkbox = page.locator('[role="checkbox"]').first()
    await checkbox.click()
    await expect(checkbox).toBeChecked()
    // 3. Verify it can be unchecked (not disabled)
    await expect(checkbox).not.toBeDisabled()
  })
})
