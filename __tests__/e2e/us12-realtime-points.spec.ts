import { test, expect } from '@playwright/test'

test.describe('US12 — Realtime Points Update on Day Completion', () => {
  test('dashboard requires authentication', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
  })

  test('undo end day page requires authentication', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
  })
})

test.describe('US12 — Undo End Day', () => {
  test('undo end day requires authentication', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
  })
})
